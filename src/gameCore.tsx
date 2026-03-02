// ═══════════════════════════════════════════════════════
//  gameCore.tsx — MOTOR CENTRAL E COMPONENTES
// ═══════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from 'react';
import { playSFX } from './sfx';
import { WALLACAUM_SPRITES, DAVISAUM_SPRITES, INIMIGOS_SPRITES } from './sprites';
import { FASE2_SPRITES } from './spritesFase2';

// ─────────────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────────────
export const BASE_W = 800;
export const BASE_H = 450;
export const WORLD_W = 3200;
export const FLOOR_MIN = BASE_H - 100;
export const FLOOR_MAX = BASE_H - 18;

export const GRAVITY = 0.65;
export const JUMP_FORCE = 9;
export const JUMP_CUT = 0.4;
export const MAX_JUMP_Z = 50;
export const PLAYER_ACCEL = 0.55;
export const PLAYER_DECEL = 0.78;
export const PLAYER_MAX_SPEED = 4.0;
export const COYOTE_TIME = 6;
export const LAND_SQUASH_FRAMES = 6;

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

export const ENEMY_SPEED = 1.3;
export const SPAWN_INTERVAL_MS = 3500;
export const MAX_ENEMIES = 7;
export const MAX_HP = 100;
export const FOOD_SIZE = 28;
export const MAX_PARTICLES = 100; // Aumentado para suportar a fumaça

export const DAV_SCARED_ENTER = 130;
export const DAV_SCARED_EXIT = 220;
export const DAV_FLEE_SPEED = 2.5;
export const DAV_FOLLOW_LERP = 0.08;
export const DAV_DEAD_ZONE = 6;
export const DAV_SNAP_DIST = 2;

export const IDLE_EAT_FRAMES = 120;
export const IDLE_EAT_DURATION = 90;

export const SPRITE_PLAYER_W = 85;
export const SPRITE_PLAYER_H = 95;
export const SPRITE_PLAYER_OFFSET_Y = 85;
export const SPRITE_DAVIS_W = 110;
export const SPRITE_DAVIS_OFFSET_Y = 115;
export const SPRITE_ENEMY_STD_W = 120;
export const SPRITE_ENEMY_BOSS_W = 140;
export const SPRITE_ENEMY_FURIO_W = 150;
export const SPRITE_ENEMY_OFFSET_Y = 115;

// ─────────────────────────────────────────────────────
//  TIPOS
// ─────────────────────────────────────────────────────
export type EnemyType = 'standard' | 'fast' | 'suka' | 'seguranca' | 'cientista' | 'furio';

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
}

export interface FoodItem { id: string; x: number; y: number; type: 'burger' | 'fries' | 'manual' | 'compass'; t: number; vy: number; landed: boolean; }

export interface Particle {
  id: number | string;
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  startLife: number; // Corrigido de maxLife para startLife
  color: string;
  size: number;
  startSize: number;
  type: 'spark' | 'smoke' | 'ring' | 'hit' | 'dust';
}

export interface FloatingTextData { id: string; text: string; x: number; y: number; color: string; size: number; t: number; }
export interface Davisaum { x: number; y: number; dir: 'left' | 'right'; throwTimer: number; isWalking: boolean; isThrowing: boolean; isScared: boolean; }

export const DEFAULT_PLAYER: Player = {
  x: 200, y: 380, vx: 0, vy: 0, z: 0, vz: 0, hp: MAX_HP, dir: 'right',
  attacking: false, buffing: false, hurt: false, hurtTimer: 0,
  atkTimer: 0, buffTimer: 0, invincible: 0,
  coyoteTimer: 0, landSquash: 0, wasGrounded: true,
  combo: 0, comboTimer: 0, hitstop: 0,
  idleTimer: 0, eating: false, eatTimer: 0,
};
export const DEFAULT_DAVIS: Davisaum = { x: 100, y: 380, dir: 'right', throwTimer: 0, isWalking: false, isThrowing: false, isScared: false };

// ─────────────────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────────────────
export const rng = (a: number, b: number) => Math.random() * (b - a) + a;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
let _id = 0;
export const uid = () => `u${++_id}`;
export const resetUid = () => { _id = 0; };
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);

export function spawnParticles(arr: Particle[], count: number, x: number, y: number, color: string, type: Particle['type'] = 'spark', spread = 4, life = 1, size = 4) {
  for (let i = 0; i < count && arr.length < MAX_PARTICLES; i++) {
    arr.push({ 
      id: uid(), x, y, 
      vx: rng(-spread, spread), 
      vy: rng(-spread * 0.8, -0.5), 
      life, startLife: life, 
      color, size: rng(size * 0.5, size * 1.2), 
      startSize: size, type 
    });
  }
}

