import type { Enemy, Player } from '../types';

// IMPORTANTE: Tem de importar as funções específicas de IA de onde elas estiverem definidas!
// Exemplo (ajuste o caminho se necessário):
import { updateSukaAI, updateFurioAI, updateBasicEnemyAI } from './SpecificAI'; 

export function updateEnemies(enemies: Enemy[], p: Player) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    
    // Stun logic (Se estiver magoado, não se mexe)
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
