// ═══════════════════════════════════════════════════════
//  components.tsx — Componentes Visuais de Sprites
// ═══════════════════════════════════════════════════════
import React from 'react';
import type { EnemyType, Particle } from './types';
import {
  SPRITE_PLAYER_W, SPRITE_PLAYER_H, SPRITE_DAVIS_W, LAND_SQUASH_FRAMES,
  BASE_W, isBossType,
} from './constants';
import { clamp, rng } from './utils';
import { WALLACAUM_SPRITES, DAVISAUM_SPRITES, INIMIGOS_SPRITES } from './sprites';
import { FASE2_SPRITES } from './spritesFase2';
import { BUFA_SPRITES } from './BufaSprites';

// ─────────────────────────────────────────────────────
//  Sprite helper (retorna imagem base64 do inimigo)
// ─────────────────────────────────────────────────────
function getEnemySprite(
  type: EnemyType, isWalking: boolean, isPunching: boolean, isShouting: boolean,
  isSuper = false, isCharging = false
): string {
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
  // standard
  if (isPunching) return INIMIGOS_SPRITES.capanga_loiro_socando;
  if (isWalking) return Math.floor(Date.now() / 200) % 2 === 0 ? INIMIGOS_SPRITES.capanga_loiro_andando : INIMIGOS_SPRITES.capanga_loiro_parado;
  return INIMIGOS_SPRITES.capanga_loiro_parado;
}

