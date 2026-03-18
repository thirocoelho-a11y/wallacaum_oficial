// ═══════════════════════════════════════════════════════
//  App.tsx — Roteador de Fases + Música por Fase + Telas
//
//  Fluxo: título → fase1 → trans1→2 → fase2 → trans2→3
//         → fase3 → trans3→moto → fase3moto → trans_mototo4 → ...
//
//  ✅ INTEGRADO: Fase 3½ (Moto)
//  ✅ INTEGRADO: Música diferente por fase (Jukebox)
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState, useCallback } from 'react';
import { createJukebox, type Jukebox, type MusicTrackId } from './musicSprite';
import { setSFXMute } from './sfx';
import { BASE_W, BASE_H, MAX_HP } from './constants';
import { GAME_CSS } from './gameStyles';
import {
  TitleScreen, PhaseTransitionScreen, Phase2to3TransitionScreen,
  Phase3toMotoTransitionScreen, MotoToPhase4TransitionScreen,
  GameOverScreen, VictoryScreen,
} from './screens';
import Fase1 from './Fase1';
import Fase2 from './Fase2';
import Fase3 from './Fase3';
import Fase3Moto from './Fase3Moto';
// import Fase4 from './Fase4';           // TODO: quando pronto
// import Fase5 from './Fase5';           // TODO: quando pronto

type Screen =
  | 'title'
  | 'fase1'
  | 'trans_1to2'
  | 'fase2'
  | 'trans_2to3'
  | 'fase3'
  | 'trans_3tomoto'
  | 'fase3moto'
  | 'trans_mototo4'
  // | 'fase4'
  // | 'trans_4to5'
  // | 'fase5'
  | 'gameover'
  | 'victory';

// ─────────────────────────────────────────────────────
//  MAPA: Screen → MusicTrackId + Volume
//
//  Para adicionar música a uma fase nova, basta:
//  1. Adicionar o base64 no musicSprite.ts (ex: MUSICA_FASE4)
//  2. Adicionar a screen aqui no mapa
// ─────────────────────────────────────────────────────
interface MusicConfig {
  track: MusicTrackId;
  volume: number;
  fadeOut?: boolean;  // true = fade out gradual ao entrar nessa screen
}

