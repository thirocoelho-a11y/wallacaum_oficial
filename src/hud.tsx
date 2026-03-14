// ═══════════════════════════════════════════════════════
//  hud.tsx — HUD (Vida, Score, Boss HP, Música) + Touch Controls
// ═══════════════════════════════════════════════════════
import React from 'react';
import type { Enemy } from './types';
import { isBossType } from './constants';

// ─────────────────────────────────────────────────────
//  HpBar
// ─────────────────────────────────────────────────────
export const HpBar = React.memo(function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = (hp / maxHp) * 100;
  const c = hp > 60 ? '#2ecc71' : hp > 30 ? '#f1c40f' : '#e74c3c';
  return (
    <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10000, background: 'rgba(0,0,0,0.65)', padding: '6px 10px', borderRadius: 5, border: '1.5px solid #44444488' }}>
      <div style={{ color: '#f1c40f', fontSize: 7, marginBottom: 3, letterSpacing: 1.5, fontWeight: 900 }}>⚡ WALLAÇAUM</div>
      <div style={{ width: 100, height: 10, background: '#222', border: '1.5px solid #444', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(180deg, ${c}, ${c}bb)`, transition: 'width 0.25s ease-out' }} />
      </div>
      <div style={{ color: '#888', fontSize: 6, marginTop: 2, textAlign: 'right' }}>{Math.max(0, Math.round(hp))}/{maxHp}</div>
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  ScoreDisplay
// ─────────────────────────────────────────────────────
export const ScoreDisplay = React.memo(function ScoreDisplay({ score, combo, phase }: { score: number; combo: number; phase: number }) {
  return (
    <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10000, background: 'rgba(0,0,0,0.65)', padding: '6px 10px', borderRadius: 5, border: '1.5px solid #44444488', textAlign: 'right' }}>
      {phase === 2 && <div style={{ color: '#ff6600', fontSize: 6, fontWeight: 900, letterSpacing: 1, marginBottom: 2 }}>FASE 2 — FÁBRICA</div>}
      <div style={{ color: '#fff', fontSize: 12, fontWeight: 900, fontFamily: '"Press Start 2P", monospace' }}>{String(score).padStart(6, '0')}</div>
      {combo >= 2 && <div style={{ color: combo >= 8 ? '#e74c3c' : combo >= 5 ? '#f39c12' : '#f1c40f', fontSize: 7, fontWeight: 900, marginTop: 2, animation: 'pulse 0.3s infinite alternate' }}>COMBO x{combo}</div>}
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  BossHpBar
// ─────────────────────────────────────────────────────
export const BossHpBar = React.memo(function BossHpBar({ enemy }: { enemy: Enemy | undefined }) {
  if (!enemy) return null;
  const pct = (enemy.hp / enemy.maxHp) * 100;
  const isFurio = enemy.type === 'furio';
  const col = isFurio ? '#ff4500' : '#9b59b6';
  const bg = isFurio
    ? 'linear-gradient(90deg, #cc3300, #ff4500, #ff8844)'
    : 'linear-gradient(90deg, #8e44ad, #9b59b6, #c39bd3)';
  const name = isFurio ? '🔥 FURIO — CHEFE NUTRICONTROL 🔥' : '☠ SUKA BARULHENTA ☠';
  return (
    <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 10000, width: 220, background: 'rgba(0,0,0,0.75)', padding: '4px 8px', borderRadius: 4, border: `1.5px solid ${col}` }}>
      <div style={{ color: col, fontSize: 6, fontWeight: 900, letterSpacing: 1, marginBottom: 2, textAlign: 'center' }}>{name}</div>
      <div style={{ width: '100%', height: 6, background: '#222', border: '1px solid #555', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: bg, transition: 'width 0.3s ease-out' }} />
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  MusicButton
// ─────────────────────────────────────────────────────
export const MusicButton = React.memo(function MusicButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} onPointerDown={e => e.stopPropagation()} style={{ position: 'absolute', top: 8, left: 130, zIndex: 10001, background: 'rgba(0,0,0,0.5)', border: `1px solid ${muted ? '#e74c3c44' : '#2ecc7144'}`, borderRadius: 12, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11 }}>{muted ? '🔇' : '🔊'}</span>
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  PauseButton
// ─────────────────────────────────────────────────────
export const PauseButton = React.memo(function PauseButton({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} onPointerDown={e => e.stopPropagation()} style={{ position: 'absolute', top: 8, left: 168, zIndex: 10001, background: 'rgba(0,0,0,0.5)', border: `1px solid ${paused ? '#f1c40f44' : '#ffffff22'}`, borderRadius: 12, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11 }}>{paused ? '▶' : '⏸'}</span>
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  Touch D-Pad
// ─────────────────────────────────────────────────────
export const TouchDpad = React.memo(function TouchDpad({ keysRef }: { keysRef: React.MutableRefObject<Record<string, boolean>> }) {
  const h = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId); keysRef.current[k] = true; },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[k] = false; },
    onPointerLeave: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[k] = false; },
    onPointerCancel: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[k] = false; },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });
  const S: React.CSSProperties = { width: 52, height: 52, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 20, fontWeight: 900, touchAction: 'none', userSelect: 'none' };
  return (
    <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 10020, display: 'grid', gridTemplateColumns: 'repeat(3, 52px)', gridTemplateRows: 'repeat(3, 52px)', gap: 2 }}>
      <div /><div style={S} {...h('arrowup')}>▲</div><div />
      <div style={S} {...h('arrowleft')}>◀</div><div style={{ ...S, background: 'transparent', border: '1px solid rgba(255,255,255,0.04)' }} /><div style={S} {...h('arrowright')}>▶</div>
      <div /><div style={S} {...h('arrowdown')}>▼</div><div />
    </div>
  );
});

// ─────────────────────────────────────────────────────
//  Touch Actions (Pulo, Soco, Bufa)
// ─────────────────────────────────────────────────────
export const TouchActions = React.memo(function TouchActions({ keysRef }: { keysRef: React.MutableRefObject<Record<string, boolean>> }) {
  const h = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId); keysRef.current[k] = true; },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[k] = false; },
    onPointerLeave: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[k] = false; },
    onPointerCancel: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[k] = false; },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });
  const C = (color: string, sz: number): React.CSSProperties => ({
    width: sz, height: sz,
    background: `radial-gradient(circle at 40% 35%, ${color}33, ${color}15 70%, transparent)`,
    border: `2px solid ${color}44`, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
    color: `${color}aa`, touchAction: 'none', userSelect: 'none',
  });
  return (
    <div style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 10020, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={C('#3498db', 50)} {...h('z')}><span style={{ fontSize: 16 }}>⬆</span><span style={{ fontSize: 6, fontWeight: 900, fontFamily: '"Press Start 2P", monospace' }}>PULO</span></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={C('#e74c3c', 66)} {...h('x')}><span style={{ fontSize: 20 }}>👊</span><span style={{ fontSize: 6, fontWeight: 900, fontFamily: '"Press Start 2P", monospace' }}>SOCO</span></div>
        <div style={C('#2ecc71', 66)} {...h('c')}><span style={{ fontSize: 20 }}>💨</span><span style={{ fontSize: 6, fontWeight: 900, fontFamily: '"Press Start 2P", monospace' }}>BUFA</span></div>
      </div>
    </div>
  );
});