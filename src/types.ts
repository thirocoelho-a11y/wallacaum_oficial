// ═══════════════════════════════════════════════════════
//  types.ts — Tipos compartilhados do jogo
// ═══════════════════════════════════════════════════════

// ── Tipos de inimigos (expandido para fases 3-5) ──
export type EnemyType =
  | 'standard' | 'fast' | 'suka'                          // Fase 1
  | 'seguranca' | 'cientista' | 'furio'                    // Fase 2
  | 'zumbi' | 'zumbi_turbo' | 'suka_mk2'                  // Fase 3
  | 'anciao'                                                // Fase 4
  | 'zumbi_blindado' | 'mega_zumbi' | 'furia_final';      // Fase 5

export type GameState =
  | 'title' | 'playing' | 'gameover' | 'victory'
  | 'phase_transition' | 'cutscene';

// ═══════════════════════════════════════════════════════
//  TIPOS EXISTENTES (Fases 1-2) — intocados
// ═══════════════════════════════════════════════════════

export interface Player {
  x: number; y: number; vx: number; vy: number;
  z: number; vz: number; hp: number; dir: 'left' | 'right';
  attacking: boolean; buffing: boolean;
  hurt: boolean; hurtTimer: number;
  atkTimer: number; buffTimer: number; invincible: number;
  coyoteTimer: number; landSquash: number; wasGrounded: boolean;
  combo: number; comboTimer: number; hitstop: number;
  idleTimer: number; eating: boolean; eatTimer: number;
  // ── Novos (Fase 4+) — opcionais pra não quebrar fases 1-2 ──
  powers?: PlayerPowers;
  chargeTimer?: number;        // tempo segurando C (bufa carregada)
  chargeReady?: boolean;       // bufa carregada pronta pra soltar
}

export interface Enemy {
  id: string; type: EnemyType;
  x: number; y: number; z: number;
  hp: number; maxHp: number; dir: 'left' | 'right';
  walking: boolean; hurt: boolean;
  hurtTimer: number; kbx: number; kby: number;
  atkCd: number; stateTimer: number; punchTimer: number;
  hitThisSwing: boolean;
  charging?: boolean; chargeDir?: number;
  superActivated?: boolean;
  // ── Novos (Fases 3-5) — opcionais ──
  regenTimer?: number;          // Zumbi: tempo até regenerar
  gasTimer?: number;            // Zumbi: timer do gás passivo
  absorbing?: boolean;          // Suka MK2: escudo absorvendo bufa
  absorbTimer?: number;         // Suka MK2: duração do escudo
  flying?: boolean;             // Suka MK2: modo aéreo (<50% HP)
  armorFailing?: boolean;       // Suka MK2: armadura falhando (<25% HP)
  stage?: number;               // Fúria Final: estágio 1/2/3
  mutationLevel?: number;       // Fúria Final: nível de mutação visual
  isTraining?: boolean;         // Ancião: não mata, só testa
}

export interface FoodItem {
  id: string; x: number; y: number;
  type: 'burger' | 'fries' | 'manual' | 'compass';
  t: number; vy: number; landed: boolean;
}

export interface Particle {
  id: string; x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
  type: 'dust' | 'hit' | 'spark' | 'ring'
    | 'gas' | 'electric' | 'rain';       // novos tipos visuais
}

export interface FloatingTextData {
  id: string; text: string;
  x: number; y: number;
  color: string; size: number; t: number;
}

export interface Davisaum {
  x: number; y: number; dir: 'left' | 'right';
  throwTimer: number; isWalking: boolean;
  isThrowing: boolean; isScared: boolean;
}

/** Interface genérica para refs mutáveis — sem depender de React */
export interface MutableRef<T> { current: T; }

/** Config do motor por fase (beat-em-up) */
export interface EnginePhaseConfig {
  initialScore: number;
  initialHp: number;
  bossThreshold: number;
  spawnIntervalMs: number;
  bossType: EnemyType;
  bossHp: number;
  bossAnnounce: string;
  bossAnnounceColor: string;
  bossDeathColor: string;
  bossDeathParticles: string;
  getNormalEnemyType: () => EnemyType;
  getNormalEnemyHp: (type: EnemyType) => number;
  onGameOver: (score: number) => void;
  onComplete: (score: number, hp: number) => void;
  // ── Novos (opcionais, fases 3-5) ──
  environmentObjects?: EnvironmentObject[];
  lightningZones?: LightningZone[];
  hasRain?: boolean;
  playerPowers?: PlayerPowers;
}

