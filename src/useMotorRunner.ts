// ═══════════════════════════════════════════════════════
//  useMotorRunner.ts — Motor da Fase 3½ (Moto / Runner)
//
//  Engine COMPLETAMENTE SEPARADO do useGameEngine.
//  Mecânica: side-scroller automático, lane-based.
//
//  Input: ↑↓ mudar faixa, Z pular, X soco lateral
//
//  3 Atos:
//  ┌──────────────────┬────────────┬────────────────────┐
//  │ ATO 1 (0-30s)    │ ATO 2      │ ATO 3 (60-90s)     │
//  │ Saída da cidade   │ Estrada    │ Subida montanha    │
//  │ speed 3, spawn 90 │ speed 5,50 │ speed 7, spawn 30  │
//  └──────────────────┴────────────┴────────────────────┘
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

// ─────────────────────────────────────────────────────
//  Constantes locais do runner
// ─────────────────────────────────────────────────────
const MOTO_X = 140;                    // Posição X fixa da moto na tela
const OBSTACLE_SPAWN_X = BASE_W + 60;  // Spawn fora da tela à direita
const OBSTACLE_DESPAWN_X = -80;        // Remove ao sair pela esquerda
const LANE_Y = [160, 240, 320];        // Y visual de cada faixa (topo, meio, baixo)
const MOTO_VISUAL_Y_OFFSET = -30;      // Offset pra moto "sentar" na faixa
const JUMP_HEIGHT = 55;                // Altura máxima do pulo
const INVINCIBLE_FRAMES = 60;          // 1 segundo de invencibilidade após hit

// Larguras dos obstáculos por tipo
const OBSTACLE_WIDTH: Record<RoadObstacleType, number> = {
  zumbi: 40,
  carro: 70,
  gas: 100,
  buraco: 50,
  zumbi_corredor: 35,
  barreira: BASE_W + 20, // Ocupa todas as faixas
};

// Dano por tipo
const OBSTACLE_DAMAGE: Record<RoadObstacleType, number> = {
  zumbi: MOTO_DMG_ZUMBI,
  carro: MOTO_DMG_CARRO,
  gas: MOTO_DMG_GAS,
  buraco: MOTO_DMG_BURACO,
  zumbi_corredor: MOTO_DMG_ZUMBI_CORREDOR,
  barreira: MOTO_DMG_BARREIRA,
};

// ─────────────────────────────────────────────────────
//  Helper: ato atual baseado no frame
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

// ─────────────────────────────────────────────────────
//  Helper: spawn de obstáculo aleatório por ato
// ─────────────────────────────────────────────────────
function randomObstacleForAct(act: 1 | 2 | 3): { type: RoadObstacleType; lane: 0 | 1 | 2 } {
  const r = Math.random();
  let type: RoadObstacleType;
  let lane: 0 | 1 | 2 = Math.floor(Math.random() * 3) as 0 | 1 | 2;

  if (act === 1) {
    // Ato 1: poucos obstáculos simples
    if (r < 0.5) type = 'zumbi';
    else if (r < 0.75) type = 'buraco';
    else type = 'carro';
  } else if (act === 2) {
    // Ato 2: mais variedade, gás aparece
    if (r < 0.25) type = 'zumbi';
    else if (r < 0.40) type = 'carro';
    else if (r < 0.55) type = 'gas';
    else if (r < 0.70) type = 'buraco';
    else if (r < 0.85) type = 'zumbi_corredor';
    else type = 'barreira';
  } else {
    // Ato 3: intenso, mais barreiras e corredores
    if (r < 0.15) type = 'zumbi';
    else if (r < 0.30) type = 'carro';
    else if (r < 0.45) type = 'gas';
    else if (r < 0.55) type = 'buraco';
    else if (r < 0.70) type = 'zumbi_corredor';
    else type = 'barreira';
  }

  // Gás ocupa 2 faixas — sempre spawna na faixa 0 ou 1 (nunca 2 pra ter escape)
  if (type === 'gas') {
    lane = Math.random() < 0.5 ? 0 : 1;
  }

  return { type, lane };
}

// ─────────────────────────────────────────────────────
//  Helper: spawn de item aleatório
// ─────────────────────────────────────────────────────
function randomItem(): RoadItemType {
  const r = Math.random();
  if (r < 0.55) return 'burger';    // Mais comum
  if (r < 0.80) return 'turbo';
  return 'escudo';
}

