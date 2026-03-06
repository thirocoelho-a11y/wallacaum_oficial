// ═══════════════════════════════════════════════════════
//  ai.ts — IA dos inimigos e do Davisaum (zero React)
// ═══════════════════════════════════════════════════════
import type { Enemy, Player, Davisaum, FoodItem, Particle, FloatingTextData, MutableRef } from './types';
import {
  ENEMY_SPEED, FLOOR_MIN, FLOOR_MAX, WORLD_W,
  DAV_SCARED_ENTER, DAV_SCARED_EXIT, DAV_FLEE_SPEED, DAV_FOLLOW_LERP, DAV_DEAD_ZONE, DAV_SNAP_DIST,
} from './constants';
import { clamp, dist, uid, spawnParticles } from './utils';
import { playSFX } from './sfx';

// ─────────────────────────────────────────────────────
//  IA GENÉRICA (inimigos normais não-boss)
// ─────────────────────────────────────────────────────
export function updateBasicEnemyAI(
  e: Enemy, p: Player,
  particles: Particle[], texts: FloatingTextData[], f: number,
): 'dead' | 'alive' {
  if (e.punchTimer > 0) e.punchTimer--;
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.sqrt(dx * dx + dy * dy);
  e.dir = dx > 0 ? 'right' : 'left';
  const sm = (e.type === 'fast' || e.type === 'cientista') ? 1.5 : e.type === 'seguranca' ? 0.9 : 1;
  if (d > 50) { e.x += (dx / d) * ENEMY_SPEED * sm; e.y += (dy / d) * ENEMY_SPEED * 0.7 * sm; }
  e.walking = d > 50;
  e.y = clamp(e.y, FLOOR_MIN, FLOOR_MAX);
  if (e.atkCd > 0) e.atkCd--;

  if (d < 50 && p.invincible <= 0 && p.z < 10 && !p.buffing && e.atkCd <= 0) {
    const cd = (e.type === 'fast' || e.type === 'cientista') ? 30 : 50;
    e.atkCd = cd; e.punchTimer = 15;
    const dmg = e.type === 'seguranca' ? 12 : (e.type === 'fast' || e.type === 'cientista') ? 8 : 10;
    p.hp -= dmg; p.hurt = true; p.hurtTimer = 15; p.invincible = 30;
    p.combo = 0; p.comboTimer = 0;
    spawnParticles(particles, 4, p.x, p.y - 30 - p.z, '#ff4444', 'hit', 3, 12, 4);
    texts.push({ id: uid(), text: `-${dmg}`, x: p.x, y: p.y - 40 - p.z, color: '#ff4444', size: 16, t: f });
    if (p.hp <= 0) return 'dead';
  }
  return 'alive';
}

// ─────────────────────────────────────────────────────
//  SUKA BARULHENTA (Boss Fase 1)
// ─────────────────────────────────────────────────────
export function updateSukaAI(
  e: Enemy, p: Player, dav: Davisaum,
  particles: Particle[], texts: FloatingTextData[],
  f: number, screenShakeRef: MutableRef<number>,
): 'dead' | 'alive' {
  const dx = p.x - e.x, dy = p.y - e.y;
  const hx = Math.abs(dx), hy = Math.abs(dy);
  e.dir = dx > 0 ? 'right' : 'left';
  if (e.punchTimer > 0) e.punchTimer--;

  if (hx < 150 && hy < 60 && e.atkCd <= 0) {
    e.walking = false; e.stateTimer++;
    if (e.stateTimer === 1) {
      texts.push({ id: uid(), text: '⚠ CUIDADO!', x: e.x, y: e.y - 70, color: '#e74c3c', size: 14, t: f });
    }
    if (e.stateTimer > 50) {
      playSFX('shout');
      e.atkCd = 180; e.stateTimer = 0;
      texts.push({ id: uid(), text: 'KRAAAAAHH!!!', x: e.x, y: e.y - 40, color: '#3498db', size: 22, t: f });
      screenShakeRef.current = 12;
      spawnParticles(particles, 6, e.x, e.y - 30, 'rgba(52,152,219,0.6)', 'ring', 8, 25, 10);
      if (hx < 180 && hy < 70 && p.z < 20 && p.invincible <= 0) {
        p.hp -= 25; p.hurt = true; p.hurtTimer = 20; p.invincible = 40;
        p.vx = (dx > 0 ? -1 : 1) * 12;
        dav.x += (dx > 0 ? 1 : -1) * 120;
        p.combo = 0; p.comboTimer = 0;
        spawnParticles(particles, 8, p.x, p.y - 30 - p.z, '#e74c3c', 'hit', 5, 18, 6);
        texts.push({ id: uid(), text: '-25', x: p.x, y: p.y - 50 - p.z, color: '#ff2222', size: 22, t: f });
        if (p.hp <= 0) return 'dead';
      }
    }
  } else {
    e.stateTimer = 0; e.walking = true;
    if (hx > 70) e.x += Math.sign(dx) * ENEMY_SPEED * 0.8;
    if (hy > 10) e.y += Math.sign(dy) * ENEMY_SPEED * 0.5;
    e.y = clamp(e.y, FLOOR_MIN, FLOOR_MAX);
    if (e.atkCd > 0) e.atkCd--;
    if (hx < 80 && hy < 25 && e.atkCd <= 0 && p.invincible <= 0 && p.z < 10) {
      e.atkCd = 60; e.punchTimer = 15;
      p.hp -= 15; p.hurt = true; p.hurtTimer = 15; p.invincible = 30;
      p.combo = 0; p.comboTimer = 0;
      spawnParticles(particles, 5, p.x, p.y - 30 - p.z, '#ff4444', 'hit', 3, 14, 5);
      texts.push({ id: uid(), text: '-15', x: p.x, y: p.y - 40 - p.z, color: '#ff4444', size: 16, t: f });
      if (p.hp <= 0) return 'dead';
    }
  }
  return 'alive';
}

