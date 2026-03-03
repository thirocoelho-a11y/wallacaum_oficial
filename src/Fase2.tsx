// ═══════════════════════════════════════════════════════
//  Fase2.tsx — Fábrica NutriControl / Boss: Furio
// ═══════════════════════════════════════════════════════
import { CENARIO_FASE2 } from './cenarioFase2';
import { useGameEngine } from './gameCore';
import type { EnemyType } from './gameCore';
import { PhaseScreen } from './phaseScreen';

export interface Fase2Props {
  initialScore: number;
  initialHp: number;
  muted: boolean;
  onToggleMute: () => void;
  onVictory: (score: number) => void;
  onGameOver: (score: number) => void;
}

const fase2EnemyType = () => (Math.random() > 0.5 ? 'seguranca' : 'cientista');
const fase2EnemyHp = (enemyType: EnemyType) => (enemyType === 'seguranca' ? 5 : 3);
const fase2AmbienceOverlay =
  'linear-gradient(180deg, rgba(0,0,20,0.1) 0%, transparent 30%, transparent 80%, rgba(0,0,0,0.15) 100%)';

export default function Fase2({ initialScore, initialHp, muted, onToggleMute, onVictory, onGameOver }: Fase2Props) {
  const engine = useGameEngine({
    initialScore,
    initialHp,
    bossThreshold: 800,
    spawnIntervalMs: 3000,
    bossType: 'furio',
    bossHp: 60,
    bossAnnounce: '🔥 FURIO — CHEFE FINAL!',
    bossAnnounceColor: '#ff4500',
    bossDeathColor: '#ff4500',
    bossDeathParticles: '#f1c40f',
    getNormalEnemyType: fase2EnemyType,
    getNormalEnemyHp: fase2EnemyHp,
    onGameOver,
    onComplete: onVictory
  });

  return (
    <PhaseScreen
      backgroundImage={CENARIO_FASE2}
      cameraX={engine.cam}
      frame={engine.frame}
      shake={engine.shake}
      player={engine.p}
      dav={engine.dav}
      enemies={engine.enemies}
      food={engine.food}
      particles={engine.particles}
      texts={engine.texts}
      bossEnemy={engine.bossEnemy}
      score={engine.score}
      phaseNumber={2}
      muted={muted}
      onToggleMute={onToggleMute}
      keysRef={engine.keysRef}
      ambienceOverlay={fase2AmbienceOverlay}
    />
  );
}
