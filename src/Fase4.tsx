// ═══════════════════════════════════════════════════════
//  Fase4.tsx — Configuração da Fase 4 (Treino RPG)
//
//  "PICO DAS PEDRAS AGUDAS"
//  Estilo: RPG por turnos (Pokémon)
// ═══════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import useTrainingEngine from './useTrainingEngine';
import TrainingRenderer from './TrainingRenderer';

export interface Fase4Props {
  initialScore: number;
  initialHp: number;
  muted: boolean;
  onToggleMute: () => void;
  onComplete: (score: number, hp: number) => void;
  onGameOver: (score: number) => void;
  onRestart: () => void;
}

export default function Fase4({
  initialScore, initialHp, muted, onToggleMute,
  onComplete, onGameOver,
}: Fase4Props) {

  const [showIntro, setShowIntro] = useState(true);
  const handleStart = useCallback(() => setShowIntro(false), []);

  const engine = useTrainingEngine({
    initialHp,
    initialScore,
    onComplete,
    onGameOver,
  });

  // ── Intro ──
  if (showIntro) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 99999,
        background: 'linear-gradient(180deg, #1a0a2e 0%, #4a1942 30%, #c0392b 60%, #e67e22 80%, #000 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Montanha silhueta */}
        <svg viewBox="0 0 400 100" style={{ width: 300, marginBottom: -10, opacity: 0.3 }}>
          <polygon points="0,100 60,30 120,60 180,10 240,50 300,20 360,55 400,40 400,100" fill="#1a1a2e" />
        </svg>

        <div style={{
          fontSize: 18, color: '#f1c40f', fontWeight: 900,
          fontFamily: '"Press Start 2P", monospace',
          textShadow: '3px 3px 0 #000, 0 0 20px rgba(241,196,15,0.3)',
          animation: 'pulse 1.5s infinite alternate',
          letterSpacing: 2,
        }}>
          FASE 4
        </div>

        <div style={{
          fontSize: 9, color: '#9b59b6', marginTop: 6,
          letterSpacing: 3, fontWeight: 700, textShadow: '1px 1px 0 #000',
        }}>
          PICO DAS PEDRAS AGUDAS
        </div>

        <div style={{
          width: 250, height: 2, margin: '14px 0',
          background: 'linear-gradient(90deg, transparent, #9b59b6, transparent)',
        }} />

        {/* Estilo de batalha */}
        <div style={{
          fontSize: 8, color: '#f39c12', fontWeight: 900,
          letterSpacing: 2, marginBottom: 10,
        }}>
          ⚔️ TREINO POR TURNOS
        </div>

        {/* Descrição */}
        <div style={{
          color: '#aaa', fontSize: 7, textAlign: 'center',
          maxWidth: 320, lineHeight: 2.2, textShadow: '1px 1px 0 #000',
        }}>
          <div>
            <span style={{ color: '#f1c40f', fontWeight: 700 }}>↑↓</span>
            <span style={{ color: '#888' }}> — Navegar menu</span>
          </div>
          <div>
            <span style={{ color: '#2ecc71', fontWeight: 700 }}>Z / C / ENTER</span>
            <span style={{ color: '#888' }}> — Confirmar</span>
          </div>
          <div>
            <span style={{ color: '#e74c3c', fontWeight: 700 }}>X / ESC</span>
            <span style={{ color: '#888' }}> — Voltar</span>
          </div>
        </div>

        <div style={{
          width: 250, height: 1, margin: '10px 0',
          background: 'linear-gradient(90deg, transparent, #555, transparent)',
        }} />

        {/* Citação */}
        <div style={{
          color: '#9b59b6', fontSize: 7, marginTop: 4,
          fontStyle: 'italic', textShadow: '1px 1px 0 #000',
          textAlign: 'center', maxWidth: 300, lineHeight: 1.8,
        }}>
          "Você busca a força do trovão, mas seu estômago
          <br />só conhece o caos da fritura."
          <br /><span style={{ color: '#666' }}>— Mestre Ancião</span>
        </div>

        {/* Botão */}
        <div
          onClick={handleStart}
          style={{
            marginTop: 16, padding: '12px 40px',
            background: 'linear-gradient(180deg, #9b59b6, #7d3c98)',
            color: '#fff', fontWeight: 900, fontSize: 11,
            border: '3px solid #bb88dd', borderRadius: 4,
            cursor: 'pointer', letterSpacing: 3,
            boxShadow: '0 4px 20px rgba(155,89,182,0.4)',
            animation: 'pulse 1.2s infinite alternate',
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          INICIAR TREINO
        </div>
      </div>
    );
  }

  // ── Fase ativa ──
  return (
    <TrainingRenderer
      state={engine.state}
      tick={engine.tick} // ⬅️ AQUI ESTÁ A CORREÇÃO: O tick é passado para re-renderizar o visual a cada frame
      muted={muted}
      onToggleMute={onToggleMute}
    />
  );
}