// ─────────────────────────────────────────────────────
//  PixelWallacaum
// ─────────────────────────────────────────────────────
export const PixelWallacaum = React.memo(function PixelWallacaum({ direction, isWalking, isAttacking, isBuffa, isHurt, isEating, jumpZ, landSquash, combo, buffTimer = 0 }: {
  direction: string; isWalking: boolean; isAttacking: boolean; isBuffa: boolean; isHurt: boolean; isEating: boolean;
  jumpZ: number; landSquash: number; combo: number; buffTimer?: number;
}) {
  const flip = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';

  let spr = WALLACAUM_SPRITES.parado;
  if (isHurt) spr = WALLACAUM_SPRITES.dor;
  else if (isBuffa) spr = WALLACAUM_SPRITES.bufa;
  else if (isAttacking) spr = WALLACAUM_SPRITES.soco;
  else if (jumpZ > 0) spr = WALLACAUM_SPRITES.pulando;
  else if (isWalking) spr = Math.floor(Date.now() / 140) % 2 === 0 ? WALLACAUM_SPRITES.walk1 : WALLACAUM_SPRITES.walk2;
  else if (isEating) spr = WALLACAUM_SPRITES.comendo;

  let bufaEffectSpr: string | null = null;
  if (isBuffa) {
    if (buffTimer > 42) bufaEffectSpr = BUFA_SPRITES.INICIO;
    else if (buffTimer > 28) bufaEffectSpr = BUFA_SPRITES.MEIO;
    else if (buffTimer > 10) bufaEffectSpr = BUFA_SPRITES.FIM;
  }

  let sx = 1, sy = 1;
  if (jumpZ > 8) { sx = 0.92; sy = 1.08; }
  else if (landSquash > 0) { const t = landSquash / LAND_SQUASH_FRAMES; sx = 1 + t * 0.12; sy = 1 - t * 0.1; }

  const flt = isHurt ? 'drop-shadow(0 0 12px rgba(255,50,50,0.9)) brightness(1.8) sepia(1) hue-rotate(-50deg) saturate(4)' : 'drop-shadow(2px 3px 0px rgba(0,0,0,0.55))';
  const shS = clamp(1 - jumpZ / 120, 0.3, 1);
  const shO = clamp(0.5 - jumpZ / 200, 0.1, 0.5);
  const eatBob = isEating ? Math.sin(Date.now() * 0.008) * 2 : 0;

  // ── Cálculos do efeito de fumaça da bufa ──
  const maxT = 50;
  const progress = isBuffa ? 1 - (buffTimer / maxT) : 0;
  const smokeScale = 0.4 + progress * 1.2;
  const smokeOpacity = progress < 0.3 ? progress * 3 : progress > 0.7 ? (1 - progress) * 2.5 : 0.85;
  const smokeBlur = progress < 0.3 ? 1 : 2 + progress * 4;
  const smokeRotate = Math.sin(Date.now() * 0.005) * (5 + progress * 10);
  const driftX = Math.sin(Date.now() * 0.003) * (3 + progress * 8);

  return (
    <div style={{ transform: `${flip} scaleX(${sx}) scaleY(${sy})`, transformOrigin: 'bottom center', position: 'relative', width: SPRITE_PLAYER_W, height: SPRITE_PLAYER_H, transition: 'transform 0.04s' }}>

      {/* ── Névoa CSS atrás do personagem (4 camadas) ── */}
      {isBuffa && <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: -20, width: 210, height: 180, pointerEvents: 'none', zIndex: -1 }}>
        {/* Camada 1: névoa base que se espalha no chão */}
        <div style={{ position: 'absolute', left: 10, bottom: 5, width: 190, height: 60, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(46,204,113,0.35) 0%, rgba(0,206,209,0.15) 50%, transparent 80%)', filter: 'blur(10px)', animation: 'smokeDrift 0.8s infinite ease-in-out' }} />
        {/* Camada 2: nuvem principal subindo */}
        <div style={{ position: 'absolute', left: 30, bottom: 15, width: 140, height: 100, borderRadius: '60% 40% 50% 60%', background: 'radial-gradient(ellipse, rgba(80,220,160,0.4) 0%, rgba(0,206,209,0.2) 40%, transparent 70%)', filter: 'blur(8px)', animation: 'smokeExpand 0.7s infinite ease-out' }} />
        {/* Camada 3: névoa alta dissipando */}
        <div style={{ position: 'absolute', left: 20, bottom: 30, width: 160, height: 80, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(135,206,235,0.2) 0%, rgba(46,204,113,0.1) 40%, transparent 70%)', filter: 'blur(14px)', animation: 'smokeFade 1s infinite ease-out' }} />
        {/* Camada 4: brilho central pulsante */}
        <div style={{ position: 'absolute', left: 60, bottom: 10, width: 80, height: 50, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(72,209,204,0.45) 0%, transparent 70%)', filter: 'blur(6px)', animation: 'pulse 0.25s infinite alternate' }} />
      </div>}

      {/* ── Sprite do personagem ── */}
      <img src={spr} alt="W" style={{ position: 'absolute', left: '50%', transform: `translateX(-50%) translateY(${eatBob}px)`, bottom: 0, width: SPRITE_PLAYER_W, height: SPRITE_PLAYER_H, objectFit: 'contain', imageRendering: 'pixelated', pointerEvents: 'none', filter: flt, opacity: isHurt ? (Math.floor(Date.now() / 60) % 2 === 0 ? 0.4 : 0.9) : 1, zIndex: 2 }} />

      {/* ── Sprite da bufa com efeito de fumaça dinâmico ── */}
      {isBuffa && bufaEffectSpr && (
        <div style={{ position: 'absolute', left: '50%', bottom: '-10%', transform: 'translateX(-50%)', width: 160, height: 160, pointerEvents: 'none', zIndex: 1 }}>
          {/* Sprite principal: cresce, gira, flutua, fica turvo */}
          <img src={bufaEffectSpr} alt="Bufa" style={{
            position: 'absolute', left: '50%', bottom: 0,
            transform: `translateX(-50%) translateX(${driftX}px) scale(${smokeScale}) rotate(${smokeRotate}deg)`,
            width: 140, height: 140,
            objectFit: 'contain', imageRendering: 'pixelated',
            opacity: smokeOpacity,
            filter: `blur(${smokeBlur}px) drop-shadow(0 0 8px rgba(46,204,113,0.4))`,
            transition: 'transform 0.08s ease-out, opacity 0.1s',
            pointerEvents: 'none',
          }} />
          {/* Cópia fantasma: mais expandida e transparente, dá volume */}
          <img src={bufaEffectSpr} alt="" style={{
            position: 'absolute', left: '50%', bottom: 0,
            transform: `translateX(-50%) translateX(${-driftX * 0.6}px) scale(${smokeScale * 1.3}) rotate(${-smokeRotate * 0.5}deg)`,
            width: 140, height: 140,
            objectFit: 'contain', imageRendering: 'pixelated',
            opacity: smokeOpacity * 0.3,
            filter: `blur(${smokeBlur + 4}px)`,
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }} />
        </div>
      )}

      {/* ── Efeito de comendo ── */}
      {isEating && <>
        <div style={{ position: 'absolute', top: 30 + Math.sin(Date.now() * 0.01) * 5, right: 15, width: 4, height: 4, background: '#d4a017', borderRadius: '50%', opacity: 0.8, animation: 'crumbFall 0.8s infinite linear' }} />
        <div style={{ position: 'absolute', top: 35 + Math.cos(Date.now() * 0.012) * 4, right: 25, width: 3, height: 3, background: '#c0392b', borderRadius: '50%', opacity: 0.7, animation: 'crumbFall 1.1s 0.3s infinite linear' }} />
        <div style={{ position: 'absolute', top: 32 + Math.sin(Date.now() * 0.009) * 6, right: 8, width: 3, height: 3, background: '#27ae60', borderRadius: '50%', opacity: 0.6, animation: 'crumbFall 0.9s 0.5s infinite linear' }} />
        <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', fontSize: 18, animation: 'pulse 0.5s infinite alternate', filter: 'drop-shadow(1px 1px 0 #000)' }}>🍔</div>
      </>}

      {/* ── Textos flutuantes ── */}
      {isBuffa && <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', color: '#2ecc71', fontWeight: 900, fontSize: 11, letterSpacing: 2, textShadow: '2px 2px 0 #000, -1px -1px 0 #000', whiteSpace: 'nowrap', animation: 'pulse 0.2s infinite alternate', zIndex: 3 }}>⚡ BUFA CELESTE! ⚡</div>}
      {combo >= 3 && <div style={{ position: 'absolute', top: -45, left: '50%', transform: 'translateX(-50%)', color: combo >= 8 ? '#e74c3c' : combo >= 5 ? '#f39c12' : '#f1c40f', fontWeight: 900, fontSize: combo >= 8 ? 16 : 12, textShadow: '2px 2px 0 #000, -1px -1px 0 #000', whiteSpace: 'nowrap', animation: 'pulse 0.2s infinite alternate', zIndex: 3 }}>{combo}x COMBO!</div>}

      {/* ── Sombra no chão ── */}
      <div style={{ position: 'absolute', bottom: -6, left: '15%', width: `${70 * shS}%`, height: 10, background: `rgba(0,0,0,${shO})`, borderRadius: '50%', transform: `scaleX(${shS})`, transformOrigin: 'center' }} />
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  PixelDavisaum
// ─────────────────────────────────────────────────────
export const PixelDavisaum = React.memo(function PixelDavisaum({ direction, isWalking, isThrowing, isScared, frame }: {
  direction: string; isWalking: boolean; isThrowing: boolean; isScared: boolean; frame: number;
}) {
  const flip = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  let spr = DAVISAUM_SPRITES.parado;
  if (isScared) spr = DAVISAUM_SPRITES.medo;
  else if (isThrowing) spr = DAVISAUM_SPRITES.jogando;
  else if (isWalking) spr = Math.floor(Date.now() / 200) % 2 === 0 ? DAVISAUM_SPRITES.walk : DAVISAUM_SPRITES.parado;
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

// ─────────────────────────────────────────────────────
//  PixelAgent (inimigos)
// ─────────────────────────────────────────────────────
export const PixelAgent = React.memo(function PixelAgent({ type, direction, isWalking, punchTimer, stateTimer, frame, isHurt, hp, maxHp, charging }: {
  type: EnemyType; direction: string; isWalking: boolean; punchTimer: number; stateTimer: number;
  frame: number; isHurt: boolean; hp: number; maxHp: number; charging?: boolean;
}) {
  const flip = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  const isPunching = punchTimer > 0;
  const isShouting = stateTimer > 0;
  const hpPct = hp / maxHp;
  const isSuper = type === 'furio' && hpPct < 0.35;
  const spr = getEnemySprite(type, isWalking || !!charging, isPunching, isShouting, isSuper, !!charging);
  const sprFilter = isHurt ? 'brightness(2.5) sepia(1) hue-rotate(-50deg) saturate(4)' : '';
  const visualScale = type === 'furio' ? 1.25 : type === 'suka' ? 0.85 : 1;
  const visualBottom = type === 'furio' ? -4 : 0;
  const bob = isWalking && !isPunching && !isShouting ? Math.sin(frame * 0.3) * 2 : 0;
  const hurtSquash = isHurt ? 'scaleX(1.08) scaleY(0.92)' : '';
  const shakeX = isHurt ? rng(-3, 3) : 0;
  const hpColor = type === 'furio' ? `hsl(${hpPct * 30 + 5}, 90%, ${40 + hpPct * 15}%)` : type === 'suka' ? `hsl(${280 + hpPct * 20}, 60%, ${45 + hpPct * 15}%)` : `hsl(${hpPct * 40}, 75%, 50%)`;
  const chargeGlow = charging ? 'drop-shadow(0 0 15px rgba(255,100,0,0.8)) drop-shadow(0 0 30px rgba(255,50,0,0.4))' : '';
  const superGlow = isSuper && !isHurt ? 'drop-shadow(0 0 10px rgba(80,150,255,0.7)) drop-shadow(0 0 25px rgba(80,100,255,0.3))' : '';

  return (
    <div style={{ transform: `${flip} translateX(${shakeX}px) ${hurtSquash}`, transformOrigin: 'bottom center', transition: 'filter 0.08s', position: 'relative', width: 90, height: 95 }}>
      <div style={{ position: 'absolute', bottom: -6, left: 12, width: 56, height: 9, background: isBossType(type) ? 'rgba(100,20,120,0.4)' : 'rgba(0,0,0,0.35)', borderRadius: '50%' }} />

      {type === 'suka' && isShouting && <div style={{ position: 'absolute', bottom: 30, left: direction === 'right' ? 55 : -70, width: 90, height: 90, border: '4px solid rgba(52,152,219,0.5)', borderRadius: '50%', animation: 'sonicWave 0.3s infinite', pointerEvents: 'none' }} />}
      {type === 'furio' && isShouting && <div style={{ position: 'absolute', bottom: 30, left: direction === 'right' ? 45 : -80, width: 100, height: 100, border: '4px solid rgba(255,80,0,0.6)', borderRadius: '50%', animation: 'sonicWave 0.3s infinite', pointerEvents: 'none' }} />}
      {charging && <div style={{ position: 'absolute', bottom: 0, left: direction === 'right' ? -30 : 35, width: 60, height: 25, background: 'radial-gradient(ellipse, rgba(255,100,0,0.4), transparent)', borderRadius: '50%', filter: 'blur(4px)', animation: 'pulse 0.15s infinite alternate' }} />}

      <img src={spr} alt="E" style={{ position: 'absolute', bottom: bob + visualBottom, left: '50%', transform: `translateX(-50%) scale(${visualScale})`, transformOrigin: 'bottom center', width: 120, height: 120, objectFit: 'contain', imageRendering: 'pixelated', opacity: isHurt ? (Math.floor(Date.now() / 50) % 2 === 0 ? 0.5 : 1) : 1, filter: `${sprFilter} ${chargeGlow} ${superGlow}` }} />

      <div style={{ position: 'absolute', top: -30, left: 5, width: 70, height: 7, background: '#1a1a1a', border: '1.5px solid #333', borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
        <div style={{ width: `${hpPct * 100}%`, height: '100%', background: `linear-gradient(180deg, ${hpColor}, ${hpColor}dd)`, transition: 'width 0.2s ease-out', boxShadow: hpPct < 0.3 ? `0 0 6px ${hpColor}` : 'none' }} />
      </div>
      {type === 'suka' && <div style={{ position: 'absolute', top: -42, left: '50%', transform: 'translateX(-50%)', color: '#9b59b6', fontWeight: 900, fontSize: 8, textShadow: '1px 1px 0 #000', whiteSpace: 'nowrap' }}>SUKA BARULHENTA</div>}
      {type === 'furio' && <div style={{ position: 'absolute', top: -42, left: '50%', transform: 'translateX(-50%)', color: isSuper ? '#4488ff' : '#ff4500', fontWeight: 900, fontSize: 8, textShadow: '1px 1px 0 #000', whiteSpace: 'nowrap' }}>{isSuper ? '💀 FURIA MÁXIMA!' : '⚡ FURIO'}</div>}
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  FoodItemComp
// ─────────────────────────────────────────────────────
export const FoodItemComp = React.memo(function FoodItemComp({ type, landed }: { type: string; landed: boolean }) {
  const b = !landed ? 'translateY(-4px)' : '';
  if (type === 'burger') return <div style={{ fontSize: 24, transform: b, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))', animation: 'itemFloat 1.5s infinite ease-in-out' }}>🍔</div>;
  if (type === 'fries') return <div style={{ fontSize: 24, transform: b, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))', animation: 'itemFloat 1.8s infinite ease-in-out' }}>🍟</div>;
  if (type === 'manual') return <div style={{ width: 22, height: 26, background: 'linear-gradient(135deg, #3498db, #2980b9)', border: '2px solid #1a6fa0', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, animation: 'itemFloat 2s infinite ease-in-out' }}>📘</div>;
  if (type === 'compass') return <div style={{ width: 22, height: 22, background: 'linear-gradient(135deg, #bdc3c7, #95a5a6)', border: '2px solid #7f8c8d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, animation: 'itemFloat 1.7s infinite ease-in-out' }}>🧭</div>;
  return null;
});

// ─────────────────────────────────────────────────────
//  FloatingText
// ─────────────────────────────────────────────────────
export const FloatingText = React.memo(function FloatingText({ text, x, y, color, size = 16 }: {
  text: string; x: number; y: number; color: string; size?: number;
}) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, transform: `translate3d(${x}px, ${y}px, 0)`, pointerEvents: 'none', zIndex: 9999 }}>
      <div style={{ color, fontWeight: 900, fontSize: size, fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 0 0 8px rgba(0,0,0,0.5)', animation: 'floatUp 0.9s ease-out forwards' }}>
        {text}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  ParticleRenderer
// ─────────────────────────────────────────────────────
export const ParticleRenderer = React.memo(function ParticleRenderer({ particles, cam }: { particles: Particle[]; cam: number }) {
  return (<>{particles.map(p => {
    const alpha = p.life / p.maxLife;
    const sx = p.x - cam;
    if (sx < -20 || sx > BASE_W + 20) return null;

    if (p.type === 'ring') {
      const sc = 1 + (1 - alpha) * 2;
      return <div key={p.id} style={{ position: 'absolute', left: 0, top: 0, transform: `translate3d(${sx - 20}px, ${p.y - 20}px, 0) scale(${sc})`, width: 40, height: 40, borderRadius: '50%', border: `3px solid ${p.color}`, opacity: alpha * 0.6, pointerEvents: 'none', zIndex: 9998 }} />;
    }

    return <div key={p.id} style={{ position: 'absolute', left: 0, top: 0, transform: `translate3d(${sx - p.size / 2}px, ${p.y - p.size / 2}px, 0) ${p.type === 'spark' ? `rotate(${p.vx * 20}deg)` : ''}`, width: p.size, height: p.size, background: p.color, borderRadius: p.type === 'spark' ? '1px' : '50%', opacity: alpha, boxShadow: `0 0 ${p.size}px ${p.color}`, pointerEvents: 'none', zIndex: 9998 }} />;
  })}</>);
});
