// ═══════════════════════════════════════════════════════
//  spritesMoto.ts — Sprites Base64 da Fase 3½ (Moto)
//
//  TODAS as imagens são strings Base64.
//  Preencha cada constante com o data URI correspondente.
//  Formato: "data:image/png;base64,XXXXXXX..."
//
//  Após preencher, chame preloadMotoSprites() antes de
//  iniciar o game loop para garantir que todas as Image
//  estejam decodificadas e prontas.
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────
//  MOTO + PERSONAGENS
// ─────────────────────────────────────────────────────
/** Moto com Wallaçaum pilotando + Davisaum atrás (idle) */
export const SPRITE_MOTO_IDLE = ""; // INSIRA_O_BASE64_AQUI

/** Moto com Wallaçaum dando soco lateral */
export const SPRITE_MOTO_PUNCH = ""; // INSIRA_O_BASE64_AQUI

/** Moto no ar (pulo) */
export const SPRITE_MOTO_JUMP = ""; // INSIRA_O_BASE64_AQUI

/** Moto com efeito turbo (chamas no escape) */
export const SPRITE_MOTO_TURBO = ""; // INSIRA_O_BASE64_AQUI

/** Moto com escudo ativo (bolha azul ao redor) */
export const SPRITE_MOTO_SHIELD = ""; // INSIRA_O_BASE64_AQUI

// ─────────────────────────────────────────────────────
//  OBSTÁCULOS
// ─────────────────────────────────────────────────────
/** Zumbi parado na pista (braços estendidos, gás verde) */
export const SPRITE_OBS_ZUMBI = ""; // INSIRA_O_BASE64_AQUI

/** Carro enferrujado abandonado */
export const SPRITE_OBS_CARRO = ""; // INSIRA_O_BASE64_AQUI

/** Nuvem de gás tóxico verde (ocupa 2 faixas) */
export const SPRITE_OBS_GAS = ""; // INSIRA_O_BASE64_AQUI

/** Buraco no asfalto */
export const SPRITE_OBS_BURACO = ""; // INSIRA_O_BASE64_AQUI

/** Zumbi corredor (vem correndo, precisa socar) */
export const SPRITE_OBS_ZUMBI_CORREDOR = ""; // INSIRA_O_BASE64_AQUI

/** Barreira de construção (ocupa 3 faixas, pular) */
export const SPRITE_OBS_BARREIRA = ""; // INSIRA_O_BASE64_AQUI

// ─────────────────────────────────────────────────────
//  ITENS COLETÁVEIS
// ─────────────────────────────────────────────────────
/** Burger (+15 HP) */
export const SPRITE_ITEM_BURGER = ""; // INSIRA_O_BASE64_AQUI

/** Turbo (velocidade 2x por 3s) */
export const SPRITE_ITEM_TURBO = ""; // INSIRA_O_BASE64_AQUI

/** Escudo (absorve 1 hit) */
export const SPRITE_ITEM_ESCUDO = ""; // INSIRA_O_BASE64_AQUI

// ─────────────────────────────────────────────────────
//  DIMENSÕES (largura × altura em pixels)
// ─────────────────────────────────────────────────────
export const MOTO_SPRITE_SIZE = { width: 100, height: 55 } as const;

export const OBSTACLE_SIZES: Record<string, { width: number; height: number }> = {
  zumbi:          { width: 35, height: 50 },
  carro:          { width: 70, height: 35 },
  gas:            { width: 90, height: 45 },
  buraco:         { width: 50, height: 15 },
  zumbi_corredor: { width: 30, height: 50 },
  barreira:       { width: 120, height: 40 },
};

export const ITEM_SIZES: Record<string, { width: number; height: number }> = {
  burger: { width: 22, height: 22 },
  turbo:  { width: 24, height: 24 },
  escudo: { width: 26, height: 26 },
};

// ─────────────────────────────────────────────────────
//  SELETORES — retorna o base64 correto por estado
// ─────────────────────────────────────────────────────
import type { RoadObstacleType, RoadItemType } from './types';

/** Retorna o sprite da moto baseado no estado atual */
export function getMotoSprite(state: {
  punching: boolean;
  jumping: boolean;
  turboActive: boolean;
  shieldActive: boolean;
}): string {
  if (state.jumping)      return SPRITE_MOTO_JUMP;
  if (state.punching)     return SPRITE_MOTO_PUNCH;
  if (state.shieldActive) return SPRITE_MOTO_SHIELD;
  if (state.turboActive)  return SPRITE_MOTO_TURBO;
  return SPRITE_MOTO_IDLE;
}

/** Retorna o sprite do obstáculo por tipo */
export function getObstacleSprite(type: RoadObstacleType): string {
  switch (type) {
    case 'zumbi':          return SPRITE_OBS_ZUMBI;
    case 'carro':          return SPRITE_OBS_CARRO;
    case 'gas':            return SPRITE_OBS_GAS;
    case 'buraco':         return SPRITE_OBS_BURACO;
    case 'zumbi_corredor': return SPRITE_OBS_ZUMBI_CORREDOR;
    case 'barreira':       return SPRITE_OBS_BARREIRA;
    default:               return SPRITE_OBS_ZUMBI;
  }
}

/** Retorna o sprite do item por tipo */
export function getItemSprite(type: RoadItemType): string {
  switch (type) {
    case 'burger': return SPRITE_ITEM_BURGER;
    case 'turbo':  return SPRITE_ITEM_TURBO;
    case 'escudo': return SPRITE_ITEM_ESCUDO;
    default:       return SPRITE_ITEM_BURGER;
  }
}

// ─────────────────────────────────────────────────────
//  PRELOADER — converte base64 em HTMLImageElement
//  Chame ANTES do game loop iniciar.
// ─────────────────────────────────────────────────────
const imageCache = new Map<string, HTMLImageElement>();

/** Carrega uma string base64 e retorna a Image cacheada */
function loadImage(src: string): Promise<HTMLImageElement> {
  if (!src) return Promise.resolve(new Image());
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** Retorna Image do cache (usar dentro do render) */
export function getCachedImage(src: string): HTMLImageElement | null {
  return imageCache.get(src) ?? null;
}

/** Preload de TODOS os sprites da moto — retorna Promise */
export async function preloadMotoSprites(): Promise<void> {
  const allSprites = [
    // Moto
    SPRITE_MOTO_IDLE,
    SPRITE_MOTO_PUNCH,
    SPRITE_MOTO_JUMP,
    SPRITE_MOTO_TURBO,
    SPRITE_MOTO_SHIELD,
    // Obstáculos
    SPRITE_OBS_ZUMBI,
    SPRITE_OBS_CARRO,
    SPRITE_OBS_GAS,
    SPRITE_OBS_BURACO,
    SPRITE_OBS_ZUMBI_CORREDOR,
    SPRITE_OBS_BARREIRA,
    // Itens
    SPRITE_ITEM_BURGER,
    SPRITE_ITEM_TURBO,
    SPRITE_ITEM_ESCUDO,
  ].filter(s => s.length > 0); // ignora placeholders vazios

  await Promise.all(allSprites.map(loadImage));
}
