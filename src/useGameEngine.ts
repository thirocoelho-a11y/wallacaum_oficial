// ═══════════════════════════════════════════════════════
//  useGameEngine.ts — Motor Central do Jogo (Hook React)
//
//  Suporta tanto fases 1-2 (combat original) quanto
//  fases 3-5 (combatV2 + objetos de ambiente + IA nova).
//  A detecção é automática pelo EnginePhaseConfig.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import type {
  Player, Enemy, FoodItem, FloatingTextData, Particle,
  Davisaum, EnginePhaseConfig, EnvironmentObject, LightningZone,
} from './types';
import {
  DEFAULT_PLAYER, DEFAULT_DAVIS, MAX_HP, MAX_ENEMIES, WORLD_W, FLOOR_MIN, FLOOR_MAX,
  BASE_W, KNOCKBACK_DECAY, isBossType, FASE3_MAX_ENEMIES,
} from './constants';
import { rng, clamp, uid, spawnParticles } from './utils';
import { updatePlayerMovement, updatePlayerJump } from './physics';
import { updateIdleEating } from './combat';

// ── Fases 1-2: combat + AI originais ──
import { updatePlayerAttacks, checkPlayerHits, updateItems } from './combat';
import { updateBasicEnemyAI, updateSukaAI, updateFurioAI, updateDavisAI } from './ai';

// ── Fases 3-5: combat V2 + AI nova + ambiente ──
import { updatePlayerAttacksV2, checkPlayerHitsV2, updateRainEffect, updateLightningZones } from './combatV2';
import { updateZumbiAI, updateSukaMK2AI } from './aiFase3';
import {
  updateEnvironmentObjects, checkPlayerActivatesObject,
  checkEnvironmentHitsEnemy, checkBotijaoAreaDamage, checkTubulacaoSlowZone,
  respawnBossPhaseObjects,
} from './combatEnvironment';

// ─────────────────────────────────────────────────────
//  Particles & Texts update (local ao engine)
//  Expandido com tipos novos: gas, electric, rain
// ─────────────────────────────────────────────────────
function updateParticlesAndTexts(particles: Particle[], texts: FloatingTextData[], f: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx; pt.y += pt.vy;
    if (pt.type === 'dust' || pt.type === 'hit') pt.vy += 0.15;
    if (pt.type === 'spark') { pt.vx *= 0.92; pt.vy *= 0.92; }
    if (pt.type === 'gas') { pt.vy -= 0.05; pt.vx *= 0.95; } // Gás sobe e desacelera
    if (pt.type === 'electric') { pt.vx *= 0.85; pt.vy *= 0.85; } // Elétrico dissipa rápido
    if (pt.type === 'rain') { pt.vy += 0.3; pt.vx += 0.1; } // Chuva cai com vento
    pt.life--;
    if (pt.life <= 0) particles.splice(i, 1);
  }
  for (let i = texts.length - 1; i >= 0; i--) {
    if (f - texts[i].t >= 55) texts.splice(i, 1);
  }
}

// ─────────────────────────────────────────────────────
//  Helper: é tipo de inimigo da fase 3+?
// ─────────────────────────────────────────────────────
function isV2EnemyType(type: string): boolean {
  return type === 'zumbi' || type === 'zumbi_turbo' || type === 'suka_mk2'
    || type === 'zumbi_blindado' || type === 'mega_zumbi'
    || type === 'furia_final' || type === 'anciao';
}

