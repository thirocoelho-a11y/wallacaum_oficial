// ═══════════════════════════════════════════════════════
//  App.tsx — Roteador de Fases + Música por Fase + Telas
//
//  Fluxo: unlock → título → fase1 → trans1→2 → fase2 →
//         trans2→3 → fase3 → trans3→moto → fase3moto →
//         trans_mototo4 → ...
//
//  ✅ INTEGRADO: Fase 3½ (Moto)
//  ✅ INTEGRADO: Música diferente por fase (Jukebox)
//  ✅ FIX: Tela de unlock para autoplay no Vercel
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
// ─────────────────────────────────────────────────────
interface MusicConfig {
  track: MusicTrackId;
  volume: number;
  fadeOut?: boolean;
}

const SCREEN_MUSIC: Record<Screen, MusicConfig> = {
  title:          { track: 'title',      volume: 0.4 },
  fase1:          { track: 'fase1',      volume: 0.3 },
  trans_1to2:     { track: 'transition', volume: 0.3 },
  fase2:          { track: 'fase2',      volume: 0.4 },
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
  // ── Unlock de áudio (necessário pro Vercel/produção) ──
  const [unlocked, setUnlocked] = useState(true);

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
  // Só toca se o áudio foi desbloqueado pelo clique do usuário
  // Pula a primeira vez no title (o handleUnlock já tocou)
  const firstUnlockRef = useRef(true);

  useEffect(() => {
    const jb = jukeboxRef.current;
    if (!jb || !unlocked) return;

    // O handleUnlock já tocou a música do title direto no handler.
    // Pula essa execução pra não dar play duplicado.
    if (firstUnlockRef.current && screen === 'title') {
      firstUnlockRef.current = false;
      return;
    }

    const cfg = SCREEN_MUSIC[screen];
    if (!cfg) return;

    if (cfg.fadeOut) {
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
  }, [screen, unlocked]);

  // Mute sincroniza com jukebox + sfx
  useEffect(() => {
    const jb = jukeboxRef.current;
    if (jb) jb.setMuted(muted);
    setSFXMute(muted);
  }, [muted]);

  const toggleMute = useCallback(() => setMuted(m => !m), []);

  // ═══════════════════════════════════════════════════
  //  Unlock handler — desbloqueia áudio e vai pro título
  //
  //  IMPORTANTE: No celular, audio.play() SÓ funciona
  //  se chamado DENTRO do handler de toque/clique.
  //  Por isso tocamos a música direto aqui, não no useEffect.
  // ═══════════════════════════════════════════════════
  const handleUnlock = useCallback(() => {
    // 1. Desbloqueia o AudioContext do sfx (se estava suspenso)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      ctx.close();
    } catch (_) { /* ignora */ }

    // 2. Toca a música do título DIRETO no handler (exigência mobile)
    const jb = jukeboxRef.current;
    if (jb) {
      const cfg = SCREEN_MUSIC['title'];
      jb.setVolume(cfg.volume);
      jb.play(cfg.track);
    }

    // 3. Atualiza estado
    setUnlocked(true);
    setScreen('title');
  }, []);

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

      {/* ═══════════════════════════════════════════════
          TELA DE UNLOCK — Aparece antes de tudo.
          O clique do usuário desbloqueia o autoplay
          de áudio nos navegadores (Chrome, Safari, etc).
          ═══════════════════════════════════════════════ */}
      {!unlocked && (
        <div
          onClick={handleUnlock}
          onTouchStart={handleUnlock}
          style={{
            position: 'absolute', inset: 0, zIndex: 999999,
            background: 'radial-gradient(ellipse at center, rgba(10,5,20,0.95) 0%, #000 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {/* Logo */}
          <div style={{
            fontSize: 32, color: '#f1c40f', fontWeight: 900,
            fontFamily: '"Press Start 2P", monospace',
            textShadow: '3px 3px 0 #c0392b, 6px 6px 0 rgba(0,0,0,0.5)',
            letterSpacing: 3,
            animation: 'pulse 1.5s infinite alternate',
          }}>
            WALLAÇAUM
          </div>

          {/* Subtítulo */}
          <div style={{
            fontSize: 8, color: '#e74c3c', marginTop: 8,
            letterSpacing: 3, fontWeight: 700,
            textShadow: '1px 1px 0 #000',
          }}>
            A CONSPIRAÇÃO DO SUPLEMENTO
          </div>

          {/* Separador */}
          <div style={{
            width: 200, height: 2, margin: '24px 0',
            background: 'linear-gradient(90deg, transparent, #f1c40f44, transparent)',
          }} />

          {/* Instrução de toque */}
          <div style={{
            fontSize: 11, color: '#fff', fontWeight: 900,
            letterSpacing: 2,
            animation: 'pulse 1s infinite alternate',
          }}>
            🎮 TOQUE PARA COMEÇAR
          </div>

          {/* Dica mobile */}
          <div style={{
            fontSize: 7, color: '#666', marginTop: 12,
            letterSpacing: 1,
          }}>
            Clique ou toque na tela
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          VIEWPORT DO JOGO (só renderiza após unlock)
          ═══════════════════════════════════════════════ */}
      {unlocked && (
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
      )}
    </div>
  );
}