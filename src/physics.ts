// ═══════════════════════════════════════════════════════
//  physics.ts — Movimentação e pulo do jogador (zero React)
// ═══════════════════════════════════════════════════════
import type { Player, Particle, FloatingTextData } from './types';
import {
  PLAYER_ACCEL, PLAYER_DECEL, PLAYER_MAX_SPEED, FLOOR_MIN, FLOOR_MAX, WORLD_W,
  GRAVITY, JUMP_FORCE, JUMP_CUT, MAX_JUMP_Z, COYOTE_TIME, LAND_SQUASH_FRAMES,
  IDLE_EAT_FRAMES, IDLE_EAT_DURATION,
} from './constants';
import { clamp, uid, spawnParticles } from './utils';
import { playSFX } from './sfx';

export function updatePlayerMovement(p: Player, k: Record<string, boolean>, particles: Particle[]): void {
  let ix = 0, iy = 0;
  if (k['arrowleft'] || k['a']) ix -= 1;
  if (k['arrowright'] || k['d']) ix += 1;
  if (k['arrowup'] || k['w']) iy -= 1;
  if (k['arrowdown'] || k['s']) iy += 1;
  if (ix !== 0 && iy !== 0) { ix *= 0.707; iy *= 0.707; }

  // ✅ FIX: Durante knockback (primeiros frames de hurt), controle reduzido
  if (p.hurt && p.hurtTimer > 10) {
    ix *= 0.15; iy *= 0.15;
  }

  if (ix !== 0) {
    p.vx += ix * PLAYER_ACCEL;
    p.vx = clamp(p.vx, -PLAYER_MAX_SPEED, PLAYER_MAX_SPEED);
    p.dir = ix > 0 ? 'right' : 'left';
  } else {
    p.vx *= PLAYER_DECEL;
    if (Math.abs(p.vx) < 0.1) p.vx = 0;
  }

  if (iy !== 0) {
    p.vy += iy * PLAYER_ACCEL * 0.65;
    p.vy = clamp(p.vy, -PLAYER_MAX_SPEED * 0.65, PLAYER_MAX_SPEED * 0.65);
  } else {
    p.vy *= PLAYER_DECEL;
    if (Math.abs(p.vy) < 0.1) p.vy = 0;
  }

  p.x += p.vx;
  p.y += p.vy;
  p.x = clamp(p.x, 30, WORLD_W - 30);
  p.y = clamp(p.y, FLOOR_MIN, FLOOR_MAX);
}

export function updatePlayerJump(p: Player, k: Record<string, boolean>, particles: Particle[]): void {
  const gnd = p.z <= 0 && p.vz <= 0;
  if (gnd) {
    p.coyoteTimer = COYOTE_TIME;
    if (!p.wasGrounded && p.landSquash <= 0) {
      p.landSquash = LAND_SQUASH_FRAMES;
      spawnParticles(particles, 4, p.x, p.y + 5, '#8B7355', 'dust', 2, 15, 5);
    }
  } else {
    if (p.coyoteTimer > 0) p.coyoteTimer--;
  }
  p.wasGrounded = gnd;

  if ((k['z'] || k[' ']) && p.coyoteTimer > 0 && p.z === 0) {
    p.vz = JUMP_FORCE; p.coyoteTimer = 0; p.landSquash = 0;
    playSFX('jump');
    spawnParticles(particles, 3, p.x, p.y + 5, '#8B7355', 'dust', 1.5, 12, 4);
  }

  if (!(k['z'] || k[' ']) && p.vz > 0) p.vz *= JUMP_CUT;

  if (p.z > 0 || p.vz > 0) {
    p.z += p.vz; p.vz -= GRAVITY;
    if (p.z > MAX_JUMP_Z) { p.z = MAX_JUMP_Z; if (p.vz > 0) p.vz = 0; }
    if (p.z <= 0) { p.z = 0; p.vz = 0; }
  }

  if (p.landSquash > 0) p.landSquash--;
}

export function updateIdleEating(
  p: Player, k: Record<string, boolean>,
  particles: Particle[], texts: FloatingTextData[], f: number,
): void {
  const hasMovement = !!(k['arrowleft'] || k['a'] || k['arrowright'] || k['d'] || k['arrowup'] || k['w'] || k['arrowdown'] || k['s']);
  const hasAction = !!(k['x'] || k['c'] || k['z'] || k[' ']);

  if (hasMovement || hasAction || p.attacking || p.buffing || p.hurt || p.z > 0) {
    p.idleTimer = 0; p.eating = false; p.eatTimer = 0;
  } else {
    if (p.eating) {
      p.eatTimer--;
      if (p.eatTimer <= 0) { p.eating = false; p.idleTimer = 0; }
    } else {
      p.idleTimer++;
      if (p.idleTimer >= IDLE_EAT_FRAMES) {
        p.eating = true; p.eatTimer = IDLE_EAT_DURATION; p.idleTimer = 0;
        texts.push({ id: uid(), text: 'nhom nhom~', x: p.x + 20, y: p.y - 70, color: '#f39c12', size: 10, t: f });
        spawnParticles(particles, 3, p.x + 15, p.y - 40, '#d4a017', 'dust', 1.5, 20, 3);
      }
    }
  }
}