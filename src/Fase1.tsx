// ═══════════════════════════════════════════════════════
//  Fase1.tsx — Rua da Cidade / Boss: Suka Barulhenta
// ═══════════════════════════════════════════════════════
import { CENARIO_FASE1 } from './cenarioFase1';
import {
  BASE_W, MAX_HP, FOOD_SIZE, SPRITE_PLAYER_W, SPRITE_PLAYER_OFFSET_Y, SPRITE_DAVIS_OFFSET_Y, SPRITE_ENEMY_OFFSET_Y, rng, SPAWN_INTERVAL_MS,
  PixelWallacaum, PixelDavisaum, PixelAgent, FoodItemComp, FloatingText, ParticleRenderer, TouchDpad, TouchActions, HpBar, ScoreDisplay, BossHpBar, MusicButton, useGameEngine
} from './gameCore';

export interface Fase1Props {
  initialScore: number; initialHp: number; muted: boolean;
  onToggleMute: () => void; onComplete: (score: number, hp: number) => void;
  onGameOver: (score: number) => void; onRestart: () => void;
}

export default function Fase1({ initialScore, initialHp, muted, onToggleMute, onComplete, onGameOver, onRestart }: Fase1Props) {
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
  const entities = [
    { key: 'player', type: 'player', y: p.y, data: p },
    { key: 'davisaum', type: 'davisaum', y: dav.y, data: dav },
    ...enemies.map(e => ({ key: e.id, type: 'enemy', y: e.y, data: e })),
    ...food.map(fo => ({ key: fo.id, type: 'food', y: fo.y, data: fo })),
  ].sort((a, b) => a.y - b.y);

  const shakeX = shake > 0 ? rng(-shake, shake) : 0;
  const shakeY = shake > 0 ? rng(-shake * 0.6, shake * 0.6) : 0;

  return (
    <>
      <div style={{ position: 'absolute', inset: -4, transform: `translate3d(${shakeX}px, ${shakeY}px, 0)` }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${CENARIO_FASE1})`, backgroundRepeat: 'repeat-x', backgroundPositionX: -cam, backgroundSize: 'cover', backgroundPositionY: 'bottom' }} />
        {entities.map(ent => {
          const sx = ent.data.x - cam;
          if (sx < -120 || sx > BASE_W + 120) return null;
          if (ent.type === 'player') return <div key="player" style={{ position: 'absolute', top: 0, left: 0, transform: `translate3d(${sx - SPRITE_PLAYER_W / 2}px, ${ent.data.y - SPRITE_PLAYER_OFFSET_Y - (ent.data.z || 0)}px, 0)`, zIndex: Math.floor(ent.data.y) }}><PixelWallacaum direction={ent.data.dir} isWalking={isMoving} isAttacking={ent.data.attacking} isBuffa={ent.data.buffing} isHurt={ent.data.hurt} isEating={ent.data.eating} jumpZ={ent.data.z || 0} landSquash={ent.data.landSquash} combo={ent.data.combo} /></div>;
          if (ent.type === 'davisaum') return <div key="davisaum" style={{ position: 'absolute', top: 0, left: 0, transform: `translate3d(${sx - 45}px, ${ent.data.y - SPRITE_DAVIS_OFFSET_Y}px, 0)`, zIndex: Math.floor(ent.data.y) }}><PixelDavisaum direction={ent.data.dir} isWalking={ent.data.isWalking} isThrowing={ent.data.isThrowing} isScared={ent.data.isScared} frame={frame} /></div>;
          if (ent.type === 'enemy') return <div key={ent.key} style={{ position: 'absolute', top: 0, left: 0, transform: `translate3d(${sx - 45}px, ${ent.data.y - SPRITE_ENEMY_OFFSET_Y}px, 0)`, zIndex: Math.floor(ent.data.y) }}><PixelAgent type={ent.data.type} direction={ent.data.dir} isWalking={ent.data.walking} punchTimer={ent.data.punchTimer} stateTimer={ent.data.stateTimer} frame={frame} isHurt={ent.data.hurt} hp={ent.data.hp} maxHp={ent.data.maxHp} charging={ent.data.charging} /></div>;
          if (ent.type === 'food') return <div key={ent.key} style={{ position: 'absolute', top: 0, left: 0, transform: `translate3d(${sx - FOOD_SIZE / 2}px, ${ent.data.y - FOOD_SIZE - 8}px, 0)`, zIndex: Math.floor(ent.data.y) - 1 }}><FoodItemComp type={ent.data.type} landed={ent.data.landed} /></div>;
          return null;
        })}
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