// ═══════════════════════════════════════════════════════
//  constants.ts — Constantes numéricas e valores padrão
// ═══════════════════════════════════════════════════════
import type { Player, Davisaum, MotoState, PlayerPowers, EnemyType } from './types';

// ── Viewport e Mundo ──
export const BASE_W = 800;
export const BASE_H = 450;
export const WORLD_W = 3200;
export const FLOOR_MIN = BASE_H - 55;
export const FLOOR_MAX = BASE_H - 10;

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
  scaredTimer: 0,
};

// ── Helpers de tipo de inimigo (usados tanto em componentes quanto em combat) ──
export function getEnemyWidth(type: EnemyType): number {
  if (type === 'furia_final') return SPRITE_ENEMY_FURIA_FINAL_W;
  if (type === 'furio') return SPRITE_ENEMY_FURIO_W;
  if (type === 'suka' || type === 'suka_mk2') return SPRITE_ENEMY_BOSS_W;
  if (type === 'mega_zumbi') return SPRITE_ENEMY_MEGA_ZUMBI_W;
  if (type === 'anciao') return SPRITE_ENEMY_BOSS_W;
  return SPRITE_ENEMY_STD_W;
}

export function isBossType(type: EnemyType): boolean {
  return type === 'suka' || type === 'furio'
    || type === 'suka_mk2' || type === 'anciao'
    || type === 'mega_zumbi' || type === 'furia_final';
}

// ═══════════════════════════════════════════════════════
//  FASE 3 — Zumbis + Suka MK2 + Objetos de Ambiente
// ═══════════════════════════════════════════════════════

// ── Zumbi Flatulento ──
export const ZUMBI_SPEED = 0.6;                // Bem lento, errático
export const ZUMBI_HP = 3;
export const ZUMBI_REGEN_TIME = 480;            // 8s × 60fps — regenera se não morrer rápido
export const ZUMBI_REGEN_AMOUNT = 1;            // HP por tick de regen
export const ZUMBI_GAS_DAMAGE = 2;              // Dano passivo por segundo se ficar perto
export const ZUMBI_GAS_RANGE = 60;              // Range da nuvem de gás
export const ZUMBI_GAS_INTERVAL = 60;           // 1 tick de dano por segundo

// ── Zumbi Turbinado ──
export const ZUMBI_TURBO_HP = 8;
export const ZUMBI_TURBO_REGEN_TIME = 300;      // 5s — regenera mais rápido
export const ZUMBI_TURBO_SCALE = 1.3;           // 30% maior visualmente
export const ZUMBI_TURBO_SPEED = 0.9;

// ── Suka Mark II (Boss Fase 3) ──
export const SUKA_MK2_HP = 60;
export const SUKA_MK2_SWORD_DAMAGE = 20;
export const SUKA_MK2_SWORD_RANGE = 70;
export const SUKA_MK2_SWORD_PUSHBACK = 14;
export const SUKA_MK2_SONIC_DAMAGE = 15;
export const SUKA_MK2_SONIC_RANGE = 160;
export const SUKA_MK2_SONIC_STUN = 60;          // 1s stun
export const SUKA_MK2_SHIELD_DURATION = 180;    // 3s — absorve bufa
export const SUKA_MK2_COUNTER_DAMAGE = 25;      // Contra-ataque elétrico
export const SUKA_MK2_COUNTER_RANGE = 130;
// Fases: 100-50% melee+grito, 50-25% voo, 25-0% armadura falha
export const SUKA_MK2_FLY_THRESHOLD = 0.5;
export const SUKA_MK2_FAIL_THRESHOLD = 0.25;

// ── Objetos de Ambiente (Fase 3 + 5) ──
export const ENV_BOTIJAO_DAMAGE = 10;           // Dano em área ao explodir
export const ENV_BOTIJAO_RADIUS = 80;
export const ENV_BOTIJAO_SLIDE_SPEED = 6;
export const ENV_CARRINHO_DAMAGE = 5;
export const ENV_CARRINHO_SLOW_DURATION = 180;  // 3s slow
export const ENV_POSTE_DAMAGE = 15;             // Cai e eletrocuta em linha
export const ENV_POSTE_COMBO_REQ = 3;           // Combo mínimo pra derrubar poste (reduzido de 5 pra viabilizar com gás)
export const ENV_PLACA_DAMAGE = 8;              // Projétil voador
export const ENV_PLACA_SPEED = 8;
export const ENV_TANQUE_DAMAGE = 12;            // Fase 5: tanque de líquido
export const ENV_TANQUE_RADIUS = 90;
export const ENV_TUBULACAO_SLOW_DURATION = 240; // 4s slow zone