// ─────────────────────────────────────────────────────
//  Diálogos do Davisaum por ato
// ─────────────────────────────────────────────────────
interface DavisaumDialogue {
  frame: number;     // Frame em que aparece
  text: string;
  color: string;
}

const DIALOGUES: DavisaumDialogue[] = [
  // Ato 1
  { frame: 60,   text: 'A ESTRADA TÁ LIMPA! ...RELATIVAMENTE!', color: '#3498db' },
  { frame: 600,  text: 'SEGURA FIRME!', color: '#3498db' },
  // Ato 1→2 transição
  { frame: MOTO_ACT1_END + 10, text: 'A VELOCIDADE MÁXIMA SEGURA É 60! ESTAMOS A 140!', color: '#e67e22' },
  // Ato 2
  { frame: MOTO_ACT1_END + 600, text: 'TEM GÁS NA ESTRADA! CUIDADO!', color: '#27ae60' },
  { frame: MOTO_ACT1_END + 1200, text: 'DESVIA! DESVIA! DESVIAAA!', color: '#e74c3c' },
  // Ato 2→3 transição
  { frame: MOTO_ACT2_END + 10, text: 'PEDRA! PEDRA! PEDRAAA!', color: '#e74c3c' },
  // Ato 3
  { frame: MOTO_ACT2_END + 600, text: 'TÔ VENDO A MONTANHA! AGUENTA!', color: '#f1c40f' },
  { frame: MOTO_ACT2_END + 1400, text: 'CHEGAMOS! EU AINDA TO INTEIRO?!', color: '#2ecc71' },
];

