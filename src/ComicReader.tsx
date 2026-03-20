// ═══════════════════════════════════════════════════════
//  ComicReader.tsx — Leitor de Cutscenes em estilo HQ
//
//  Recebe uma ComicScene (4 painéis) e exibe um por vez.
//  Avança com clique, toque, espaço ou enter.
//
//  Layout: grid 2×2, painéis aparecem com animação.
//  Balões de fala posicionados por speaker.
//  Narração em caixa amarela no rodapé do painel.
//  Fallback [ARTE] quando base64 está vazio.
// ═══════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import type { ComicScene, ComicPanel, ComicSpeaker } from './storyData';
import { playSFX } from './sfx';
import { BASE_W, BASE_H } from './constants';

// ─────────────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────────────
interface ComicReaderProps {
  /** Cena com 4 painéis */
  scene: ComicScene;
  /** Chamado ao clicar no último painel — avança pro próximo estado */
  onFinish: () => void;
}

// ─────────────────────────────────────────────────────
//  Constantes visuais
// ─────────────────────────────────────────────────────
const PANEL_W = 280;
const PANEL_H = 160;
const PANEL_GAP = 16;
const ROTATIONS = [-1.5, 1.2, -0.8, 1.5]; // Leve rotação por painel

// ─────────────────────────────────────────────────────
//  Posição do balão de fala baseado no speaker
// ─────────────────────────────────────────────────────
function getBalloonPosition(speaker?: ComicSpeaker): React.CSSProperties {
  switch (speaker) {
    case 'wallacaum':
      return { bottom: -12, left: 15 };
    case 'davisaum':
      return { bottom: -12, left: 60 };
    case 'suka':
    case 'furio':
      return { bottom: -12, right: 15 };
    case 'anciao':
      return { bottom: -12, right: 40 };
    default:
      return { bottom: -12, left: 30 };
  }
}

// Posição do "rabinho" do balão
function getTailPosition(speaker?: ComicSpeaker): React.CSSProperties {
  switch (speaker) {
    case 'wallacaum':
      return { top: -8, left: 20 };
    case 'davisaum':
      return { top: -8, left: 50 };
    case 'suka':
    case 'furio':
      return { top: -8, right: 20 };
    case 'anciao':
      return { top: -8, right: 45 };
    default:
      return { top: -8, left: 30 };
  }
}

