// ═══════════════════════════════════════════════════════
//  gameCore.tsx — MOTOR CENTRAL E COMPONENTES (OTIMIZADO)
// ═══════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from 'react';
import { playSFX } from './sfx';
import { WALLACAUM_SPRITES, DAVISAUM_SPRITES, INIMIGOS_SPRITES } from './sprites';
import { FASE2_SPRITES } from './spritesFase2';
import { BUFA_SPRITES } from './BufaSprites';

// ─────────────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────────────
export const BASE_W = 800;
export const BASE_H = 450;
export const WORLD_W = 3200;
export const FLOOR_MIN = BASE_H - 100;
export const FLOOR_MAX = BASE_H - 18;
export const LEVEL_HEIGHT = FLOOR_MAX - FLOOR_MIN;
export const WORLD_MIN_Y = FLOOR_MIN;
export const WORLD_MAX_Y = FLOOR_MIN + LEVEL_HEIGHT;

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

export const BUFA_RENDER_SCALE = 2.5;
export const BUFA_PLAYER_RENDER_SCALE = 1;
export const BUFA_SMOKE_RENDER_SCALE = 2;
export const BUFA_HITBOX_SCALE = 6;

export const HITSTOP_FRAMES = 4;
export const KNOCKBACK_DECAY = 0.82;
export const COMBO_TIMEOUT = 90;

export const ENEMY_SPEED = 1.3;
export const SPAWN_INTERVAL_MS = 3500;
export const MAX_ENEMIES = 7;
export const MAX_HP = 100;
export const FOOD_SIZE = 28;
export const MAX_PARTICLES = 150;

export const IDLE_EAT_FRAMES = 120;
export const IDLE_EAT_DURATION = 90;

export const SPRITE_PLAYER_W = 85;
export const SPRITE_PLAYER_H = 95;
export const SPRITE_DAVIS_W = 110;
export const SPRITE_ENEMY_STD_W = 120;
export const SPRITE_ENEMY_BOSS_W = 140;
export const SPRITE_ENEMY_FURIO_W = 150;

const CELESTIAL_SMOKE_COLORS = ['#00f2ff', '#2ecc71', '#a2ffd1', '#0077ff'] as const;
const frameToggle = (frame: number, step: number) => Math.floor(frame / step) % 2 === 0;

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
  startLife: number;
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
export const clampY = (y: number) => clamp(y, WORLD_MIN_Y, WORLD_MAX_Y);
export const clampLevelY = clampY;
export const clampEntityY = <T extends { y: number }>(entity: T) => {
  entity.y = clampY(entity.y);
  return entity;
};
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

export function spawnCelestialSmoke(particles: Particle[], x: number, y: number) {
  for (let i = 0; i < 3; i++) {
    const life = rng(1.5, 2.5);
    const baseSize = rng(35, 55);
    particles.push({
      id: Math.random(),
      x: x + rng(-30, 30),
      y: y + rng(-20, 10),
      vx: rng(-1.5, 1.5),
      vy: rng(-2.5, -1.0),
      life: life,
      startLife: life,
      color: CELESTIAL_SMOKE_COLORS[Math.floor(Math.random() * CELESTIAL_SMOKE_COLORS.length)],
      size: baseSize,
      startSize: baseSize,
      type: 'smoke'
    });
  }
}