// ── Spawn Fase 3 ──
export const FASE3_SPAWN_INTERVAL = 4000;       // Mais lento, zumbis são persistentes
export const FASE3_MAX_ENEMIES = 8;
export const FASE3_BOSS_THRESHOLD = 800;
export const FASE3_ZUMBI_TURBO_KILL_REQ = 3;   // 3 zumbis morrendo juntos spawnam turbo

// ═══════════════════════════════════════════════════════
//  FASE 3½ — Moto / Runner
// ═══════════════════════════════════════════════════════

export const MOTO_TOTAL_DURATION = 5400;        // ~90s × 60fps
export const MOTO_LANE_COUNT = 3;
export const MOTO_LANE_Y = [                    // Y de cada faixa
  FLOOR_MIN + 20,                               // Topo
  FLOOR_MIN + 60,                               // Meio
  FLOOR_MIN + 100,                              // Baixo
];
export const MOTO_LANE_SWITCH_SPEED = 8;        // Lerp pra trocar de faixa
export const MOTO_JUMP_FORCE = 12;
export const MOTO_JUMP_DURATION = 30;           // Frames no ar
export const MOTO_PUNCH_DURATION = 15;
export const MOTO_PUNCH_RANGE = 60;
export const MOTO_INITIAL_HP = 100;

// Velocidades por ato
export const MOTO_SPEED_ACT1 = 3;              // 0-30s: lento
export const MOTO_SPEED_ACT2 = 5;              // 30-60s: médio
export const MOTO_SPEED_ACT3 = 7;              // 60-90s: máximo

// Dano dos obstáculos
export const MOTO_DMG_ZUMBI = 10;
export const MOTO_DMG_CARRO = 20;
export const MOTO_DMG_GAS = 5;                 // Por segundo enquanto dentro
export const MOTO_DMG_BURACO = 15;
export const MOTO_DMG_ZUMBI_CORREDOR = 10;
export const MOTO_DMG_BARREIRA = 25;

// Itens
export const MOTO_HEAL_BURGER = 15;
export const MOTO_TURBO_DURATION = 180;         // 3s
export const MOTO_SHIELD_HITS = 1;              // Absorve 1 hit

// Spawn de obstáculos por ato (intervalo em frames)
export const MOTO_SPAWN_ACT1 = 90;              // Poucos
export const MOTO_SPAWN_ACT2 = 50;              // Mais
export const MOTO_SPAWN_ACT3 = 30;              // Intenso
export const MOTO_ITEM_SPAWN_CHANCE = 0.15;     // 15% chance de item por spawn

// Atos (em frames)
export const MOTO_ACT1_END = 1800;              // 30s
export const MOTO_ACT2_END = 3600;              // 60s

// ── Valores Padrão da Moto ──
export const DEFAULT_MOTO: MotoState = {
  lane: 1,                                      // Começa no meio
  jumping: false,
  jumpTimer: 0,
  speed: MOTO_SPEED_ACT1,
  hp: MOTO_INITIAL_HP,
  distance: 0,
  punching: false,
  punchTimer: 0,
  invincible: 0,
  shieldActive: false,
  turboActive: false,
  turboTimer: 0,
};

// ═══════════════════════════════════════════════════════
//  FASE 4 — Treino do Ancião
// ═══════════════════════════════════════════════════════

// ── Arena ──
export const FASE4_ARENA_W = 800;               // Arena circular, sem scroll
export const FASE4_ARENA_CENTER_X = 400;
export const FASE4_ARENA_CENTER_Y = FLOOR_MIN + 40;

// ── Desafio 1: Bufa Precisa (empurrar pedras) ──
export const TRAINING_STONES_COUNT = 5;
export const TRAINING_STONE_TOLERANCE = 25;      // Distância da marca pra contar como acerto

// ── Desafio 2: Bufa Carregada ──
export const BUFA_CHARGE_TIME_WEAK = 0;          // Toque rápido
export const BUFA_CHARGE_TIME_MEDIUM = 60;       // 1s segurando
export const BUFA_CHARGE_TIME_FULL = 120;        // 2s segurando — BUFA CARREGADA
export const BUFA_CHARGED_DAMAGE = 8;
export const BUFA_CHARGED_RANGE = 250;
export const BUFA_CHARGED_DEPTH = 120;

