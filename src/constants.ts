// constants.ts
export const PHYSICS = {
  GRAVITY: 0.65,
  JUMP_FORCE: 9,
  JUMP_CUT: 0.4,
  PLAYER_ACCEL: 0.55,
  PLAYER_DECEL: 0.78,
  PLAYER_MAX_SPEED: 4.0,
  FIXED_TIME_STEP: 1000 / 60, // 16.666ms por frame lógico
};

export const WORLD = {
  BASE_W: 800,
  BASE_H: 450,
  WORLD_W: 3200,
  FLOOR_MIN: 350,
  FLOOR_MAX: 432,
};