// ─────────────────────────────────────────────────────
//  FURIO (Boss Fase 2)
// ─────────────────────────────────────────────────────
export function updateFurioAI(
  e: Enemy, p: Player, dav: Davisaum,
  particles: Particle[], texts: FloatingTextData[],
  f: number, screenShakeRef: MutableRef<number>,
): 'dead' | 'alive' {
  const dx = p.x - e.x, dy = p.y - e.y;
  const hx = Math.abs(dx), hy = Math.abs(dy);
  e.dir = dx > 0 ? 'right' : 'left';
  if (e.punchTimer > 0) e.punchTimer--;

  const furioSuper = e.hp / e.maxHp < 0.35;
  const chargeSpd = furioSuper ? 5 * 1.6 : 5;
  const chargeDmg = furioSuper ? 40 : 30;
  const punchDmg = furioSuper ? 28 : 20;
  const cdMult = furioSuper ? 0.5 : 1;
  const particleColor = furioSuper ? '#4488ff' : '#ff4500';

  // BUG FIX: superActivated previne spam da ativação do modo super
  if (furioSuper && !e.superActivated) {
    e.superActivated = true;
    texts.push({ id: uid(), text: '💀 FURIA MÁXIMA!', x: e.x, y: e.y - 90, color: '#4488ff', size: 20, t: f });
    screenShakeRef.current = 20;
    spawnParticles(particles, 12, e.x, e.y - 40, '#4488ff', 'ring', 12, 30, 15);
  }

  if (e.charging) {
    e.x += (e.chargeDir || 1) * chargeSpd;
    e.x = clamp(e.x, 10, WORLD_W - 10);
    e.stateTimer--;
    if (f % 3 === 0) spawnParticles(particles, 2, e.x, e.y - 20, particleColor, 'spark', 3, 10, 4);
    if (e.stateTimer <= 0) { e.charging = false; e.atkCd = Math.floor(90 * cdMult); }
    if (Math.abs(e.x - p.x) < 50 && hy < 40 && p.invincible <= 0 && p.z < 15) {
      p.hp -= chargeDmg; p.hurt = true; p.hurtTimer = 25; p.invincible = 50;
      p.vx = (e.chargeDir || 1) * (furioSuper ? 18 : 15);
      p.combo = 0; p.comboTimer = 0;
      screenShakeRef.current = furioSuper ? 20 : 15;
      spawnParticles(particles, 10, p.x, p.y - 30, particleColor, 'hit', 6, 20, 7);
      texts.push({ id: uid(), text: `-${chargeDmg}`, x: p.x, y: p.y - 50, color: '#ff2200', size: 24, t: f });
      e.charging = false; e.atkCd = Math.floor(60 * cdMult);
      if (p.hp <= 0) return 'dead';
    }
  } else if (hx < 220 && hy < 60 && e.atkCd <= 0 && hx > 80) {
    e.charging = true; e.chargeDir = dx > 0 ? 1 : -1;
    e.stateTimer = furioSuper ? 30 : 40;
    texts.push({ id: uid(), text: furioSuper ? '⚡ SUPER CARGA!' : '💥 CARGA!', x: e.x, y: e.y - 70, color: particleColor, size: 16, t: f });
    screenShakeRef.current = furioSuper ? 10 : 6;
  } else if (hx < 150 && hy < 60 && e.atkCd <= 0 && !e.charging) {
    e.walking = false; e.stateTimer++;
    if (e.stateTimer === 1) {
      texts.push({ id: uid(), text: furioSuper ? '💀 MORRA!' : '⚠ FURIO!', x: e.x, y: e.y - 70, color: particleColor, size: 14, t: f });
    }
    if (e.stateTimer > (furioSuper ? 25 : 40)) {
      playSFX('shout');
      e.atkCd = Math.floor(120 * cdMult); e.stateTimer = 0;
      texts.push({ id: uid(), text: furioSuper ? 'ANIQUILAÇÃO!!!' : 'DESTRUIÇÃO!!!', x: e.x, y: e.y - 40, color: particleColor, size: 20, t: f });
      screenShakeRef.current = furioSuper ? 22 : 15;
      spawnParticles(particles, furioSuper ? 12 : 8, e.x, e.y - 30, `${particleColor}99`, 'ring', 10, 25, 12);
      const aoeRangeX = furioSuper ? 180 : 140;
      if (hx < aoeRangeX && hy < 60 && p.z < 20 && p.invincible <= 0) {
        p.hp -= punchDmg; p.hurt = true; p.hurtTimer = 20; p.invincible = 40;
        p.vx = (dx > 0 ? -1 : 1) * (furioSuper ? 18 : 14);
        p.combo = 0; p.comboTimer = 0;
        spawnParticles(particles, 8, p.x, p.y - 30 - p.z, particleColor, 'hit', 5, 18, 6);
        texts.push({ id: uid(), text: `-${punchDmg}`, x: p.x, y: p.y - 50 - p.z, color: '#ff2200', size: 22, t: f });
        if (p.hp <= 0) return 'dead';
      }
    }
  } else {
    e.stateTimer = 0; e.walking = true;
    if (hx > 65) e.x += Math.sign(dx) * ENEMY_SPEED * 1.2;
    if (hy > 10) e.y += Math.sign(dy) * ENEMY_SPEED * 0.6;
    e.y = clamp(e.y, FLOOR_MIN, FLOOR_MAX);
    if (e.atkCd > 0) e.atkCd--;
    if (hx < 75 && hy < 25 && e.atkCd <= 0 && p.invincible <= 0 && p.z < 10) {
      e.atkCd = 45; e.punchTimer = 15;
      p.hp -= 12; p.hurt = true; p.hurtTimer = 15; p.invincible = 30;
      p.combo = 0; p.comboTimer = 0;
      spawnParticles(particles, 5, p.x, p.y - 30, '#ff4444', 'hit', 3, 14, 5);
      texts.push({ id: uid(), text: '-12', x: p.x, y: p.y - 40, color: '#ff4444', size: 16, t: f });
      if (p.hp <= 0) return 'dead';
    }
  }
  return 'alive';
}

