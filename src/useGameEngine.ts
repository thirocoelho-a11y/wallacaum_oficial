// ═══════════════════════════════════════════════════════
//  useGameEngine.ts — Motor Central do Jogo (Hook React)
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import type { Player, Enemy, FoodItem, FloatingTextData, Particle, Davisaum, EnginePhaseConfig } from './types';
import {
  DEFAULT_PLAYER, DEFAULT_DAVIS, MAX_HP, MAX_ENEMIES, WORLD_W, FLOOR_MIN, FLOOR_MAX,
  BASE_W, KNOCKBACK_DECAY, isBossType,
} from './constants';
import { rng, clamp, uid, spawnParticles } from './utils';
import { updatePlayerMovement, updatePlayerJump } from './physics';
import { updatePlayerAttacks, checkPlayerHits, updateItems, updateIdleEating } from './combat';
import { updateBasicEnemyAI, updateSukaAI, updateFurioAI, updateDavisAI } from './ai';

// ─────────────────────────────────────────────────────
//  Particles & Texts update (local ao engine)
// ─────────────────────────────────────────────────────
function updateParticlesAndTexts(particles: Particle[], texts: FloatingTextData[], f: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx; pt.y += pt.vy;
    if (pt.type === 'dust' || pt.type === 'hit') pt.vy += 0.15;
    if (pt.type === 'spark') { pt.vx *= 0.92; pt.vy *= 0.92; }
    pt.life--;
    if (pt.life <= 0) particles.splice(i, 1);
  }
  for (let i = texts.length - 1; i >= 0; i--) {
    if (f - texts[i].t >= 55) texts.splice(i, 1);
  }
}

