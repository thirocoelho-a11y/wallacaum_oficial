// ═══════════════════════════════════════════════════════
//  PhaseRenderer.tsx — Renderizador Unificado de Fases
//  Suporta fases 1-2 (original) e 3-5 (objetos, raios, chuva)
// ═══════════════════════════════════════════════════════
import React from 'react';
import type { EnginePhaseConfig, EnvironmentObject, LightningZone } from './types';
import { BASE_W, MAX_HP, FOOD_SIZE, SPRITE_PLAYER_W, SPRITE_PLAYER_OFFSET_Y, SPRITE_DAVIS_OFFSET_Y, SPRITE_ENEMY_OFFSET_Y, BUFA_CHARGE_TIME_FULL } from './constants';
import { rng } from './utils';
import { useGameEngine } from './useGameEngine';
import { PixelWallacaum, PixelDavisaum, PixelAgent, FoodItemComp, FloatingText, ParticleRenderer } from './components';
import { HpBar, ScoreDisplay, BossHpBar, MusicButton, PauseButton, TouchDpad, TouchActions } from './hud';
import { getFase3PropSprite, FASE3_PROP_SPRITES } from './spritesFase3';

interface PhaseRendererProps {
  engineConfig: EnginePhaseConfig;
  bgImage: string;
  phase: number;
  muted: boolean;
  onToggleMute: () => void;
  overlay?: boolean;
}

