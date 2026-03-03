// ═══════════════════════════════════════════════════════
//  Fase2.tsx — Fábrica NutriControl / Boss: Furio
// ═══════════════════════════════════════════════════════
import { CENARIO_FASE2 } from './cenarioFase2';
import {
  MAX_HP,
  FloatingText, ParticleRenderer, TouchDpad, TouchActions, HpBar, ScoreDisplay, BossHpBar, MusicButton, useGameEngine
} from './gameCore';
import { buildSortedSceneEntities, getShakeOffset, renderSceneEntity } from './phaseEntities';

export interface Fase2Props {
  initialScore: number; 
  initialHp: number; 
  muted: boolean;
  onToggleMute: () => void; 
  onVictory: (score: number) => void;
  onGameOver: (score: number) => void;
}

export default function Fase2({ initialScore, initialHp, muted, onToggleMute, onVictory, onGameOver }: Fase2Props) {
  const { p, dav, enemies, food, texts, particles, keysRef, frame, cam, shake, score, bossEnemy } = useGameEngine({
    initialScore, initialHp,
    bossThreshold: 800,
    spawnIntervalMs: 3000,
    bossType: 'furio', bossHp: 60,
    bossAnnounce: '🔥 FURIO — CHEFE FINAL!', bossAnnounceColor: '#ff4500', bossDeathColor: '#ff4500', bossDeathParticles: '#f1c40f',
    getNormalEnemyType: () => Math.random() > 0.5 ? 'seguranca' : 'cientista',
    getNormalEnemyHp: (tp) => tp === 'seguranca' ? 5 : 3,
    onGameOver, onComplete: onVictory // O evento genérico do motor aciona o final do jogo
  });

  const isMoving = Math.abs(p.vx) > 0.3 || Math.abs(p.vy) > 0.3;
  const entities = buildSortedSceneEntities(p, dav, enemies, food);
  const { x: shakeX, y: shakeY } = getShakeOffset(shake);

  return (
    <>
      <div style={{ position: 'absolute', inset: -4, transform: `translate3d(${shakeX}px, ${shakeY}px, 0)` }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${CENARIO_FASE2})`, backgroundRepeat: 'repeat-x', backgroundPositionX: -cam, backgroundSize: 'cover', backgroundPositionY: 'bottom' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,20,0.1) 0%, transparent 30%, transparent 80%, rgba(0,0,0,0.15) 100%)', pointerEvents: 'none' }} />
        {entities.map((entity) => renderSceneEntity(entity, cam, frame, isMoving))}
        <ParticleRenderer particles={particles} cam={cam} />
        {texts.map(ft => <FloatingText key={ft.id} text={ft.text} x={ft.x - cam - 10} y={ft.y} color={ft.color} size={ft.size} />)}
      </div>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9990, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)', mixBlendMode: 'multiply' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9991, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)' }} />
      <HpBar hp={p.hp} maxHp={MAX_HP} />
      <ScoreDisplay score={score} combo={p.combo} phase={2} />
      {bossEnemy && <BossHpBar enemy={bossEnemy} />}
      <MusicButton muted={muted} onToggle={onToggleMute} />
      <TouchDpad keysRef={keysRef} />
      <TouchActions keysRef={keysRef} />
    </>
  );
}


