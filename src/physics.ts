// physics.ts
import { PHYSICS, WORLD } from './constants';
import type { Player } from './types';

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function applyPlayerPhysics(p: Player, inputs: Record<string, boolean>) {
  let ix = 0, iy = 0;
  
  // Captura de Input
  if (inputs['arrowleft'] || inputs['a']) ix -= 1; 
  if (inputs['arrowright'] || inputs['d']) ix += 1;
  if (inputs['arrowup'] || inputs['w']) iy -= 1; 
  if (inputs['arrowdown'] || inputs['s']) iy += 1;

  // Normalização de diagonal
  if (ix !== 0 && iy !== 0) { 
    ix *= 0.707; 
    iy *= 0.707; 
  }

  // Aceleração X
  if (ix !== 0) { 
    p.vx += ix * PHYSICS.PLAYER_ACCEL; 
    p.vx = clamp(p.vx, -PHYSICS.PLAYER_MAX_SPEED, PHYSICS.PLAYER_MAX_SPEED); 
    p.dir = ix > 0 ? 'right' : 'left'; 
  } else { 
    p.vx *= PHYSICS.PLAYER_DECEL; 
    if (Math.abs(p.vx) < 0.1) p.vx = 0; 
  }

  // Movimento e Colisão com as bordas do mundo
  p.x += p.vx;
  p.x = clamp(p.x, 30, WORLD.WORLD_W - 30);
  
  // Pulo e Gravidade (Lógica inalterada, mas agora roda em taxa fixa)
  // ... lógica de eixo Z e Y aqui ...
}
