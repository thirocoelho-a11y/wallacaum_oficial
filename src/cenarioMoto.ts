// ═══════════════════════════════════════════════════════
//  cenarioMoto.ts — Backgrounds da Fase 3½ (Moto)
//
//  APENAS 2 imagens base64:
//  1. CENARIO_CIDADE — repete em loop durante toda a fase
//  2. CENARIO_MONTANHA — exibido ao final para mostrar
//     que o jogador chegou na montanha
//
//  O scroll horizontal é feito via CSS backgroundPositionX
//  com a velocidade proporcional à speed da moto.
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────
//  BACKGROUNDS BASE64
// ─────────────────────────────────────────────────────

/**
 * Cenário da cidade destruída — rua pós-apocalíptica.
 * Deve ser uma imagem horizontal tileable (as bordas
 * esquerda/direita se conectam pra scroll infinito).
 * Tamanho recomendado: 960×540 ou 1280×720
 */
export const CENARIO_CIDADE = ""; // INSIRA_O_BASE64_AQUI

/**
 * Cenário final da montanha — mostra que o jogador
 * chegou ao destino. Exibido apenas na conclusão da fase.
 * Não precisa ser tileable. Tamanho recomendado: 960×540
 */
export const CENARIO_MONTANHA = ""; // INSIRA_O_BASE64_AQUI

// ─────────────────────────────────────────────────────
//  PRELOADER
// ─────────────────────────────────────────────────────
const bgCache = new Map<string, HTMLImageElement>();

function loadBg(src: string): Promise<HTMLImageElement> {
  if (!src) return Promise.resolve(new Image());
  const cached = bgCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      bgCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** Preload dos backgrounds — chamar junto com preloadMotoSprites() */
export async function preloadMotoCenarios(): Promise<void> {
  const bgs = [CENARIO_CIDADE, CENARIO_MONTANHA].filter(s => s.length > 0);
  await Promise.all(bgs.map(loadBg));
}

// ─────────────────────────────────────────────────────
//  CONFIGURAÇÃO DE SCROLL
// ─────────────────────────────────────────────────────

/** Multiplicador de velocidade do scroll do background */
export const BG_SCROLL_SPEED = 0.6;

/**
 * Cor de fallback caso o base64 ainda não esteja preenchido.
 * O MotoRenderer usa essa cor como background-color por baixo.
 */
export const BG_FALLBACK_COLOR = '#2a2a3a';