// ─────────────────────────────────────────────────────
//  Hook Principal
// ─────────────────────────────────────────────────────
export function useGameEngine(cfg: EnginePhaseConfig) {
  const playerRef = useRef<Player>({
    ...DEFAULT_PLAYER,
    hp: Math.min(MAX_HP, cfg.initialHp > 0 ? cfg.initialHp + (cfg.bossType === 'furio' ? 30 : 0) : MAX_HP),
    invincible: cfg.bossType === 'furio' ? 60 : 0,
  });
  const enemiesRef = useRef<Enemy[]>([]);
  const foodRef = useRef<FoodItem[]>([]);
  const textsRef = useRef<FloatingTextData[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const davisRef = useRef<Davisaum>({ ...DEFAULT_DAVIS });
  const keysRef = useRef<Record<string, boolean>>({});
  const frameRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const cameraRef = useRef(0);
  const bossSpawned = useRef(false);
  const screenShakeRef = useRef(0);
  const scoreRef = useRef(cfg.initialScore);

  const [score, setScore] = useState(cfg.initialScore);
  const [dead, setDead] = useState(false);
  const [frameTick, setFrameTick] = useState(0);

  // ── Teclado ──
  useEffect(() => {
    const d = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const u = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    // Fix: limpar teclas quando a janela perde foco (previne movimento travado)
    const blur = () => { keysRef.current = {}; };
    window.addEventListener('keydown', d, { passive: false });
    window.addEventListener('keyup', u);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', d);
      window.removeEventListener('keyup', u);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // ── Game Loop ──
  useEffect(() => {
    if (dead) return;
    let animId: number;

    const loop = () => {
      const p = playerRef.current;
      const k = keysRef.current;
      const f = ++frameRef.current;
      const dav = davisRef.current;
      const enemies = enemiesRef.current;
      const particles = particlesRef.current;
      const texts = textsRef.current;

      // Hitstop — congela tudo exceto render
      if (p.hitstop > 0) { p.hitstop--; setFrameTick(f); animId = requestAnimationFrame(loop); return; }

      // ── Sistemas do jogador ──
      updateIdleEating(p, k, particles, texts, f);
      updatePlayerMovement(p, k, particles);
      updatePlayerJump(p, k, particles);

      // ── Câmera ──
      cameraRef.current += (clamp(p.x - BASE_W / 2, 0, WORLD_W - BASE_W) - cameraRef.current) * 0.07;

      // ── Ataques ──
      updatePlayerAttacks(p, k, enemies, screenShakeRef);

      // ── Davisaum ──
      updateDavisAI(dav, p, enemies, foodRef.current, f);

      // ── Inimigos ──
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // Knockback
        if (e.hurtTimer > 0) {
          e.hurtTimer--; e.x += e.kbx; e.y += e.kby || 0;
          e.kbx *= KNOCKBACK_DECAY; e.kby = (e.kby || 0) * KNOCKBACK_DECAY;
          e.x = clamp(e.x, 10, WORLD_W - 10); e.y = clamp(e.y, FLOOR_MIN, FLOOR_MAX);
          if (e.hurtTimer <= 0) { e.hurt = false; e.charging = false; }
          continue;
        }

        // IA por tipo
        let stateResult: 'dead' | 'alive' = 'alive';
        if (e.type === 'suka') stateResult = updateSukaAI(e, p, dav, particles, texts, f, screenShakeRef);
        else if (e.type === 'furio') stateResult = updateFurioAI(e, p, dav, particles, texts, f, screenShakeRef);
        else stateResult = updateBasicEnemyAI(e, p, particles, texts, f);

        if (stateResult === 'dead') { setDead(true); cfg.onGameOver(scoreRef.current); return; }

        // Hit check
        const died = checkPlayerHits(e, p, particles, texts, f);
        if (died) {
          enemies.splice(i, 1);
          spawnParticles(particles, 12, e.x, e.y - 30, e.type === cfg.bossType ? cfg.bossDeathColor : '#2980b9', 'spark', 6, 25, 5);
          if (e.type === cfg.bossType) {
            screenShakeRef.current = 25;
            spawnParticles(particles, 20, e.x, e.y - 40, cfg.bossDeathParticles, 'ring', 10, 35, 15);
            cfg.onComplete(scoreRef.current, p.hp);
            return;
          } else {
            scoreRef.current += p.combo >= 5 ? 150 : 100;
            setScore(scoreRef.current);
          }
        }
      }

      // ── Itens ──
      updateItems(foodRef.current, p, texts, particles, f);

      // ── Spawn ──
      spawnTimerRef.current++;
      const si = cfg.spawnIntervalMs / 16.67;
      if (scoreRef.current - cfg.initialScore >= cfg.bossThreshold && !bossSpawned.current) {
        bossSpawned.current = true;
        enemies.push({
          id: uid(), type: cfg.bossType,
          x: p.x + 400, y: clamp(p.y, FLOOR_MIN, FLOOR_MAX), z: 0,
          hp: cfg.bossHp, maxHp: cfg.bossHp, dir: 'left',
          walking: true, hurt: false, hurtTimer: 0, kbx: 0, kby: 0,
          atkCd: 60, stateTimer: 0, punchTimer: 0, hitThisSwing: false,
          charging: false, chargeDir: 0,
        });
        screenShakeRef.current = 20;
        texts.push({ id: uid(), text: cfg.bossAnnounce, x: p.x + 200, y: p.y - 100, color: cfg.bossAnnounceColor, size: 18, t: f });
      } else if (spawnTimerRef.current > si && enemies.length < MAX_ENEMIES && !bossSpawned.current) {
        spawnTimerRef.current = 0;
        const side = Math.random() < 0.5 ? p.x - BASE_W * 0.6 : p.x + BASE_W * 0.6;
        const tp = cfg.getNormalEnemyType();
        const ehp = cfg.getNormalEnemyHp(tp);
        enemies.push({
          id: uid(), type: tp,
          x: clamp(side, 10, WORLD_W - 10), y: rng(FLOOR_MIN + 10, FLOOR_MAX - 10), z: 0,
          hp: ehp, maxHp: ehp, dir: side < p.x ? 'right' : 'left',
          walking: true, hurt: false, hurtTimer: 0, kbx: 0, kby: 0,
          atkCd: 30, stateTimer: 0, punchTimer: 0, hitThisSwing: false,
        });
      }

      // ── Partículas e textos ──
      updateParticlesAndTexts(particles, texts, f);

      setFrameTick(f);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [dead]);

  return {
    p: playerRef.current,
    dav: davisRef.current,
    enemies: enemiesRef.current,
    food: foodRef.current,
    texts: textsRef.current,
    particles: particlesRef.current,
    keysRef,
    frame: frameTick,
    cam: cameraRef.current,
    shake: screenShakeRef.current,
    score,
    bossEnemy: enemiesRef.current.find(e => isBossType(e.type)),
  };
}
