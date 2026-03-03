import { applyPlayerPhysics } from '../physics';
import type { Player, Enemy } from '../types';

export function updatePlayer(p: Player, inputs: Record<string, boolean>) {
  // 1. Aplica física
  applyPlayerPhysics(p, inputs);
  
  // 2. Resolve cooldowns
  if (p.atkTimer > 0) p.atkTimer--;
  if (p.buffTimer > 0) p.buffTimer--;
  if (p.invincible > 0) p.invincible--;
  
  // 3. Verifica inputs de ataque
  if (inputs['x'] && p.atkTimer <= 0) {
    p.attacking = true;
    p.atkTimer = 18; // PUNCH_DURATION
  } else if (p.atkTimer <= 0) {
    p.attacking = false;
  }
}
