// ═══════════════════════════════════════════════════════
//  App.tsx — Roteador de Fases + Música + Telas
//
//  Fluxo: título → fase1 → trans1→2 → fase2 → trans2→3
//         → fase3 → trans3→moto → fase3moto → ...
//
//  Fases 3½, 4, 5 serão adicionadas aqui quando prontas.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState, useCallback } from 'react';
import { MUSICA_SPRITE } from './musicSprite';
import { setSFXMute } from './sfx';
import { BASE_W, BASE_H, MAX_HP } from './constants';
import { GAME_CSS } from './gameStyles';
import {
  TitleScreen, PhaseTransitionScreen, Phase2to3TransitionScreen,
  Phase3toMotoTransitionScreen, GameOverScreen, VictoryScreen,
} from './screens';
import Fase1 from './Fase1';
import Fase2 from './Fase2';
import Fase3 from './Fase3';
// import Fase3Moto from './Fase3Moto';  // TODO: quando pronto
// import Fase4 from './Fase4';           // TODO: quando pronto
// import Fase5 from './Fase5';           // TODO: quando pronto

type Screen =
  | 'title'
  | 'fase1'
  | 'trans_1to2'        // Suka derrotada → Fase 2
  | 'fase2'
  | 'trans_2to3'        // Furio derrotado → Fase 3
  | 'fase3'
  | 'trans_3tomoto'     // Suka MK2 derrotada → Moto
  // | 'fase3moto'      // TODO
  // | 'trans_mototo4'   // TODO
  // | 'fase4'           // TODO
  // | 'trans_4to5'      // TODO
  // | 'fase5'           // TODO
  | 'gameover'
  | 'victory';

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

  // ── Música ──
  const musicRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = new Audio(MUSICA_SPRITE);
    a.loop = true; a.volume = 0.5; a.preload = 'auto';
    musicRef.current = a;
    return () => { a.pause(); a.src = ''; };
  }, []);

  useEffect(() => {
    const a = musicRef.current; if (!a) return;
    const playingScreens: Screen[] = ['fase1', 'fase2', 'fase3'];

    if (playingScreens.includes(screen)) {
      a.volume = 0.5;
      a.play().catch(() => {});
    } else if (screen === 'gameover') {
      let v = a.volume;
      const f = setInterval(() => {
        v -= 0.05;
        if (v <= 0) { clearInterval(f); a.pause(); a.volume = 0.5; }
        else a.volume = v;
      }, 50);
      return () => clearInterval(f);
    } else if (screen === 'victory') {
      a.volume = 0.25;
    } else if (screen.startsWith('trans_')) {
      a.volume = 0.3;
    } else {
      a.pause(); a.currentTime = 0; a.volume = 0.5;
    }
  }, [screen]);

  useEffect(() => {
    if (musicRef.current) musicRef.current.muted = muted;
    setSFXMute(muted);
  }, [muted]);

  const toggleMute = useCallback(() => setMuted(m => !m), []);

  // ═══════════════════════════════════════════════════
  //  Navegação entre fases
  // ═══════════════════════════════════════════════════

  const startGame = useCallback(() => {
    setScore(0); setHp(MAX_HP); setScreen('fase1');
  }, []);

  // Fase 1 → transição → Fase 2
  const onFase1Complete = useCallback((newScore: number, newHp: number) => {
    setScore(newScore); setHp(newHp); setScreen('trans_1to2');
  }, []);

  const startFase2 = useCallback(() => {
    setScreen('fase2');
  }, []);

  // Fase 2 → transição → Fase 3
  const onFase2Complete = useCallback((newScore: number, newHp: number) => {
    setScore(newScore); setHp(newHp); setScreen('trans_2to3');
  }, []);

  const startFase3 = useCallback(() => {
    setScreen('fase3');
  }, []);

  // Fase 3 → transição → Moto (3½)
  // NOTA: Fase3.tsx tem cutscene interna da horda antes de chamar onComplete
  const onFase3Complete = useCallback((newScore: number, newHp: number) => {
    setScore(newScore); setHp(newHp); setScreen('trans_3tomoto');
  }, []);

  const startMoto = useCallback(() => {
    // TODO: setScreen('fase3moto'); quando Fase3Moto existir
    // Por agora, mostra vitória temporária (placeholder)
    setScreen('victory');
  }, []);

  // Vitória final (será chamada pela Fase 5 no futuro)
  const onVictory = useCallback((finalScore: number) => {
    setScore(finalScore); setScreen('victory');
  }, []);

  // Game Over (qualquer fase)
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

        {/* ── Fases jogáveis ── */}

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

        {/* TODO: Fase 3½ Moto */}
        {/* {screen === 'fase3moto' && (
          <Fase3Moto
            initialScore={score} initialHp={hp}
            muted={muted} onToggleMute={toggleMute}
            onComplete={onMotoComplete} onGameOver={onGameOver} onRestart={startGame}
          />
        )} */}

        {/* ── Telas de UI ── */}

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

        {screen === 'gameover' && <GameOverScreen score={score} onRetry={startGame} />}
        {screen === 'victory' && <VictoryScreen score={score} onRetry={startGame} />}

      </div>
    </div>
  );
}
