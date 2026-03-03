import React from 'react';
// Ajuste os caminhos de importação conforme a sua estrutura atual:
import { WALLACAUM_SPRITES, DAVISAUM_SPRITES, INIMIGOS_SPRITES } from '../sprites';
import { FASE2_SPRITES } from '../spritesFase2';
import { BUFA_SPRITES } from '../BufaSprites';
// Importe as constantes e tipos do seu arquivo centralizado:
import { 
  SPRITE_PLAYER_W, SPRITE_PLAYER_H, SPRITE_DAVIS_W, 
  BUFA_PLAYER_RENDER_SCALE, BUFA_SMOKE_RENDER_SCALE, BASE_W, LAND_SQUASH_FRAMES
} from '../constants';
import type { EnemyType, Particle } from '../types';

// Função auxiliar interna
const frameToggle = (frame: number, step: number) => Math.floor(frame / step) % 2 === 0;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// --- COMPONENTES OTIMIZADOS ---

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
    <div style={{ transform: `${flip} scaleX(${sx}) scaleY(${sy})`, transformOrigin: 'bottom center', position: 'relative', width: SPRITE_PLAYER_W, height: SPRITE_PLAYER_H, transition: 'transform 0.04s' }}>
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
    <div style={{ transform: `${flip} translateX(${sk}px)`, position: 'relative', width: 90, height: SPRITE_PLAYER_H }}>
      <div style={{ position: 'absolute', bottom: -6, left: 18, width: 54, height: 9, background: 'rgba(0,0,0,0.3)', borderRadius: '50%' }} />
      {isScared && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 14, animation: 'pulse 0.3s infinite alternate' }}>😰</div>}
      <img src={spr} alt="D" style={{ position: 'absolute', bottom: bob, left: '50%', transform: 'translateX(-50%)', width: SPRITE_DAVIS_W, height: SPRITE_PLAYER_H, objectFit: 'contain', imageRendering: 'pixelated', pointerEvents: 'none' }} />
    </div>
  );
});

// Nota: A função getEnemySprite deve ser importada ou movida para cá.
// Para brevidade, omiti a implementação dela aqui, mas você precisa mantê-la.
declare function getEnemySprite(type: EnemyType, w: boolean, p: boolean, s: boolean, f: number, sup: boolean, c: boolean): string;

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
    <div style={{ transform: `${flip}`, transformOrigin: 'bottom center', position: 'relative', width: 90, height: 95 }}>
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
    
    // Culling: Se saiu da tela, o React não processa essa div/img.
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
      <div key={p.id} style={{ position: 'absolute', left: 0, top: 0, transform: `translate3d(${sx - p.size / 2}px, ${p.y - p.size / 2}px, 0) ${p.type === 'spark' ? `rotate(${p.vx * 20}deg)` : ''}`, width: p.size, height: p.size, background: p.color, borderRadius: p.type === 'spark' ? '1px' : '50%', opacity: alpha, pointerEvents: 'none', zIndex: 9998 }} />
    ); 
  })}</>);
});
