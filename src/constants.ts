// ═══════════════════════════════════════════════════════
//  constants.ts — Constantes numéricas e valores padrão
// ═══════════════════════════════════════════════════════
import type { Player, Davisaum, EnemyType } from './types';

// ── Viewport e Mundo ──
export const BASE_W = 800;
export const BASE_H = 450;
export const WORLD_W = 3200;
export const FLOOR_MIN = BASE_H - 100;
export const FLOOR_MAX = BASE_H - 18;

// ── Física do Jogador ──
export const GRAVITY = 0.65;
export const JUMP_FORCE = 9;
export const JUMP_CUT = 0.4;
export const MAX_JUMP_Z = 50;
export const PLAYER_ACCEL = 0.55;
export const PLAYER_DECEL = 0.78;
export const PLAYER_MAX_SPEED = 4.0;
export const COYOTE_TIME = 6;
export const LAND_SQUASH_FRAMES = 6;

// ── Combate ──
export const PUNCH_RANGE = 45;
export const PUNCH_DEPTH = 45;
export const PUNCH_DAMAGE = 1;
export const PUNCH_DURATION = 18;
export const PUNCH_ACTIVE: [number, number] = [4, 12];
export const BUFA_RANGE = 170;
export const BUFA_DEPTH = 85;
export const BUFA_DAMAGE_NORMAL = 3;
export const BUFA_DAMAGE_BOSS = 5;
export const BUFA_DURATION = 50;
export const BUFA_ACTIVE_START = 12;
export const HITSTOP_FRAMES = 4;
export const KNOCKBACK_DECAY = 0.82;
export const COMBO_TIMEOUT = 90;

// ── Inimigos ──
export const ENEMY_SPEED = 1.3;
export const SPAWN_INTERVAL_MS = 3500;
export const MAX_ENEMIES = 7;

// ── Jogador ──
export const MAX_HP = 100;
export const FOOD_SIZE = 28;
export const MAX_PARTICLES = 60;

// ── Davisaum ──
export const DAV_SCARED_ENTER = 130;
export const DAV_SCARED_EXIT = 220;
export const DAV_FLEE_SPEED = 2.5;
export const DAV_FOLLOW_LERP = 0.08;
export const DAV_DEAD_ZONE = 6;
export const DAV_SNAP_DIST = 2;

// ── Idle / Comendo ──
export const IDLE_EAT_FRAMES = 120;
export const IDLE_EAT_DURATION = 90;

// ── Dimensões de Sprite ──
export const SPRITE_PLAYER_W = 85;
export const SPRITE_PLAYER_H = 95;
export const SPRITE_PLAYER_OFFSET_Y = 85;
export const SPRITE_DAVIS_W = 110;
export const SPRITE_DAVIS_OFFSET_Y = 115;
export const SPRITE_ENEMY_STD_W = 120;
export const SPRITE_ENEMY_BOSS_W = 140;
export const SPRITE_ENEMY_FURIO_W = 150;
export const SPRITE_ENEMY_OFFSET_Y = 115;

// ── Valores Padrão ──
export const DEFAULT_PLAYER: Player = {
  x: 200, y: 380, vx: 0, vy: 0, z: 0, vz: 0, hp: MAX_HP, dir: 'right',
  attacking: false, buffing: false, hurt: false, hurtTimer: 0,
  atkTimer: 0, buffTimer: 0, invincible: 0,
  coyoteTimer: 0, landSquash: 0, wasGrounded: true,
  combo: 0, comboTimer: 0, hitstop: 0,
  idleTimer: 0, eating: false, eatTimer: 0,
};

export const DEFAULT_DAVIS: Davisaum = {
  x: 100, y: 380, dir: 'right',
  throwTimer: 0, isWalking: false, isThrowing: false, isScared: false,
};

// ── Helpers de tipo de inimigo (usados tanto em componentes quanto em combat) ──
export function getEnemyWidth(type: EnemyType): number {
  if (type === 'furio') return SPRITE_ENEMY_FURIO_W;
  if (type === 'suka') return SPRITE_ENEMY_BOSS_W;
  return SPRITE_ENEMY_STD_W;
}

export function isBossType(type: EnemyType): boolean {
  return type === 'suka' || type === 'furio';
}
