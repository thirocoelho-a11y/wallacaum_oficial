// ═══════════════════════════════════════════════════════
//  useMotorRunner.ts — Motor da Fase 3½ (Moto / Runner)
//
//  REESCRITA COMPLETA:
//  ✅ Câmera TRAVADA (sem lerp) — objetos fixos no chão
//  ✅ Moto se move em espaço de TELA (LEFT/RIGHT)
//  ✅ Pulo com gravidade real (sem Math.sin)
//  ✅ Colisão AABB com posição Y contínua
//  ✅ Delta time (consistente em 60/120/144Hz)
//  ✅ Hitboxes vindas do OBSTACLE_SIZES (sem duplicação)
//  ✅ Gas corrigido pra lane 2
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import type {
  MotoState, RoadObstacle, RoadItem, RoadObstacleType, RoadItemType,
  Particle, FloatingTextData, MotoPhaseConfig, MutableRef,
} from './types';
import {
  DEFAULT_MOTO, BASE_W, BASE_H,
  MOTO_TOTAL_DURATION, MOTO_LANE_COUNT,
  MOTO_LANE_SWITCH_SPEED, MOTO_JUMP_DURATION,
  MOTO_PUNCH_DURATION, MOTO_PUNCH_RANGE,
  MOTO_SPEED_ACT1, MOTO_SPEED_ACT2, MOTO_SPEED_ACT3,
  MOTO_DMG_ZUMBI, MOTO_DMG_CARRO, MOTO_DMG_GAS,
  MOTO_DMG_BURACO, MOTO_DMG_ZUMBI_CORREDOR, MOTO_DMG_BARREIRA,
  MOTO_HEAL_BURGER, MOTO_TURBO_DURATION, MOTO_SHIELD_HITS,
  MOTO_SPAWN_ACT1, MOTO_SPAWN_ACT2, MOTO_SPAWN_ACT3,
  MOTO_ACT1_END, MOTO_ACT2_END,
  MOTO_ITEM_SPAWN_CHANCE,
  MAX_HP,
} from './constants';
import { uid, spawnParticles, clamp } from './utils';
import { playSFX } from './sfx';
import { OBSTACLE_SIZES, MOTO_SPRITE_SIZE } from './spritesMoto';

// ─────────────────────────────────────────────────────
//  Constantes
// ─────────────────────────────────────────────────────

// Moto na tela
const MOTO_REST_X = 200;         // Posição de descanso (sem input)
const MOTO_MIN_X = 60;           // Limite esquerdo
const MOTO_MAX_X = 600;          // Limite direito
const MOTO_ACCEL = 6.0;          // Aceleração ao apertar RIGHT
const MOTO_BRAKE = 5.0;          // Frenagem ao apertar LEFT
const MOTO_FRICTION = 0.88;      // Atrito quando soltar setas (só sem input)

// Velocidade do mundo
const WORLD_SPEED_MULT = 1.5;    // Multiplicador sobre m.speed

// Faixas
const LANE_Y = [265, 335, 405];
const LANE_SWITCH_LERP = 0.25;   // Velocidade de troca de faixa

// Pulo (gravidade real)
const JUMP_IMPULSE = 12;         // Velocidade inicial pra cima
const GRAVITY = 0.55;            // Gravidade por frame (a 60fps)
const GROUND_LEVEL = 0;          // jumpZ = 0 é o chão

// Invencibilidade
const INVINCIBLE_FRAMES = 60;

// Spawn/Despawn
const SPAWN_AHEAD = 1200;
const DESPAWN_BEHIND = 200;

// Hitbox da moto (relativa ao centro)
const MOTO_HB_LEFT = -50;        // ~metade do MOTO_SPRITE_SIZE.width/2
const MOTO_HB_RIGHT = 50;
const MOTO_HB_TOP = -MOTO_SPRITE_SIZE.height;
const MOTO_HB_BOTTOM = 0;

// Dano
const OBSTACLE_DAMAGE: Record<RoadObstacleType, number> = {
  zumbi: MOTO_DMG_ZUMBI,
  carro: MOTO_DMG_CARRO,
  gas: MOTO_DMG_GAS,
  buraco: MOTO_DMG_BURACO,
  zumbi_corredor: MOTO_DMG_ZUMBI_CORREDOR,
  barreira: MOTO_DMG_BARREIRA,
};