// NOVA FUNÇÃO: Gera a fumaça da Bufa Celeste
export function spawnCelestialSmoke(particles: Particle[], x: number, y: number) {
  const colors = ['#00f2ff', '#2ecc71', '#a2ffd1', '#0077ff'];
  for (let i = 0; i < 2; i++) {
    const life = rng(1.2, 1.8);
    particles.push({
      id: Math.random(),
      x: x + rng(-15, 15),
      y: y + rng(-5, 5),
      vx: rng(-0.4, 0.4),
      vy: rng(-1.2, -0.6),
      life: life,
      startLife: life,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: rng(6, 10),
      startSize: rng(6, 10),
      type: 'smoke'
    });
  }
}

// ─────────────────────────────────────────────────────
//  SPRITES helpers
// ─────────────────────────────────────────────────────
export function getEnemySprite(type: EnemyType, isWalking: boolean, isPunching: boolean, isShouting: boolean, isSuper = false, isCharging = false) {
  if (type === 'seguranca') {
    if (isPunching) return FASE2_SPRITES.operario_socando;
    if (isWalking) return Math.floor(Date.now() / 200) % 2 === 0 ? FASE2_SPRITES.operario_andando1 : FASE2_SPRITES.operario_andando2;
    return FASE2_SPRITES.operario_parado;
  }
  if (type === 'cientista') {
    if (isPunching) return FASE2_SPRITES.cientista_socando;
    if (isWalking) return Math.floor(Date.now() / 160) % 2 === 0 ? FASE2_SPRITES.cientista_andando1 : FASE2_SPRITES.cientista_andando2;
    return FASE2_SPRITES.cientista_parado;
  }
  if (type === 'furio') {
    if (isSuper) {
      if (isCharging || isShouting) return FASE2_SPRITES.furia_super_carga;
      if (isPunching) return FASE2_SPRITES.furia_super_socando;
      return FASE2_SPRITES.furia_super_parado;
    }
    if (isCharging || isShouting) return FASE2_SPRITES.furia_carga;
    if (isPunching) return FASE2_SPRITES.furia_socando;
    if (isWalking) return Math.floor(Date.now() / 180) % 2 === 0 ? FASE2_SPRITES.furia_andando1 : FASE2_SPRITES.furia_andando2;
    return FASE2_SPRITES.furia_parado;
  }
  if (type === 'suka') {
    if (isShouting) return INIMIGOS_SPRITES.suka_gritando;
    if (isPunching) return INIMIGOS_SPRITES.suka_socando;
    if (isWalking) return Math.floor(Date.now() / 200) % 2 === 0 ? INIMIGOS_SPRITES.suka_andando : INIMIGOS_SPRITES.suka_parada;
    return INIMIGOS_SPRITES.suka_parada;
  }
  if (type === 'fast') {
    if (isPunching) return INIMIGOS_SPRITES.capanga_preto_socando;
    if (isWalking) return Math.floor(Date.now() / 180) % 2 === 0 ? INIMIGOS_SPRITES.capanga_preto_andando : INIMIGOS_SPRITES.capanga_preto_parado;
    return INIMIGOS_SPRITES.capanga_preto_parado;
  }
  if (isPunching) return INIMIGOS_SPRITES.capanga_loiro_socando;
  if (isWalking) return Math.floor(Date.now() / 200) % 2 === 0 ? INIMIGOS_SPRITES.capanga_loiro_andando : INIMIGOS_SPRITES.capanga_loiro_parado;
  return INIMIGOS_SPRITES.capanga_loiro_parado;
}

export function getEnemyWidth(type: EnemyType) {
  if (type === 'furio') return SPRITE_ENEMY_FURIO_W;
  if (type === 'suka') return SPRITE_ENEMY_BOSS_W;
  return SPRITE_ENEMY_STD_W;
}
export function isBossType(type: EnemyType) { return type === 'suka' || type === 'furio'; }

// ─────────────────────────────────────────────────────
//  COMPONENTES VISUAIS
// ─────────────────────────────────────────────────────

