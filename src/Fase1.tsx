import React, { useMemo } from 'react';

// 1. Importe a lógica, os controles e a HUD do seu motor principal
import { 
  useGameEngine, 
  TouchDpad, 
  TouchActions, 
  HpBar, 
  ScoreDisplay, 
  MusicButton,
  EnginePhaseConfig
} from './gameCore';

// 2. Importe os componentes visuais otimizados que criamos
import { 
  PixelWallacaum, 
  PixelDavisaum, 
  PixelAgent, 
  FoodItemComp, 
  FloatingText, 
  ParticleRenderer 
} from './components/Graphics'; // Ajuste este caminho se salvou em outro lugar!

// 3. Importe o background da Fase 1
import { BACKGROUND_FASE1 } from './sprites'; 
import { BASE_W, BASE_H } from './constants'; 

interface Fase1Props {
  initialScore: number;
  initialHp: number;
  muted: boolean;
  onToggleMute: () => void;
  onComplete: (score: number, hp: number) => void;
  onGameOver: (score: number) => void;
}

export default function Fase1({ initialScore, initialHp, muted, onToggleMute, onComplete, onGameOver }: Fase1Props) {
  
  // Configuração rígida da Fase 1 (sem recálculos desnecessários)
  const engineConfig: EnginePhaseConfig = useMemo(() => ({
    initialScore,
    initialHp,
    bossThreshold: 2000,
    spawnIntervalMs: 3500,
    bossType: 'suka',
    bossHp: 200,
    bossAnnounce: 'SUKA APARECEU!',
    bossAnnounceColor: '#e74c3c',
    bossDeathColor: '#c0392b',
    bossDeathParticles: 'spark',
    getNormalEnemyType: () => Math.random() > 0.7 ? 'fast' : 'standard',
    getNormalEnemyHp: (type) => type === 'fast' ? 40 : 60,
    onGameOver,
    onComplete
  }), [initialScore, initialHp, onGameOver, onComplete]);

  // Inicia o motor
  const { p, dav, enemies, food, texts, particles, keysRef, frame, cam, score } = useGameEngine(engineConfig);

  return (
    <div style={{ position: 'relative', width: BASE_W, height: BASE_H, overflow: 'hidden' }}>
      
      {/* BACKGROUND COM PARALLAX SIMPLES */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${BACKGROUND_FASE1})`, backgroundSize: 'cover', backgroundPosition: `${-cam * 0.1}px center`, zIndex: 0 }} />

      {/* INTERFACE (HUD) */}
      <HpBar hp={p.hp} maxHp={100} />
      <ScoreDisplay score={score} combo={p.combo} phase={1} />
      <MusicButton muted={muted} onToggle={onToggleMute} />

      {/* ÁREA DE RENDERIZAÇÃO DO JOGO */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-cam}px)`, zIndex: 10 }}>
        
        {/* Entidades renderizadas com Memoização (Sem stuttering) */}
        <PixelDavisaum direction={dav.dir} isWalking={dav.isWalking} isThrowing={dav.isThrowing} isScared={dav.isScared} frame={frame} />
        
        <PixelWallacaum 
          direction={p.dir} isWalking={Math.abs(p.vx) > 0.1} isAttacking={p.attacking} 
          isBuffa={p.buffing} isHurt={p.hurt} isEating={p.eating} 
          jumpZ={p.z} landSquash={p.landSquash} combo={p.combo} frame={frame} 
        />

        {enemies.map(e => (
          <PixelAgent 
            key={e.id} type={e.type} direction={e.dir} 
            isWalking={e.walking} punchTimer={e.punchTimer} stateTimer={e.stateTimer} 
            frame={frame} isHurt={e.hurt} hp={e.hp} maxHp={e.maxHp} charging={e.charging} 
          />
        ))}

        {food.map(f => (
          <div key={f.id} style={{ position: 'absolute', left: 0, top: 0, transform: `translate3d(${f.x}px, ${f.y}px, 0)`, zIndex: Math.floor(f.y) }}>
            <FoodItemComp type={f.type} landed={f.landed} />
          </div>
        ))}

        {texts.map(t => (
          <FloatingText key={t.id} text={t.text} x={t.x} y={t.y} color={t.color} size={t.size} />
        ))}

        {/* Partículas com Culling (ignora o que está fora da tela) */}
        <ParticleRenderer particles={particles} cam={cam} />
      </div>

      {/* CONTROLES MOBILE */}
      <TouchDpad keysRef={keysRef} />
      <TouchActions keysRef={keysRef} />
    </div>
  );
}
