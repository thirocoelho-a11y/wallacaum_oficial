// physics.ts
import { PHYSICS, WORLD } from './constants';
import type { Player } from './types';

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function applyPlayerPhysics(p: Player, inputs: Record<string, boolean>) {
  let ix = 0, iy = 0;
  
  // 1. Captura de Input (X e Y)
  if (inputs['arrowleft'] || inputs['a']) ix -= 1; 
  if (inputs['arrowright'] || inputs['d']) ix += 1;
  if (inputs['arrowup'] || inputs['w']) iy -= 1; 
  if (inputs['arrowdown'] || inputs['s']) iy += 1;

  // Normalização de movimento na diagonal (impede andar mais rápido na diagonal)
  if (ix !== 0 && iy !== 0) { 
    ix *= 0.707; 
    iy *= 0.707; 
  }

  // 2. FÍSICA X (Esquerda / Direita)
  if (ix !== 0) { 
    p.vx += ix * PHYSICS.PLAYER_ACCEL; 
    p.vx = clamp(p.vx, -PHYSICS.PLAYER_MAX_SPEED, PHYSICS.PLAYER_MAX_SPEED); 
    p.dir = ix > 0 ? 'right' : 'left'; 
  } else { 
    p.vx *= PHYSICS.PLAYER_DECEL; 
    if (Math.abs(p.vx) < 0.1) p.vx = 0; 
  }
  p.x += p.vx;
  p.x = clamp(p.x, 30, WORLD.WORLD_W - 30);

  // 3. FÍSICA Y (Cima / Baixo - Perspetiva 3D)
  if (iy !== 0) {
    p.vy += iy * PHYSICS.PLAYER_ACCEL * 0.65; // Eixo Y é ligeiramente mais lento para sensação de profundidade
    p.vy = clamp(p.vy, -PHYSICS.PLAYER_MAX_SPEED * 0.65, PHYSICS.PLAYER_MAX_SPEED * 0.65);
  } else {
    p.vy *= PHYSICS.PLAYER_DECEL;
    if (Math.abs(p.vy) < 0.1) p.vy = 0;
  }
  p.y += p.vy;
  p.y = clamp(p.y, WORLD.FLOOR_MIN, WORLD.FLOOR_MAX); // Restringe o jogador ao chão do cenário

  // 4. FÍSICA Z (Pulo e Gravidade)
  // Deteta se está no chão
  const gnd = p.z <= 0 && p.vz <= 0;
  
  if (gnd) { 
    p.coyoteTimer = PHYSICS.COYOTE_TIME ?? 6; // Tempo extra para pular ao cair
    if (!p.wasGrounded) { 
      // Acabou de aterrar! Ativa a animação de "esmagamento" (Squash)
      p.landSquash = 6; 
    } 
  } else { 
    if (p.coyoteTimer > 0) p.coyoteTimer--; 
  }
  p.wasGrounded = gnd;

  // Iniciar o Pulo (Tecla Z ou Espaço)
  if ((inputs['z'] || inputs[' ']) && p.coyoteTimer > 0 && p.z === 0) { 
    p.vz = PHYSICS.JUMP_FORCE; 
    p.coyoteTimer = 0; 
  }
  
  // Cortar o pulo se o jogador soltar o botão cedo (Pulo variável)
  if (!(inputs['z'] || inputs[' ']) && p.vz > 0) {
    p.vz *= PHYSICS.JUMP_CUT;
  }

  // Aplicar gravidade
  if (p.z > 0 || p.vz > 0) { 
    p.z += p.vz; 
    p.vz -= PHYSICS.GRAVITY; 
    if (p.z <= 0) { 
      // Bateu no chão
      p.z = 0; 
      p.vz = 0; 
    } 
  }

  // Reduzir o efeito visual de aterragem frame a frame
  if (p.landSquash > 0) p.landSquash--;
}