export function PixelWallacaum({ direction, isWalking, isAttacking, isBuffa, isHurt, isEating, jumpZ, landSquash, combo }: {
  direction: string; isWalking: boolean; isAttacking: boolean; isBuffa: boolean; isHurt: boolean; isEating: boolean; jumpZ: number; landSquash: number; combo: number;
}) {
  const flip = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  let spr = WALLACAUM_SPRITES.parado;
  if (isHurt) spr = WALLACAUM_SPRITES.dor;
  else if (isBuffa) spr = WALLACAUM_SPRITES.bufa;
  else if (isAttacking) spr = WALLACAUM_SPRITES.soco;
  else if (jumpZ > 0) spr = WALLACAUM_SPRITES.pulando;
  else if (isWalking) spr = Math.floor(Date.now() / 140) % 2 === 0 ? WALLACAUM_SPRITES.walk1 : WALLACAUM_SPRITES.walk2;
  else if (isEating) spr = WALLACAUM_SPRITES.comendo;

  let sx = 1, sy = 1;
  if (jumpZ > 8) { sx = 0.92; sy = 1.08; }
  else if (landSquash > 0) { const t = landSquash / LAND_SQUASH_FRAMES; sx = 1 + t * 0.12; sy = 1 - t * 0.1; }
  
  const flt = isHurt ? 'drop-shadow(0 0 12px rgba(255,50,50,0.9)) brightness(1.8) sepia(1)' : 'drop-shadow(2px 3px 0px rgba(0,0,0,0.55))';
  const shS = clamp(1 - jumpZ / 120, 0.3, 1);
  const shO = clamp(0.5 - jumpZ / 200, 0.1, 0.5);
  const eatBob = isEating ? Math.sin(Date.now() * 0.008) * 2 : 0;

  return (
    <div style={{ transform: `${flip} scaleX(${sx}) scaleY(${sy})`, transformOrigin: 'bottom center', position: 'relative', width: SPRITE_PLAYER_W, height: SPRITE_PLAYER_H, transition: 'transform 0.04s' }}>
      <img src={spr} alt="W" style={{ position: 'absolute', left: '50%', transform: `translateX(-50%) translateY(${eatBob}px)`, bottom: 0, width: SPRITE_PLAYER_W, height: SPRITE_PLAYER_H, objectFit: 'contain', imageRendering: 'pixelated', pointerEvents: 'none', filter: flt, opacity: isHurt ? (Math.floor(Date.now() / 60) % 2 === 0 ? 0.4 : 0.9) : 1 }} />
      {isBuffa && <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', color: '#2ecc71', fontWeight: 900, fontSize: 11, letterSpacing: 2, textShadow: '2px 2px 0 #000', whiteSpace: 'nowrap', animation: 'pulse 0.3s infinite alternate' }}>⚡ BUFA CELESTE! ⚡</div>}
      {combo >= 3 && <div style={{ position: 'absolute', top: -45, left: '50%', transform: 'translateX(-50%)', color: combo >= 8 ? '#e74c3c' : combo >= 5 ? '#f39c12' : '#f1c40f', fontWeight: 900, fontSize: combo >= 8 ? 16 : 12, textShadow: '2px 2px 0 #000', whiteSpace: 'nowrap', animation: 'pulse 0.2s infinite alternate' }}>{combo}x COMBO!</div>}
      <div style={{ position: 'absolute', bottom: -6, left: '15%', width: `${70 * shS}%`, height: 10, background: `rgba(0,0,0,${shO})`, borderRadius: '50%', transform: `scaleX(${shS})`, transformOrigin: 'center' }} />
    </div>
  );
}

export function PixelDavisaum({ direction, isWalking, isThrowing, isScared, frame }: { direction: string; isWalking: boolean; isThrowing: boolean; isScared: boolean; frame: number }) {
  const flip = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  let spr = DAVISAUM_SPRITES.parado;
  if (isScared) spr = DAVISAUM_SPRITES.medo; else if (isThrowing) spr = DAVISAUM_SPRITES.jogando; else if (isWalking) spr = Math.floor(Date.now() / 200) % 2 === 0 ? DAVISAUM_SPRITES.walk : DAVISAUM_SPRITES.parado;
  const bob = isWalking && !isScared && !isThrowing ? Math.sin(frame * 0.4) * 2 : 0;
  const sk = isScared ? Math.sin(frame * 1.5) * 2 : 0;
  return (
    <div style={{ transform: `${flip} translateX(${sk}px)`, position: 'relative', width: 90, height: SPRITE_PLAYER_H }}>
      <div style={{ position: 'absolute', bottom: -6, left: 18, width: 54, height: 9, background: 'rgba(0,0,0,0.3)', borderRadius: '50%' }} />
      {isScared && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 14, animation: 'pulse 0.3s infinite alternate' }}>😰</div>}
      <img src={spr} alt="D" style={{ position: 'absolute', bottom: bob, left: '50%', transform: 'translateX(-50%)', width: SPRITE_DAVIS_W, height: SPRITE_PLAYER_H, objectFit: 'contain', imageRendering: 'pixelated', pointerEvents: 'none' }} />
    </div>
  );
}