const SCREEN_MUSIC: Record<Screen, MusicConfig> = {
  title:          { track: 'title',      volume: 0.4 },
  fase1:          { track: 'fase1',      volume: 0.5 },
  trans_1to2:     { track: 'transition', volume: 0.3 },
  fase2:          { track: 'fase2',      volume: 0.5 },
  trans_2to3:     { track: 'transition', volume: 0.3 },
  fase3:          { track: 'fase3',      volume: 0.5 },
  trans_3tomoto:  { track: 'transition', volume: 0.3 },
  fase3moto:      { track: 'fase3moto',  volume: 0.6 },
  trans_mototo4:  { track: 'transition', volume: 0.3 },
  // fase4:       { track: 'fase4',      volume: 0.5 },
  // trans_4to5:  { track: 'transition', volume: 0.3 },
  // fase5:       { track: 'fase5',      volume: 0.5 },
  gameover:       { track: 'gameover',   volume: 0.5, fadeOut: true },
  victory:        { track: 'victory',    volume: 0.4 },
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [muted, setMuted] = useState(false);
  const [viewScale, setViewScale] = useState(1);

  // ── Escala responsiva ──
  useEffect(() => {
    const calc = () => {
      const s = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
      setViewScale(s);
    };
    calc();
    window.addEventListener('resize', calc);
    const oc = () => setTimeout(calc, 300);
    window.addEventListener('orientationchange', oc);
    return () => {
      window.removeEventListener('resize', calc);
      window.removeEventListener('orientationchange', oc);
    };
  }, []);

  // ── Jukebox (música por fase) ──
  const jukeboxRef = useRef<Jukebox | null>(null);

  useEffect(() => {
    const jb = createJukebox();
    jukeboxRef.current = jb;
    return () => { jb.destroy(); };
  }, []);

  // Reage a troca de screen → troca de música
  useEffect(() => {
    const jb = jukeboxRef.current;
    if (!jb) return;

    const cfg = SCREEN_MUSIC[screen];
    if (!cfg) return;

    // Se a screen anterior era gameover com fadeOut, faz o fade primeiro
    // Caso contrário, troca direto
    if (cfg.fadeOut) {
      // Fade out da música anterior, depois toca a nova (se tiver)
      jb.fadeOut(500).then(() => {
        if (cfg.track !== 'silent' && cfg.track !== 'transition') {
          jb.setVolume(cfg.volume);
          jb.play(cfg.track);
        }
      });
    } else {
      jb.setVolume(cfg.volume);
      jb.play(cfg.track);
    }
  }, [screen]);

  // Mute sincroniza com jukebox + sfx
  useEffect(() => {
    const jb = jukeboxRef.current;
    if (jb) jb.setMuted(muted);
    setSFXMute(muted);
  }, [muted]);

  const toggleMute = useCallback(() => setMuted(m => !m), []);

  // ═══════════════════════════════════════════════════
  //  Navegação entre fases
  // ═══════════════════════════════════════════════════

  const startGame = useCallback(() => {
    setScore(0); setHp(MAX_HP); setScreen('fase1');
  }, []);

  const onFase1Complete = useCallback((newScore: number, newHp: number) => {
    setScore(newScore); setHp(newHp); setScreen('trans_1to2');
  }, []);

  const startFase2 = useCallback(() => {
    setScreen('fase2');
  }, []);

  const onFase2Complete = useCallback((newScore: number, newHp: number) => {
    setScore(newScore); setHp(newHp); setScreen('trans_2to3');
  }, []);

  const startFase3 = useCallback(() => {
    setScreen('fase3');
  }, []);

  const onFase3Complete = useCallback((newScore: number, newHp: number) => {
    setScore(newScore); setHp(newHp); setScreen('trans_3tomoto');
  }, []);

  const startMoto = useCallback(() => {
    setScreen('fase3moto');
  }, []);

  const onMotoComplete = useCallback((newScore: number, newHp: number) => {
    setScore(newScore); setHp(newHp); setScreen('trans_mototo4');
  }, []);

  const startFase4 = useCallback(() => {
    // TODO: setScreen('fase4'); quando Fase 4 existir
    setScreen('victory');
  }, []);

  const onVictory = useCallback((finalScore: number) => {
    setScore(finalScore); setScreen('victory');
  }, []);

  const onGameOver = useCallback((finalScore: number) => {
    setScore(finalScore); setScreen('gameover');
  }, []);

  // ═══════════════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════════════

  return (
    <div
      style={{
        width: '100vw', height: '100dvh', overflow: 'hidden',
        background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Press Start 2P", monospace, system-ui',
        userSelect: 'none', touchAction: 'none',
      }}
      onContextMenu={e => e.preventDefault()}
    >
      <style>{GAME_CSS}</style>
      <div style={{
        width: BASE_W, height: BASE_H,
        transform: `scale(${viewScale})`, transformOrigin: 'center center',
        position: 'relative', overflow: 'hidden', imageRendering: 'pixelated',
      }}>

        {screen === 'fase1' && (
          <Fase1
            initialScore={0} initialHp={MAX_HP}
            muted={muted} onToggleMute={toggleMute}
            onComplete={onFase1Complete} onGameOver={onGameOver} onRestart={startGame}
          />
        )}

        {screen === 'fase2' && (
          <Fase2
            initialScore={score} initialHp={hp}
            muted={muted} onToggleMute={toggleMute}
            onVictory={onFase2Complete} onGameOver={onGameOver} onRestart={startGame}
          />
        )}

        {screen === 'fase3' && (
          <Fase3
            initialScore={score} initialHp={hp}
            muted={muted} onToggleMute={toggleMute}
            onComplete={onFase3Complete} onGameOver={onGameOver} onRestart={startGame}
          />
        )}

        {screen === 'fase3moto' && (
          <Fase3Moto
            initialScore={score} initialHp={hp}
            muted={muted} onToggleMute={toggleMute}
            onComplete={onMotoComplete} onGameOver={onGameOver} onRestart={startGame}
          />
        )}

        {screen === 'title' && <TitleScreen onStart={startGame} />}

        {screen === 'trans_1to2' && (
          <PhaseTransitionScreen score={score} onContinue={startFase2} />
        )}

        {screen === 'trans_2to3' && (
          <Phase2to3TransitionScreen score={score} onContinue={startFase3} />
        )}

        {screen === 'trans_3tomoto' && (
          <Phase3toMotoTransitionScreen score={score} onContinue={startMoto} />
        )}

        {screen === 'trans_mototo4' && (
          <MotoToPhase4TransitionScreen score={score} onContinue={startFase4} />
        )}

        {screen === 'gameover' && <GameOverScreen score={score} onRetry={startGame} />}
        {screen === 'victory' && <VictoryScreen score={score} onRetry={startGame} />}

      </div>
    </div>
  );
}