// ═════════════════════════════════════════════════════
//  HOOK PRINCIPAL: useMotorRunner
// ═════════════════════════════════════════════════════
export function useMotorRunner(cfg: MotoPhaseConfig) {
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
  const targetLaneRef = useRef<0 | 1 | 2>(1); // Lane alvo (interpolação suave)
  const laneYRef = useRef(LANE_Y[1]);          // Y visual atual (interpolado)
  const jumpZRef = useRef(0);                   // Altura do pulo (0 = no chão)
  const dialogueIdxRef = useRef(0);             // Próximo diálogo a mostrar
  const completedRef = useRef(false);

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

    const loop = () => {
      const m = motoRef.current;
      const k = keysRef.current;
      const f = ++frameRef.current;
      const obstacles = obstaclesRef.current;
      const items = itemsRef.current;
      const particles = particlesRef.current;
      const texts = textsRef.current;

      // ══════════════════════════════════════════
      //  PROGRESSÃO & ATO
      // ══════════════════════════════════════════
      const act = getCurrentAct(f);
      m.speed = m.turboActive ? getActSpeed(act) * 2 : getActSpeed(act);
      m.distance = Math.min(100, (f / MOTO_TOTAL_DURATION) * 100);

      // Vitória: sobreviveu até o fim
      if (f >= MOTO_TOTAL_DURATION && !completedRef.current) {
        completedRef.current = true;
        cfg.onComplete(scoreRef.current, m.hp);
        return;
      }

      // ══════════════════════════════════════════
      //  INPUT: Troca de faixa
      // ══════════════════════════════════════════
      if (k['arrowup'] && targetLaneRef.current > 0) {
        targetLaneRef.current = (targetLaneRef.current - 1) as 0 | 1 | 2;
        k['arrowup'] = false; // Consume input (1 press = 1 lane)
        playSFX('hit');
      }
      if (k['arrowdown'] && targetLaneRef.current < 2) {
        targetLaneRef.current = (targetLaneRef.current + 1) as 0 | 1 | 2;
        k['arrowdown'] = false;
        playSFX('hit');
      }

      // Interpolação suave da posição Y
      const targetY = LANE_Y[targetLaneRef.current];
      laneYRef.current += (targetY - laneYRef.current) * 0.18;
      if (Math.abs(laneYRef.current - targetY) < 1) laneYRef.current = targetY;
      m.lane = targetLaneRef.current;

      // ══════════════════════════════════════════
      //  INPUT: Pulo
      // ══════════════════════════════════════════
      if ((k['z'] || k[' ']) && !m.jumping) {
        m.jumping = true;
        m.jumpTimer = MOTO_JUMP_DURATION;
        k['z'] = false;
        k[' '] = false;
        playSFX('hit');
      }

      if (m.jumping) {
        m.jumpTimer--;
        // Arco parabólico suave
        const half = MOTO_JUMP_DURATION / 2;
        const t = MOTO_JUMP_DURATION - m.jumpTimer;
        if (t <= half) {
          // Subindo
          jumpZRef.current = (t / half) * JUMP_HEIGHT;
        } else {
          // Descendo
          jumpZRef.current = ((MOTO_JUMP_DURATION - t) / half) * JUMP_HEIGHT;
        }
        if (m.jumpTimer <= 0) {
          m.jumping = false;
          m.jumpTimer = 0;
          jumpZRef.current = 0;
          // Partículas de pouso
          spawnParticles(particles, 4, MOTO_X, laneYRef.current, '#8B7355', 'dust', 3, 10, 3);
        }
      }

      // ══════════════════════════════════════════
      //  INPUT: Soco lateral
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
      //  TURBO & ESCUDO
      // ══════════════════════════════════════════
      if (m.turboActive) {
        m.turboTimer--;
        if (m.turboTimer <= 0) {
          m.turboActive = false;
          m.turboTimer = 0;
        }
        // Partículas de turbo
        if (f % 3 === 0) {
          spawnParticles(particles, 1, MOTO_X - 20, laneYRef.current, '#f1c40f', 'spark', 3, 8, 3);
        }
      }

      if (m.invincible > 0) m.invincible--;

      // ══════════════════════════════════════════
      //  SPAWN DE OBSTÁCULOS
      // ══════════════════════════════════════════
      spawnTimerRef.current++;
      const spawnInt = getSpawnInterval(act);

      if (spawnTimerRef.current >= spawnInt) {
        spawnTimerRef.current = 0;

        const { type, lane } = randomObstacleForAct(act);
        obstacles.push({
          id: uid(),
          type,
          lane,
          x: OBSTACLE_SPAWN_X,
          width: OBSTACLE_WIDTH[type],
          dangerous: true,
        });

        // Chance de item junto com o obstáculo
        if (Math.random() < MOTO_ITEM_SPAWN_CHANCE) {
          // Item numa faixa diferente do obstáculo
          let itemLane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
          if (itemLane === lane) itemLane = ((lane + 1) % 3) as 0 | 1 | 2;

          items.push({
            id: uid(),
            type: randomItem(),
            lane: itemLane,
            x: OBSTACLE_SPAWN_X + 30,
          });
        }
      }

      // ══════════════════════════════════════════
      //  MOVER OBSTÁCULOS & ITENS
      // ══════════════════════════════════════════
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= m.speed;

        // Remover se saiu da tela
        if (obs.x < OBSTACLE_DESPAWN_X) {
          // Score por evitar obstáculo
          if (!obs.hit) {
            scoreRef.current += 10;
            setScore(scoreRef.current);
          }
          obstacles.splice(i, 1);
        }
      }

      for (let i = items.length - 1; i >= 0; i--) {
        items[i].x -= m.speed;
        if (items[i].x < OBSTACLE_DESPAWN_X) {
          items.splice(i, 1);
        }
      }

      // ══════════════════════════════════════════
      //  COLISÃO: Moto vs Obstáculos (lane-based)
      // ══════════════════════════════════════════
      for (const obs of obstacles) {
        if (obs.hit) continue;

        // Check X: obstáculo está na zona da moto?
        const motoLeft = MOTO_X - 25;
        const motoRight = MOTO_X + 35;
        const obsLeft = obs.x - obs.width / 2;
        const obsRight = obs.x + obs.width / 2;

        if (motoRight < obsLeft || motoLeft > obsRight) continue;

        // ── Zumbi corredor: só pode ser derrotado com soco ──
        if (obs.type === 'zumbi_corredor') {
          // Soco derrota o zumbi corredor
          if (m.punching && m.punchTimer > MOTO_PUNCH_DURATION - 10) {
            obs.hit = true;
            obs.dangerous = false;
            scoreRef.current += 50;
            setScore(scoreRef.current);
            spawnParticles(particles, 6, obs.x, LANE_Y[obs.lane] - 20, '#f1c40f', 'spark', 4, 15, 4);
            texts.push({ id: uid(), text: '+50 SOCO!', x: obs.x, y: LANE_Y[obs.lane] - 40, color: '#f1c40f', size: 14, t: f });
            playSFX('hit');
            screenShakeRef.current = 5;
            continue;
          }

          // Zumbi corredor: checa mesma faixa
          if (obs.lane !== m.lane) continue;
          if (m.invincible > 0 || m.turboActive) continue;

          // Hit!
          applyDamage(m, obs, particles, texts, f, screenShakeRef);
          if (m.hp <= 0) { setDead(true); cfg.onGameOver(scoreRef.current); return; }
          continue;
        }

        // ── Barreira: precisa pular (todas as faixas) ──
        if (obs.type === 'barreira') {
          if (m.jumping && jumpZRef.current > 25) continue; // Pulou por cima
          if (m.invincible > 0 || m.turboActive) { obs.hit = true; continue; }

          applyDamage(m, obs, particles, texts, f, screenShakeRef);
          if (m.hp <= 0) { setDead(true); cfg.onGameOver(scoreRef.current); return; }
          continue;
        }

        // ── Gás: ocupa 2 faixas (lane e lane+1) ──
        if (obs.type === 'gas') {
          const inGas = m.lane === obs.lane || m.lane === (obs.lane + 1);
          if (!inGas) continue;
          if (m.jumping && jumpZRef.current > 15) continue; // Pular reduz exposição
          if (m.invincible > 0 || m.turboActive) continue;

          // Gás: dano contínuo (aplica a cada 30 frames enquanto dentro)
          if (f % 30 === 0) {
            m.hp -= MOTO_DMG_GAS;
            m.invincible = 10; // Breve invencibilidade pra não stackar
            spawnParticles(particles, 3, MOTO_X, laneYRef.current - 20, 'rgba(100,255,100,0.5)', 'gas', 2, 15, 5);
            texts.push({ id: uid(), text: `-${MOTO_DMG_GAS} ☁`, x: MOTO_X + 30, y: laneYRef.current - 40, color: '#88ff88', size: 12, t: f });
            if (m.hp <= 0) { setDead(true); cfg.onGameOver(scoreRef.current); return; }
          }
          continue;
        }

        // ── Buraco: precisa pular ──
        if (obs.type === 'buraco') {
          if (obs.lane !== m.lane) continue;
          if (m.jumping && jumpZRef.current > 10) continue;
          if (m.invincible > 0 || m.turboActive) { obs.hit = true; continue; }

          applyDamage(m, obs, particles, texts, f, screenShakeRef);
          if (m.hp <= 0) { setDead(true); cfg.onGameOver(scoreRef.current); return; }
          continue;
        }

        // ── Zumbi / Carro: mudar de faixa para evitar ──
        if (obs.lane !== m.lane) continue;
        if (m.jumping && jumpZRef.current > 20) continue; // Pular zumbi funciona
        if (m.invincible > 0 || m.turboActive) { obs.hit = true; continue; }

        applyDamage(m, obs, particles, texts, f, screenShakeRef);
        if (m.hp <= 0) { setDead(true); cfg.onGameOver(scoreRef.current); return; }
      }

      // ══════════════════════════════════════════
      //  COLISÃO: Moto vs Itens
      // ══════════════════════════════════════════
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item.collected) continue;

        const dx = Math.abs(item.x - MOTO_X);
        if (dx > 40) continue;
        if (item.lane !== m.lane) continue;

        // Coletou!
        item.collected = true;
        items.splice(i, 1);

        switch (item.type) {
          case 'burger':
            m.hp = Math.min(MAX_HP, m.hp + MOTO_HEAL_BURGER);
            texts.push({ id: uid(), text: `+${MOTO_HEAL_BURGER} HP 🍔`, x: MOTO_X, y: laneYRef.current - 50, color: '#f39c12', size: 14, t: f });
            spawnParticles(particles, 4, MOTO_X, laneYRef.current - 20, '#f39c12', 'spark', 3, 12, 4);
            break;

          case 'turbo':
            m.turboActive = true;
            m.turboTimer = MOTO_TURBO_DURATION;
            texts.push({ id: uid(), text: '⚡ TURBO!', x: MOTO_X, y: laneYRef.current - 50, color: '#f1c40f', size: 16, t: f });
            spawnParticles(particles, 6, MOTO_X, laneYRef.current - 20, '#f1c40f', 'ring', 5, 20, 8);
            screenShakeRef.current = 6;
            break;

          case 'escudo':
            m.shieldActive = true;
            texts.push({ id: uid(), text: '🛡 ESCUDO!', x: MOTO_X, y: laneYRef.current - 50, color: '#3498db', size: 14, t: f });
            spawnParticles(particles, 5, MOTO_X, laneYRef.current - 20, '#3498db', 'ring', 4, 18, 8);
            break;
        }

        scoreRef.current += 25;
        setScore(scoreRef.current);
        playSFX('hit');
      }

      // ══════════════════════════════════════════
      //  DIÁLOGOS DO DAVISAUM
      // ══════════════════════════════════════════
      if (dialogueIdxRef.current < DIALOGUES.length) {
        const next = DIALOGUES[dialogueIdxRef.current];
        if (f >= next.frame) {
          texts.push({
            id: uid(),
            text: next.text,
            x: MOTO_X + 60,
            y: laneYRef.current - 80,
            color: next.color,
            size: 9,
            t: f,
          });
          dialogueIdxRef.current++;
        }
      }

      // ══════════════════════════════════════════
      //  PARTÍCULAS & TEXTOS
      // ══════════════════════════════════════════

      // Partículas de estrada (fumaça do escape)
      if (f % 4 === 0) {
        spawnParticles(particles, 1, MOTO_X - 30, laneYRef.current + 5, 'rgba(150,150,150,0.3)', 'dust', 1, 15, 3);
      }
      // Turbo: mais partículas
      if (m.turboActive && f % 2 === 0) {
        spawnParticles(particles, 1, MOTO_X - 35, laneYRef.current, '#ff6600', 'spark', 2, 10, 3);
      }

      // Atualizar partículas
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx - m.speed * 0.3; // Partículas também scrollam
        pt.y += pt.vy;
        if (pt.type === 'dust') pt.vy -= 0.05;
        if (pt.type === 'gas') { pt.vy -= 0.08; pt.vx *= 0.95; }
        if (pt.type === 'spark') { pt.vx *= 0.9; pt.vy *= 0.9; }
        pt.life--;
        if (pt.life <= 0) particles.splice(i, 1);
      }

      // Limpar textos velhos
      for (let i = texts.length - 1; i >= 0; i--) {
        if (f - texts[i].t >= 80) texts.splice(i, 1); // Diálogos duram mais
      }

      // Screen shake decay
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
    motoX: MOTO_X,
    lanePositions: LANE_Y,
  };
}

