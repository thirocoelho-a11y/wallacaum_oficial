// ═══════════════════════════════════════════════════════
//  screens.tsx — Telas de UI (título, transições, game over, vitória)
//
//  ✅ Transições agora usam ComicReader (cutscenes HQ)
//  ✅ Adicionado: IntroScreen (prólogo antes da Fase 1)
//  ✅ Mantidos: TitleScreen, GameOverScreen, VictoryScreen
// ═══════════════════════════════════════════════════════
import React from 'react';
import ComicReader from './ComicReader';
import {
  INTRO_STORY,
  TRANSITION_1_TO_2,
  TRANSITION_2_TO_3,
  TRANSITION_3_TO_MOTO,
  TRANSITION_MOTO_TO_4,
} from './storyData';

// ─────────────────────────────────────────────────────
//  Tela Título (mantida igual)
// ─────────────────────────────────────────────────────
export function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 99999, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.95) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 28, color: '#f1c40f', fontWeight: 900, fontFamily: '"Press Start 2P", monospace', textShadow: '3px 3px 0 #c0392b, 5px 5px 0 rgba(0,0,0,0.5)', animation: 'pulse 1.5s infinite alternate', letterSpacing: 2 }}>WALLAÇAUM</div>
      <div style={{ fontSize: 9, color: '#e74c3c', marginTop: 6, letterSpacing: 2, fontWeight: 700, textShadow: '1px 1px 0 #000' }}>A CONSPIRAÇÃO DO SUPLEMENTO</div>
      <div onClick={onStart} style={{ marginTop: 22, padding: '12px 36px', background: 'linear-gradient(180deg, #e74c3c, #c0392b)', color: '#fff', fontWeight: 900, fontSize: 12, border: '3px solid #fff', borderRadius: 4, cursor: 'pointer', letterSpacing: 2, boxShadow: '0 4px 20px rgba(231,76,60,0.4)', animation: 'pulse 1.2s infinite alternate' }}>PRESS START</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  ✅ NOVO: Intro (prólogo — comic antes da Fase 1)
// ─────────────────────────────────────────────────────
export function IntroScreen({ onContinue }: { onContinue: () => void }) {
  return <ComicReader scene={INTRO_STORY} onFinish={onContinue} />;
}

// ─────────────────────────────────────────────────────
//  Transição Fase 1 → 2 (agora em comic)
// ─────────────────────────────────────────────────────
export function PhaseTransitionScreen({ onContinue }: { onContinue: () => void }) {
  return <ComicReader scene={TRANSITION_1_TO_2} onFinish={onContinue} />;
}

// ─────────────────────────────────────────────────────
//  Transição Fase 2 → 3 (agora em comic)
// ─────────────────────────────────────────────────────
export function Phase2to3TransitionScreen({ onContinue }: { onContinue: () => void }) {
  return <ComicReader scene={TRANSITION_2_TO_3} onFinish={onContinue} />;
}

// ─────────────────────────────────────────────────────
//  Transição Fase 3 → Moto (agora em comic)
// ─────────────────────────────────────────────────────
export function Phase3toMotoTransitionScreen({ onContinue }: { onContinue: () => void }) {
  return <ComicReader scene={TRANSITION_3_TO_MOTO} onFinish={onContinue} />;
}

// ─────────────────────────────────────────────────────
//  Transição Moto → Fase 4 (agora em comic)
// ─────────────────────────────────────────────────────
export function MotoToPhase4TransitionScreen({ onContinue }: { onContinue: () => void }) {
  return <ComicReader scene={TRANSITION_MOTO_TO_4} onFinish={onContinue} />;
}

// ─────────────────────────────────────────────────────
//  Game Over (mantida igual)
// ─────────────────────────────────────────────────────
export function GameOverScreen({ score, onRetry }: { score: number; onRetry: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 99999, background: 'radial-gradient(ellipse at center, rgba(40,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 28, color: '#e74c3c', fontWeight: 900, textShadow: '3px 3px 0 #000, 0 0 20px rgba(231,76,60,0.5)', animation: 'shake 0.5s infinite' }}>GAME OVER</div>
      <div style={{ color: '#f1c40f', fontSize: 12, marginTop: 8, fontWeight: 700 }}>SCORE: {score}</div>
      <div onClick={onRetry} style={{ marginTop: 14, padding: '10px 28px', background: 'linear-gradient(180deg, #e74c3c, #c0392b)', color: '#fff', fontWeight: 900, fontSize: 11, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 4 }}>TENTAR DE NOVO</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  Vitória (mantida igual)
// ─────────────────────────────────────────────────────
export function VictoryScreen({ score, onRetry }: { score: number; onRetry: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 99999, background: 'radial-gradient(ellipse at center, rgba(0,40,20,0.85) 0%, rgba(0,0,0,0.95) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 28, color: '#f1c40f', fontWeight: 900, textShadow: '3px 3px 0 #000, 0 0 25px rgba(241,196,15,0.5)', animation: 'pulse 1s infinite alternate' }}>🏆 VITÓRIA TOTAL! 🏆</div>
      <div style={{ color: '#2ecc71', fontSize: 10, marginTop: 8 }}>FURIO E A NUTRICONTROL FORAM DERROTADOS!</div>
      <div style={{ color: '#95a5a6', fontSize: 9, marginTop: 4, fontStyle: 'italic' }}>São Burgão está livre dos suplementos falsos.</div>
      <div style={{ color: '#f1c40f', fontSize: 14, marginTop: 8, fontWeight: 900 }}>SCORE FINAL: {score}</div>
      <div onClick={onRetry} style={{ marginTop: 14, padding: '10px 28px', background: 'linear-gradient(180deg, #f1c40f, #e67e22)', color: '#000', fontWeight: 900, fontSize: 11, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 4 }}>JOGAR DE NOVO</div>
    </div>
  );
}