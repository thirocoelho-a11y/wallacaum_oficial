// ═══════════════════════════════════════════════════════
//  types.ts — Tipos compartilhados do jogo
// ═══════════════════════════════════════════════════════

export type EnemyType = 'standard' | 'fast' | 'suka' | 'seguranca' | 'cientista' | 'furio';
export type GameState = 'title' | 'playing' | 'gameover' | 'victory' | 'phase_transition';

export interface Player {
  x: number; y: number; vx: number; vy: number;
  z: number; vz: number; hp: number; dir: 'left' | 'right';
  attacking: boolean; buffing: boolean;
  hurt: boolean; hurtTimer: number;
  atkTimer: number; buffTimer: number; invincible: number;
  coyoteTimer: number; landSquash: number; wasGrounded: boolean;
  combo: number; comboTimer: number; hitstop: number;
  idleTimer: number; eating: boolean; eatTimer: number;
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
  superActivated?: boolean; // previne spam do Furio super
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
  type: 'dust' | 'hit' | 'spark' | 'ring';
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

/** Config do motor por fase */
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
}
