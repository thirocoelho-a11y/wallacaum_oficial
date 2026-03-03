// ═══════════════════════════════════════════════════════
//  Fase1.tsx — Rua da Cidade / Boss: Suka Barulhenta
// ═══════════════════════════════════════════════════════
import { CENARIO_FASE1 } from './cenarioFase1';
import {
  MAX_HP, SPAWN_INTERVAL_MS,
  FloatingText, ParticleRenderer, TouchDpad, TouchActions, HpBar, ScoreDisplay, BossHpBar, MusicButton, useGameEngine
} from './gameCore';
import { buildSortedSceneEntities, getShakeOffset, renderSceneEntity } from './phaseEntities';

export interface Fase1Props {
  initialScore: number; initialHp: number; muted: boolean;
  onToggleMute: () => void; onComplete: (score: number, hp: number) => void;
  onGameOver: (score: number) => void;
}

export default function Fase1({ initialScore, initialHp, muted, onToggleMute, onComplete, onGameOver }: Fase1Props) {
  const { p, dav, enemies, food, texts, particles, keysRef, frame, cam, shake, score, bossEnemy } = useGameEngine({
    initialScore, initialHp,
    bossThreshold: 1000,
    spawnIntervalMs: SPAWN_INTERVAL_MS,
    bossType: 'suka', bossHp: 40,
    bossAnnounce: '☠ SUKA BARULHENTA!', bossAnnounceColor: '#9b59b6', bossDeathColor: '#9b59b6', bossDeathParticles: '#9b59b6',
    getNormalEnemyType: () => Math.random() > 0.5 ? 'fast' : 'standard',
    getNormalEnemyHp: (tp) => tp === 'fast' ? 2 : 4,
    onGameOver, onComplete
  });

  const isMoving = Math.abs(p.vx) > 0.3 || Math.abs(p.vy) > 0.3;
  const entities = buildSortedSceneEntities(p, dav, enemies, food);
  const { x: shakeX, y: shakeY } = getShakeOffset(shake);

  return (
    <>
      <div style={{ position: 'absolute', inset: -4, transform: `translate3d(${shakeX}px, ${shakeY}px, 0)` }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${CENARIO_FASE1})`, backgroundRepeat: 'repeat-x', backgroundPositionX: -cam, backgroundSize: 'cover', backgroundPositionY: 'bottom' }} />
        {entities.map((entity) => renderSceneEntity(entity, cam, frame, isMoving))}
        <ParticleRenderer particles={particles} cam={cam} />
        {texts.map(ft => <FloatingText key={ft.id} text={ft.text} x={ft.x - cam - 10} y={ft.y} color={ft.color} size={ft.size} />)}
      </div>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9990, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)', mixBlendMode: 'multiply' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9991, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)' }} />
      <HpBar hp={p.hp} maxHp={MAX_HP} />
      <ScoreDisplay score={score} combo={p.combo} phase={1} />
      {bossEnemy && <BossHpBar enemy={bossEnemy} />}
      <MusicButton muted={muted} onToggle={onToggleMute} />
      <TouchDpad keysRef={keysRef} />
      <TouchActions keysRef={keysRef} />
    </>
  );
}