// ─────────────────────────────────────────────────────
//  Componente visual: Objeto de Ambiente
// ─────────────────────────────────────────────────────
const EnvObjectComp = React.memo(function EnvObjectComp({ obj }: { obj: EnvironmentObject }) {
  if (!obj.active && !obj.exploding) return null;

  // ── Dimensões por tipo de objeto ──
  const SIZE: Record<string, { w: number; h: number }> = {
    botijao:   { w: 40, h: 55 },
    carrinho:  { w: 60, h: 50 },
    poste:     { w: 25, h: 90 },
    placa:     { w: 50, h: 40 },
    tanque:    { w: 45, h: 65 },
    tubulacao: { w: 60, h: 25 },
  };
  const dim = SIZE[obj.type] || { w: 60, h: 60 };

  // ── Tentar sprite base64 primeiro ──
  // Override pra estados destruídos (getFase3PropSprite nem sempre detecta)
  let spriteSrc = '';
  const isDestroyed = !obj.active && obj.exploding;
  if (isDestroyed) {
    // Forçar sprite destruído
    if (obj.type === 'botijao')  spriteSrc = FASE3_PROP_SPRITES.botijao_explodindo;
    if (obj.type === 'carrinho') spriteSrc = FASE3_PROP_SPRITES.carrinho_tombado;
    if (obj.type === 'poste')    spriteSrc = FASE3_PROP_SPRITES.poste_caido;
    if (obj.type === 'placa')    spriteSrc = FASE3_PROP_SPRITES.placa_voando;
  }
  // Se não é destruído, usar seletor normal
  if (!spriteSrc) spriteSrc = getFase3PropSprite(obj);
  if (spriteSrc) {
    // Fade out gradual nos últimos 30 frames
    const fadeTimer = obj.explodeTimer || 0;
    const fadeOpacity = isDestroyed
      ? (fadeTimer > 30 ? 1 : Math.max(0.2, fadeTimer / 30))
      : 1;
    // Poste caído: rotação horizontal
    const destroyTransform = isDestroyed && obj.type === 'poste'
      ? 'rotate(85deg)' : '';
    // Botijão explodindo: scale up
    const explodeScale = obj.type === 'botijao' && isDestroyed
      ? `scale(${1 + (1 - fadeTimer / 25) * 0.5})` : '';

    return (
      <img
        src={spriteSrc}
        alt=""
        style={{
          width: dim.w, height: dim.h,
          imageRendering: 'pixelated',
          filter: (obj.type === 'botijao' && isDestroyed)
            ? 'brightness(1.8) hue-rotate(10deg)'
            : 'none',
          opacity: fadeOpacity,
          transform: `${destroyTransform} ${explodeScale}`,
          transformOrigin: 'bottom center',
          pointerEvents: 'none',
        }}
      />
    );
  }

  // ── Fallback: CSS puro (quando sprite ainda não foi preenchido) ──

  // Explosão: efeito visual
  if (obj.exploding) {
    const scale = obj.explodeTimer ? 1 + (1 - obj.explodeTimer / 30) * 0.5 : 1.5;
    const opacity = obj.explodeTimer ? obj.explodeTimer / 30 : 0;
    const color = obj.type === 'botijao' ? '#ff4400'
      : obj.type === 'tanque' ? '#44ff44'
      : 'rgba(200,200,200,0.5)';

    return (
      <div style={{
        width: 60, height: 60,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        transform: `scale(${scale})`,
        opacity,
        filter: `blur(${obj.type === 'tubulacao' ? 8 : 3}px)`,
        pointerEvents: 'none',
      }} />
    );
  }

  // Objeto intacto: visual por tipo
  switch (obj.type) {
    case 'botijao':
      return (
        <div style={{ position: 'relative', width: 30, height: 40 }}>
          {/* Cilindro vermelho */}
          <div style={{
            width: 26, height: 36, borderRadius: '4px 4px 6px 6px',
            background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
            border: '2px solid #922b21',
            boxShadow: '2px 3px 0 rgba(0,0,0,0.4)',
          }} />
          {/* Válvula */}
          <div style={{
            position: 'absolute', top: -4, left: 9,
            width: 8, height: 6, borderRadius: '2px 2px 0 0',
            background: '#95a5a6', border: '1px solid #7f8c8d',
          }} />
          {/* Label */}
          <div style={{
            position: 'absolute', top: 12, left: 4,
            fontSize: 5, color: '#fff', fontWeight: 900,
            textShadow: '0 0 2px #000', whiteSpace: 'nowrap',
          }}>PROP</div>
        </div>
      );

    case 'carrinho':
      return (
        <div style={{ position: 'relative', width: 45, height: 35 }}>
          {/* Corpo do carrinho */}
          <div style={{
            width: 40, height: 25, borderRadius: 3,
            background: 'linear-gradient(180deg, #bdc3c7, #95a5a6)',
            border: '2px solid #7f8c8d',
            boxShadow: '2px 3px 0 rgba(0,0,0,0.3)',
          }} />
          {/* Rodas */}
          <div style={{
            position: 'absolute', bottom: -4, left: 5,
            width: 8, height: 8, borderRadius: '50%',
            background: '#2c3e50', border: '1px solid #1a252f',
          }} />
          <div style={{
            position: 'absolute', bottom: -4, right: 8,
            width: 8, height: 8, borderRadius: '50%',
            background: '#2c3e50', border: '1px solid #1a252f',
          }} />
          {/* Óleo visual */}
          <div style={{
            position: 'absolute', top: 3, left: 6,
            width: 28, height: 12, borderRadius: 2,
            background: 'linear-gradient(180deg, #d4a017, #b8860b)',
            opacity: 0.7,
          }} />
        </div>
      );

    case 'poste':
      return (
        <div style={{ position: 'relative', width: 14, height: 70 }}>
          {/* Poste vertical */}
          <div style={{
            width: 8, height: 65, marginLeft: 3,
            background: 'linear-gradient(180deg, #7f8c8d, #5d6d7e)',
            borderRadius: 2,
            boxShadow: '2px 0 0 rgba(0,0,0,0.3)',
          }} />
          {/* Luminária */}
          <div style={{
            position: 'absolute', top: 0, left: -4,
            width: 22, height: 10, borderRadius: '10px 10px 2px 2px',
            background: 'linear-gradient(180deg, #f1c40f, #e67e22)',
            boxShadow: '0 0 8px rgba(241,196,15,0.5)',
          }} />
        </div>
      );

    case 'placa':
      return (
        <div style={{ position: 'relative', width: 40, height: 30 }}>
          {/* Placa */}
          <div style={{
            width: 38, height: 22, borderRadius: 2,
            background: 'linear-gradient(135deg, #e67e22, #d35400)',
            border: '2px solid #a04000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '2px 3px 0 rgba(0,0,0,0.3)',
          }}>
            <span style={{ fontSize: 6, color: '#fff', fontWeight: 900 }}>FRIED</span>
          </div>
          {/* Suporte */}
          <div style={{
            position: 'absolute', bottom: -6, left: 16,
            width: 4, height: 12,
            background: '#7f8c8d',
          }} />
        </div>
      );

    case 'tanque':
      return (
        <div style={{ position: 'relative', width: 35, height: 50 }}>
          {/* Tanque cilíndrico */}
          <div style={{
            width: 30, height: 45, borderRadius: '6px',
            background: 'linear-gradient(135deg, #27ae60, #1e8449)',
            border: '2px solid #145a32',
            boxShadow: '3px 4px 0 rgba(0,0,0,0.4)',
          }} />
          {/* Líquido brilhando */}
          <div style={{
            position: 'absolute', top: 8, left: 5,
            width: 20, height: 30, borderRadius: 4,
            background: 'rgba(46,204,113,0.4)',
            animation: 'pulse 1.5s infinite alternate',
          }} />
          {/* Label */}
          <div style={{
            position: 'absolute', top: 4, left: 5,
            fontSize: 5, color: '#ff0', fontWeight: 900,
          }}>☣</div>
        </div>
      );

    case 'tubulacao':
      return (
        <div style={{ position: 'relative', width: 50, height: 20 }}>
          {/* Tubo horizontal */}
          <div style={{
            width: 48, height: 14, borderRadius: 7,
            background: 'linear-gradient(180deg, #95a5a6, #7f8c8d)',
            border: '2px solid #5d6d7e',
            boxShadow: '2px 3px 0 rgba(0,0,0,0.3)',
          }} />
          {/* Juntas */}
          <div style={{
            position: 'absolute', top: 1, left: 10,
            width: 6, height: 16, borderRadius: 1,
            background: '#5d6d7e',
          }} />
          <div style={{
            position: 'absolute', top: 1, left: 32,
            width: 6, height: 16, borderRadius: 1,
            background: '#5d6d7e',
          }} />
        </div>
      );

    default:
      return null;
  }
});