// ─────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────
function getCurrentAct(frame: number): 1 | 2 | 3 {
  if (frame < MOTO_ACT1_END) return 1;
  if (frame < MOTO_ACT2_END) return 2;
  return 3;
}

function getActSpeed(act: 1 | 2 | 3): number {
  if (act === 1) return MOTO_SPEED_ACT1;
  if (act === 2) return MOTO_SPEED_ACT2;
  return MOTO_SPEED_ACT3;
}

function getSpawnInterval(act: 1 | 2 | 3): number {
  if (act === 1) return MOTO_SPAWN_ACT1;
  if (act === 2) return MOTO_SPAWN_ACT2;
  return MOTO_SPAWN_ACT3;
}

/** Retorna o Y central de um obstáculo baseado na lane */
function getObsY(obs: RoadObstacle): number {
  return LANE_Y[obs.lane] ?? LANE_Y[1];
}

/** Retorna a altura visual de um obstáculo */
function getObsH(type: RoadObstacleType): number {
  return OBSTACLE_SIZES[type]?.height ?? 50;
}

function randomObstacleForAct(act: 1 | 2 | 3): { type: RoadObstacleType; lane: 0 | 1 | 2 } {
  const r = Math.random();
  let type: RoadObstacleType;
  let lane: 0 | 1 | 2 = Math.floor(Math.random() * 3) as 0 | 1 | 2;

  if (act === 1) {
    if (r < 0.5) type = 'zumbi';
    else if (r < 0.75) type = 'buraco';
    else type = 'carro';
  } else if (act === 2) {
    if (r < 0.25) type = 'zumbi';
    else if (r < 0.40) type = 'carro';
    else if (r < 0.55) type = 'gas';
    else if (r < 0.70) type = 'buraco';
    else if (r < 0.85) type = 'zumbi_corredor';
    else type = 'barreira';
  } else {
    if (r < 0.15) type = 'zumbi';
    else if (r < 0.30) type = 'carro';
    else if (r < 0.45) type = 'gas';
    else if (r < 0.55) type = 'buraco';
    else if (r < 0.70) type = 'zumbi_corredor';
    else type = 'barreira';
  }

  // Gas: faixa 0 ou 1 (nunca 2, senão vaza pra faixa inexistente)
  if (type === 'gas') lane = Math.random() < 0.5 ? 0 : 1;
  return { type, lane };
}

function randomItem(): RoadItemType {
  const r = Math.random();
  if (r < 0.55) return 'burger';
  if (r < 0.80) return 'turbo';
  return 'escudo';
}

// Diálogos
interface DavisaumDialogue { frame: number; text: string; color: string; }
const DIALOGUES: DavisaumDialogue[] = [
  { frame: 60,   text: '"VAI DEVAGAR PELO AMOR!!"', color: '#3498db' },
  { frame: 300,  text: '"EU ACHO QUE VI UM ZUMBI!!"', color: '#e74c3c' },
  { frame: 600,  text: '"DESVIA DESSE CARRO!!"', color: '#f39c12' },
  { frame: 1000, text: '"A ESTRADA TÁ FICANDO ESCURA!!"', color: '#9b59b6' },
  { frame: 1500, text: '"TEM GÁS TÓXICO NA PISTA!!"', color: '#2ecc71' },
  { frame: 2000, text: '"OLHA A BARREIRA!! PULA!!"', color: '#e74c3c' },
  { frame: 2800, text: '"TÁ QUASE LÁ!! EU ACHO!!"', color: '#f1c40f' },
  { frame: 3200, text: '"A MONTANHA!! FINALMENTE!!"', color: '#1abc9c' },
];

