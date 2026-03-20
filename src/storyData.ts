// ═══════════════════════════════════════════════════════
//  storyData.ts — Roteiro das Cutscenes (HQ)
//
//  Cada cena tem 4 painéis com:
//  - image: referência ao base64 do spritesComics.ts
//  - narration: texto de narração (caixa amarela)
//  - speech: fala de personagem (balão branco)
//  - speaker: quem fala (posiciona o balão)
//  - speechColor: cor da borda do balão
//
//  Para editar textos, mexa SÓ neste arquivo.
//  Para trocar imagens, mexa SÓ no spritesComics.ts.
// ═══════════════════════════════════════════════════════
import {
  INTRO_P1, INTRO_P2, INTRO_P3, INTRO_P4,
  TRANS1_P1, TRANS1_P2, TRANS1_P3, TRANS1_P4,
  TRANS2_P1, TRANS2_P2, TRANS2_P3, TRANS2_P4,
  TRANS3_P1, TRANS3_P2, TRANS3_P3, TRANS3_P4,
  TRANS4_P1, TRANS4_P2, TRANS4_P3, TRANS4_P4,
} from './spritesComics';

// ─────────────────────────────────────────────────────
//  Tipos locais (não polui types.ts)
// ─────────────────────────────────────────────────────
export type ComicSpeaker =
  | 'wallacaum' | 'davisaum'
  | 'suka' | 'furio' | 'anciao'
  | 'system';

export interface ComicPanel {
  /** Referência ao base64 da arte (de spritesComics.ts) */
  image: string;
  /** Texto de narração — caixa amarela no rodapé do painel */
  narration?: string;
  /** Fala de personagem — balão branco com rabinho */
  speech?: string;
  /** Quem está falando (posiciona o balão esq/dir) */
  speaker?: ComicSpeaker;
  /** Cor da borda do balão de fala */
  speechColor?: string;
}

export interface ComicScene {
  /** Identificador único da cena */
  id: string;
  /** 4 painéis da cena */
  panels: [ComicPanel, ComicPanel, ComicPanel, ComicPanel];
}

// ═══════════════════════════════════════════════════════
//  CENAS
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────
//  INTRO — Antes da Fase 1
// ─────────────────────────────────────────────────────
export const INTRO_STORY: ComicScene = {
  id: 'intro',
  panels: [
    {
      image: INTRO_P1,
      narration: 'A cidade não é mais a mesma. Suplementos sintéticos tomaram o controle das ruas.',
    },
    {
      image: INTRO_P2,
      speech: 'Wallaçaum! Eles tão quebrando tudo no X-Burgão!',
      speaker: 'davisaum',
      speechColor: '#3498db',
    },
    {
      image: INTRO_P3,
      speech: 'Ninguém desperdiça comida de verdade na minha frente...',
      speaker: 'wallacaum',
      speechColor: '#2ecc71',
    },
    {
      image: INTRO_P4,
      narration: 'A Suka Barulhenta acha que manda na rua. É hora de limpar a área.',
    },
  ],
};

// ─────────────────────────────────────────────────────
//  TRANSIÇÃO 1→2 — Suka derrotada, rumo à fábrica
// ─────────────────────────────────────────────────────
export const TRANSITION_1_TO_2: ComicScene = {
  id: 'trans_1to2',
  panels: [
    {
      image: TRANS1_P1,
      narration: 'A Suka Barulhenta caiu. Mas ela era só um peão.',
    },
    {
      image: TRANS1_P2,
      speech: 'Aquele pó falso vem de um lugar só... A fábrica NutriControl.',
      speaker: 'wallacaum',
      speechColor: '#2ecc71',
    },
    {
      image: TRANS1_P3,
      narration: 'Lá, Furio manipula o mercado com suplementos batizados.',
    },
    {
      image: TRANS1_P4,
      speech: 'Pode vir, Wallaçaum. Minha fábrica será o seu túmulo!',
      speaker: 'furio',
      speechColor: '#e74c3c',
    },
  ],
};

// ─────────────────────────────────────────────────────
//  TRANSIÇÃO 2→3 — Fábrica explode, zumbis na rua
// ─────────────────────────────────────────────────────
export const TRANSITION_2_TO_3: ComicScene = {
  id: 'trans_2to3',
  panels: [
    {
      image: TRANS2_P1,
      narration: 'A fábrica caiu. Mas as caldeiras romperam...',
    },
    {
      image: TRANS2_P2,
      narration: 'O gás tóxico do suplemento vazou pelas ruas de São Burgão.',
    },
    {
      image: TRANS2_P3,
      speech: 'Mano, a galera tá virando zumbi flatulento! A Bufa não faz efeito neles!',
      speaker: 'davisaum',
      speechColor: '#f1c40f',
    },
    {
      image: TRANS2_P4,
      speech: 'E pior... a Suka voltou. Com uma armadura Mark II.',
      speaker: 'wallacaum',
      speechColor: '#2ecc71',
    },
  ],
};

// ─────────────────────────────────────────────────────
//  TRANSIÇÃO 3→Moto — Fuga de moto
// ─────────────────────────────────────────────────────
export const TRANSITION_3_TO_MOTO: ComicScene = {
  id: 'trans_3tomoto',
  panels: [
    {
      image: TRANS3_P1,
      narration: 'Suka foi derrotada novamente, mas a horda de zumbis era infinita.',
    },
    {
      image: TRANS3_P2,
      speech: 'A gente precisa de um milagre. Ou de um veículo muito rápido!',
      speaker: 'davisaum',
      speechColor: '#3498db',
    },
    {
      image: TRANS3_P3,
      speech: 'Achei a moto do entregador do X-Burgão! Sobe, rápido!',
      speaker: 'wallacaum',
      speechColor: '#f1c40f',
    },
    {
      image: TRANS3_P4,
      narration: 'Próxima parada: As Pedras Agudas. O refúgio do Ancião.',
    },
  ],
};

// ─────────────────────────────────────────────────────
//  TRANSIÇÃO Moto→4 — Chegada na montanha
// ─────────────────────────────────────────────────────
export const TRANSITION_MOTO_TO_4: ComicScene = {
  id: 'trans_mototo4',
  panels: [
    {
      image: TRANS4_P1,
      narration: 'Após a fuga alucinante, os pneus derreteram na base da montanha.',
    },
    {
      image: TRANS4_P2,
      speech: 'Sobrevivemos... mas como vamos derrotar essa infestação?',
      speaker: 'davisaum',
      speechColor: '#3498db',
    },
    {
      image: TRANS4_P3,
      narration: 'No topo das Pedras Agudas, uma figura os aguardava.',
    },
    {
      image: TRANS4_P4,
      speech: 'Sua Bufa é forte, mas indisciplinada. O treinamento começa agora.',
      speaker: 'anciao',
      speechColor: '#9b59b6',
    },
  ],
};
