import { useEffect, useRef, useState } from 'react';
import { PHYSICS } from './constants';
import { updatePlayer } from './entities/Player';
import { updateEnemies } from './entities/EnemyAI';
import type { Player, Enemy } from './types';

export function useGameEngine(cfg: any) {
  const playerRef = useRef<Player>(createDefaultPlayer());
  const enemiesRef = useRef<Enemy[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  
  // Controle de Tempo e Renderização
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      // Inicialização do relógio
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      
      let deltaTime = timestamp - lastTimeRef.current;
      
      // Limite de segurança: se a aba foi minimizada e voltou,
      // não processe horas de física de uma vez (evita travar o navegador)
      if (deltaTime > 250) deltaTime = 250; 
      
      lastTimeRef.current = timestamp;
      accumulatorRef.current += deltaTime;

      // FIXED TIMESTEP: Atualiza a física em blocos exatos de 16.6ms
      let physicsUpdated = false;
      while (accumulatorRef.current >= PHYSICS.FIXED_TIME_STEP) {
        // --- INÍCIO DA ATUALIZAÇÃO LÓGICA ---
        const p = playerRef.current;
        const inputs = keysRef.current;

        updatePlayer(p, inputs);
        updateEnemies(enemiesRef.current, p);
        
        // --- FIM DA ATUALIZAÇÃO LÓGICA ---
        
        accumulatorRef.current -= PHYSICS.FIXED_TIME_STEP;
        physicsUpdated = true;
      }

      // Se a física mudou, pede para o React atualizar a tela
      if (physicsUpdated) {
        setRenderTick(t => t + 1);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []); // Dependências limpas. O loop acessa tudo via refs.

  return {
    player: playerRef.current,
    enemies: enemiesRef.current,
    renderTick
  };
}
