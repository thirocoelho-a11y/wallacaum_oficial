// ═══════════════════════════════════════════════════════
//  ComicReader.tsx — Leitor de Cutscenes em estilo HQ
//
//  ✅ 1 PAINEL POR VEZ (tela cheia, grande, legível)
//  ✅ FIX: onClick + onTouchStart não dispara dobrado
//  ✅ Animação de entrada a cada troca de painel
//  ✅ Contador de painéis (1/4, 2/4...)
// ═══════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ComicScene, ComicPanel, ComicSpeaker } from './storyData';
import { playSFX } from './sfx';
import { BASE_W, BASE_H } from './constants';

interface ComicReaderProps {
  scene: ComicScene;
  onFinish: () => void;
}

// ─────────────────────────────────────────────────────
//  Posição do balão de fala baseado no speaker
// ─────────────────────────────────────────────────────
function getSpeakerName(speaker?: ComicSpeaker): string {
  switch (speaker) {
    case 'wallacaum': return 'WALLAÇAUM';
    case 'davisaum':  return 'DAVISAUM';
    case 'suka':      return 'SUKA';
    case 'furio':     return 'FURIO';
    case 'anciao':    return 'ANCIÃO';
    default:          return '';
  }
}

function getBalloonAlign(speaker?: ComicSpeaker): 'left' | 'right' {
  if (speaker === 'suka' || speaker === 'furio' || speaker === 'anciao') return 'right';
  return 'left';
}

// ═══════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════
export default function ComicReader({ scene, onFinish }: ComicReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0); // Força re-render da animação
  const cooldownRef = useRef(false);         // Anti double-trigger

  const panel = scene.panels[currentIndex];
  const isLastPanel = currentIndex >= scene.panels.length - 1;
  const hasImage = panel?.image && panel.image.length > 0;
  const balloonSide = getBalloonAlign(panel?.speaker);

  // ── Avança com anti-spam (300ms cooldown) ──
  const handleAdvance = useCallback(() => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 300);

    if (currentIndex < scene.panels.length - 1) {
      playSFX('hit');
      setCurrentIndex(prev => prev + 1);
      setAnimKey(prev => prev + 1);
    } else {
      playSFX('jump');
      onFinish();
    }
  }, [currentIndex, scene.panels.length, onFinish]);

  // ── Teclado: espaço / enter ──
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

  if (!panel) return null;

  return (
    <div
      onClick={handleAdvance}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#0a0a0a',
        backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '12px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        fontFamily: '"Press Start 2P", monospace, system-ui',
        userSelect: 'none',
        padding: 16,
      }}
    >
      {/* ── Título da cena ── */}
      <div style={{
        position: 'absolute',
        top: 8,
        left: 0, right: 0,
        textAlign: 'center',
        fontSize: 7,
        color: '#444',
        letterSpacing: 3,
        textTransform: 'uppercase',
      }}>
        {scene.id === 'intro' ? '— PRÓLOGO —' : '— ENTRE FASES —'}
      </div>

      {/* ═══════════════════════════════════════════
          PAINEL ÚNICO (tela cheia)
          ═══════════════════════════════════════════ */}
      <div
        key={animKey}
        style={{
          position: 'relative',
          width: Math.min(BASE_W * 0.88, 700),
          border: '5px solid #fff',
          backgroundColor: '#000',
          boxShadow: '6px 6px 0 rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)',
          animation: 'comicSlideIn 0.35s ease-out forwards',
          overflow: 'visible',
        }}
      >
        {/* ── Imagem ou placeholder ── */}
        {hasImage ? (
          <img
            src={panel.image}
            alt=""
            style={{
              width: '100%',
              height: Math.min(BASE_H * 0.6, 340),
              objectFit: 'cover',
              display: 'block',
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: Math.min(BASE_H * 0.6, 340),
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ fontSize: 36, opacity: 0.3 }}>🎨</div>
            <div style={{ color: '#555', fontSize: 9, fontFamily: 'monospace', letterSpacing: 2 }}>
              [ ARTE PAINEL {currentIndex + 1} ]
            </div>
          </div>
        )}

        {/* ── Balão de fala ── */}
        {panel.speech && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: balloonSide === 'left' ? 12 : 'auto',
            right: balloonSide === 'right' ? 12 : 'auto',
            backgroundColor: '#fff',
            border: `3px solid ${panel.speechColor ?? '#000'}`,
            borderRadius: 14,
            padding: '10px 14px',
            maxWidth: '55%',
            color: '#000',
            fontSize: 9,
            lineHeight: 1.6,
            fontWeight: 900,
            fontFamily: '"Press Start 2P", monospace, system-ui',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.4)',
            zIndex: 10,
            animation: 'comicBalloonIn 0.3s ease-out 0.15s both',
          }}>
            {/* Nome do speaker */}
            {panel.speaker && panel.speaker !== 'system' && (
              <div style={{
                fontSize: 7,
                color: panel.speechColor ?? '#888',
                marginBottom: 5,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}>
                {getSpeakerName(panel.speaker)}
              </div>
            )}
            {panel.speech}

            {/* Rabinho do balão */}
            <div style={{
              position: 'absolute',
              bottom: -10,
              left: balloonSide === 'left' ? 25 : 'auto',
              right: balloonSide === 'right' ? 25 : 'auto',
              width: 0, height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `10px solid ${panel.speechColor ?? '#000'}`,
            }} />
          </div>
        )}

        {/* ── Narração (caixa amarela no rodapé) ── */}
        {panel.narration && (
          <div style={{
            backgroundColor: '#f1c40f',
            color: '#000',
            borderTop: '3px solid #000',
            padding: '8px 14px',
            fontSize: 8,
            fontWeight: 900,
            fontFamily: '"Press Start 2P", monospace, system-ui',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            lineHeight: 1.7,
            animation: 'comicTextIn 0.3s ease-out 0.2s both',
          }}>
            {panel.narration}
          </div>
        )}
      </div>

      {/* ── Contador de painéis ── */}
      <div style={{
        marginTop: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        {scene.panels.map((_, idx) => (
          <div
            key={`dot${idx}`}
            style={{
              width: idx === currentIndex ? 12 : 8,
              height: idx === currentIndex ? 12 : 8,
              borderRadius: '50%',
              background: idx <= currentIndex ? '#f1c40f' : '#333',
              border: idx === currentIndex ? '2px solid #fff' : '1px solid #555',
              transition: 'all 0.2s',
            }}
          />
        ))}
        <span style={{
          fontSize: 8,
          color: '#666',
          marginLeft: 6,
        }}>
          {currentIndex + 1} / {scene.panels.length}
        </span>
      </div>

      {/* ── Instrução ── */}
      <div style={{
        position: 'absolute',
        bottom: 10,
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

      {/* ── Animações CSS ── */}
      <style>{`
        @keyframes comicSlideIn {
          0% { transform: translateX(60px) scale(0.95); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes comicBalloonIn {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes comicTextIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}