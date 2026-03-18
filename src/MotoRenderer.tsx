// ═══════════════════════════════════════════════════════
//  MotoRenderer.tsx — Renderizador Visual da Fase 3½
//
//  Usa sprites Base64 (spritesMoto.ts) e cenários Base64
//  (cenarioMoto.ts) em vez de CSS puro.
//
//  Cenário: imagem da cidade em scroll loop contínuo.
//  Ao completar a fase, troca para imagem da montanha.
//
//  ✅ FIX: LANE_Y substituído por lanePositions (prop)
// ═══════════════════════════════════════════════════════
import React, { useMemo } from 'react';
import type {
  MotoState, RoadObstacle, RoadItem, RoadObstacleType, RoadItemType,
  Particle, FloatingTextData, MutableRef,
} from './types';
import { BASE_W, BASE_H, MAX_HP } from './constants';
import { rng } from './utils';
import {
  CENARIO_CIDADE, CENARIO_MONTANHA,
  BG_SCROLL_SPEED, BG_FALLBACK_COLOR,
} from './cenarioMoto';
import {
  getMotoSprite, getObstacleSprite, getItemSprite,
  MOTO_SPRITE_SIZE, OBSTACLE_SIZES, ITEM_SIZES,
} from './spritesMoto';

// ─────────────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────────────
interface MotoRendererProps {
  moto: MotoState;
  obstacles: RoadObstacle[];
  items: RoadItem[];
  particles: Particle[];
  texts: FloatingTextData[];
  keysRef: MutableRef<Record<string, boolean>>;
  frame: number;
  score: number;
  act: 1 | 2 | 3;
  shake: number;
  laneY: number;
  jumpZ: number;
  motoX: number;
  lanePositions: number[];
  muted: boolean;
  onToggleMute: () => void;
  /** true quando a fase completou (exibir cenário montanha) */
  phaseComplete?: boolean;
}

