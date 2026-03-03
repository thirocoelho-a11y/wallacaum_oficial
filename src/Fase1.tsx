// ═══════════════════════════════════════════════════════
//  Fase1.tsx — Rua da Cidade / Boss: Suka Barulhenta
// ═══════════════════════════════════════════════════════
import { CENARIO_FASE1 } from './cenarioFase1';
import { SPAWN_INTERVAL_MS, useGameEngine } from './gameCore';
import type { EnemyType } from './gameCore';
import { PhaseScreen } from './phaseScreen';

export interface Fase1Props {
  initialScore: number;
  initialHp: number;
  muted: boolean;
  onToggleMute: () => void;
  onComplete: (score: number, hp: number) => void;
  onGameOver: (score: number) => void;
}

const fase1EnemyType = () => (Math.random() > 0.5 ? 'fast' : 'standard');
const fase1EnemyHp = (enemyType: EnemyType) => (enemyType === 'fast' ? 2 : 4);

export default function Fase1({ initialScore, initialHp, muted, onToggleMute, onComplete, onGameOver }: Fase1Props) {
  const engine = useGameEngine({
    initialScore,
    initialHp,
    bossThreshold: 1000,
    spawnIntervalMs: SPAWN_INTERVAL_MS,
    bossType: 'suka',
    bossHp: 40,
    bossAnnounce: '☠ SUKA BARULHENTA!',
    bossAnnounceColor: '#9b59b6',
    bossDeathColor: '#9b59b6',
    bossDeathParticles: '#9b59b6',
    getNormalEnemyType: fase1EnemyType,
    getNormalEnemyHp: fase1EnemyHp,
    onGameOver,
    onComplete
  });

  return (
    <PhaseScreen
      backgroundImage={CENARIO_FASE1}
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
      phaseNumber={1}
      muted={muted}
      onToggleMute={onToggleMute}
      keysRef={engine.keysRef}
    />
  );
}