export function getEnemySprite(type: EnemyType, isWalking: boolean, isPunching: boolean, isShouting: boolean, frame: number, isSuper = false, isCharging = false) {
  if (type === 'seguranca') {
    if (isPunching) return FASE2_SPRITES.operario_socando;
    if (isWalking) return frameToggle(frame, 12) ? FASE2_SPRITES.operario_andando1 : FASE2_SPRITES.operario_andando2;
    return FASE2_SPRITES.operario_parado;
  }
  if (type === 'cientista') {
    if (isPunching) return FASE2_SPRITES.cientista_socando;
    if (isWalking) return frameToggle(frame, 10) ? FASE2_SPRITES.cientista_andando1 : FASE2_SPRITES.cientista_andando2;
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
    if (isWalking) return frameToggle(frame, 11) ? FASE2_SPRITES.furia_andando1 : FASE2_SPRITES.furia_andando2;
    return FASE2_SPRITES.furia_parado;
  }
  if (type === 'suka') {
    if (isShouting) return INIMIGOS_SPRITES.suka_gritando;
    if (isPunching) return INIMIGOS_SPRITES.suka_socando;
    if (isWalking) return frameToggle(frame, 12) ? INIMIGOS_SPRITES.suka_andando : INIMIGOS_SPRITES.suka_parada;
    return INIMIGOS_SPRITES.suka_parada;
  }
  if (type === 'fast') {
    if (isPunching) return INIMIGOS_SPRITES.capanga_preto_socando;
    if (isWalking) return frameToggle(frame, 11) ? INIMIGOS_SPRITES.capanga_preto_andando : INIMIGOS_SPRITES.capanga_preto_parado;
    return INIMIGOS_SPRITES.capanga_preto_parado;
  }
  if (isPunching) return INIMIGOS_SPRITES.capanga_loiro_socando;
  if (isWalking) return frameToggle(frame, 12) ? INIMIGOS_SPRITES.capanga_loiro_andando : INIMIGOS_SPRITES.capanga_loiro_parado;
  return INIMIGOS_SPRITES.capanga_loiro_parado;
}

export function isBossType(type: EnemyType) { return type === 'suka' || type === 'furio'; }

// ─────────────────────────────────────────────────────
//  COMPONENTES VISUAIS (MEMOIZADOS PARA PERFORMANCE)
// ─────────────────────────────────────────────────────

export const PixelWallacaum = React.memo(function PixelWallacaum({ direction, isWalking, isAttacking, isBuffa, isHurt, isEating, jumpZ, landSquash, combo, frame }: any) {
  const flip = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  let spr = WALLACAUM_SPRITES.parado;
  if (isHurt) spr = WALLACAUM_SPRITES.dor;
  else if (isBuffa) spr = WALLACAUM_SPRITES.bufa;
  else if (isAttacking) spr = WALLACAUM_SPRITES.soco;
  else if (jumpZ > 0) spr = WALLACAUM_SPRITES.pulando;
  else if (isWalking) spr = frameToggle(frame, 9) ? WALLACAUM_SPRITES.walk1 : WALLACAUM_SPRITES.walk2;
  else if (isEating) spr = WALLACAUM_SPRITES.comendo;

  let sx = 1, sy = 1;
  if (jumpZ > 8) { sx = 0.92; sy = 1.08; }
  else if (landSquash > 0) { const t = landSquash / LAND_SQUASH_FRAMES; sx = 1 + t * 0.12; sy = 1 - t * 0.1; }
  
  const flt = isHurt ? 'drop-shadow(0 0 12px rgba(255,50,50,0.9)) brightness(1.8) sepia(1)' : 'drop-shadow(2px 3px 0px rgba(0,0,0,0.55))';
  const shS = clamp(1 - jumpZ / 120, 0.3, 1);
  const shO = clamp(0.5 - jumpZ / 200, 0.1, 0.5);
  const eatBob = isEating ? Math.sin(frame * 0.45) * 2 : 0;
  const hurtOpacity = isHurt ? (frameToggle(frame, 3) ? 0.4 : 0.9) : 1;
  const bufaScale = isBuffa ? BUFA_PLAYER_RENDER_SCALE : 1;

  return (
    <div style={{ transform: `${flip} scaleX(${sx}) scaleY(${sy})`, transformOrigin: 'bottom center', position: 'absolute', left: 0, top: 0, width: SPRITE_PLAYER_W, height: SPRITE_PLAYER_H, transition: 'transform 0.04s' }}>
      <img src={spr} alt="W" style={{ position: 'absolute', left: '50%', transform: `translateX(-50%) translateY(${eatBob}px) scale(${bufaScale})`, transformOrigin: 'bottom center', bottom: 0, width: SPRITE_PLAYER_W, height: SPRITE_PLAYER_H, objectFit: 'contain', imageRendering: 'pixelated', pointerEvents: 'none', filter: flt, opacity: hurtOpacity }} />
      {isBuffa && <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', color: '#2ecc71', fontWeight: 900, fontSize: 11, letterSpacing: 2, textShadow: '2px 2px 0 #000', whiteSpace: 'nowrap', animation: 'pulse 0.3s infinite alternate' }}>⚡ BUFA CELESTE! ⚡</div>}
      {combo >= 3 && <div style={{ position: 'absolute', top: -45, left: '50%', transform: 'translateX(-50%)', color: combo >= 8 ? '#e74c3c' : combo >= 5 ? '#f39c12' : '#f1c40f', fontWeight: 900, fontSize: combo >= 8 ? 16 : 12, textShadow: '2px 2px 0 #000', whiteSpace: 'nowrap', animation: 'pulse 0.2s infinite alternate' }}>{combo}x COMBO!</div>}
      <div style={{ position: 'absolute', bottom: -6, left: '15%', width: `${70 * shS}%`, height: 10, background: `rgba(0,0,0,${shO})`, borderRadius: '50%', transform: `scaleX(${shS})`, transformOrigin: 'center' }} />
    </div>
  );
});

export const PixelDavisaum = React.memo(function PixelDavisaum({ direction, isWalking, isThrowing, isScared, frame }: any) {
  const flip = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  let spr = DAVISAUM_SPRITES.parado;
  if (isScared) spr = DAVISAUM_SPRITES.medo; else if (isThrowing) spr = DAVISAUM_SPRITES.jogando; else if (isWalking) spr = frameToggle(frame, 12) ? DAVISAUM_SPRITES.walk : DAVISAUM_SPRITES.parado;
  const bob = isWalking && !isScared && !isThrowing ? Math.sin(frame * 0.4) * 2 : 0;
  const sk = isScared ? Math.sin(frame * 1.5) * 2 : 0;
  return (
    <div style={{ transform: `${flip} translateX(${sk}px)`, position: 'absolute', width: 90, height: 95 }}>
      <div style={{ position: 'absolute', bottom: -6, left: 18, width: 54, height: 9, background: 'rgba(0,0,0,0.3)', borderRadius: '50%' }} />
      {isScared && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 14, animation: 'pulse 0.3s infinite alternate' }}>😰</div>}
      <img src={spr} alt="D" style={{ position: 'absolute', bottom: bob, left: '50%', transform: 'translateX(-50%)', width: SPRITE_DAVIS_W, height: 95, objectFit: 'contain', imageRendering: 'pixelated', pointerEvents: 'none' }} />
    </div>
  );
});