// ── Desafio 3: Boss Ancião ──
export const ANCIAO_HP = 30;                     // Baixo de propósito
export const ANCIAO_RAIO_DAMAGE = 10;
export const ANCIAO_CHUVA_DAMAGE = 3;            // Por segundo
export const ANCIAO_CHUVA_RADIUS = 70;
export const ANCIAO_PEDRA_DAMAGE = 8;
export const ANCIAO_PEDRA_COUNT = 3;
export const ANCIAO_WIND_PUSH = 16;              // Empurra mas não dá dano

// ── Dimensões de Sprite Novas ──
export const SPRITE_ENEMY_SUKA_MK2_W = 140;
export const SPRITE_ENEMY_MEGA_ZUMBI_W = 160;   // 1.5x do normal
export const SPRITE_ENEMY_FURIA_FINAL_W = 160;
export const SPRITE_ANCIAO_W = 130;

// ═══════════════════════════════════════════════════════
//  FASE 5 — Lab do Fúria + Boss Final
// ═══════════════════════════════════════════════════════

// ── Zumbi Blindado ──
export const ZUMBI_BLINDADO_HP = 6;
export const ZUMBI_BLINDADO_GAS_DAMAGE = 12;    // Concentrado, range curto
export const ZUMBI_BLINDADO_GAS_RANGE = 40;

// ── Mega-Zumbi (mini-boss) ──
export const MEGA_ZUMBI_HP = 35;
export const MEGA_ZUMBI_SCALE = 1.5;
export const MEGA_ZUMBI_STOMP_DAMAGE = 20;
export const MEGA_ZUMBI_STOMP_RADIUS = 90;
export const MEGA_ZUMBI_VOMIT_DAMAGE = 15;
export const MEGA_ZUMBI_VOMIT_PUDDLE_DURATION = 300;  // 5s poça no chão
export const MEGA_ZUMBI_EXPLOSION_DAMAGE = 18;         // <30% HP, 360°
export const MEGA_ZUMBI_EXPLOSION_RADIUS = 120;

// ── Fúria Forma Final (Boss Final) ──
export const FURIA_FINAL_HP = 80;

// Estágio 1: "O Executivo" (80-50% HP)
export const FURIA_S1_PUNCH_DAMAGE = 15;
export const FURIA_S1_FLASK_DAMAGE = 10;
export const FURIA_S1_SUMMON_INTERVAL = 1200;   // 20s — convoca 2 cientistas
export const FURIA_S1_THRESHOLD = 0.5;          // Abaixo de 50% → estágio 2

// Estágio 2: "A Mutação" (50-25% HP)
export const FURIA_S2_CHARGE_DAMAGE = 25;
export const FURIA_S2_GAS_DAMAGE = 3;           // Nuvem tóxica constante /s
export const FURIA_S2_GAS_RANGE = 80;
export const FURIA_S2_SCALE = 1.3;              // Corpo cresce
export const FURIA_S2_THRESHOLD = 0.25;         // Abaixo de 25% → estágio 3

// Estágio 3: "Tempestade Final" (25-0% HP)
export const FURIA_S3_RAIN_DRAIN = 1;           // Fúria perde 1 HP/s pela chuva
export const FURIA_S3_SCALE = 1.6;              // Totalmente monstruoso
export const FURIA_S3_LIGHTNING_INTERVAL = 180;  // 3s entre raios do Ancião
export const FURIA_S3_LIGHTNING_DAMAGE = 20;
export const FURIA_S3_LIGHTNING_RADIUS = 50;
export const FURIA_S3_LIGHTNING_WARNING = 60;    // 1s piscando antes do raio

// ── Power-ups pós Fase 4 ──
export const SOCO_ELETRICO_COMBO_REQ = 8;       // Combo 8+ ativa soco elétrico
export const SOCO_ELETRICO_BONUS_DAMAGE = 3;
export const SOCO_ELETRICO_STUN = 30;           // 0.5s
export const GAS_RESISTANCE_MULT = 0.5;         // Dano de gás reduzido em 50%
export const BUFA_ANTI_SINTETICA_DAMAGE = 2;    // Dano da bufa V2 em zumbis
export const BUFA_ANTI_SINTETICA_REGEN_BLOCK = true;  // Impede regeneração

// ── Valores Padrão dos Power-ups ──
export const DEFAULT_POWERS: PlayerPowers = {
  bufaDirecional: false,
  bufaCarregada: false,
  socoEletrico: false,
  resistenciaGas: false,
  bufaAntiSintetica: false,
};

export const POWERS_AFTER_TRAINING: PlayerPowers = {
  bufaDirecional: true,
  bufaCarregada: true,
  socoEletrico: true,
  resistenciaGas: true,
  bufaAntiSintetica: true,
};