// ─────────────────────────────────────────────────────
//  Hook Principal
// ─────────────────────────────────────────────────────
export function useGameEngine(cfg: EnginePhaseConfig) {
  // ── Detectar se usa mecânicas V2 ──
  const useV2 = !!(cfg.environmentObjects || cfg.playerPowers || cfg.lightningZones || cfg.hasRain);
  const maxEnemies = useV2 ? FASE3_MAX_ENEMIES : MAX_ENEMIES;

  const playerRef = useRef<Player>({
    ...DEFAULT_PLAYER,
    hp: Math.min(MAX_HP, cfg.initialHp > 0 ? cfg.initialHp + (cfg.bossType === 'furio' ? 30 : 0) : MAX_HP),
    invincible: cfg.bossType === 'furio' ? 60 : 0,
    // ── Novo: carregar powers se existirem na config ──
    powers: cfg.playerPowers || undefined,
    chargeTimer: 0,
    chargeReady: false,
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

  // ── Novo: refs pra mecânicas V2 ──
  const envObjectsRef = useRef<EnvironmentObject[]>(cfg.environmentObjects ? [...cfg.environmentObjects] : []);
  const lightningRef = useRef<LightningZone[]>(cfg.lightningZones ? [...cfg.lightningZones] : []);

  // ── Dicas do Davisaum pra objetos de ambiente (uma vez por tipo) ──
  const objectHintsShown = useRef<Set<string>>(new Set());

  const [score, setScore] = useState(cfg.initialScore);
  const [dead, setDead] = useState(false);
  const [frameTick, setFrameTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  // ── Teclado ──
  useEffect(() => {
    const d = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      // Escape ou P = toggle pause
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
        return;
      }
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const u = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
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
      const envObjects = envObjectsRef.current;
      const lightning = lightningRef.current;

      // Hitstop — congela tudo exceto render
      if (p.hitstop > 0) { p.hitstop--; setFrameTick(f); animId = requestAnimationFrame(loop); return; }

      // Pause — congela tudo, loop continua rodando pra detectar unpause
      if (pausedRef.current) { frameRef.current--; animId = requestAnimationFrame(loop); return; }

      // ── Sistemas do jogador ──
      updateIdleEating(p, k, particles, texts, f);
      updatePlayerMovement(p, k, particles);
      updatePlayerJump(p, k, particles);

      // ── Câmera ──
      cameraRef.current += (clamp(p.x - BASE_W / 2, 0, WORLD_W - BASE_W) - cameraRef.current) * 0.07;

      // ══════════════════════════════════════════════
      //  ATAQUES — V1 ou V2 conforme a fase
      // ══════════════════════════════════════════════
      if (useV2) {
        updatePlayerAttacksV2(p, k, enemies, screenShakeRef, particles, texts, f);
      } else {
        updatePlayerAttacks(p, k, enemies, screenShakeRef);
      }

      // ── Davisaum ──
      updateDavisAI(dav, p, enemies, foodRef.current, f);

      // ══════════════════════════════════════════════
      //  OBJETOS DE AMBIENTE (só V2)
      // ══════════════════════════════════════════════
      if (useV2 && envObjects.length > 0) {
        // Física dos objetos
        updateEnvironmentObjects(envObjects, f);

        // ── Dicas do Davisaum (primeira vez que chega perto) ──
        const hints = objectHintsShown.current;
        for (const obj of envObjects) {
          if (!obj.active || hints.has(obj.type)) continue;
          const hdx = Math.abs(obj.x - p.x);
          const hdy = Math.abs(obj.y - p.y);
          if (hdx < 150 && hdy < 80) {
            hints.add(obj.type);
            let hintText = '';
            let hintColor = '#3498db';
            switch (obj.type) {
              case 'botijao':  hintText = 'USA O BOTIJÃO! CHUTA NELE!'; break;
              case 'carrinho': hintText = 'EMPURRA O CARRINHO! SOCO OU BUFA!'; break;
              case 'poste':    hintText = 'O POSTE! FAZ UM COMBO E DERRUBA!'; hintColor = '#f1c40f'; break;
              case 'placa':    hintText = 'A PLACA! JOGA NOS ZUMBIS!'; break;
              case 'tanque':   hintText = 'TANQUE DE BUFA! EXPLODE TUDO!'; hintColor = '#2ecc71'; break;
              case 'tubulacao': hintText = 'A TUBULAÇÃO! LIBERA O VAPOR!'; break;
            }
            if (hintText) {
              texts.push({ id: uid(), text: hintText, x: dav.x, y: dav.y - 70, color: hintColor, size: 9, t: f });
            }
          }
        }

        // Jogador ativa objetos
        for (const obj of envObjects) {
          checkPlayerActivatesObject(obj, p, particles, texts, f, screenShakeRef);
        }

        // Objetos atingem inimigos
        for (const obj of envObjects) {
          if (!obj.active && !obj.exploding) continue;

          for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            const died = checkEnvironmentHitsEnemy(obj, e, particles, texts, f, screenShakeRef);
            if (died) {
              enemies.splice(i, 1);
              spawnParticles(particles, 12, e.x, e.y - 30, '#ff6600', 'spark', 6, 25, 5);
              scoreRef.current += p.combo >= 5 ? 200 : 120;
              setScore(scoreRef.current);
            }
          }

          // Botijão: dano em área a todos
          checkBotijaoAreaDamage(obj, enemies, particles, texts, f);

          // Tubulação: slow zone contínuo
          checkTubulacaoSlowZone(obj, p, enemies, particles, f);
        }
      }

      // ══════════════════════════════════════════════
      //  INIMIGOS — IA + Hit check
      // ══════════════════════════════════════════════
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

        // ── IA por tipo ──
        let stateResult: 'dead' | 'alive' = 'alive';

        if (e.type === 'zumbi' || e.type === 'zumbi_turbo') {
          stateResult = updateZumbiAI(e, p, particles, texts, f);
        } else if (e.type === 'suka_mk2') {
          stateResult = updateSukaMK2AI(e, p, dav, particles, texts, f, screenShakeRef);
        } else if (e.type === 'suka') {
          stateResult = updateSukaAI(e, p, dav, particles, texts, f, screenShakeRef);
        } else if (e.type === 'furio') {
          stateResult = updateFurioAI(e, p, dav, particles, texts, f, screenShakeRef);
        } else {
          stateResult = updateBasicEnemyAI(e, p, particles, texts, f);
        }

        if (stateResult === 'dead') { setDead(true); cfg.onGameOver(scoreRef.current); return; }

        // ── Hit check: V1 ou V2 ──
        const died = useV2
          ? checkPlayerHitsV2(e, p, particles, texts, f)
          : checkPlayerHits(e, p, particles, texts, f);

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

      // ══════════════════════════════════════════════
      //  BOIDS: Separação entre inimigos (anti-overlap)
      //  ✅ Impede que inimigos se empilhem no mesmo pixel
      // ══════════════════════════════════════════════
      for (let i = 0; i < enemies.length; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
          const e1 = enemies[i], e2 = enemies[j];
          const bdx = e1.x - e2.x, bdy = e1.y - e2.y;
          const bDist = Math.sqrt(bdx * bdx + bdy * bdy);
          if (bDist === 0) {
            // Salvaguarda: spawn no mesmo pixel exato
            e1.x += 1; e2.x -= 1;
            e1.y -= 0.5; e2.y += 0.5;
          } else if (bDist < 25) {
            const push = (25 - bDist) * 0.3 / bDist;
            e1.x += bdx * push; e1.y += bdy * push;
            e2.x -= bdx * push; e2.y -= bdy * push;
          }
        }
      }
      // Clamp pós-boids (não empurrar fora do cenário)
      for (const e of enemies) {
        e.x = clamp(e.x, 10, WORLD_W - 10);
        e.y = clamp(e.y, FLOOR_MIN, FLOOR_MAX);
      }

      // ══════════════════════════════════════════════
      //  CHUVA + RELÂMPAGOS (Fase 5 estágio 3)
      // ══════════════════════════════════════════════
      if (cfg.hasRain) {
        updateRainEffect(enemies, particles, texts, f, true);
      }
      if (lightning.length > 0) {
        updateLightningZones(lightning, enemies, p, particles, texts, f, screenShakeRef);
      }

      // ── Itens ──
      updateItems(foodRef.current, p, texts, particles, f);

      // ══════════════════════════════════════════════
      //  SPAWN
      // ══════════════════════════════════════════════
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
          // Campos V2 pra bosses novos
          absorbing: false, absorbTimer: 0,
          flying: false, armorFailing: false,
          stage: 1,
        });
        screenShakeRef.current = 20;
        texts.push({ id: uid(), text: cfg.bossAnnounce, x: p.x + 200, y: p.y - 100, color: cfg.bossAnnounceColor, size: 18, t: f });

        // ── Respawnar objetos de ambiente pro combate do boss ──
        if (useV2 && envObjects.length >= 0) {
          respawnBossPhaseObjects(envObjects, p.x);
          texts.push({ id: uid(), text: '⚠ NOVOS OBJETOS!', x: p.x, y: p.y - 60, color: '#e67e22', size: 10, t: f });
        }
      } else if (spawnTimerRef.current > si && enemies.length < maxEnemies && !bossSpawned.current) {
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
          // Campos V2 pra zumbis
          regenTimer: 0, gasTimer: 0,
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
    // ── Novo: expostos pro renderer ──
    envObjects: envObjectsRef.current,
    lightning: lightningRef.current,
    // ── Pause ──
    paused,
    togglePause: () => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); },
  };
}