export function PixelAgent({ type, direction, isWalking, punchTimer, stateTimer, frame, isHurt, hp, maxHp, charging }: {
  type: EnemyType; direction: string; isWalking: boolean; punchTimer: number; stateTimer: number; frame: number; isHurt: boolean; hp: number; maxHp: number; charging?: boolean;
}) {
  const flip = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  const isPunching = punchTimer > 0; const isShouting = stateTimer > 0;
  const hpPct = hp / maxHp;
  const isSuper = type === 'furio' && hpPct < 0.35;
  const spr = getEnemySprite(type, isWalking || !!charging, isPunching, isShouting, isSuper, !!charging);
  const sprFilter = isHurt ? 'brightness(2.5) sepia(1)' : '';
  const visualScale = type === 'furio' ? 1.25 : type === 'suka' ? 1.05 : 1;
  const visualBottom = type === 'furio' ? -4 : 0;
  const bob = isWalking && !isPunching && !isShouting ? Math.sin(frame * 0.3) * 2 : 0;
  const hpColor = type === 'furio' ? `hsl(${hpPct * 30 + 5}, 90%, 50%)` : `hsl(${hpPct * 40}, 75%, 50%)`;

  return (
    <div style={{ transform: `${flip}`, transformOrigin: 'bottom center', position: 'relative', width: 90, height: 95 }}>
      <div style={{ position: 'absolute', bottom: -6, left: 12, width: 56, height: 9, background: 'rgba(0,0,0,0.35)', borderRadius: '50%' }} />
      <img src={spr} alt="E" style={{ position: 'absolute', bottom: bob + visualBottom, left: '50%', transform: `translateX(-50%) scale(${visualScale})`, transformOrigin: 'bottom center', width: 120, height: 120, objectFit: 'contain', imageRendering: 'pixelated', opacity: isHurt ? (Math.floor(Date.now() / 50) % 2 === 0 ? 0.5 : 1) : 1, filter: sprFilter }} />
      <div style={{ position: 'absolute', top: -30, left: 5, width: 70, height: 7, background: '#1a1a1a', border: '1.5px solid #333', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${hpPct * 100}%`, height: '100%', background: hpColor, transition: 'width 0.2s ease-out' }} />
      </div>
    </div>
  );
}

export function FoodItemComp({ type, landed }: { type: string; landed: boolean }) {
  const b = !landed ? 'translateY(-4px)' : '';
  if (type === 'burger') return <div style={{ fontSize: 24, transform: b }}>🍔</div>;
  if (type === 'fries') return <div style={{ fontSize: 24, transform: b }}>🍟</div>;
  if (type === 'manual') return <div style={{ fontSize: 18, transform: b }}>📘</div>;
  if (type === 'compass') return <div style={{ fontSize: 18, transform: b }}>🧭</div>;
  return null;
}

export function FloatingText({ text, x, y, color, size = 16 }: { text: string; x: number; y: number; color: string; size?: number }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, transform: `translate3d(${x}px, ${y}px, 0)`, pointerEvents: 'none', zIndex: 9999 }}>
      <div style={{ color, fontWeight: 900, fontSize: size, fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000', animation: 'floatUp 0.9s ease-out forwards' }}>
        {text}
      </div>
    </div>
  );
}

export function ParticleRenderer({ particles, cam }: { particles: Particle[]; cam: number }) {
  return (<>{particles.map(p => { 
    const alpha = p.life / p.startLife; 
    const sx = p.x - cam; 
    if (sx < -40 || sx > BASE_W + 40) return null; 

    if (p.type === 'ring') { 
      const sc = 1 + (1 - alpha) * 2; 
      return <div key={p.id} style={{ position: 'absolute', left: 0, top: 0, transform: `translate3d(${sx - 20}px, ${p.y - 20}px, 0) scale(${sc})`, width: 40, height: 40, borderRadius: '50%', border: `3px solid ${p.color}`, opacity: alpha * 0.6, pointerEvents: 'none', zIndex: 9998 }} />; 
    } 

    if (p.type === 'smoke') {
      return (
        <div key={p.id} style={{ 
          position: 'absolute', left: 0, top: 0, 
          transform: `translate3d(${sx - p.size / 2}px, ${p.y - p.size / 2}px, 0)`, 
          width: p.size, height: p.size, 
          background: p.color, borderRadius: '2px', opacity: alpha, 
          boxShadow: `0 0 ${p.size}px ${p.color}`, pointerEvents: 'none', zIndex: 9997 
        }} />
      );
    }
    
    return (
      <div key={p.id} style={{ 
        position: 'absolute', left: 0, top: 0, 
        transform: `translate3d(${sx - p.size / 2}px, ${p.y - p.size / 2}px, 0)`, 
        width: p.size, height: p.size, background: p.color, 
        borderRadius: p.type === 'spark' ? '1px' : '50%', opacity: alpha, pointerEvents: 'none', zIndex: 9998 
      }} />
    ); 
  })}</>);
}

// ─────────────────────────────────────────────────────
//  TOUCH CONTROLS
// ─────────────────────────────────────────────────────
export function TouchDpad({ keysRef }: { keysRef: React.MutableRefObject<Record<string, boolean>> }) {
  const h = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId); keysRef.current[k] = true; },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[k] = false; },
    onPointerLeave: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[k] = false; },
    onPointerCancel: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[k] = false; },
  });
  const S: React.CSSProperties = { width: 52, height: 52, background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', touchAction: 'none' };
  return (
    <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 10020, display: 'grid', gridTemplateColumns: 'repeat(3, 52px)', gap: 2 }}>
      <div /><div style={S} {...h('arrowup')}>▲</div><div />
      <div style={S} {...h('arrowleft')}>◀</div><div /><div style={S} {...h('arrowright')}>▶</div>
      <div /><div style={S} {...h('arrowdown')}>▼</div><div />
    </div>
  );
}

export function TouchActions({ keysRef }: { keysRef: React.MutableRefObject<Record<string, boolean>> }) {
  const h = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId); keysRef.current[k] = true; },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[k] = false; },
    onPointerLeave: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[k] = false; },
  });
  const C = (color: string): React.CSSProperties => ({ width: 66, height: 66, background: `${color}33`, border: `2px solid ${color}66`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, touchAction: 'none' });
  return (
    <div style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 10020, display: 'flex', gap: 10 }}>
      <div style={C('#3498db')} {...h('z')}>PULO</div>
      <div style={C('#e74c3c')} {...h('x')}>SOCO</div>
      <div style={C('#2ecc71')} {...h('c')}>BUFA</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  HUD & TELAS
// ─────────────────────────────────────────────────────
export function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = (hp / maxHp) * 100;
  return <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10000, background: 'rgba(0,0,0,0.6)', padding: 5, borderRadius: 5 }}>
    <div style={{ color: '#f1c40f', fontSize: 8 }}>WALLAÇAUM</div>
    <div style={{ width: 100, height: 10, background: '#333', border: '1px solid #555' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: '#2ecc71' }} />
    </div>
  </div>;
}
export function ScoreDisplay({ score, combo, phase }: { score: number; combo: number; phase: number }) {
  return <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10000, textAlign: 'right', color: '#fff' }}>
    <div style={{ fontSize: 12 }}>{String(score).padStart(6, '0')}</div>
    {combo >= 2 && <div style={{ color: '#f1c40f', fontSize: 8 }}>x{combo} COMBO</div>}
  </div>;
}
export function BossHpBar({ enemy }: { enemy: Enemy | undefined }) {
  if (!enemy) return null;
  const pct = (enemy.hp / enemy.maxHp) * 100;
  return <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 10000, width: 200, background: 'rgba(0,0,0,0.7)', padding: 5 }}>
    <div style={{ color: '#e74c3c', fontSize: 8, textAlign: 'center' }}>CHEFE</div>
    <div style={{ width: '100%', height: 6, background: '#333' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: '#e74c3c' }} />
    </div>
  </div>;
}
export function MusicButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return <div onClick={onToggle} style={{ position: 'absolute', top: 8, left: 130, zIndex: 10001, cursor: 'pointer' }}>{muted ? '🔇' : '🔊'}</div>;
}

export function TitleScreen({ onStart }: { onStart: () => void }) {
  return <div style={{ position: 'absolute', inset: 0, zIndex: 99999, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontSize: 28, color: '#f1c40f' }}>WALLAÇAUM</div>
    <div onClick={onStart} style={{ marginTop: 20, padding: 10, border: '2px solid #fff', color: '#fff', cursor: 'pointer' }}>START</div>
  </div>;
}
export function PhaseTransitionScreen({ score, onContinue }: { score: number; onContinue: () => void }) {
  return <div style={{ position: 'absolute', inset: 0, zIndex: 99999, background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
    <div>FASE CONCLUÍDA!</div>
    <div onClick={onContinue} style={{ marginTop: 20, cursor: 'pointer' }}>PRÓXIMA FASE</div>
  </div>;
}
export function GameOverScreen({ score, onRetry }: { score: number; onRetry: () => void }) {
  return <div style={{ position: 'absolute', inset: 0, zIndex: 99999, background: 'rgba(100,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
    <div style={{ fontSize: 32 }}>GAME OVER</div>
    <div onClick={onRetry} style={{ marginTop: 20, cursor: 'pointer' }}>RETRY</div>
  </div>;
}
export function VictoryScreen({ score, onRetry }: { score: number; onRetry: () => void }) {
  return <div style={{ position: 'absolute', inset: 0, zIndex: 99999, background: 'rgba(0,100,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
    <div>VITÓRIA!</div>
    <div onClick={onRetry} style={{ marginTop: 20, cursor: 'pointer' }}>JOGAR NOVAMENTE</div>
  </div>;
}

// ─────────────────────────────────────────────────────
//  LOGICA DE JOGO
// ─────────────────────────────────────────────────────

export function updatePlayerMovement(p: Player, k: Record<string, boolean>) {
  let ix = 0, iy = 0;
  if (k['arrowleft'] || k['a']) ix -= 1; if (k['arrowright'] || k['d']) ix += 1;
  if (k['arrowup'] || k['w']) iy -= 1; if (k['arrowdown'] || k['s']) iy += 1;
  if (ix !== 0 && iy !== 0) { ix *= 0.707; iy *= 0.707; }
  if (ix !== 0) { p.vx += ix * PLAYER_ACCEL; p.vx = clamp(p.vx, -PLAYER_MAX_SPEED, PLAYER_MAX_SPEED); p.dir = ix > 0 ? 'right' : 'left'; }
  else { p.vx *= PLAYER_DECEL; if (Math.abs(p.vx) < 0.1) p.vx = 0; }
  if (iy !== 0) { p.vy += iy * PLAYER_ACCEL * 0.65; p.vy = clamp(p.vy, -PLAYER_MAX_SPEED * 0.65, PLAYER_MAX_SPEED * 0.65); }
  else { p.vy *= PLAYER_DECEL; if (Math.abs(p.vy) < 0.1) p.vy = 0; }
  p.x += p.vx; p.y += p.vy;
  p.x = clamp(p.x, 30, WORLD_W - 30); p.y = clamp(p.y, FLOOR_MIN, FLOOR_MAX);
}

export function updatePlayerJump(p: Player, k: Record<string, boolean>, particles: Particle[]) {
  const gnd = p.z <= 0 && p.vz <= 0;
  if (gnd) { 
    p.coyoteTimer = COYOTE_TIME; 
    if (!p.wasGrounded) { p.landSquash = LAND_SQUASH_FRAMES; spawnParticles(particles, 4, p.x, p.y, '#8B7355', 'dust', 2, 0.3, 5); } 
  } else { if (p.coyoteTimer > 0) p.coyoteTimer--; }
  p.wasGrounded = gnd;
  if ((k['z'] || k[' ']) && p.coyoteTimer > 0 && p.z === 0) { p.vz = JUMP_FORCE; p.coyoteTimer = 0; playSFX('jump'); }
  if (!(k['z'] || k[' ']) && p.vz > 0) p.vz *= JUMP_CUT;
  if (p.z > 0 || p.vz > 0) { p.z += p.vz; p.vz -= GRAVITY; if (p.z <= 0) { p.z = 0; p.vz = 0; } }
  if (p.landSquash > 0) p.landSquash--;
}

export function updatePlayerAttacks(p: Player, k: Record<string, boolean>, enemies: Enemy[], screenShakeRef: React.MutableRefObject<number>) {
  if (k['x'] && !p.attacking && p.atkTimer <= 0) { p.attacking = true; p.atkTimer = PUNCH_DURATION; enemies.forEach(e => e.hitThisSwing = false); }
  if (p.atkTimer > 0) { p.atkTimer--; if (p.atkTimer <= 0) p.attacking = false; }
  if (k['c'] && !p.buffing && p.buffTimer <= 0) { p.buffing = true; p.buffTimer = BUFA_DURATION; playSFX('bufa'); enemies.forEach(e => e.hitThisSwing = false); screenShakeRef.current = 8; }
  if (p.buffTimer > 0) { p.buffTimer--; if (p.buffTimer <= 0) p.buffing = false; }
  if (p.hurtTimer > 0) { p.hurtTimer--; if (p.hurtTimer <= 0) p.hurt = false; }
  if (p.invincible > 0) p.invincible--;
  if (p.comboTimer > 0) { p.comboTimer--; if (p.comboTimer <= 0) p.combo = 0; }
}

export function updateIdleEating(p: Player, k: Record<string, boolean>, particles: Particle[], texts: FloatingTextData[], f: number) {
  const move = !!(k['arrowleft'] || k['arrowright'] || k['arrowup'] || k['arrowdown']);
  if (move || p.attacking || p.buffing || p.hurt) { p.idleTimer = 0; p.eating = false; }
  else {
    p.idleTimer++; 
    if (p.idleTimer >= IDLE_EAT_FRAMES && !p.eating) { 
      p.eating = true; p.eatTimer = IDLE_EAT_DURATION; 
      texts.push({ id: uid(), text: 'nhom nhom~', x: p.x, y: p.y - 60, color: '#f39c12', size: 10, t: f });
    }
    if (p.eating) { p.eatTimer--; if (p.eatTimer <= 0) { p.eating = false; p.idleTimer = 0; } }
  }
}

export function updateDavisAI(dav: Davisaum, p: Player, enemies: Enemy[], food: FoodItem[], f: number) {
  const d = dist(dav.x, dav.y, p.x, p.y);
  if (d > 100) { dav.x += (p.x - dav.x) * 0.05; dav.y += (p.y - dav.y) * 0.05; dav.isWalking = true; } else dav.isWalking = false;
  dav.dir = dav.x < p.x ? 'right' : 'left';
  dav.throwTimer++; 
  if (dav.throwTimer > 240) { 
    dav.throwTimer = 0; 
    food.push({ id: uid(), x: dav.x, y: dav.y, type: 'burger', t: f, vy: -3, landed: false }); 
  }
}

export function updateItems(food: FoodItem[], p: Player, texts: FloatingTextData[], particles: Particle[], f: number) {
  for (let i = food.length - 1; i >= 0; i--) {
    const fo = food[i];
    if (!fo.landed) { fo.vy += 0.3; fo.y += fo.vy; if (fo.vy > 0) fo.landed = true; }
    if (dist(fo.x, fo.y, p.x, p.y) < 30) {
      p.hp = Math.min(MAX_HP, p.hp + 20); playSFX('eat');
      food.splice(i, 1);
    }
  }
}

// CORRIGIDO: Lógica de fumaça integrada no atualizador de partículas
export function updateParticlesAndTexts(particles: Particle[], texts: FloatingTextData[], f: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    
    if (pt.type === 'smoke') {
      pt.vx *= 0.96;
      pt.vy *= 0.98;
      pt.y += pt.vy;
      pt.x += pt.vx;
      const lifeFactor = pt.life / pt.startLife;
      pt.size = pt.startSize * (1 + (1 - lifeFactor) * 0.4);
    } else {
      pt.x += pt.vx; pt.y += pt.vy;
      if (pt.type !== 'ring') pt.vy += 0.15;
    }
    
    pt.life -= 0.016;
    if (pt.life <= 0) particles.splice(i, 1);
  }
  for (let i = texts.length - 1; i >= 0; i--) { if (f - texts[i].t >= 60) texts.splice(i, 1); }
}

export function checkPlayerHits(e: Enemy, p: Player, particles: Particle[], texts: FloatingTextData[], f: number): boolean {
  const dx = Math.abs(e.x - p.x);
  const dy = Math.abs(e.y - p.y);
  const pf = PUNCH_DURATION - p.atkTimer;
  
  if (p.attacking && pf >= PUNCH_ACTIVE[0] && pf <= PUNCH_ACTIVE[1] && dx < PUNCH_RANGE && dy < PUNCH_DEPTH && !e.hitThisSwing) {
    e.hitThisSwing = true; e.hp -= PUNCH_DAMAGE; e.hurt = true; e.hurtTimer = 10;
    p.combo++; p.comboTimer = COMBO_TIMEOUT; playSFX('hit');
    spawnParticles(particles, 5, e.x, e.y - 30, '#f1c40f', 'spark');
  }
  if (p.buffing && p.buffTimer < (BUFA_DURATION - BUFA_ACTIVE_START) && dx < BUFA_RANGE && dy < BUFA_DEPTH && !e.hitThisSwing) {
    e.hitThisSwing = true; e.hp -= BUFA_DAMAGE_NORMAL; e.hurt = true; e.hurtTimer = 15;
    p.combo++; p.comboTimer = COMBO_TIMEOUT;
    spawnParticles(particles, 8, e.x, e.y - 30, '#2ecc71', 'smoke');
  }
  return e.hp <= 0;
}

export function updateBasicEnemyAI(e: Enemy, p: Player, particles: Particle[], texts: FloatingTextData[], f: number): 'dead' | 'alive' {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.sqrt(dx * dx + dy * dy);
  if (d > 50) { e.x += Math.sign(dx) * ENEMY_SPEED; e.y += Math.sign(dy) * ENEMY_SPEED * 0.5; e.walking = true; } else e.walking = false;
  e.dir = dx > 0 ? 'right' : 'left';
  if (d < 50 && p.invincible <= 0 && e.atkCd <= 0) {
    e.atkCd = 60; p.hp -= 10; p.hurt = true; p.invincible = 30;
    if (p.hp <= 0) return 'dead';
  }
  if (e.atkCd > 0) e.atkCd--;
  return 'alive';
}

export function updateSukaAI(e: Enemy, p: Player, dav: Davisaum, particles: Particle[], texts: FloatingTextData[], f: number, screenShakeRef: React.MutableRefObject<number>): 'dead' | 'alive' {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.sqrt(dx * dx + dy * dy);
  if (e.stateTimer > 0) {
    e.stateTimer--; 
    if (e.stateTimer === 1 && d < 150) {
      p.hp -= 20; p.hurt = true; screenShakeRef.current = 10;
      if (p.hp <= 0) return 'dead';
    }
  } else if (d < 150 && e.atkCd <= 0) { e.stateTimer = 40; e.atkCd = 120; }
  if (e.atkCd > 0) e.atkCd--;
  e.x += Math.sign(dx) * ENEMY_SPEED * 0.6; e.y += Math.sign(dy) * ENEMY_SPEED * 0.4;
  return 'alive';
}

export function updateFurioAI(e: Enemy, p: Player, dav: Davisaum, particles: Particle[], texts: FloatingTextData[], f: number, screenShakeRef: React.MutableRefObject<number>): 'dead' | 'alive' {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.sqrt(dx * dx + dy * dy);
  if (e.charging) {
    e.x += (e.chargeDir || 0) * 6; e.stateTimer--;
    if (e.stateTimer <= 0) e.charging = false;
  } else if (d < 200 && e.atkCd <= 0) {
    e.charging = true; e.chargeDir = Math.sign(dx); e.stateTimer = 40; e.atkCd = 100;
  }
  if (e.atkCd > 0) e.atkCd--;
  return 'alive';
}

// ─────────────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────────────
export const GAME_CSS = `
  @keyframes floatUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-40px)}}
  @keyframes pulse{0%{transform:scale(1)}100%{transform:scale(1.1)}}
`;

// ─────────────────────────────────────────────────────
//  MOTOR (useGameEngine)
// ─────────────────────────────────────────────────────

export interface EnginePhaseConfig {
  initialScore: number; initialHp: number; bossThreshold: number; spawnIntervalMs: number;
  bossType: EnemyType; bossHp: number; bossAnnounce: string; bossAnnounceColor: string; bossDeathColor: string; bossDeathParticles: string;
  getNormalEnemyType: () => EnemyType; getNormalEnemyHp: (type: EnemyType) => number;
  onGameOver: (score: number) => void; onComplete: (score: number, hp: number) => void;
}

export function useGameEngine(cfg: EnginePhaseConfig) {
  const playerRef = useRef<Player>({ ...DEFAULT_PLAYER, hp: cfg.initialHp });
  const enemiesRef = useRef<Enemy[]>([]);
  const foodRef = useRef<FoodItem[]>([]);
  const textsRef = useRef<FloatingTextData[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const davisRef = useRef<Davisaum>({ ...DEFAULT_DAVIS });
  const keysRef = useRef<Record<string, boolean>>({});
  const frameRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const cameraRef = useRef(0);
  const bossSpawned = useRef(false);
  const screenShakeRef = useRef(0);
  const scoreRef = useRef(cfg.initialScore);
  
  const [score, setScore] = useState(cfg.initialScore);
  const [dead, setDead] = useState(false);
  const [frameTick, setFrameTick] = useState(0);

  useEffect(() => {
    const d = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const u = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', d); window.addEventListener('keyup', u);
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); };
  }, []);

  useEffect(() => {
    if (dead) return;
    let animId: number;
    const loop = () => {
      const p = playerRef.current; const k = keysRef.current; const f = ++frameRef.current;
      const dav = davisRef.current; const enemies = enemiesRef.current;
      const particles = particlesRef.current; const texts = textsRef.current;
      
      if (p.hitstop > 0) { p.hitstop--; setFrameTick(f); animId = requestAnimationFrame(loop); return; }

      updateIdleEating(p, k, particles, texts, f);
      updatePlayerMovement(p, k);
      updatePlayerJump(p, k, particles);
      
      // LOGICA DA BUFA CELESTE: Fumaça visual
      if (p.buffing && f % 2 === 0) {
        spawnCelestialSmoke(particles, p.x, p.y - 10);
      }

      cameraRef.current += (clamp(p.x - BASE_W / 2, 0, WORLD_W - BASE_W) - cameraRef.current) * 0.07;
      updatePlayerAttacks(p, k, enemies, screenShakeRef);
      updateDavisAI(dav, p, enemies, foodRef.current, f);

      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.hurtTimer > 0) { e.hurtTimer--; if (e.hurtTimer <= 0) e.hurt = false; continue; }

        let stateResult: 'dead' | 'alive' = 'alive';
        // CORREÇÃO: Variável dav passada corretamente
        if (e.type === 'suka') stateResult = updateSukaAI(e, p, dav, particles, texts, f, screenShakeRef);
        else if (e.type === 'furio') stateResult = updateFurioAI(e, p, dav, particles, texts, f, screenShakeRef);
        else stateResult = updateBasicEnemyAI(e, p, particles, texts, f);

        if (stateResult === 'dead') { setDead(true); cfg.onGameOver(scoreRef.current); return; }

        if (checkPlayerHits(e, p, particles, texts, f)) {
          enemies.splice(i, 1); scoreRef.current += 100; setScore(scoreRef.current);
          if (e.type === cfg.bossType) cfg.onComplete(scoreRef.current, p.hp);
        }
      }

      updateItems(foodRef.current, p, texts, particles, f);

      if (scoreRef.current >= cfg.bossThreshold && !bossSpawned.current) {
        bossSpawned.current = true;
        enemies.push({ id: uid(), type: cfg.bossType, x: p.x + 400, y: p.y, z: 0, hp: cfg.bossHp, maxHp: cfg.bossHp, dir: 'left', walking: true, hurt: false, hurtTimer: 0, kbx: 0, kby: 0, atkCd: 60, stateTimer: 0, punchTimer: 0, hitThisSwing: false } as any);
      } else {
        spawnTimerRef.current++;
        if (spawnTimerRef.current > cfg.spawnIntervalMs / 16 && enemies.length < MAX_ENEMIES) {
          spawnTimerRef.current = 0;
          enemies.push({ id: uid(), type: cfg.getNormalEnemyType(), x: p.x + 500, y: rng(FLOOR_MIN, FLOOR_MAX), z: 0, hp: 5, maxHp: 5, dir: 'left', walking: true, hurt: false, hurtTimer: 0, kbx: 0, kby: 0, atkCd: 0, stateTimer: 0, punchTimer: 0, hitThisSwing: false } as any);
        }
      }

      if (screenShakeRef.current > 0) screenShakeRef.current *= 0.9;
      updateParticlesAndTexts(particles, texts, f);
      setFrameTick(f);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [dead]);

  return {
    p: playerRef.current, dav: davisRef.current, enemies: enemiesRef.current, food: foodRef.current,
    texts: textsRef.current, particles: particlesRef.current, keysRef, frame: frameTick,
    cam: cameraRef.current, shake: screenShakeRef.current, score, bossEnemy: enemiesRef.current.find(e => isBossType(e.type))
  };
}
