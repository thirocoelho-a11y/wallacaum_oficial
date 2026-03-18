// ═══════════════════════════════════════════════════════
//  Fase2.tsx — Configuração da Fase 2 (Fábrica / Boss: Furio)
// ═══════════════════════════════════════════════════════
import { CENARIO_FASE2 } from './cenarioFase2';
import PhaseRenderer from './PhaseRenderer';

export interface Fase2Props {
  initialScore: number; initialHp: number; muted: boolean;
  onToggleMute: () => void; onVictory: (score: number, hp: number) => void;
  onGameOver: (score: number) => void; onRestart: () => void;
}

export default function Fase2({ initialScore, initialHp, muted, onToggleMute, onVictory, onGameOver }: Fase2Props) {
  return (
    <PhaseRenderer
      phase={2}
      bgImage={CENARIO_FASE2}
      muted={muted}
      onToggleMute={onToggleMute}
      overlay
      engineConfig={{
        initialScore, initialHp,
        bossThreshold: 2600,
        spawnIntervalMs: 3000,
        bossType: 'furio', bossHp: 45,
        bossAnnounce: '🔥 FURIO — CHEFE FINAL!', bossAnnounceColor: '#ff4500',
        bossDeathColor: '#ff4500', bossDeathParticles: '#f1c40f',
        getNormalEnemyType: () => Math.random() > 0.5 ? 'seguranca' : 'cientista',
        getNormalEnemyHp: (tp) => tp === 'seguranca' ? 5 : 3,
        onGameOver, onComplete: onVictory,
      }}
    />
  );
}