// ─────────────────────────────────────────────────────
//  Componente visual: Zona de Relâmpago
// ─────────────────────────────────────────────────────
const LightningZoneComp = React.memo(function LightningZoneComp({ zone }: { zone: LightningZone }) {
  const isWarning = zone.warning && zone.warningTimer && zone.warningTimer > 0;
  const blink = isWarning ? Math.floor(Date.now() / 100) % 2 === 0 : false;
  const radius = zone.radius;

  return (
    <div style={{
      width: radius * 2, height: radius * 1.2,
      borderRadius: '50%',
      background: isWarning
        ? `radial-gradient(circle, rgba(255,255,100,${blink ? 0.3 : 0.1}), transparent 70%)`
        : `radial-gradient(circle, rgba(241,196,15,0.25), rgba(241,196,15,0.05) 60%, transparent 80%)`,
      border: isWarning
        ? `2px dashed rgba(255,255,100,${blink ? 0.6 : 0.2})`
        : '1px solid rgba(241,196,15,0.2)',
      boxShadow: isWarning ? 'none' : '0 0 15px rgba(241,196,15,0.15)',
      pointerEvents: 'none',
      transition: 'opacity 0.15s',
    }} />
  );
});

// ─────────────────────────────────────────────────────
//  Indicador de Carga da Bufa (HUD)
// ─────────────────────────────────────────────────────
const ChargeIndicator = React.memo(function ChargeIndicator({ chargeTimer, maxCharge }: { chargeTimer: number; maxCharge: number }) {
  if (chargeTimer <= 0) return null;
  const pct = Math.min(chargeTimer / maxCharge, 1);
  const ready = pct >= 1;
  const color = ready ? '#f1c40f' : '#2ecc71';

  return (
    <div style={{
      position: 'absolute', bottom: 180, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10005, width: 80, textAlign: 'center',
    }}>
      <div style={{
        fontSize: 6, color, fontWeight: 900, marginBottom: 2,
        textShadow: '1px 1px 0 #000',
        animation: ready ? 'pulse 0.2s infinite alternate' : 'none',
      }}>
        {ready ? '🔥 SOLTA!' : '⚡ CARGA'}
      </div>
      <div style={{
        width: 60, height: 6, background: '#222',
        border: '1px solid #444', borderRadius: 3,
        overflow: 'hidden', margin: '0 auto',
      }}>
        <div style={{
          width: `${pct * 100}%`, height: '100%',
          background: ready
            ? 'linear-gradient(90deg, #f1c40f, #e67e22)'
            : `linear-gradient(90deg, #2ecc71, ${color})`,
          transition: 'width 0.05s',
          boxShadow: ready ? '0 0 8px #f1c40f' : 'none',
        }} />
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  PhaseRenderer principal
// ─────────────────────────────────────────────────────
export default function PhaseRenderer({ engineConfig, bgImage, phase, muted, onToggleMute, overlay }: PhaseRendererProps) {
  const {
    p, dav, enemies, food, texts, particles,
    keysRef, frame, cam, shake, score, bossEnemy,
    envObjects, lightning,
    paused, togglePause,
  } = useGameEngine(engineConfig);

  const isMoving = Math.abs(p.vx) > 0.3 || Math.abs(p.vy) > 0.3;
  const hasV2 = envObjects.length > 0 || lightning.length > 0;

  // ── Entidades ordenadas por Y (depth sort) ──
  const entities: { key: string; type: 'player' | 'davisaum' | 'enemy' | 'food' | 'envobj' | 'lightning'; y: number; data: any }[] = [
    { key: 'player', type: 'player', y: p.y, data: p },
    { key: 'davisaum', type: 'davisaum', y: dav.y, data: dav },
    ...enemies.map(e => ({ key: e.id, type: 'enemy' as const, y: e.y, data: e })),
    ...food.map(fo => ({ key: fo.id, type: 'food' as const, y: fo.y, data: fo })),
    // Objetos de ambiente (renderizados junto com tudo, depth-sorted)
    ...envObjects
      .filter(o => o.active || o.exploding)
      .map(o => ({ key: o.id, type: 'envobj' as const, y: o.y, data: o })),
  ];
  entities.sort((a, b) => a.y - b.y);

  const shakeX = shake > 0 ? rng(-shake, shake) : 0;
  const shakeY = shake > 0 ? rng(-shake * 0.6, shake * 0.6) : 0;

  // Label de fase pra ScoreDisplay
  const phaseLabel = phase === 3 ? 'FASE 3 — SÃO BURGÃO' : phase === 2 ? undefined : undefined;

  return (
    <>
      <div style={{ position: 'absolute', inset: -4, transform: `translate3d(${shakeX}px, ${shakeY}px, 0)` }}>
        {/* ── Background ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundColor: bgImage ? undefined : (phase === 3 ? '#2c2c3a' : '#1a1a2e'),
          backgroundRepeat: 'repeat-x', backgroundPositionX: -cam,
          backgroundSize: 'cover', backgroundPositionY: 'bottom',
        }} />

        {/* ── Overlay atmosférico ── */}
        {overlay && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,20,0.1) 0%, transparent 30%, transparent 80%, rgba(0,0,0,0.15) 100%)', pointerEvents: 'none' }} />}

        {/* ── Nuvens de gás ambiental (Fase 3 visual) ── */}
        {phase === 3 && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
            {[0, 200, 500, 900, 1400, 2000, 2600].map((gx, i) => {
              const sx = gx - cam;
              if (sx < -150 || sx > BASE_W + 150) return null;
              const colors = ['rgba(255,150,200,0.08)', 'rgba(150,255,150,0.08)', 'rgba(255,255,150,0.08)'];
              return (
                <div key={`gas${i}`} style={{
                  position: 'absolute',
                  left: sx, bottom: 30 + (i % 3) * 20,
                  width: 120 + (i % 2) * 40, height: 50,
                  borderRadius: '50%',
                  background: `radial-gradient(ellipse, ${colors[i % 3]}, transparent 70%)`,
                  filter: 'blur(12px)',
                  animation: `pulse ${2 + (i % 3)}s infinite alternate`,
                }} />
              );
            })}
          </div>
        )}

        {/* ── Zonas de relâmpago (renderizadas ATRÁS das entidades) ── */}
        {lightning.map(z => {
          const sx = z.x - cam;
          if (sx < -100 || sx > BASE_W + 100) return null;
          return (
            <div key={z.id} style={{
              position: 'absolute', top: 0, left: 0,
              transform: `translate3d(${sx - z.radius}px, ${z.y - z.radius * 0.6}px, 0)`,
              zIndex: Math.floor(z.y) - 5,
            }}>
              <LightningZoneComp zone={z} />
            </div>
          );
        })}

        {/* ── Entidades (player, davis, enemies, food, env objects) ── */}
        {entities.map(ent => {
          const sx = ent.data.x - cam;
          if (sx < -120 || sx > BASE_W + 120) return null;

          if (ent.type === 'player') return (
            <div key="player" style={{
              position: 'absolute', top: 0, left: 0,
              transform: `translate3d(${sx - SPRITE_PLAYER_W / 2}px, ${ent.data.y - SPRITE_PLAYER_OFFSET_Y - (ent.data.z || 0)}px, 0)`,
              zIndex: Math.floor(ent.data.y),
            }}>
              <PixelWallacaum
                direction={ent.data.dir} isWalking={isMoving}
                isAttacking={ent.data.attacking} isBuffa={ent.data.buffing}
                buffTimer={ent.data.buffTimer} isHurt={ent.data.hurt}
                isEating={ent.data.eating} jumpZ={ent.data.z || 0}
                landSquash={ent.data.landSquash} combo={ent.data.combo}
              />
            </div>
          );

          if (ent.type === 'davisaum') return (
            <div key="davisaum" style={{
              position: 'absolute', top: 0, left: 0,
              transform: `translate3d(${sx - 45}px, ${ent.data.y - SPRITE_DAVIS_OFFSET_Y}px, 0)`,
              zIndex: Math.floor(ent.data.y),
            }}>
              <PixelDavisaum
                direction={ent.data.dir} isWalking={ent.data.isWalking}
                isThrowing={ent.data.isThrowing} isScared={ent.data.isScared}
                frame={frame}
              />
            </div>
          );

          if (ent.type === 'enemy') return (
            <div key={ent.key} style={{
              position: 'absolute', top: 0, left: 0,
              transform: `translate3d(${sx - 45}px, ${ent.data.y - SPRITE_ENEMY_OFFSET_Y - (ent.data.z || 0)}px, 0)`,
              zIndex: Math.floor(ent.data.y),
            }}>
              <PixelAgent
                type={ent.data.type} direction={ent.data.dir}
                isWalking={ent.data.walking} punchTimer={ent.data.punchTimer}
                stateTimer={ent.data.stateTimer} frame={frame}
                isHurt={ent.data.hurt} hp={ent.data.hp} maxHp={ent.data.maxHp}
                charging={ent.data.charging}
                absorbing={ent.data.absorbing}
                flying={ent.data.flying}
                armorFailing={ent.data.armorFailing}
              />
            </div>
          );

          if (ent.type === 'food') return (
            <div key={ent.key} style={{
              position: 'absolute', top: 0, left: 0,
              transform: `translate3d(${sx - FOOD_SIZE / 2}px, ${ent.data.y - FOOD_SIZE - 8}px, 0)`,
              zIndex: Math.floor(ent.data.y) - 1,
            }}>
              <FoodItemComp type={ent.data.type} landed={ent.data.landed} />
            </div>
          );

          if (ent.type === 'envobj') return (
            <div key={ent.key} style={{
              position: 'absolute', top: 0, left: 0,
              transform: `translate3d(${sx - 20}px, ${ent.data.y - 45}px, 0)`,
              zIndex: Math.floor(ent.data.y) - 2,
            }}>
              <EnvObjectComp obj={ent.data} />
            </div>
          );

          return null;
        })}

        {/* ── Partículas ── */}
        <ParticleRenderer particles={particles} cam={cam} />

        {/* ── Textos flutuantes ── */}
        {texts.map(ft => (
          <FloatingText key={ft.id} text={ft.text} x={ft.x - cam - 10} y={ft.y} color={ft.color} size={ft.size} />
        ))}
      </div>

      {/* ── Efeito CRT (scanlines + vignette) ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9990, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)', mixBlendMode: 'multiply' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9991, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)' }} />

      {/* ── HUD ── */}
      <HpBar hp={p.hp} maxHp={MAX_HP} />
      <ScoreDisplay score={score} combo={p.combo} phase={phase} />
      {bossEnemy && <BossHpBar enemy={bossEnemy} />}
      <MusicButton muted={muted} onToggle={onToggleMute} />
      <PauseButton paused={paused} onToggle={togglePause} />
      <TouchDpad keysRef={keysRef} />
      <TouchActions keysRef={keysRef} />

      {/* ── Overlay de Pause ── */}
      {paused && (
        <div onClick={togglePause} style={{
          position: 'absolute', inset: 0, zIndex: 10010,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <div style={{
            fontSize: 24, color: '#f1c40f', fontWeight: 900,
            fontFamily: '"Press Start 2P", monospace',
            textShadow: '3px 3px 0 #000, 0 0 20px rgba(241,196,15,0.3)',
            animation: 'pulse 1.5s infinite alternate',
          }}>⏸ PAUSADO</div>
          <div style={{
            fontSize: 8, color: '#aaa', marginTop: 12,
            textShadow: '1px 1px 0 #000',
          }}>Clique ou pressione ESC / P para continuar</div>
        </div>
      )}

      {/* ── Indicador de carga da bufa (só com power-up) ── */}
      {p.powers?.bufaCarregada && (
        <ChargeIndicator chargeTimer={p.chargeTimer || 0} maxCharge={BUFA_CHARGE_TIME_FULL} />
      )}
    </>
  );
}