// ─────────────────────────────────────────────────────
//  DAVISAUM (companheiro)
// ─────────────────────────────────────────────────────
export function updateDavisAI(
  dav: Davisaum, p: Player,
  enemies: Enemy[], food: FoodItem[], f: number,
): void {
  const ced = enemies.length > 0 ? Math.min(...enemies.map(e => dist(e.x, e.y, dav.x, dav.y))) : Infinity;
  if (dav.isScared) {
    if (ced > DAV_SCARED_EXIT) dav.isScared = false;
  } else {
    if (ced < DAV_SCARED_ENTER) dav.isScared = true;
  }

  if (dav.isScared) {
    const ne = enemies.reduce((c, e) => {
      const d2 = dist(e.x, e.y, dav.x, dav.y);
      return d2 < c.d ? { d: d2, e } : c;
    }, { d: Infinity, e: null as Enemy | null });
    if (ne.e && ne.d < DAV_SCARED_EXIT) {
      const fx = dav.x - ne.e.x, fy = dav.y - ne.e.y;
      const fd = Math.sqrt(fx * fx + fy * fy);
      if (fd > DAV_SNAP_DIST) {
        dav.x += (fx / fd) * DAV_FLEE_SPEED;
        dav.y += (fy / fd) * DAV_FLEE_SPEED * 0.5;
        dav.dir = fx > 0 ? 'right' : 'left';
      }
      dav.isWalking = true;
    } else {
      dav.isWalking = false;
    }
  } else {
    const tx = p.dir === 'right' ? p.x - 90 : p.x + 90;
    const ty = p.y;
    const dx2 = tx - dav.x, dy2 = ty - dav.y;
    const dt2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    if (dt2 > DAV_DEAD_ZONE) {
      dav.x += dx2 * DAV_FOLLOW_LERP;
      dav.y += dy2 * DAV_FOLLOW_LERP;
      if (Math.abs(tx - dav.x) < DAV_SNAP_DIST) dav.x = tx;
      if (Math.abs(ty - dav.y) < DAV_SNAP_DIST) dav.y = ty;
      dav.dir = dav.x < p.x ? 'right' : 'left';
      dav.isWalking = true;
    } else {
      dav.isWalking = false;
    }
  }

  dav.x = clamp(dav.x, 30, WORLD_W - 30);
  dav.y = clamp(dav.y, FLOOR_MIN, FLOOR_MAX);

  dav.throwTimer++;
  dav.isThrowing = dav.throwTimer > 210;
  if (dav.throwTimer > 240) {
    dav.throwTimer = 0; dav.isThrowing = false;
    const r = Math.random();
    const it = r < 0.25 ? 'manual' : r < 0.5 ? 'compass' : r < 0.75 ? 'burger' : 'fries';
    food.push({
      id: `u${Date.now()}`, x: dav.x + (dav.dir === 'right' ? 40 : -40),
      y: dav.y, type: it as FoodItem['type'], t: f, vy: -3, landed: false,
    });
  }
}
