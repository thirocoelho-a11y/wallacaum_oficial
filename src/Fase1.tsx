// ═══════════════════════════════════════════════════════
//  Fase1.tsx — Configuração da Fase 1 (Rua / Boss: Suka)
// ═══════════════════════════════════════════════════════
import { CENARIO_FASE1 } from './cenarioFase1';
import { SPAWN_INTERVAL_MS } from './constants';
import PhaseRenderer from './PhaseRenderer';

export interface Fase1Props {
  initialScore: number; initialHp: number; muted: boolean;
  onToggleMute: () => void; onComplete: (score: number, hp: number) => void;
  onGameOver: (score: number) => void; onRestart: () => void;
}

export default function Fase1({ initialScore, initialHp, muted, onToggleMute, onComplete, onGameOver }: Fase1Props) {
  return (
    <PhaseRenderer
      phase={1}
      bgImage={CENARIO_FASE1}
      muted={muted}
      onToggleMute={onToggleMute}
      engineConfig={{
        initialScore, initialHp,
        bossThreshold: 2000,
        spawnIntervalMs: SPAWN_INTERVAL_MS,
        bossType: 'suka', bossHp: 40,
        bossAnnounce: '☠ SUKA BARULHENTA!', bossAnnounceColor: '#9b59b6',
        bossDeathColor: '#9b59b6', bossDeathParticles: '#9b59b6',
        getNormalEnemyType: () => Math.random() > 0.5 ? 'fast' : 'standard',
        getNormalEnemyHp: (tp) => tp === 'fast' ? 2 : 4,
        onGameOver, onComplete,
      }}
    />
  );
}