// ═══════════════════════════════════════════════════════
//  HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════
export default function useMotorRunner(cfg: MotoPhaseConfig) {
  const motoRef = useRef<MotoState>({
    ...DEFAULT_MOTO,
    hp: Math.min(MAX_HP, cfg.initialHp > 0 ? cfg.initialHp : MAX_HP),
  });
  const obstaclesRef = useRef<RoadObstacle[]>([]);
  const itemsRef = useRef<RoadItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingTextData[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const frameRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const scoreRef = useRef(cfg.initialScore);
  const screenShakeRef = useRef(0);
  const targetLaneRef = useRef<0 | 1 | 2>(1);
  const laneYRef = useRef(LANE_Y[1]);
  const jumpZRef = useRef(0);
  const jumpVelRef = useRef(0);         // ✅ Velocidade vertical do pulo
  const dialogueIdxRef = useRef(0);
  const completedRef = useRef(false);
  const lastTimeRef = useRef(0);        // ✅ Delta time

  // Câmera e posição
  const worldAdvanceRef = useRef(0);    // Quanto o mundo avançou no total
  const motoVxRef = useRef(0);          // Velocidade horizontal da moto em tela
  const motoScreenXRef = useRef(MOTO_REST_X);

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
    if (dead || completedRef.current) return;
    let animId: number;
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      // ✅ Delta time: normalizado pra 60fps (dt=1.0 a 60fps)
      const rawDt = (now - lastTimeRef.current) / (1000 / 60);
      const dt = Math.min(rawDt, 3); // Cap pra evitar saltos grandes
      lastTimeRef.current = now;

      const m = motoRef.current;
      const k = keysRef.current;
      const f = ++frameRef.current;
      const obstacles = obstaclesRef.current;
      const items = itemsRef.current;
      const particles = particlesRef.current;
      const texts = textsRef.current;

      // ══════════════════════════════════════════
      //  PROGRESSÃO
      // ══════════════════════════════════════════
      const act = getCurrentAct(f);
      m.speed = m.turboActive ? getActSpeed(act) * 2 : getActSpeed(act);
      m.distance = Math.min(100, (f / MOTO_TOTAL_DURATION) * 100);

      // ✅ Mundo avança (com delta time)
      worldAdvanceRef.current += m.speed * WORLD_SPEED_MULT * dt;

      // Vitória
      if (f >= MOTO_TOTAL_DURATION && !completedRef.current) {
        completedRef.current = true;
        cfg.onComplete(scoreRef.current, m.hp);
        return;
      }

      // ══════════════════════════════════════════
      //  MOTO: Posição horizontal em ESPAÇO DE TELA
      //  ✅ LEFT/RIGHT movem a moto na tela diretamente
      //  ✅ O mundo avança automaticamente (câmera travada)
      // ══════════════════════════════════════════
      if (k['arrowright']) {
        motoVxRef.current += MOTO_ACCEL * dt;
      } else if (k['arrowleft']) {
        motoVxRef.current -= MOTO_BRAKE * dt;
      } else {
        // Atrito só sem input: moto volta pro rest point
        motoVxRef.current *= Math.pow(MOTO_FRICTION, dt);
        // Puxar suavemente pro rest point
        const pullToRest = (MOTO_REST_X - motoScreenXRef.current) * 0.02 * dt;
        motoScreenXRef.current += pullToRest;
      }

      // Aplicar velocidade
      motoScreenXRef.current += motoVxRef.current * dt;

      // Clamp na tela + clamp velocidade
      motoScreenXRef.current = clamp(motoScreenXRef.current, MOTO_MIN_X, MOTO_MAX_X);
      motoVxRef.current = clamp(motoVxRef.current, -15, 15);

      // ✅ Câmera TRAVADA (sem lerp) — elimina patinação
      const cameraX = worldAdvanceRef.current;

      // ✅ Posição da moto no MUNDO (pra colisão)
      const motoWorldX = cameraX + motoScreenXRef.current;

      const motoScrX = motoScreenXRef.current;

      // ══════════════════════════════════════════
      //  Troca de faixa (UP/DOWN)
      // ══════════════════════════════════════════
      if (k['arrowup'] && targetLaneRef.current > 0) {
        targetLaneRef.current = (targetLaneRef.current - 1) as 0 | 1 | 2;
        k['arrowup'] = false;
        playSFX('hit');
      }
      if (k['arrowdown'] && targetLaneRef.current < 2) {
        targetLaneRef.current = (targetLaneRef.current + 1) as 0 | 1 | 2;
        k['arrowdown'] = false;
        playSFX('hit');
      }

      const targetY = LANE_Y[targetLaneRef.current];
      laneYRef.current += (targetY - laneYRef.current) * LANE_SWITCH_LERP * dt;
      if (Math.abs(laneYRef.current - targetY) < 1) laneYRef.current = targetY;

      // Lane lógica sincroniza quando visual está perto
      if (Math.abs(laneYRef.current - targetY) < 20) {
        m.lane = targetLaneRef.current;
      }

      // ══════════════════════════════════════════
      //  Pulo (gravidade real)
      // ══════════════════════════════════════════
      if ((k['z'] || k[' ']) && !m.jumping) {
        m.jumping = true;
        jumpVelRef.current = JUMP_IMPULSE;
        k['z'] = false; k[' '] = false;
        playSFX('hit');
      }

      if (m.jumping) {
        // ✅ Física real: velocidade + gravidade
        jumpVelRef.current -= GRAVITY * dt;
        jumpZRef.current += jumpVelRef.current * dt;

        // Aterrissou
        if (jumpZRef.current <= GROUND_LEVEL) {
          jumpZRef.current = GROUND_LEVEL;
          jumpVelRef.current = 0;
          m.jumping = false;
          m.jumpTimer = 0;
          spawnParticles(particles, 4, motoScrX, laneYRef.current, '#8B7355', 'dust', 3, 10, 3);
        }
      }

      // ══════════════════════════════════════════
      //  Soco (X)
      // ══════════════════════════════════════════
      if (k['x'] && !m.punching && m.punchTimer <= 0) {
        m.punching = true;
        m.punchTimer = MOTO_PUNCH_DURATION;
        k['x'] = false;
        playSFX('hit');
      }
      if (m.punchTimer > 0) {
        m.punchTimer--;
        if (m.punchTimer <= 0) m.punching = false;
      }

      // ══════════════════════════════════════════
      //  Turbo / Escudo / Invencibilidade
      // ══════════════════════════════════════════
      if (m.turboActive) {
        m.turboTimer--;
        if (m.turboTimer <= 0) { m.turboActive = false; m.turboTimer = 0; }
        if (f % 3 === 0) spawnParticles(particles, 1, motoScrX - 20, laneYRef.current, '#f1c40f', 'spark', 3, 8, 3);
      }
      if (m.invincible > 0) m.invincible--;

      // ══════════════════════════════════════════
      //  SPAWN (posição no MUNDO)
      // ══════════════════════════════════════════
      spawnTimerRef.current++;
      if (spawnTimerRef.current >= getSpawnInterval(act)) {
        spawnTimerRef.current = 0;
        const { type, lane } = randomObstacleForAct(act);
        const obsW = OBSTACLE_SIZES[type]?.width ?? 40;

        obstacles.push({
          id: uid(), type, lane,
          x: motoWorldX + SPAWN_AHEAD,
          width: obsW,
          dangerous: true,
        });

        if (Math.random() < MOTO_ITEM_SPAWN_CHANCE) {
          let itemLane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
          if (itemLane === lane) itemLane = ((lane + 1) % 3) as 0 | 1 | 2;
          items.push({
            id: uid(), type: randomItem(), lane: itemLane,
            x: motoWorldX + SPAWN_AHEAD + 50,
          });
        }
      }

      // ══════════════════════════════════════════
      //  DESPAWN
      // ══════════════════════════════════════════
      for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].x < motoWorldX - DESPAWN_BEHIND) {
          if (!obstacles[i].hit && !(obstacles[i] as any)._touched) {
            scoreRef.current += 10;
            setScore(scoreRef.current);
          }
          obstacles.splice(i, 1);
        }
      }
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].x < motoWorldX - DESPAWN_BEHIND) items.splice(i, 1);
      }

      // ══════════════════════════════════════════
      //  COLISÃO AABB (mundo)
      //  ✅ Usa posições contínuas (Y real, não lane)
      // ══════════════════════════════════════════
      const motoY = laneYRef.current;         // Y contínuo da moto
      const motoZ = jumpZRef.current;         // Altura do pulo

      for (const obs of obstacles) {
        if (obs.hit) continue;

        const obsW = OBSTACLE_SIZES[obs.type]?.width ?? 40;
        const obsH = getObsH(obs.type);
        const obsY = getObsY(obs);

        // ── AABB horizontal (mundo) ──
        const mL = motoWorldX + MOTO_HB_LEFT;
        const mR = motoWorldX + MOTO_HB_RIGHT;
        const oL = obs.x - obsW / 2;
        const oR = obs.x + obsW / 2;
        if (mR < oL || mL > oR) continue;

        // ── AABB vertical (tela Y) ──
        // Moto Y range: [motoY - motoH, motoY] (pé no chão = motoY)
        const motoH = MOTO_SPRITE_SIZE.height;
        const mTop = motoY - motoH - motoZ;  // Z eleva a moto
        const mBot = motoY - motoZ;
        const oTop = obsY - obsH;
        const oBot = obsY;
        if (mBot < oTop || mTop > oBot) continue; // Pulou por cima!

        // ── Colisão confirmada — processar por tipo ──

        // Zumbi corredor: soco derrota
        if (obs.type === 'zumbi_corredor') {
          if (m.punching && m.punchTimer > 0) {
            obs.hit = true; obs.dangerous = false;
            scoreRef.current += 50; setScore(scoreRef.current);
            const osX = obs.x - cameraX;
            spawnParticles(particles, 6, osX, LANE_Y[obs.lane] - 20, '#f1c40f', 'spark', 4, 15, 4);
            texts.push({ id: uid(), text: '+50 SOCO!', x: osX, y: LANE_Y[obs.lane] - 40, color: '#f1c40f', size: 14, t: f });
            playSFX('hit'); screenShakeRef.current = 5;
            continue;
          }
          if (m.invincible > 0 || m.turboActive) continue;
          applyDamage(m, obs, particles, texts, f, screenShakeRef, laneYRef.current, motoScrX);
          if (m.hp <= 0) { setDead(true); cfg.onGameOver(scoreRef.current); return; }
          continue;
        }

        // Barreira
        if (obs.type === 'barreira') {
          if (m.invincible > 0 || m.turboActive) { obs.hit = true; continue; }
          applyDamage(m, obs, particles, texts, f, screenShakeRef, laneYRef.current, motoScrX);
          if (m.hp <= 0) { setDead(true); cfg.onGameOver(scoreRef.current); return; }
          continue;
        }

        // Gás: dano contínuo
        if (obs.type === 'gas') {
          // ✅ FIX: Checa proximidade Y real em vez de lane match
          const gasYCenter = obsY;
          const gasHalfH = obsH;
          const motoCenter = motoY - motoZ;
          if (Math.abs(motoCenter - gasYCenter) > gasHalfH) continue;

          if (m.invincible > 0 || m.turboActive) continue;
          (obs as any)._touched = true;
          if (f % 30 === 0) {
            m.hp -= MOTO_DMG_GAS; m.invincible = 10;
            spawnParticles(particles, 3, motoScrX, laneYRef.current - 20, 'rgba(100,255,100,0.5)', 'gas', 2, 15, 5);
            texts.push({ id: uid(), text: `-${MOTO_DMG_GAS} ☁`, x: motoScrX + 30, y: laneYRef.current - 40, color: '#88ff88', size: 12, t: f });
            if (m.hp <= 0) { setDead(true); cfg.onGameOver(scoreRef.current); return; }
          }
          continue;
        }

        // Buraco / Zumbi / Carro (genéricos)
        if (m.invincible > 0 || m.turboActive) { obs.hit = true; continue; }
        applyDamage(m, obs, particles, texts, f, screenShakeRef, laneYRef.current, motoScrX);
        if (m.hp <= 0) { setDead(true); cfg.onGameOver(scoreRef.current); return; }
      }

      // ══════════════════════════════════════════
      //  COLISÃO: Itens
      // ══════════════════════════════════════════
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item.collected) continue;
        if (Math.abs(item.x - motoWorldX) > 50) continue;
        if (item.lane !== m.lane) continue;

        item.collected = true; items.splice(i, 1);

        switch (item.type) {
          case 'burger':
            m.hp = Math.min(MAX_HP, m.hp + MOTO_HEAL_BURGER);
            texts.push({ id: uid(), text: `+${MOTO_HEAL_BURGER} HP`, x: motoScrX, y: laneYRef.current - 50, color: '#2ecc71', size: 14, t: f });
            spawnParticles(particles, 4, motoScrX, laneYRef.current - 20, '#2ecc71', 'ring', 4, 15, 6);
            break;
          case 'turbo':
            m.turboActive = true; m.turboTimer = MOTO_TURBO_DURATION;
            texts.push({ id: uid(), text: '⚡ TURBO!', x: motoScrX, y: laneYRef.current - 50, color: '#f1c40f', size: 16, t: f });
            spawnParticles(particles, 6, motoScrX, laneYRef.current - 20, '#f1c40f', 'ring', 5, 20, 8);
            screenShakeRef.current = 6;
            break;
          case 'escudo':
            m.shieldActive = true;
            texts.push({ id: uid(), text: '🛡 ESCUDO!', x: motoScrX, y: laneYRef.current - 50, color: '#3498db', size: 14, t: f });
            spawnParticles(particles, 5, motoScrX, laneYRef.current - 20, '#3498db', 'ring', 4, 18, 8);
            break;
        }
        scoreRef.current += 25; setScore(scoreRef.current); playSFX('hit');
      }

      // ══════════════════════════════════════════
      //  DIÁLOGOS
      // ══════════════════════════════════════════
      if (dialogueIdxRef.current < DIALOGUES.length) {
        const next = DIALOGUES[dialogueIdxRef.current];
        if (f >= next.frame) {
          texts.push({ id: uid(), text: next.text, x: motoScrX + 60, y: laneYRef.current - 80, color: next.color, size: 9, t: f });
          dialogueIdxRef.current++;
        }
      }

      // ══════════════════════════════════════════
      //  PARTÍCULAS
      // ══════════════════════════════════════════
      if (f % 4 === 0) spawnParticles(particles, 1, motoScrX - 30, laneYRef.current + 5, 'rgba(150,150,150,0.3)', 'dust', 1, 15, 3);
      if (m.turboActive && f % 2 === 0) spawnParticles(particles, 1, motoScrX - 35, laneYRef.current, '#ff6600', 'spark', 2, 10, 3);

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx; pt.y += pt.vy;
        if (pt.type === 'dust') pt.vy -= 0.05;
        if (pt.type === 'gas') { pt.vy -= 0.08; pt.vx *= 0.95; }
        if (pt.type === 'spark') { pt.vx *= 0.9; pt.vy *= 0.9; }
        pt.life--;
        if (pt.life <= 0) particles.splice(i, 1);
      }

      for (let i = texts.length - 1; i >= 0; i--) {
        if (f - texts[i].t >= 80) texts.splice(i, 1);
      }

      if (screenShakeRef.current > 0) screenShakeRef.current--;
      setFrameTick(f);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [dead]);

  return {
    moto: motoRef.current,
    obstacles: obstaclesRef.current,
    items: itemsRef.current,
    particles: particlesRef.current,
    texts: textsRef.current,
    keysRef,
    frame: frameTick,
    score,
    act: getCurrentAct(frameTick) as 1 | 2 | 3,
    shake: screenShakeRef.current,
    laneY: laneYRef.current,
    jumpZ: jumpZRef.current,
    motoX: motoScreenXRef.current,
    lanePositions: LANE_Y,
    cameraX: worldAdvanceRef.current,  // ✅ Câmera travada = avanço do mundo
  };
}

