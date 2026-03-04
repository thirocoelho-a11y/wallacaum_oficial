import {
  BASE_W, FOOD_SIZE, SPRITE_DAVIS_OFFSET_Y, SPRITE_ENEMY_OFFSET_Y, SPRITE_PLAYER_OFFSET_Y, SPRITE_PLAYER_W,
  PixelAgent, PixelDavisaum, PixelWallacaum, FoodItemComp, rng,
  type Davisaum, type Enemy, type FoodItem, type Player
} from './gameCore';

export type SceneEntity =
  | { key: string; type: 'player'; y: number; data: Player }
  | { key: string; type: 'davisaum'; y: number; data: Davisaum }
  | { key: string; type: 'enemy'; y: number; data: Enemy }
  | { key: string; type: 'food'; y: number; data: FoodItem };

export function buildSortedSceneEntities(player: Player, davisaum: Davisaum, enemies: Enemy[], food: FoodItem[]): SceneEntity[] {
  const entities: SceneEntity[] = new Array(2 + enemies.length + food.length);
  let idx = 0;
  
  entities[idx++] = { key: 'player', type: 'player', y: player.y, data: player };
  entities[idx++] = { key: 'davisaum', type: 'davisaum', y: davisaum.y, data: davisaum };

  for (let i = 0; i < enemies.length; i++) {
    entities[idx++] = { key: enemies[i].id, type: 'enemy', y: enemies[i].y, data: enemies[i] };
  }
  for (let i = 0; i < food.length; i++) {
    entities[idx++] = { key: food[i].id, type: 'food', y: food[i].y, data: food[i] };
  }

  // Ordenação pelo eixo Y (falso 3D)
  return entities.sort((a, b) => a.y - b.y);
}

export function getShakeOffset(shake: number) {
  if (shake <= 0) return { x: 0, y: 0 };
  return {
    x: rng(-shake, shake),
    y: rng(-shake * 0.6, shake * 0.6),
  };
}

export function renderSceneEntity(entity: SceneEntity, cam: number, frame: number, isPlayerMoving: boolean) {
  const screenX = entity.data.x - cam;
  
  // Culling (Não renderiza o que está fora do ecrã)
  if (screenX < -120 || screenX > BASE_W + 120) return null;

  // Renderização comum com posicionamento absoluto injetado via CSS
  const renderWrapper = (offsetX: number, offsetY: number, child: JSX.Element) => (
    <div
      key={entity.key}
      style={{
        position: 'absolute', top: 0, left: 0,
        transform: `translate3d(${screenX - offsetX}px, ${entity.y - offsetY}px, 0)`,
        zIndex: Math.floor(entity.y),
      }}
    >
      {child}
    </div>
  );

  switch (entity.type) {
    case 'player':
      return renderWrapper(
        SPRITE_PLAYER_W / 2, 
        SPRITE_PLAYER_OFFSET_Y + (entity.data.z || 0), 
        <PixelWallacaum direction={entity.data.dir} isWalking={isPlayerMoving} isAttacking={entity.data.attacking} isBuffa={entity.data.buffing} isHurt={entity.data.hurt} isEating={entity.data.eating} jumpZ={entity.data.z || 0} landSquash={entity.data.landSquash} combo={entity.data.combo} frame={frame} />
      );
    case 'davisaum':
      return renderWrapper(45, SPRITE_DAVIS_OFFSET_Y, <PixelDavisaum direction={entity.data.dir} isWalking={entity.data.isWalking} isThrowing={entity.data.isThrowing} isScared={entity.data.isScared} frame={frame} />);
    case 'enemy':
      return renderWrapper(45, SPRITE_ENEMY_OFFSET_Y, <PixelAgent type={entity.data.type} direction={entity.data.dir} isWalking={entity.data.walking} punchTimer={entity.data.punchTimer} stateTimer={entity.data.stateTimer} frame={frame} isHurt={entity.data.hurt} hp={entity.data.hp} maxHp={entity.data.maxHp} charging={entity.data.charging} />);
    case 'food':
      return renderWrapper(FOOD_SIZE / 2, FOOD_SIZE + 8, <FoodItemComp type={entity.data.type} landed={entity.data.landed} />);
    default:
      return null;
  }
}
