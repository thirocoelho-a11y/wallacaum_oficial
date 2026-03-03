import type { Enemy, Player } from '../types';

export function updateEnemies(enemies: Enemy[], p: Player) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    
    // Stun logic
    if (e.hurtTimer > 0) {
      e.hurtTimer--;
      if (e.hurtTimer <= 0) e.hurt = false;
      continue;
    }

    // State machine roteadora
    switch(e.type) {
      case 'suka':
         updateSukaAI(e, p);
         break;
      case 'furio':
         updateFurioAI(e, p);
         break;
      default:
         updateBasicEnemyAI(e, p);
    }
  }
}