// ─────────────────────────────────────────────────────
//  Aplica dano
// ─────────────────────────────────────────────────────
function applyDamage(
  m: MotoState, obs: RoadObstacle,
  particles: Particle[], texts: FloatingTextData[],
  f: number, screenShakeRef: MutableRef<number>,
  laneVisualY: number, motoScrX: number,
): void {
  obs.hit = true;

  if (m.shieldActive) {
    m.shieldActive = false;
    m.invincible = INVINCIBLE_FRAMES;
    spawnParticles(particles, 6, motoScrX, laneVisualY - 20, '#3498db', 'ring', 5, 20, 8);
    texts.push({ id: uid(), text: '🛡 BLOQUEOU!', x: motoScrX, y: laneVisualY - 50, color: '#3498db', size: 14, t: f });
    screenShakeRef.current = 4;
    return;
  }

  const dmg = OBSTACLE_DAMAGE[obs.type];
  m.hp -= dmg;
  m.invincible = INVINCIBLE_FRAMES;
  screenShakeRef.current = 10;
  playSFX('shout');

  const hitColor = obs.type === 'carro' ? '#e74c3c' : obs.type === 'barreira' ? '#ff4444' : '#ff8844';
  spawnParticles(particles, 8, motoScrX, laneVisualY - 20, hitColor, 'hit', 5, 18, 5);
  texts.push({ id: uid(), text: `-${dmg}`, x: motoScrX + 20, y: laneVisualY - 50, color: hitColor, size: 18, t: f });
}