// ═══════════════════════════════════════════════════════
//  TIPOS NOVOS — Fase 3 (Objetos de Ambiente)
// ═══════════════════════════════════════════════════════

export type EnvironmentObjectType =
  | 'botijao'         // Fase 3+5: chutar/bufa → desliza, explode
  | 'carrinho'        // Fase 3: bufa → óleo espirrando, slow
  | 'poste'           // Fase 3: combo 5+ → cai, eletrocuta
  | 'placa'           // Fase 3: bufa → projétil voador
  | 'tanque'          // Fase 5: explode, dano em área
  | 'tubulacao';      // Fase 5: vapor quando quebra, slow zone

export interface EnvironmentObject {
  id: string;
  type: EnvironmentObjectType;
  x: number; y: number;
  hp: number;
  active: boolean;           // ainda pode ser usado
  vx: number;                // velocidade horizontal (quando empurrado)
  vy?: number;
  exploding?: boolean;       // em animação de explosão
  explodeTimer?: number;
}

// ═══════════════════════════════════════════════════════
//  TIPOS NOVOS — Fase 3½ (Moto / Runner)
// ═══════════════════════════════════════════════════════

export interface MotoState {
  lane: 0 | 1 | 2;           // 3 faixas: topo, meio, baixo
  jumping: boolean;
  jumpTimer: number;
  speed: number;              // aumenta ao longo da fase
  hp: number;
  distance: number;           // progresso 0-100%
  punching: boolean;
  punchTimer: number;
  invincible: number;
  shieldActive: boolean;      // item escudo
  turboActive: boolean;       // item turbo
  turboTimer: number;
}

export type RoadObstacleType =
  | 'zumbi'            // mudar de faixa ou pular
  | 'carro'            // mudar de faixa (fixo)
  | 'gas'              // ir pra faixa livre (ocupa 2 faixas)
  | 'buraco'           // pular
  | 'zumbi_corredor'   // soco lateral
  | 'barreira';        // pular (obrigatório, 3 faixas)

export interface RoadObstacle {
  id: string;
  type: RoadObstacleType;
  lane: 0 | 1 | 2;
  x: number;                  // posição horizontal (vem da direita)
  width: number;
  dangerous: boolean;
  hit?: boolean;              // já colidiu
}

export type RoadItemType = 'burger' | 'turbo' | 'escudo';

export interface RoadItem {
  id: string;
  type: RoadItemType;
  lane: 0 | 1 | 2;
  x: number;
  collected?: boolean;
}

/** Config do motor da moto (fase 3½) */
export interface MotoPhaseConfig {
  initialHp: number;
  initialScore: number;
  duration: number;           // frames totais (~90s × 60fps)
  onGameOver: (score: number) => void;
  onComplete: (score: number, hp: number) => void;
}

// ═══════════════════════════════════════════════════════
//  TIPOS NOVOS — Fase 4 (Treino do Ancião)
// ═══════════════════════════════════════════════════════

export interface PlayerPowers {
  bufaDirecional: boolean;    // Desbloqueia após Desafio 1
  bufaCarregada: boolean;     // Desbloqueia após Desafio 2
  socoEletrico: boolean;      // Desbloqueia após Desafio 3
  resistenciaGas: boolean;    // Passivo após completar Fase 4
  bufaAntiSintetica: boolean; // Bufa V2 contra zumbis
}

export type TrainingChallenge = 'direcao' | 'intensidade' | 'combate';

export interface TrainingState {
  currentChallenge: TrainingChallenge;
  challengeIndex: number;     // 0, 1, 2
  completed: boolean[];       // [false, false, false]
  stones?: TrainingStone[];   // Desafios 1 e 2
}

export interface TrainingStone {
  id: string;
  x: number; y: number;
  targetX: number; targetY: number;
  size: 'small' | 'medium' | 'large';
  placed: boolean;            // chegou no alvo
}

// ═══════════════════════════════════════════════════════
//  TIPOS NOVOS — Fase 5 (Zonas de Relâmpago)
// ═══════════════════════════════════════════════════════

export interface LightningZone {
  id: string;
  x: number; y: number;
  radius: number;
  damage: number;
  timer: number;              // frames restantes
  warning?: boolean;          // piscando antes de ativar
  warningTimer?: number;
}

/** Estado do cenário da Fase 5 (muda no estágio 3 do Fúria) */
export type Fase5Scenario = 'lab' | 'lab_destroyed';