// ─────────────────────────────────────────────────────
//  Componente: Painel individual
// ─────────────────────────────────────────────────────
function PanelComp({
  panel, index, isNew,
}: {
  panel: ComicPanel; index: number; isNew: boolean;
}) {
  const hasImage = panel.image && panel.image.length > 0;
  const rotation = ROTATIONS[index] ?? 0;
  const balloonPos = getBalloonPosition(panel.speaker);
  const tailPos = getTailPosition(panel.speaker);

  return (
    <div style={{
      position: 'relative',
      width: PANEL_W,
      border: '4px solid #fff',
      backgroundColor: '#000',
      boxShadow: '5px 5px 0 rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.3)',
      transform: `rotate(${rotation}deg)`,
      opacity: isNew ? 0 : 1,
      animation: isNew ? 'comicPanelIn 0.35s ease-out 0.05s forwards' : 'none',
      overflow: 'visible',
    }}>
      {/* ── Imagem ou placeholder ── */}
      {hasImage ? (
        <img
          src={panel.image}
          alt=""
          style={{
            width: PANEL_W,
            height: PANEL_H,
            objectFit: 'cover',
            display: 'block',
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        <div style={{
          width: PANEL_W,
          height: PANEL_H,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ fontSize: 24, opacity: 0.4 }}>🎨</div>
          <div style={{ color: '#555', fontSize: 8, fontFamily: 'monospace', letterSpacing: 1 }}>
            [ ARTE ]
          </div>
        </div>
      )}

      {/* ── Balão de fala ── */}
      {panel.speech && (
        <div style={{
          position: 'absolute',
          ...balloonPos,
          backgroundColor: '#fff',
          border: `3px solid ${panel.speechColor ?? '#000'}`,
          borderRadius: 12,
          padding: '8px 12px',
          maxWidth: 200,
          color: '#000',
          fontSize: 8,
          lineHeight: 1.5,
          fontWeight: 900,
          fontFamily: '"Press Start 2P", monospace, system-ui',
          boxShadow: '3px 3px 0 rgba(0,0,0,0.4)',
          zIndex: 10,
        }}>
          {/* Nome do speaker */}
          {panel.speaker && panel.speaker !== 'system' && (
            <div style={{
              fontSize: 6,
              color: panel.speechColor ?? '#888',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}>
              {panel.speaker === 'wallacaum' ? 'WALLAÇAUM'
                : panel.speaker === 'davisaum' ? 'DAVISAUM'
                : panel.speaker === 'suka' ? 'SUKA'
                : panel.speaker === 'furio' ? 'FURIO'
                : panel.speaker === 'anciao' ? 'ANCIÃO'
                : ''}
            </div>
          )}
          {panel.speech}

          {/* Rabinho do balão */}
          <div style={{
            position: 'absolute',
            ...tailPos,
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: `8px solid ${panel.speechColor ?? '#000'}`,
          }} />
        </div>
      )}

      {/* ── Narração (caixa amarela no rodapé) ── */}
      {panel.narration && (
        <div style={{
          backgroundColor: '#f1c40f',
          color: '#000',
          borderTop: '2px solid #000',
          padding: '6px 10px',
          fontSize: 7,
          fontWeight: 900,
          fontFamily: '"Press Start 2P", monospace, system-ui',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          lineHeight: 1.6,
        }}>
          {panel.narration}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════
export default function ComicReader({ scene, onFinish }: ComicReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleAdvance = useCallback(() => {
    if (currentIndex < scene.panels.length - 1) {
      playSFX('hit');
      setCurrentIndex(prev => prev + 1);
    } else {
      playSFX('jump');
      onFinish();
    }
  }, [currentIndex, scene.panels.length, onFinish]);

  // Teclado: espaço / enter avança
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleAdvance]);

  // Painéis visíveis (até o atual)
  const visiblePanels = scene.panels.slice(0, currentIndex + 1);
  const isLastPanel = currentIndex >= scene.panels.length - 1;

  return (
    <div
      onClick={handleAdvance}
      onTouchStart={handleAdvance}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#111',
        backgroundImage: 'radial-gradient(circle, #222 1px, transparent 1px)',
        backgroundSize: '10px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        fontFamily: '"Press Start 2P", monospace, system-ui',
        userSelect: 'none',
      }}
    >
      {/* ── Título da cena (sutil no topo) ── */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 7,
        color: '#444',
        letterSpacing: 3,
        textTransform: 'uppercase',
      }}>
        {scene.id === 'intro' ? '— PRÓLOGO —' : '— ENTRE FASES —'}
      </div>

      {/* ── Grid de painéis 2×2 ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: PANEL_GAP,
        maxWidth: PANEL_W * 2 + PANEL_GAP + 40,
        padding: '0 20px',
      }}>
        {visiblePanels.map((panel, idx) => (
          <PanelComp
            key={`${scene.id}-p${idx}`}
            panel={panel}
            index={idx}
            isNew={idx === currentIndex}
          />
        ))}
      </div>

      {/* ── Indicador de progresso ── */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
      }}>
        {/* Dots */}
        {scene.panels.map((_, idx) => (
          <div
            key={`dot${idx}`}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: idx <= currentIndex ? '#f1c40f' : '#333',
              border: '1px solid #555',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>

      {/* ── Texto de instrução ── */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 16,
        fontSize: 8,
        color: '#fff',
        fontWeight: 900,
        animation: 'pulse 1s infinite alternate',
        textShadow: '2px 2px 0 #000',
        letterSpacing: 1,
      }}>
        {isLastPanel ? 'CLIQUE PARA COMEÇAR ►' : 'CLIQUE PARA AVANÇAR ►'}
      </div>

      {/* ── Animação CSS ── */}
      <style>{`
        @keyframes comicPanelIn {
          0% {
            transform: scale(0.7) translateY(25px);
            opacity: 0;
          }
          60% {
            transform: scale(1.03) translateY(-3px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
