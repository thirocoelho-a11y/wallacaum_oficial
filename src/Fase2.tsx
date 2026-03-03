import React, { useMemo } from 'react';

// 1. Importações do motor e interface
import { 
  useGameEngine, 
  TouchDpad, 
  TouchActions, 
  HpBar, 
  ScoreDisplay, 
  MusicButton,
  BossHpBar,
  EnginePhaseConfig
} from './gameCore';

// 2. Importações dos gráficos otimizados
import { 
  PixelWallacaum, 
  PixelDavisaum, 
  PixelAgent, 
  FoodItemComp, 
  FloatingText, 
  ParticleRenderer 
} from './components/Graphics';

// 3. Importações específicas da Fase 2
import { BACKGROUND_FASE2 } from './spritesFase2'; 
import { BASE_W, BASE_H } from './constants'; 

interface Fase2Props {
  initialScore: number;
  initialHp: number;
  muted: boolean;
  onToggleMute: () => void;
  onVictory: (score: number) => void; // Na fase 2, o fim é a vitória
  onGameOver: (score: number) => void;
}

export default function Fase2({ initialScore, initialHp, muted, onToggleMute, onVictory, onGameOver }: Fase2Props) {
  
  // Configuração da Fase 2: O laboratório da conspiração
  const engineConfig: EnginePhaseConfig = useMemo(() => ({
    initialScore,
    initialHp,
    bossThreshold: initialScore + 2500, // Precisa de mais pontos para o Furia aparecer
    spawnIntervalMs: 2800,              // Inimigos aparecem mais rápido
    bossType: 'furio',                  // O Chefe é o Furia
    bossHp: 450,                        // Furia tem muito mais vida
    bossAnnounce: 'FURIA CHEGOU PARA O ACERTO DE CONTAS!',
    bossAnnounceColor: '#f39c12',
    bossDeathColor: '#ff4500',
    bossDeathParticles: 'smoke',
    
    // Inimigos da Fase 2: Cientistas e Seguranças
    getNormalEnemyType: () => Math.random() > 0.6 ? 'cientista' : 'seguranca',
    getNormalEnemyHp: (type) => type === 'cientista' ? 50 : 80,
    
    onGameOver,
    onComplete: (finalScore) => onVictory(finalScore)
  }), [initialScore, initialHp, onGameOver, onVictory]);

  // Inicia o motor para a Fase 2
  const { p, dav, enemies, food, texts, particles, keysRef, frame, cam, score, bossEnemy } = useGameEngine(engineConfig);

  return (
    <div style={{ position: 'relative', width: BASE_W, height: BASE_H, overflow: 'hidden' }}>
      
      {/* BACKGROUND FASE 2 (Laboratório com Parallax) */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        backgroundImage: `url(${BACKGROUND_FASE2})`, 
        backgroundSize: 'cover', 
        backgroundPosition: `${-cam * 0.15}px center`, 
        zIndex: 0 
      }} />

      {/* INTERFACE (HUD) */}
      <HpBar hp={p.hp} maxHp={100} />
      <ScoreDisplay score={score} combo={p.combo} phase={2} />
      <MusicButton muted={muted} onToggle={onToggleMute} />
      
      {/* Barra de HP do Chefe (Aparece apenas quando o Furia surge) */}
      {bossEnemy && <BossHpBar enemy={bossEnemy} />}

      {/* MUNDO DO JOGO */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-cam}px)`, zIndex: 10 }}>
        
        {/* Parceiro Davis */}
        <PixelDavisaum direction={dav.dir} isWalking={dav.isWalking} isThrowing={dav.isThrowing} isScared={dav.isScared} frame={frame} />
        
        {/* Herói Wallaçaum */}
        <PixelWallacaum 
          direction={p.dir} isWalking={Math.abs(p.vx) > 0.1} isAttacking={p.attacking} 
          isBuffa={p.buffing} isHurt={p.hurt} isEating={p.eating} 
          jumpZ={p.z} landSquash={p.landSquash} combo={p.combo} frame={frame} 
        />

        {/* Inimigos e o Chefe Furia */}
        {enemies.map(e => (
          <PixelAgent 
            key={e.id} type={e.type} direction={e.dir} 
            isWalking={e.walking} punchTimer={e.punchTimer} stateTimer={e.stateTimer} 
            frame={frame} isHurt={e.hurt} hp={e.hp} maxHp={e.maxHp} charging={e.charging} 
          />
        ))}

        {/* Lanches e Suplementos */}
        {food.map(f => (
          <div key={f.id} style={{ position: 'absolute', left: 0, top: 0, transform: `translate3d(${f.x}px, ${f.y}px, 0)`, zIndex: Math.floor(f.y) }}>
            <FoodItemComp type={f.type} landed={f.landed} />
          </div>
        ))}

        {/* Efeitos Visuais e Textos */}
        {texts.map(t => (
          <FloatingText key={t.id} text={t.text} x={t.x} y={t.y} color={t.color} size={t.size} />
        ))}

        <ParticleRenderer particles={particles} cam={cam} />
      </div>

      {/* CONTROLES */}
      <TouchDpad keysRef={keysRef} />
      <TouchActions keysRef={keysRef} />
    </div>
  );
}
