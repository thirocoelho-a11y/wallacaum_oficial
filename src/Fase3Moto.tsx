// ═══════════════════════════════════════════════════════
//  Fase3Moto.tsx — Configuração da Fase 3½ (Moto)
//
//  "FUGA! ESTRADA PARA A MONTANHA"
//
//  Gênero: Side-scroller runner (completamente diferente
//  do beat-em-up das outras fases).
//
//  Wallaçaum pilota, Davisaum segura atrás.
//  3 atos, ~90 segundos, dificuldade crescente.
//
//  Controles: ↑↓ faixa, Z pular, X soco lateral
// ═══════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import { useMotorRunner } from './useMotorRunner';
import MotoRenderer from './MotoRenderer';
import { MOTO_TOTAL_DURATION } from './constants';

export interface Fase3MotoProps {
  initialScore: number;
  initialHp: number;
  muted: boolean;
  onToggleMute: () => void;
  onComplete: (score: number, hp: number) => void;
  onGameOver: (score: number) => void;
  onRestart: () => void;
}

export default function Fase3Moto({
  initialScore, initialHp, muted, onToggleMute,
  onComplete, onGameOver,
}: Fase3MotoProps) {

  // ── Intro rápida antes da fase começar ──
  const [showIntro, setShowIntro] = useState(true);

  const handleStart = useCallback(() => {
    setShowIntro(false);
  }, []);

  // ── Engine da moto ──
  const engine = useMotorRunner({
    initialHp,
    initialScore,
    duration: MOTO_TOTAL_DURATION,
    onGameOver,
    onComplete,
  });

  // ── Intro: instruções rápidas ──
  if (showIntro) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 99999,
        background: 'radial-gradient(ellipse at center, rgba(10,5,0,0.92) 0%, rgba(0,0,0,0.98) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Título */}
        <div style={{
          fontSize: 20, color: '#e67e22', fontWeight: 900,
          fontFamily: '"Press Start 2P", monospace',
          textShadow: '3px 3px 0 #000, 0 0 15px rgba(230,126,34,0.4)',
          animation: 'pulse 0.8s infinite alternate',
          letterSpacing: 2,
        }}>
          🏍️ FUGA DE MOTO!
        </div>

        <div style={{
          fontSize: 9, color: '#f39c12', marginTop: 8,
          letterSpacing: 2, fontWeight: 700, textShadow: '1px 1px 0 #000',
        }}>
          ESTRADA PARA A MONTANHA
        </div>

        {/* Separador */}
        <div style={{
          width: 280, height: 2, margin: '14px 0',
          background: 'linear-gradient(90deg, transparent, #e67e22, transparent)',
        }} />

        {/* Moto ASCII art simplificada */}
        <div style={{
          fontSize: 22, color: '#e67e22', lineHeight: 1.2,
          textShadow: '0 0 8px rgba(230,126,34,0.3)',
          marginBottom: 12,
        }}>
          🏍️💨
        </div>

        {/* Controles */}
        <div style={{
          color: '#bbb', fontSize: 8, textAlign: 'center',
          lineHeight: 2.2, textShadow: '1px 1px 0 #000',
        }}>
          <div>
            <span style={{ color: '#f1c40f', fontWeight: 700 }}>↑ ↓</span>
            <span style={{ color: '#888' }}> — Mudar de faixa</span>
          </div>
          <div>
            <span style={{ color: '#2ecc71', fontWeight: 700 }}>Z</span>
            <span style={{ color: '#888' }}> — Pular obstáculo</span>
          </div>
          <div>
            <span style={{ color: '#e74c3c', fontWeight: 700 }}>X</span>
            <span style={{ color: '#888' }}> — Soco lateral (zumbi corredor)</span>
          </div>
        </div>

        {/* Separador */}
        <div style={{
          width: 280, height: 1, margin: '12px 0',
          background: 'linear-gradient(90deg, transparent, #555, transparent)',
        }} />

        {/* Descrição */}
        <div style={{
          color: '#777', fontSize: 7, textAlign: 'center',
          maxWidth: 320, lineHeight: 1.8, fontStyle: 'italic',
        }}>
          Davisaum no guidão. Horda nos calcanhares.<br />
          Sobreviva até a montanha!
        </div>

        {/* Botão */}
        <div
          onClick={handleStart}
          style={{
            marginTop: 18, padding: '12px 40px',
            background: 'linear-gradient(180deg, #e67e22, #d35400)',
            color: '#fff', fontWeight: 900, fontSize: 12,
            border: '3px solid #f39c12', borderRadius: 4,
            cursor: 'pointer', letterSpacing: 3,
            boxShadow: '0 4px 20px rgba(230,126,34,0.4)',
            animation: 'pulse 1.2s infinite alternate',
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          ACELERAR
        </div>
      </div>
    );
  }

  // ── Fase ativa: renderizar moto ──
  return (
    <MotoRenderer
      moto={engine.moto}
      obstacles={engine.obstacles}
      items={engine.items}
      particles={engine.particles}
      texts={engine.texts}
      keysRef={engine.keysRef}
      frame={engine.frame}
      score={engine.score}
      act={engine.act}
      shake={engine.shake}
      laneY={engine.laneY}
      jumpZ={engine.jumpZ}
      motoX={engine.motoX}
      lanePositions={engine.lanePositions}
      muted={muted}
      onToggleMute={onToggleMute}
    />
  );
}