export const PixelAgent = React.memo(function PixelAgent({ type, direction, isWalking, punchTimer, stateTimer, frame, isHurt, hp, maxHp, charging }: any) {
  const flip = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  const isPunching = punchTimer > 0; const isShouting = stateTimer > 0;
  const hpPct = hp / maxHp;
  const isSuper = type === 'furio' && hpPct < 0.35;
  const spr = getEnemySprite(type, isWalking || !!charging, isPunching, isShouting, frame, isSuper, !!charging);
  const sprFilter = isHurt ? 'brightness(2.5) sepia(1)' : '';
  const visualScale = type === 'furio' ? 1.25 : type === 'suka' ? 1.05 : 1;
  const visualBottom = type === 'furio' ? -4 : 0;
  const bob = isWalking && !isPunching && !isShouting ? Math.sin(frame * 0.3) * 2 : 0;
  const hpColor = type === 'furio' ? `hsl(${hpPct * 30 + 5}, 90%, 50%)` : `hsl(${hpPct * 40}, 75%, 50%)`;
  const hurtOpacity = isHurt ? (frameToggle(frame, 3) ? 0.5 : 1) : 1;

  return (
    <div style={{ transform: `${flip}`, transformOrigin: 'bottom center', position: 'absolute', width: 90, height: 95 }}>
      <div style={{ position: 'absolute', bottom: -6, left: 12, width: 56, height: 9, background: 'rgba(0,0,0,0.35)', borderRadius: '50%' }} />
      <img src={spr} alt="E" style={{ position: 'absolute', bottom: bob + visualBottom, left: '50%', transform: `translateX(-50%) scale(${visualScale})`, transformOrigin: 'bottom center', width: 120, height: 120, objectFit: 'contain', imageRendering: 'pixelated', opacity: hurtOpacity, filter: sprFilter }} />
      <div style={{ position: 'absolute', top: -30, left: 5, width: 70, height: 7, background: '#1a1a1a', border: '1.5px solid #333', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${hpPct * 100}%`, height: '100%', background: hpColor, transition: 'width 0.2s ease-out' }} />
      </div>
    </div>
  );
});

export const ParticleRenderer = React.memo(function ParticleRenderer({ particles, cam }: { particles: Particle[]; cam: number }) {
  return (<>{particles.map(p => { 
    const alpha = p.life / p.startLife; 
    const sx = p.x - cam; 
    const renderedSize = p.type === 'smoke' ? p.size * BUFA_SMOKE_RENDER_SCALE : p.size;
    const halfSize = renderedSize / 2;
    const edgeMargin = Math.max(60, halfSize + 10);
    
    // CULLING: Não renderiza partículas fora da tela
    if (sx < -edgeMargin || sx > BASE_W + edgeMargin) return null; 

    if (p.type === 'ring') { 
      const sc = 1 + (1 - alpha) * 2; 
      return <div key={p.id} style={{ position: 'absolute', left: 0, top: 0, transform: `translate3d(${sx - 20}px, ${p.y - 20}px, 0) scale(${sc})`, width: 40, height: 40, borderRadius: '50%', border: `3px solid ${p.color}`, opacity: alpha * 0.6, pointerEvents: 'none', zIndex: 9998 }} />; 
    } 

    if (p.type === 'smoke') {
      const lifeRatio = p.life / p.startLife;
      let currentSprite = BUFA_SPRITES.FIM;
      if (lifeRatio > 0.66) currentSprite = BUFA_SPRITES.INICIO;
      else if (lifeRatio > 0.33) currentSprite = BUFA_SPRITES.MEIO;

      return (
        <img key={p.id} src={currentSprite} alt="bufa" style={{ position: 'absolute', left: 0, top: 0, transform: `translate3d(${sx - halfSize}px, ${p.y - halfSize}px, 0)`, width: renderedSize, height: renderedSize, opacity: alpha, imageRendering: 'pixelated', pointerEvents: 'none', zIndex: 9997 }} />
      );
    }
    
    return (
      <div key={p.id} style={{ 
        position: 'absolute', left: 0, top: 0, 
        transform: `translate3d(${sx - p.size / 2}px, ${p.y - p.size / 2}px, 0) ${p.type === 'spark' ? `rotate(${p.vx * 20}deg)` : ''}`, 
        width: p.size, height: p.size, background: p.color, 
        borderRadius: p.type === 'spark' ? '1px' : '50%', opacity: alpha, pointerEvents: 'none', zIndex: 9998 
      }} />
    ); 
  })}</>);
});

// ─────────────────────────────────────────────────────
//  HUD & TELAS
// ─────────────────────────────────────────────────────
export const HpBar = React.memo(function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = (clamp(hp, 0, maxHp) / maxHp) * 100;
  return <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10000, background: 'rgba(0,0,0,0.6)', padding: 5, borderRadius: 5 }}>
    <div style={{ color: '#f1c40f', fontSize: 8 }}>WALLAÇAUM</div>
    <div style={{ width: 100, height: 10, background: '#333', border: '1px solid #555' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: '#2ecc71' }} />
    </div>
  </div>;
});

export const ScoreDisplay = React.memo(function ScoreDisplay({ score, combo }: { score: number; combo: number; phase: number }) {
  return <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10000, textAlign: 'right', color: '#fff' }}>
    <div style={{ fontSize: 12 }}>{String(score).padStart(6, '0')}</div>
    {combo >= 2 && <div style={{ color: '#f1c40f', fontSize: 8 }}>x{combo} COMBO</div>}
  </div>;
});

export function BossHpBar({ enemy }: { enemy: Enemy | undefined }) {
  if (!enemy) return null;
  const pct = (clamp(enemy.hp, 0, enemy.maxHp) / enemy.maxHp) * 100;
  return <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 10000, width: 200, background: 'rgba(0,0,0,0.7)', padding: 5 }}>
    <div style={{ color: '#e74c3c', fontSize: 8, textAlign: 'center' }}>CHEFE</div>
    <div style={{ width: '100%', height: 6, background: '#333' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: '#e74c3c' }} />
    </div>
  </div>;
}

export const MusicButton = React.memo(function MusicButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return <div onClick={onToggle} style={{ position: 'absolute', top: 8, left: 130, zIndex: 10001, cursor: 'pointer' }}>{muted ? '🔇' : '🔊'}</div>;
});

// ─────────────────────────────────────────────────────
//  LOGICA DE JOGO (FIXED TIMESTEP E MEMORIA)
// ─────────────────────────────────────────────────────

export function updateParticlesAndTexts(particles: Particle[], texts: FloatingTextData[], f: number) {
  // Limpeza sem splice (evita engasgos de lixo de memória)
  let pAlive = 0;
  for (let i = 0; i < particles.length; i++) {
    const pt = particles[i];
    if (pt.type === 'smoke') {
      pt.vx *= 0.96; pt.vy *= 0.98; pt.y += pt.vy; pt.x += pt.vx;
      pt.size = pt.startSize * (1 + (1 - pt.life / pt.startLife) * 0.4);
    } else {
      pt.x += pt.vx; pt.y += pt.vy;
      if (pt.type !== 'ring') pt.vy += 0.15;
    }
    pt.life -= 0.016;
    if (pt.life > 0) {
      particles[pAlive] = pt;
      pAlive++;
    }
  }
  particles.length = pAlive;

  let tAlive = 0;
  for (let i = 0; i < texts.length; i++) {
    if (f - texts[i].t < 60) {
      texts[tAlive] = texts[i];
      tAlive++;
    }
  }
  texts.length = tAlive;
}

// ... Restante das funções de lógica (updatePlayerMovement, checkPlayerHits, etc.) mantidas conforme original ...
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
  p.x = clamp(p.x, 30, WORLD_W - 30);
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

export function updateIdleEating(p: Player, k: Record<string, boolean>, _particles: Particle[], texts: FloatingTextData[], f: number) {
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

export function updateDavisAI(dav: Davisaum, p: Player, _enemies: Enemy[], food: FoodItem[], f: number) {
  const d = dist(dav.x, dav.y, p.x, p.y);
  if (d > 100) { dav.x += (p.x - dav.x) * 0.05; dav.y += (p.y - dav.y) * 0.05; dav.isWalking = true; } else dav.isWalking = false;
  dav.dir = dav.x < p.x ? 'right' : 'left';
  dav.throwTimer++; 
  if (dav.throwTimer > 240) { 
    dav.throwTimer = 0; 
    food.push({ id: uid(), x: dav.x, y: dav.y, type: 'burger', t: f, vy: -3, landed: false }); 
  }
}

export function updateItems(food: FoodItem[], p: Player) {
  for (let i = food.length - 1; i >= 0; i--) {
    const fo = food[i];
    if (!fo.landed) { 
      fo.vy += 0.3; fo.y += fo.vy; 
      if (fo.vy > 0 && fo.y >= p.y) { fo.y = p.y; fo.landed = true; } 
    }
    if (dist(fo.x, fo.y, p.x, p.y) < 30) {
      p.hp = Math.min(MAX_HP, p.hp + 20); playSFX('eat');
      food.splice(i, 1);
    }
  }
}

export function checkPlayerHits(e: Enemy, p: Player, particles: Particle[]) {
  const dxReal = e.x - p.x; const dx = Math.abs(dxReal); const dy = Math.abs(e.y - p.y);
  const isFacing = (p.dir === 'right' && dxReal >= 0) || (p.dir === 'left' && dxReal <= 0);
  const pf = PUNCH_DURATION - p.atkTimer;
  if (p.attacking && pf >= PUNCH_ACTIVE[0] && pf <= PUNCH_ACTIVE[1] && dx < PUNCH_RANGE && dy < PUNCH_DEPTH && isFacing && p.z < 30 && !e.hitThisSwing) {
    e.hitThisSwing = true; e.hp -= PUNCH_DAMAGE; e.hurt = true; e.hurtTimer = 10;
    p.combo++; p.comboTimer = COMBO_TIMEOUT; playSFX('hit');
    spawnParticles(particles, 5, e.x, e.y - 30, '#f1c40f', 'spark');
  }
  if (p.buffing && p.buffTimer < (BUFA_DURATION - BUFA_ACTIVE_START) && dx < BUFA_RANGE * BUFA_HITBOX_SCALE && dy < BUFA_DEPTH * BUFA_HITBOX_SCALE && isFacing && p.z < 30 && !e.hitThisSwing) {
    e.hitThisSwing = true; e.hp -= BUFA_DAMAGE_NORMAL; e.hurt = true; e.hurtTimer = 15;
    p.combo++; p.comboTimer = COMBO_TIMEOUT;
    spawnParticles(particles, 8, e.x, e.y - 30, '#2ecc71', 'smoke');
  }
  return e.hp <= 0;
}

export function updateBasicEnemyAI(e: Enemy, p: Player): 'dead' | 'alive' {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.sqrt(dx * dx + dy * dy);
  if (e.punchTimer > 0) e.punchTimer--;
  if (d > 45) { e.x += Math.sign(dx) * ENEMY_SPEED; e.y += Math.sign(dy) * ENEMY_SPEED * 0.5; e.walking = true; } else { e.walking = false; }
  e.dir = dx > 0 ? 'right' : 'left';
  if (d < 45 && p.invincible <= 0 && e.atkCd <= 0 && p.z < 20) {
    e.punchTimer = 18; e.atkCd = 60; p.hp = Math.max(0, p.hp - 10); p.hurt = true; p.hurtTimer = 20; p.invincible = 30;
    if (p.hp <= 0) return 'dead';
  }
  if (e.atkCd > 0) e.atkCd--;
  return 'alive';
}

export function updateSukaAI(e: Enemy, p: Player, _dav: Davisaum, _particles: Particle[], _texts: FloatingTextData[], _f: number, screenShakeRef: React.MutableRefObject<number>): 'dead' | 'alive' {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.sqrt(dx * dx + dy * dy);
  if (e.punchTimer > 0) e.punchTimer--;
  if (e.stateTimer > 0) {
    e.stateTimer--; 
    if (e.stateTimer === 1 && d < 70 && p.invincible <= 0 && p.z < 20) {
      e.punchTimer = 20; p.hp = Math.max(0, p.hp - 20); p.hurt = true; p.hurtTimer = 20; p.invincible = 30; screenShakeRef.current = 10;
      if (p.hp <= 0) return 'dead';
    }
  } else if (d < 70 && e.atkCd <= 0) { e.stateTimer = 40; e.atkCd = 120; e.walking = false; 
  } else { e.walking = true; e.x += Math.sign(dx) * ENEMY_SPEED * 0.6; e.y += Math.sign(dy) * ENEMY_SPEED * 0.4; }
  if (e.atkCd > 0) e.atkCd--;
  e.dir = dx > 0 ? 'right' : 'left';
  return 'alive';
}

export function updateFurioAI(e: Enemy, p: Player, _dav: Davisaum, _particles: Particle[], _texts: FloatingTextData[], _f: number, screenShakeRef: React.MutableRefObject<number>): 'dead' | 'alive' {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.sqrt(dx * dx + dy * dy);
  if (e.punchTimer > 0) e.punchTimer--;
  if (e.charging) {
    e.x += (e.chargeDir || 0) * 6; e.stateTimer--;
    if (d < 70 && p.invincible <= 0 && p.z < 20) {
      e.punchTimer = 20; p.hp = Math.max(0, p.hp - 25); p.hurt = true; p.hurtTimer = 20; p.invincible = 40; screenShakeRef.current = 15;
      if (p.hp <= 0) return 'dead';
    }
    if (e.stateTimer <= 0) e.charging = false;
  } else if (d < 200 && e.atkCd <= 0) {
    e.charging = true; e.chargeDir = Math.sign(dx); e.stateTimer = 40; e.atkCd = 100; e.walking = false;
  } else { e.walking = true; e.x += Math.sign(dx) * ENEMY_SPEED * 0.7; e.y += Math.sign(dy) * ENEMY_SPEED * 0.5; }
  if (e.atkCd > 0) e.atkCd--;
  e.dir = dx > 0 ? 'right' : 'left';
  return 'alive';
}

export function useGameEngine(cfg: EnginePhaseConfig) {
  const cfgRef = useRef(cfg);
  const playerRef = useRef<Player>({ ...DEFAULT_PLAYER, hp: cfg.initialHp });
  const enemiesRef = useRef<Enemy[]>([]);
  const foodRef = useRef<FoodItem[]>([]);
  const textsRef = useRef<FloatingTextData[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const davisRef = useRef<Davisaum>({ ...DEFAULT_DAVIS });
  const keysRef = useRef<Record<string, boolean>>({});
  const frameRef = useRef(0);
  const accumulatorRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const spawnTimerRef = useRef(0);
  const cameraRef = useRef(0);
  const bossSpawned = useRef(false);
  const screenShakeRef = useRef(0);
  const scoreRef = useRef(cfg.initialScore);
  
  const [score, setScore] = useState(cfg.initialScore);
  const [dead, setDead] = useState(false);
  const [frameTick, setFrameTick] = useState(0);

  useEffect(() => { cfgRef.current = cfg; }, [cfg]);

  useEffect(() => {
    resetUid(); cfgRef.current = cfg;
    playerRef.current = { ...DEFAULT_PLAYER, hp: cfg.initialHp };
    enemiesRef.current = []; foodRef.current = []; textsRef.current = []; particlesRef.current = [];
    davisRef.current = { ...DEFAULT_DAVIS }; keysRef.current = {}; frameRef.current = 0;
    accumulatorRef.current = 0; lastTimeRef.current = null; spawnTimerRef.current = 0;
    cameraRef.current = 0; bossSpawned.current = false; screenShakeRef.current = 0;
    scoreRef.current = cfg.initialScore; setScore(cfg.initialScore); setDead(false); setFrameTick(0);
  }, [cfg.initialHp, cfg.initialScore]);

  useEffect(() => {
    const gameplayKeys = new Set(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'a', 'd', 'w', 's', 'x', 'z', 'c']);
    const d = (e: KeyboardEvent) => { const key = e.key.toLowerCase(); if (gameplayKeys.has(key)) e.preventDefault(); keysRef.current[key] = true; };
    const u = (e: KeyboardEvent) => { const key = e.key.toLowerCase(); if (gameplayKeys.has(key)) e.preventDefault(); keysRef.current[key] = false; };
    const clearKeys = () => { keysRef.current = {}; };
    window.addEventListener('keydown', d, { passive: false });
    window.addEventListener('keyup', u, { passive: false });
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', clearKeys);
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); window.removeEventListener('blur', clearKeys); document.removeEventListener('visibilitychange', clearKeys); };
  }, []);

  useEffect(() => {
    if (dead) return;
    let animId: number;
    const FIXED_STEP = 16.666; // 60 FPS

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      let delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      if (delta > 250) delta = 250; 
      accumulatorRef.current += delta;

      const p = playerRef.current; const k = keysRef.current;
      const dav = davisRef.current; const enemies = enemiesRef.current;
      const particles = particlesRef.current; const texts = textsRef.current;

      let physicsUpdated = false;

      while (accumulatorRef.current >= FIXED_STEP) {
        const f = frameRef.current;
        if (p.hitstop > 0) { 
          p.hitstop--; 
        } else {
          updateIdleEating(p, k, particles, texts, f);
          updatePlayerMovement(p, k); clampEntityY(p);
          updatePlayerJump(p, k, particles);
          if (p.buffing && f % 2 === 0) spawnCelestialSmoke(particles, p.x, p.y - 10);

          cameraRef.current += (clamp(p.x - BASE_W / 2, 0, WORLD_W - BASE_W) - cameraRef.current) * 0.07;
          updatePlayerAttacks(p, k, enemies, screenShakeRef);
          updateDavisAI(dav, p, enemies, foodRef.current, f); clampEntityY(dav);

          for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.hurtTimer > 0) { e.hurtTimer--; if (e.hurtTimer <= 0) e.hurt = false; clampEntityY(e); continue; }
            let stateResult: 'dead' | 'alive' = 'alive';
            if (e.type === 'suka') stateResult = updateSukaAI(e, p, dav, particles, texts, f, screenShakeRef);
            else if (e.type === 'furio') stateResult = updateFurioAI(e, p, dav, particles, texts, f, screenShakeRef);
            else stateResult = updateBasicEnemyAI(e, p);
            clampEntityY(e);
            if (stateResult === 'dead') { setDead(true); cfgRef.current.onGameOver(scoreRef.current); return; }
            if (checkPlayerHits(e, p, particles)) {
              enemies.splice(i, 1); scoreRef.current += 100; setScore(scoreRef.current);
              if (e.type === cfgRef.current.bossType) cfgRef.current.onComplete(scoreRef.current, p.hp);
            }
          }

          updateItems(foodRef.current, p);

          if (scoreRef.current >= cfgRef.current.bossThreshold && !bossSpawned.current) {
            bossSpawned.current = true;
            enemies.push(createEnemy(cfgRef.current.bossType, p.x + 400, p.y, cfgRef.current.bossHp));
          } else {
            spawnTimerRef.current++;
            if (spawnTimerRef.current > cfgRef.current.spawnIntervalMs / 16 && enemies.length < MAX_ENEMIES) {
              spawnTimerRef.current = 0;
              const enemyType = cfgRef.current.getNormalEnemyType();
              enemies.push(createEnemy(enemyType, p.x + 500, rng(FLOOR_MIN, FLOOR_MAX), cfgRef.current.getNormalEnemyHp(enemyType)));
            }
          }

          if (screenShakeRef.current > 0) screenShakeRef.current *= 0.9;
          updateParticlesAndTexts(particles, texts, f);
        }
        frameRef.current++;
        accumulatorRef.current -= FIXED_STEP;
        physicsUpdated = true;
      }

      if (physicsUpdated) setFrameTick(frameRef.current);
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

// ─────────────────────────────────────────────────────
//  UI - TOUCH CONTROLS (MEMOIZADOS)
// ─────────────────────────────────────────────────────
export const TouchDpad = React.memo(function TouchDpad({ keysRef }: any) {
  const h = (k: string) => ({
    onPointerDown: (e: any) => { e.preventDefault(); e.stopPropagation(); e.target.setPointerCapture(e.pointerId); keysRef.current[k] = true; },
    onPointerUp: (e: any) => { e.preventDefault(); keysRef.current[k] = false; },
    onPointerLeave: (e: any) => { e.preventDefault(); keysRef.current[k] = false; },
    onPointerCancel: (e: any) => { e.preventDefault(); keysRef.current[k] = false; },
  });
  const S: React.CSSProperties = { width: 45, height: 45, background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 18, touchAction: 'none' };
  return (
    <div style={{ position: 'absolute', bottom: 15, left: 15, zIndex: 10020, display: 'grid', gridTemplateColumns: 'repeat(3, 45px)', gap: 6 }}>
      <div /><div style={S} {...h('arrowup')}>▲</div><div />
      <div style={S} {...h('arrowleft')}>◀</div><div /><div style={S} {...h('arrowright')}>▶</div>
      <div /><div style={S} {...h('arrowdown')}>▼</div><div />
    </div>
  );
});

export const TouchActions = React.memo(function TouchActions({ keysRef }: any) {
  const h = (k: string) => ({
    onPointerDown: (e: any) => { e.preventDefault(); e.stopPropagation(); e.target.setPointerCapture(e.pointerId); keysRef.current[k] = true; },
    onPointerUp: (e: any) => { e.preventDefault(); keysRef.current[k] = false; },
    onPointerLeave: (e: any) => { e.preventDefault(); keysRef.current[k] = false; },
  });
  const C = (color: string): React.CSSProperties => ({ width: 60, height: 60, background: `${color}1A`, border: `2px solid ${color}80`, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: color, touchAction: 'none', position: 'absolute' });
  return (
    <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10020, width: 130, height: 120 }}>
      <div style={{ ...C('#3498db'), top: 0, left: 35 }} {...h('z')}><span style={{ fontSize: 11, fontWeight: 'bold' }}>PULO</span></div>
      <div style={{ ...C('#e74c3c'), bottom: 0, left: 0 }} {...h('x')}><span style={{ fontSize: 18, marginBottom: -2 }}>👊</span><span style={{ fontSize: 8, fontWeight: 'bold' }}>SOCO</span></div>
      <div style={{ ...C('#2ecc71'), bottom: 0, right: 0 }} {...h('c')}><span style={{ fontSize: 18, marginBottom: -2 }}>💨</span><span style={{ fontSize: 8, fontWeight: 'bold' }}>BUFA</span></div>
    </div>
  );
});

function createEnemy(type: EnemyType, x: number, y: number, hp: number): Enemy {
  return { id: uid(), type, x, y: clampLevelY(y), z: 0, hp, maxHp: hp, dir: 'left', walking: true, hurt: false, hurtTimer: 0, kbx: 0, kby: 0, atkCd: 0, stateTimer: 0, punchTimer: 0, hitThisSwing: false };
}
