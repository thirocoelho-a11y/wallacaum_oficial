import React, { type MutableRefObject } from 'react';
import {
  MAX_HP, FloatingText, ParticleRenderer, TouchDpad, TouchActions,
  HpBar, ScoreDisplay, BossHpBar, MusicButton
} from './gameCore';
import { buildSortedSceneEntities, getShakeOffset, renderSceneEntity } from './phaseEntities';
import type { Enemy, FloatingTextData, Particle, Player, Davisaum, FoodItem } from './gameCore';

interface PhaseScreenProps { /* ... (mantenha a mesma interface) ... */ 
  backgroundImage: string; cameraX: number; frame: number; shake: number; player: Player;
  dav: Davisaum; enemies: Enemy[]; food: FoodItem[]; particles: Particle[]; texts: FloatingTextData[];
  bossEnemy?: Enemy | null; score: number; phaseNumber: 1 | 2; muted: boolean;
  onToggleMute: () => void; keysRef: MutableRefObject<Record<string, boolean>>; ambienceOverlay?: string;
}

const isCharacterMoving = (player: Player) => Math.abs(player.vx) > 0.3 || Math.abs(player.vy) > 0.3;

// MEMOIZADO: Só é renderizado 1x, poupa performance da GPU do telemóvel!
const ScreenPostEffects = React.memo(() => (
  <>
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9990, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)', mixBlendMode: 'multiply' }} />
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9991, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)' }} />
  </>
));

export const PhaseScreen = React.memo(function PhaseScreen({
  backgroundImage, cameraX, frame, shake, player, dav, enemies, food, particles,
  texts, bossEnemy, score, phaseNumber, muted, onToggleMute, keysRef, ambienceOverlay
}: PhaseScreenProps) {
  
  const sceneEntities = buildSortedSceneEntities(player, dav, enemies, food);
  const moving = isCharacterMoving(player);
  const { x: shakeX, y: shakeY } = getShakeOffset(shake);

  return (
    <>
      <div style={{ position: 'absolute', inset: -4, transform: `translate3d(${shakeX}px, ${shakeY}px, 0)` }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${backgroundImage})`, backgroundRepeat: 'repeat-x', backgroundPositionX: -cameraX, backgroundSize: 'cover', backgroundPositionY: 'bottom' }} />
        {ambienceOverlay && <div style={{ position: 'absolute', inset: 0, background: ambienceOverlay, pointerEvents: 'none' }} />}

        {sceneEntities.map((entity) => renderSceneEntity(entity, cameraX, frame, moving))}
        
        <ParticleRenderer particles={particles} cam={cameraX} />
        
        {texts.map((t) => (
          <FloatingText key={t.id} text={t.text} x={t.x - cameraX - 10} y={t.y} color={t.color} size={t.size} />
        ))}
      </div>

      <ScreenPostEffects />

      <HpBar hp={player.hp} maxHp={MAX_HP} />
      <ScoreDisplay score={score} combo={player.combo} phase={phaseNumber} />
      {bossEnemy && <BossHpBar enemy={bossEnemy} />}
      <MusicButton muted={muted} onToggle={onToggleMute} />
      <TouchDpad keysRef={keysRef} />
      <TouchActions keysRef={keysRef} />
    </>
  );
});
