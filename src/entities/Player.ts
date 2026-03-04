import { applyPlayerPhysics } from '../physics';
// Importe as constantes certas (removi o import não utilizado de Enemy)
import { PHYSICS } from '../constants'; 
import type { Player } from '../types';

// Aqui assumimos que estas constantes estão no seu ficheiro constants.ts
// Se não estiverem, ajuste para o local correto
const PUNCH_DURATION = 18;
const BUFA_DURATION = 50;

export function updatePlayer(p: Player, inputs: Record<string, boolean>) {
  // 1. Aplica física e movimento
  applyPlayerPhysics(p, inputs);
  
  // 2. Resolve cooldowns (Reduz o tempo de espera)
  if (p.atkTimer > 0) p.atkTimer--;
  if (p.buffTimer > 0) p.buffTimer--;
  if (p.invincible > 0) p.invincible--;
  
  // 3. Verifica inputs de ataque (SOCO - Tecla X)
  if (inputs['x'] && !p.attacking && p.atkTimer <= 0) {
    p.attacking = true;
    p.atkTimer = PUNCH_DURATION;
  } else if (p.atkTimer <= 0) {
    p.attacking = false;
  }

  // 4. Verifica inputs de habilidade (BUFA - Tecla C)
  if (inputs['c'] && !p.buffing && p.buffTimer <= 0) {
    p.buffing = true;
    p.buffTimer = BUFA_DURATION;
  } else if (p.buffTimer <= 0) {
    p.buffing = false;
  }
}