// ─────────────────────────────────────────────────────
//  Aplica dano de obstáculo à moto
// ─────────────────────────────────────────────────────
function applyDamage(
  m: MotoState, obs: RoadObstacle,
  particles: Particle[], texts: FloatingTextData[],
  f: number, screenShakeRef: MutableRef<number>,
): void {
  obs.hit = true;

  // Escudo absorve 1 hit
  if (m.shieldActive) {
    m.shieldActive = false;
    spawnParticles(particles, 6, MOTO_X, LANE_Y[m.lane] - 20, '#3498db', 'ring', 5, 20, 8);
    texts.push({ id: uid(), text: '🛡 BLOQUEOU!', x: MOTO_X, y: LANE_Y[m.lane] - 50, color: '#3498db', size: 14, t: f });
    screenShakeRef.current = 4;
    return;
  }

  const dmg = OBSTACLE_DAMAGE[obs.type];
  m.hp -= dmg;
  m.invincible = INVINCIBLE_FRAMES;
  screenShakeRef.current = 10;
  playSFX('shout');

  const hitColor = obs.type === 'carro' ? '#e74c3c'
    : obs.type === 'barreira' ? '#ff4444'
    : '#ff8844';

  spawnParticles(particles, 8, MOTO_X, LANE_Y[m.lane] - 20, hitColor, 'hit', 5, 18, 5);
  texts.push({
    id: uid(),
    text: `-${dmg}`,
    x: MOTO_X + 20,
    y: LANE_Y[m.lane] - 50,
    color: hitColor,
    size: 18,
    t: f,
  });
}
