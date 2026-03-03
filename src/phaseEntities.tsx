import {
  BASE_W,
  FOOD_SIZE,
  SPRITE_DAVIS_OFFSET_Y,
  SPRITE_ENEMY_OFFSET_Y,
  SPRITE_PLAYER_OFFSET_Y,
  SPRITE_PLAYER_W,
  PixelAgent,
  PixelDavisaum,
  PixelWallacaum,
  FoodItemComp,
  type Davisaum,
  type Enemy,
  type FoodItem,
  type Player,
  rng,
} from './gameCore';

export type SceneEntity =
  | { key: 'player'; type: 'player'; y: number; data: Player }
  | { key: 'davisaum'; type: 'davisaum'; y: number; data: Davisaum }
  | { key: string; type: 'enemy'; y: number; data: Enemy }
  | { key: string; type: 'food'; y: number; data: FoodItem };

export function buildSortedSceneEntities(player: Player, davisaum: Davisaum, enemies: Enemy[], food: FoodItem[]): SceneEntity[] {
  const entities: SceneEntity[] = new Array(2 + enemies.length + food.length);
  let idx = 0;
  entities[idx++] = { key: 'player', type: 'player', y: player.y, data: player };
  entities[idx++] = { key: 'davisaum', type: 'davisaum', y: davisaum.y, data: davisaum };

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    entities[idx++] = { key: enemy.id, type: 'enemy', y: enemy.y, data: enemy };
  }

  for (let i = 0; i < food.length; i++) {
    const item = food[i];
    entities[idx++] = { key: item.id, type: 'food', y: item.y, data: item };
  }

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
  if (screenX < -120 || screenX > BASE_W + 120) return null;

  if (entity.type === 'player') {
    const player = entity.data;
    return (
      <div
        key={entity.key}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate3d(${screenX - SPRITE_PLAYER_W / 2}px, ${player.y - SPRITE_PLAYER_OFFSET_Y - (player.z || 0)}px, 0)`,
          zIndex: Math.floor(player.y),
        }}
      >
        <PixelWallacaum
          direction={player.dir}
          isWalking={isPlayerMoving}
          isAttacking={player.attacking}
          isBuffa={player.buffing}
          isHurt={player.hurt}
          isEating={player.eating}
          jumpZ={player.z || 0}
          landSquash={player.landSquash}
          combo={player.combo}
          frame={frame}
        />
      </div>
    );
  }

  if (entity.type === 'davisaum') {
    const davisaum = entity.data;
    return (
      <div
        key={entity.key}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate3d(${screenX - 45}px, ${davisaum.y - SPRITE_DAVIS_OFFSET_Y}px, 0)`,
          zIndex: Math.floor(davisaum.y),
        }}
      >
        <PixelDavisaum
          direction={davisaum.dir}
          isWalking={davisaum.isWalking}
          isThrowing={davisaum.isThrowing}
          isScared={davisaum.isScared}
          frame={frame}
        />
      </div>
    );
  }

  if (entity.type === 'enemy') {
    const enemy = entity.data;
    return (
      <div
        key={entity.key}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate3d(${screenX - 45}px, ${enemy.y - SPRITE_ENEMY_OFFSET_Y}px, 0)`,
          zIndex: Math.floor(enemy.y),
        }}
      >
        <PixelAgent
          type={enemy.type}
          direction={enemy.dir}
          isWalking={enemy.walking}
          punchTimer={enemy.punchTimer}
          stateTimer={enemy.stateTimer}
          frame={frame}
          isHurt={enemy.hurt}
          hp={enemy.hp}
          maxHp={enemy.maxHp}
          charging={enemy.charging}
        />
      </div>
    );
  }

  const food = entity.data;
  return (
    <div
      key={entity.key}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate3d(${screenX - FOOD_SIZE / 2}px, ${food.y - FOOD_SIZE - 8}px, 0)`,
        zIndex: Math.floor(food.y) - 1,
      }}
    >
      <FoodItemComp type={food.type} landed={food.landed} />
    </div>
  );
}