// ─────────────────────────────────────────────────────
//  Componente: Background scrolling
// ─────────────────────────────────────────────────────
const ScrollingBackground = React.memo(function ScrollingBackground({
  frame, speed, phaseComplete,
}: {
  frame: number; speed: number; phaseComplete: boolean;
}) {
  const bgSrc = phaseComplete ? CENARIO_MONTANHA : CENARIO_CIDADE;
  const hasBg = bgSrc.length > 0;

  // Scroll horizontal contínuo (só no cenário cidade)
  const scrollX = phaseComplete ? 0 : -(frame * speed * BG_SCROLL_SPEED);

  if (!hasBg) {
    // Fallback: cor sólida + linhas da estrada (quando base64 não preenchido)
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: BG_FALLBACK_COLOR,
      }}>
        {/* Estrada básica fallback */}
        <div style={{
          position: 'absolute', top: '35%', left: 0, right: 0, bottom: 0,
          background: '#444',
        }} />
        {/* Linhas tracejadas scrollando */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const baseX = i * 120;
          const x = ((baseX + scrollX) % 960 + 960) % 960 - 60;
          return (
            <div key={`fline${i}`} style={{
              position: 'absolute',
              left: x, top: '55%',
              width: 40, height: 4,
              background: '#c8c832',
              borderRadius: 2, opacity: 0.5,
              zIndex: 1,
            }} />
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {phaseComplete ? (
        // Cenário montanha estático
        <img
          src={bgSrc}
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        // Cenário cidade em loop (duas cópias lado a lado pra scroll contínuo)
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          display: 'flex', flexDirection: 'row',
          transform: `translateX(${scrollX % BASE_W}px)`,
          willChange: 'transform',
        }}>
          <img src={bgSrc} alt="" style={{ width: BASE_W, height: '100%', objectFit: 'cover', flexShrink: 0 }} />
          <img src={bgSrc} alt="" style={{ width: BASE_W, height: '100%', objectFit: 'cover', flexShrink: 0 }} />
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  Componente: Sprite da Moto (img base64)
// ─────────────────────────────────────────────────────
const MotoBike = React.memo(function MotoBike({
  punching, jumping, jumpZ, turboActive, shieldActive, invincible, frame,
}: {
  punching: boolean; jumping: boolean; jumpZ: number;
  turboActive: boolean; shieldActive: boolean; invincible: number; frame: number;
}) {
  const bounce = Math.sin(frame * 0.15) * 1.5;
  const opacity = invincible > 0 ? (frame % 6 < 3 ? 0.4 : 1) : 1;
  const sprite = getMotoSprite({ punching, jumping, turboActive, shieldActive });
  const hasSprite = sprite.length > 0;

  return (
    <div style={{
      width: MOTO_SPRITE_SIZE.width,
      height: MOTO_SPRITE_SIZE.height,
      position: 'relative',
      opacity,
      animation: jumping ? 'none' : 'motoBounce 0.3s infinite ease-in-out',
      transform: jumping ? `translateY(${-jumpZ}px)` : `translateY(${bounce}px)`,
    }}>
      {hasSprite ? (
        <img
          src={sprite}
          alt=""
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        // Fallback CSS mínimo caso base64 não preenchido
        <div style={{
          width: '100%', height: '100%',
          background: '#2c3e50',
          borderRadius: '8px 16px 4px 4px',
          border: '2px solid #bdc3c7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 8, color: '#fff', fontFamily: 'monospace' }}>MOTO</span>
        </div>
      )}

      {/* Efeito de escudo (overlay sobre o sprite) */}
      {shieldActive && (
        <div style={{
          position: 'absolute', inset: -8,
          borderRadius: '50%',
          border: '2px solid rgba(52,152,219,0.6)',
          background: 'rgba(52,152,219,0.1)',
          animation: 'pulse 0.8s infinite alternate',
          pointerEvents: 'none',
        }} />
      )}

      {/* Efeito turbo - chamas (overlay sobre o sprite) */}
      {turboActive && (
        <div style={{
          position: 'absolute', left: -18, bottom: 12,
          width: 20, height: 8,
          background: 'linear-gradient(90deg, #ff4400, #ff8800, #ffcc00)',
          borderRadius: '4px 0 0 4px',
          filter: 'blur(1px)',
          animation: 'pulse 0.15s infinite alternate',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  Componente: Obstáculo (img base64)
// ─────────────────────────────────────────────────────
const ObstacleComp = React.memo(function ObstacleComp({
  type, frame,
}: {
  type: RoadObstacleType; frame: number;
}) {
  const sprite = getObstacleSprite(type);
  const size = OBSTACLE_SIZES[type] ?? { width: 40, height: 40 };
  const hasSprite = sprite.length > 0;

  // Gás tem pulsação extra
  const gasStyle = type === 'gas' ? {
    filter: 'blur(1px)',
    opacity: 0.7 + Math.sin(frame * 0.12) * 0.15,
  } : {};

  if (!hasSprite) {
    // Fallback mínimo por tipo
    const fallbackColors: Record<string, string> = {
      zumbi: '#6abf69',
      carro: '#8b4513',
      gas: 'rgba(100,255,100,0.3)',
      buraco: '#1a1a1a',
      zumbi_corredor: '#4a9a49',
      barreira: '#e74c3c',
    };
    return (
      <div style={{
        width: size.width, height: size.height,
        background: fallbackColors[type] ?? '#888',
        borderRadius: type === 'buraco' ? '50%' : 4,
        border: '1px solid rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...gasStyle,
      }}>
        <span style={{ fontSize: 6, color: '#fff', fontFamily: 'monospace', textTransform: 'uppercase' }}>
          {type.slice(0, 4)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={sprite}
      alt=""
      style={{
        width: size.width,
        height: size.height,
        objectFit: 'contain',
        imageRendering: 'pixelated',
        ...gasStyle,
      }}
    />
  );
});

// ─────────────────────────────────────────────────────
//  Componente: Item coletável (img base64)
// ─────────────────────────────────────────────────────
const ItemComp = React.memo(function ItemComp({
  type, frame,
}: {
  type: RoadItemType; frame: number;
}) {
  const sprite = getItemSprite(type);
  const size = ITEM_SIZES[type] ?? { width: 22, height: 22 };
  const floatY = Math.sin(frame * 0.1) * 4;
  const hasSprite = sprite.length > 0;

  if (!hasSprite) {
    const labels: Record<string, string> = { burger: '🍔', turbo: '⚡', escudo: '🛡' };
    return (
      <div style={{
        width: size.width, height: size.height,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `translateY(${floatY}px)`,
        fontSize: 12,
      }}>
        {labels[type] ?? '?'}
      </div>
    );
  }

  return (
    <img
      src={sprite}
      alt=""
      style={{
        width: size.width,
        height: size.height,
        objectFit: 'contain',
        imageRendering: 'pixelated',
        transform: `translateY(${floatY}px)`,
      }}
    />
  );
});

// ─────────────────────────────────────────────────────
//  Componente: Faróis da moto (efeito de luz)
// ─────────────────────────────────────────────────────
const HeadlightEffect = React.memo(function HeadlightEffect({
  motoX, laneY, act,
}: {
  motoX: number; laneY: number; act: 1 | 2 | 3;
}) {
  // Faróis só em atos 2 e 3 (escurecendo)
  if (act < 2) return null;
  return (
    <div style={{
      position: 'absolute',
      left: motoX + 40, top: laneY - 60,
      width: 300, height: 120,
      background: 'radial-gradient(ellipse at left center, rgba(241,196,15,0.08) 0%, transparent 70%)',
      pointerEvents: 'none',
      zIndex: 5,
    }} />
  );
});

// ─────────────────────────────────────────────────────
//  Componente: HUD da Moto
// ─────────────────────────────────────────────────────
const MotoHUD = React.memo(function MotoHUD({
  hp, distance, score, act, muted, onToggleMute,
}: {
  hp: number; distance: number; score: number;
  act: 1 | 2 | 3; muted: boolean; onToggleMute: () => void;
}) {
  const hpPct = Math.max(0, hp / MAX_HP);
  const hpColor = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
  const actLabel = act === 1
    ? 'SAÍDA DA CIDADE'
    : act === 2
      ? 'ESTRADA ABERTA'
      : 'SUBIDA DA MONTANHA';

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      padding: '6px 10px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      zIndex: 9999, pointerEvents: 'none',
      fontFamily: '"Press Start 2P", monospace, system-ui',
    }}>
      {/* HP */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 6, color: '#fff', textShadow: '1px 1px 0 #000' }}>HP</span>
        <div style={{
          width: 80, height: 8, background: '#333', borderRadius: 4,
          border: '1px solid #555', overflow: 'hidden',
        }}>
          <div style={{
            width: `${hpPct * 100}%`, height: '100%',
            background: hpColor, borderRadius: 4,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Ato */}
      <div style={{
        fontSize: 7, color: '#f1c40f',
        textShadow: '1px 1px 0 #000',
      }}>
        {actLabel}
      </div>

      {/* Score + Mute */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 7, color: '#fff', textShadow: '1px 1px 0 #000' }}>
          {score.toString().padStart(6, '0')}
        </span>
        <div
          onClick={onToggleMute}
          style={{
            fontSize: 14, cursor: 'pointer',
            pointerEvents: 'auto', userSelect: 'none',
            filter: muted ? 'grayscale(1)' : 'none',
          }}
        >
          {muted ? '🔇' : '🔊'}
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  Componente: Touch Controls
// ─────────────────────────────────────────────────────
const MotoTouchControls = React.memo(function MotoTouchControls({
  keysRef,
}: {
  keysRef: MutableRef<Record<string, boolean>>;
}) {
  const press = (key: string) => {
    keysRef.current[key] = true;
    setTimeout(() => { keysRef.current[key] = false; }, 120);
  };

  const btnStyle = (size: number): React.CSSProperties => ({
    width: size, height: size,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.35,
    fontWeight: 900,
    color: 'rgba(255,255,255,0.7)',
    border: '2px solid rgba(255,255,255,0.15)',
    userSelect: 'none',
    cursor: 'pointer',
    fontFamily: '"Press Start 2P", monospace, system-ui',
    WebkitTapHighlightColor: 'transparent',
  });

  return (
    <>
      {/* D-Pad: ↑ ↓ (esquerda) */}
      <div style={{
        position: 'absolute', bottom: 20, left: 16, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div
          style={{ ...btnStyle(50), background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }}
          onTouchStart={() => press('arrowup')}
          onMouseDown={() => press('arrowup')}
        >▲</div>
        <div
          style={{ ...btnStyle(50), background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }}
          onTouchStart={() => press('arrowdown')}
          onMouseDown={() => press('arrowdown')}
        >▼</div>
      </div>

      {/* Ações: Z pular, X soco (direita) */}
      <div style={{
        position: 'absolute', bottom: 20, right: 16, zIndex: 9999,
        display: 'flex', gap: 10,
      }}>
        <div
          style={{ ...btnStyle(50), background: 'rgba(46,204,113,0.2)', borderColor: 'rgba(46,204,113,0.4)' }}
          onTouchStart={() => press('z')}
          onMouseDown={() => press('z')}
        >Z</div>
        <div
          style={{ ...btnStyle(50), background: 'rgba(231,76,60,0.2)', borderColor: 'rgba(231,76,60,0.4)' }}
          onTouchStart={() => press('x')}
          onMouseDown={() => press('x')}
        >X</div>
      </div>
    </>
  );
});

// ═════════════════════════════════════════════════════
//  RENDERER PRINCIPAL
// ═════════════════════════════════════════════════════
export default function MotoRenderer({
  moto, obstacles, items, particles, texts, keysRef,
  frame, score, act, shake, laneY, jumpZ, motoX, lanePositions,
  muted, onToggleMute, phaseComplete = false,
}: MotoRendererProps) {
  const shakeX = shake > 0 ? rng(-shake, shake) : 0;
  const shakeY = shake > 0 ? rng(-shake * 0.5, shake * 0.5) : 0;

  return (
    <>
      <div style={{
        position: 'absolute', inset: -4,
        transform: `translate3d(${shakeX}px, ${shakeY}px, 0)`,
      }}>
        {/* ── Background scrolling ── */}
        <ScrollingBackground
          frame={frame}
          speed={moto.speed}
          phaseComplete={phaseComplete}
        />

        {/* ── Faixas visuais (indicadores sutis) ── */}
        {lanePositions.map((ly, i) => (
          <div key={`lane${i}`} style={{
            position: 'absolute', left: 0, right: 0,
            top: ly, height: 1,
            background: moto.lane === i
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(255,255,255,0.02)',
            zIndex: 3,
          }} />
        ))}

        {/* ── Faróis ── */}
        <HeadlightEffect motoX={motoX} laneY={laneY} act={act} />

        {/* ── Obstáculos ── */}
        {obstacles.map(obs => {
          if (obs.x < -80 || obs.x > BASE_W + 80) return null;
          if (obs.hit && obs.type !== 'gas') return null;
          const obsY = obs.type === 'barreira'
            ? lanePositions[1]
            : lanePositions[obs.lane];
          const dim = OBSTACLE_SIZES[obs.type] ?? { width: 40, height: 40 };

          return (
            <div key={obs.id} style={{
              position: 'absolute',
              left: obs.x - dim.width / 2,
              top: obsY - dim.height + 10,
              zIndex: 6 + Math.floor(obsY),
            }}>
              <ObstacleComp type={obs.type} frame={frame} />
            </div>
          );
        })}

        {/* ── Itens ── */}
        {items.map(item => {
          if (item.x < -40 || item.x > BASE_W + 40) return null;
          if (item.collected) return null;
          const dim = ITEM_SIZES[item.type] ?? { width: 22, height: 22 };
          const itemY = lanePositions[item.lane];
          return (
            <div key={item.id} style={{
              position: 'absolute',
              left: item.x - dim.width / 2,
              top: itemY - dim.height - 5,
              zIndex: 7 + Math.floor(itemY),
            }}>
              <ItemComp type={item.type} frame={frame} />
            </div>
          );
        })}

        {/* ── MOTO ── */}
        <div style={{
          position: 'absolute',
          left: motoX - MOTO_SPRITE_SIZE.width / 2,
          top: laneY - MOTO_SPRITE_SIZE.height - 5,
          zIndex: 8 + Math.floor(laneY),
        }}>
          <MotoBike
            punching={moto.punching}
            jumping={moto.jumping}
            jumpZ={jumpZ}
            turboActive={moto.turboActive}
            shieldActive={moto.shieldActive}
            invincible={moto.invincible}
            frame={frame}
          />
        </div>

        {/* ── Partículas ── */}
        {particles.map(pt => {
          const op = Math.max(0, pt.life / pt.maxLife);
          return (
            <div key={pt.id} style={{
              position: 'absolute',
              left: pt.x - pt.size / 2,
              top: pt.y - pt.size / 2,
              width: pt.size, height: pt.size,
              borderRadius: pt.type === 'ring' ? '50%' : pt.type === 'gas' ? '50%' : '2px',
              background: pt.type === 'ring' ? 'transparent' : pt.color,
              border: pt.type === 'ring' ? `2px solid ${pt.color}` : 'none',
              opacity: op,
              filter: pt.type === 'gas' ? `blur(${3 - op * 2}px)` : 'none',
              transform: `scale(${pt.type === 'ring' ? 1 + (1 - op) * 2 : 1})`,
              pointerEvents: 'none',
              zIndex: 10,
            }} />
          );
        })}

        {/* ── Textos flutuantes ── */}
        {texts.map(ft => {
          const age = frame - ft.t;
          const op = Math.max(0, 1 - age / 80);
          const rise = age * 0.5;
          return (
            <div key={ft.id} style={{
              position: 'absolute',
              left: ft.x - 40,
              top: ft.y - rise,
              fontSize: ft.size,
              color: ft.color,
              fontWeight: 900,
              textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 2px 2px 4px rgba(0,0,0,0.5)',
              opacity: op,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 20,
              fontFamily: '"Press Start 2P", monospace, system-ui',
            }}>
              {ft.text}
            </div>
          );
        })}

        {/* ── Escurecimento progressivo por ato ── */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(0,0,0,${act === 1 ? 0.05 : act === 2 ? 0.08 : 0.12})`,
          pointerEvents: 'none',
          zIndex: 11,
        }} />
      </div>

      {/* ── Efeito CRT ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9990,
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)',
        mixBlendMode: 'multiply',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9991,
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
      }} />

      {/* ── HUD ── */}
      <MotoHUD
        hp={moto.hp} distance={moto.distance}
        score={score} act={act}
        muted={muted} onToggleMute={onToggleMute}
      />

      {/* ── Touch Controls ── */}
      <MotoTouchControls keysRef={keysRef} />

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes motoBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes motoPunch {
          0% { transform: translateX(0); }
          30% { transform: translateX(15px); }
          100% { transform: translateX(0); }
        }
        @keyframes pulse {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
