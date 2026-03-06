// ═══════════════════════════════════════════════════════
//  combat.ts — Ataques, itens e verificação de hits (zero React)
// ═══════════════════════════════════════════════════════
import type { Player, Enemy, FoodItem, Particle, FloatingTextData, MutableRef } from './types';
import {
  PUNCH_DURATION, PUNCH_ACTIVE, PUNCH_RANGE, PUNCH_DEPTH, PUNCH_DAMAGE,
  BUFA_DURATION, BUFA_ACTIVE_START, BUFA_RANGE, BUFA_DEPTH, BUFA_DAMAGE_NORMAL, BUFA_DAMAGE_BOSS,
  HITSTOP_FRAMES, COMBO_TIMEOUT, MAX_HP,
  getEnemyWidth, isBossType,
} from './constants';
import { uid, spawnParticles } from './utils';
import { playSFX } from './sfx';

export function updatePlayerAttacks(
  p: Player, k: Record<string, boolean>,
  enemies: Enemy[], screenShakeRef: MutableRef<number>,
): void {
  // Soco
  if (k['x'] && !p.attacking && !p.buffing && p.atkTimer <= 0) {
    p.attacking = true; p.atkTimer = PUNCH_DURATION;
    enemies.forEach(e => e.hitThisSwing = false);
  }
  if (p.atkTimer > 0) { p.atkTimer--; if (p.atkTimer <= 0) p.attacking = false; }

  // Bufa
  if (k['c'] && !p.buffing && !p.attacking && p.buffTimer <= 0) {
    p.buffing = true; p.buffTimer = BUFA_DURATION;
    playSFX('bufa');
    enemies.forEach(e => e.hitThisSwing = false);
    screenShakeRef.current = 8;
  }
  if (p.buffTimer > 0) { p.buffTimer--; if (p.buffTimer <= 0) p.buffing = false; }

  // Hurt / invincible / combo decay
  if (p.hurtTimer > 0) { p.hurtTimer--; if (p.hurtTimer <= 0) p.hurt = false; }
  if (p.invincible > 0) p.invincible--;
  if (p.comboTimer > 0) { p.comboTimer--; if (p.comboTimer <= 0) p.combo = 0; }
  if (screenShakeRef.current > 0) screenShakeRef.current--;
}

/** Processa hits do jogador nos inimigos — retorna true se inimigo morreu */
export function checkPlayerHits(
  e: Enemy, p: Player,
  particles: Particle[], texts: FloatingTextData[], f: number,
): boolean {
  const ew = getEnemyWidth(e.type) / 2;
  const hx = Math.max(0, Math.abs(e.x - p.x) - ew);
  const hy = Math.abs(e.y - p.y);
  const fac = p.dir === 'right' ? e.x > p.x - 10 : e.x < p.x + 10;
  const pf2 = PUNCH_DURATION - p.atkTimer;

  // Soco
  if (p.attacking && pf2 >= PUNCH_ACTIVE[0] && pf2 <= PUNCH_ACTIVE[1]
    && hx < PUNCH_RANGE && hy < PUNCH_DEPTH && fac && !e.hitThisSwing) {
    e.hitThisSwing = true; playSFX('hit');
    e.hp -= PUNCH_DAMAGE; e.hurt = true; e.hurtTimer = 10;
    e.kbx = p.dir === 'right' ? 7 : -7; e.kby = (e.y - p.y) * 0.05;
    p.combo++; p.comboTimer = COMBO_TIMEOUT; p.hitstop = HITSTOP_FRAMES;
    spawnParticles(particles, 5, (p.x + e.x) / 2, e.y - 40, '#f1c40f', 'spark', 4, 12, 4);
    texts.push({ id: uid(), text: `-${PUNCH_DAMAGE}`, x: e.x, y: e.y - 50, color: '#f1c40f', size: 14, t: f });
  }

  // Bufa
  if (p.buffing && p.buffTimer < (BUFA_DURATION - BUFA_ACTIVE_START)
    && hx < BUFA_RANGE && hy < BUFA_DEPTH && !e.hitThisSwing) {
    e.hitThisSwing = true;
    const dmg = isBossType(e.type) ? BUFA_DAMAGE_BOSS : BUFA_DAMAGE_NORMAL;
    e.hp -= dmg; e.hurt = true; e.hurtTimer = 18;
    e.kbx = (e.x - p.x) > 0 ? 14 : -14; e.kby = (e.y - p.y) * 0.08;
    p.combo++; p.comboTimer = COMBO_TIMEOUT; p.hitstop = HITSTOP_FRAMES + 2;
    spawnParticles(particles, 8, (p.x + e.x) / 2, e.y - 40, '#2ecc71', 'spark', 6, 16, 5);
    spawnParticles(particles, 3, (p.x + e.x) / 2, e.y - 40, '#2ecc71', 'ring', 2, 20, 8);
    texts.push({ id: uid(), text: `-${dmg}`, x: e.x, y: e.y - 50, color: '#2ecc71', size: 18, t: f });
  }

  return e.hp <= 0;
}

export function updateItems(
  food: FoodItem[], p: Player,
  texts: FloatingTextData[], particles: Particle[], f: number,
): void {
  for (let i = food.length - 1; i >= 0; i--) {
    const fo = food[i];
    if (!fo.landed) {
      fo.vy += 0.3; fo.y += fo.vy;
      if (fo.vy > 0) { fo.landed = true; fo.vy = 0; }
    }
    if (Math.abs(fo.x - p.x) < 32 && Math.abs(fo.y - p.y) < 28 && p.z < 15) {
      if (fo.type === 'manual' || fo.type === 'compass') {
        texts.push({ id: uid(), text: '💢 INÚTIL!', x: p.x, y: p.y - 55 - p.z, color: '#999', size: 14, t: f });
        p.atkTimer = 0; p.buffTimer = 0; p.attacking = false; p.buffing = false;
      } else {
        const heal = fo.type === 'burger' ? 25 : 15;
        p.hp = Math.min(MAX_HP, p.hp + heal);
        playSFX('eat');
        texts.push({ id: uid(), text: `+${heal} ❤`, x: p.x, y: p.y - 55 - p.z, color: '#2ecc71', size: 16, t: f });
        spawnParticles(particles, 5, fo.x, fo.y - 10, '#2ecc71', 'spark', 2, 15, 3);
      }
      food.splice(i, 1); continue;
    }
    if (f - fo.t > 600) food.splice(i, 1);
  }
}

export function updateParticlesAndTexts(
  particles: Particle[], texts: FloatingTextData[], f: number,
): void {
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
// ─────────────────────────────────────────────
// Idle eating (comer parado automaticamente)
// ─────────────────────────────────────────────
export function updateIdleEating(
  p: Player,
  k: Record<string, boolean>,
  particles: Particle[],
  texts: FloatingTextData[],
  f: number
): void {
  // só ativa se estiver totalmente parado
  const moving =
    k['arrowleft'] || k['arrowright'] ||
    k['arrowup'] || k['arrowdown'];

  if (moving || p.attacking || p.buffing) return;

  // pequeno regen se ficar parado
  if (p.hp < MAX_HP && f % 180 === 0) { // ~3 segundos
    p.hp = Math.min(MAX_HP, p.hp + 1);

    texts.push({
      id: uid(),
      text: '+1',
      x: p.x,
      y: p.y - 50,
      color: '#2ecc71',
      size: 12,
      t: f
    });

    spawnParticles(
      particles,
      2,
      p.x,
      p.y - 30,
      '#2ecc71',
      'spark',
      1,
      10,
      2
    );
  }
}