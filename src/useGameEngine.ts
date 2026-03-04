import { useEffect, useRef, useState } from 'react';
import { PHYSICS } from './constants';
import { updatePlayer } from './entities/Player';
import { updateEnemies } from './entities/EnemyAI';
import type { Player, Enemy } from './types';

// ASSUMINDO QUE O createDefaultPlayer VEM DO PLAYER:
import { createDefaultPlayer } from './entities/Player'; 

export function useGameEngine(cfg: any) {
  const playerRef = useRef<Player>(createDefaultPlayer());
  const enemiesRef = useRef<Enemy[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  
  // Controle de Tempo e Renderização
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef<number>(0);
  const [renderTick, setRenderTick] = useState(0);

  // 1. CAPTURA DE INPUTS (TECLADO E PERDA DE FOCO)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    
    // Limpa as teclas se o jogador minimizar o jogo ou mudar de aba
    const handleBlur = () => {
      keysRef.current = {}; 
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // 2. MAIN LOOP FÍSICO
  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      // Inicialização segura do relógio
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      
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
    renderTick,
    keysRef // 3. EXPORTADO PARA OS CONTROLOS MOBILE FUNCIONAREM
  };
}
