// ═══════════════════════════════════════════════════════
//  useTrainingEngine.ts — Motor da Fase 4 (RPG por Turnos)
//
//  FIXES APLICADOS:
//  ✅ FIX 1: setTimeout → pendingState (sem race condition)
//  ✅ FIX 3: Minigame barra funciona corretamente
//  ✅ FIX: default em advanceAfterDialogue (nunca trava)
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import type { PlayerPowers } from './types';
import { MAX_HP } from './constants';
import { playSFX } from './sfx';
import type { AnciaoSpriteState, WallacaumSpriteState } from './spritesFase4';

// ─────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────
export type BattlePhase =
  | 'dialogue'
  | 'menu'
  | 'submenu'
  | 'minigame_bar'
  | 'minigame_raio'
  | 'player_action'
  | 'enemy_action'
  | 'result'
  | 'complete';

export type MenuOption = 'golpe' | 'bufa' | 'item' | 'meditar';
export type BufaLevel = 'brisa' | 'ventania' | 'furacao';
export type ItemOption = 'burgao' | 'agua';

export interface DialogueLine {
  speaker: 'anciao' | 'wallacaum' | 'davisaum' | 'sistema';
  text: string;
  color: string;
}

export interface BattleState {
  // ── Fase do combate ──
  phase: BattlePhase;
  turn: number;

  // ── HP e barras ──
  playerHp: number;
  playerMaxHp: number;
  anciaoHp: number;
  anciaoMaxHp: number;
  cxp: number;

  // ── Status ──
  playerConfused: boolean;
  anciaoAngry: boolean;
  playerLevel: number;
  anciaoLevel: number;

  // ── Sprites ──
  anciaoSprite: AnciaoSpriteState;
  wallacaumSprite: WallacaumSpriteState;
  showFxRaio: boolean;
  showFxVento: boolean;
  showFxPoeira: boolean;
  showFxBufa: boolean;

  // ── Diálogo ──
  dialogueQueue: DialogueLine[];
  dialogueIndex: number;
  currentText: string;
  textComplete: boolean;
  fullText: string;

  // ── Menu ──
  menuOptions: string[];
  menuIndex: number;
  submenuOpen: boolean;
  submenuOptions: string[];
  submenuIndex: number;

  // ── Minigame barra ──
  barPosition: number;
  barDirection: number;
  barSpeed: number;
  barTargetMin: number;
  barTargetMax: number;
  barStopped: boolean;
  barResult: 'none' | 'hit' | 'miss';

  // ── Minigame raio ──
  raioTimer: number;
  raioWindow: boolean;
  raioWindowTimer: number;
  raioResult: 'none' | 'hit' | 'miss';

  // ── Itens ──
  hasBurgao: boolean;
  hasAgua: boolean;

  // ── Poderes ──
  powers: PlayerPowers;

  // ── Animação ──
  animTimer: number;
  screenShake: number;
  frame: number;
  score: number;

  // ── FIX 1: Pending state (substitui setTimeout) ──
  pendingDialogue: DialogueLine[] | null;
  pendingTurn: number | null;
  pendingBarResult: boolean;
  pendingRaioResult: boolean;
  pendingComplete: boolean;

  // Typewriter frame counter (independente do frame global)
  twFrame: number;
}

// ─────────────────────────────────────────────────────
//  Constantes
// ─────────────────────────────────────────────────────
const PLAYER_MAX_HP = 100;
const ANCIAO_MAX_HP = 100;
const TYPEWRITER_SPEED = 2;
const ANIM_DURATION = 60;
const BAR_SPEED_BASE = 1.8;
const RAIO_COUNTDOWN = 180;
const RAIO_WINDOW = 30;

const MAIN_MENU: string[] = ['GOLPE', 'BUFA', 'ITEM', 'MEDITAR'];
const BUFA_SUBMENU: string[] = ['Brisa (fraca)', 'Ventania (média)', 'Furacão (carregada)'];
const ITEM_SUBMENU: string[] = ['Burgão Supremo', 'Água'];

// ─────────────────────────────────────────────────────
//  Scripts
// ─────────────────────────────────────────────────────
const SCRIPT_OPENING: DialogueLine[] = [
  { speaker: 'anciao', text: 'Você busca a força do trovão, mas seu estômago só conhece o caos da fritura.', color: '#9b59b6' },
  { speaker: 'sistema', text: 'Mestre Ancião desafia Wallaçaum para um treino!', color: '#f1c40f' },
];

const SCRIPT_TURN1_MISS: DialogueLine[] = [
  { speaker: 'anciao', text: 'Lento como um queijo derretido. A força sem foco é apenas ruído.', color: '#9b59b6' },
];

const SCRIPT_TURN1_ATTACK: DialogueLine[] = [
  { speaker: 'sistema', text: 'Mestre Ancião usou Tapa de Vento! -5 HP', color: '#e74c3c' },
  { speaker: 'anciao', text: 'Sua bufa é indisciplinada! Atira para todos os lados como um bueiro estourado.', color: '#9b59b6' },
];

const SCRIPT_TURN2_HIT: DialogueLine[] = [
  { speaker: 'anciao', text: 'Hm... um sopro de clareza. Mas as nuvens ainda estão pesadas.', color: '#9b59b6' },
  { speaker: 'sistema', text: 'CXP +25%! A Bufa está melhorando!', color: '#2ecc71' },
];

const SCRIPT_TURN2_MISS_STRONG: DialogueLine[] = [
  { speaker: 'anciao', text: 'Muita gordura saturada! O excesso cega o guerreiro.', color: '#e74c3c' },
  { speaker: 'sistema', text: 'Mestre Ancião usou Nuvem de Poeira! Precisão reduzida!', color: '#e67e22' },
];

const SCRIPT_TURN2_MISS_WEAK: DialogueLine[] = [
  { speaker: 'anciao', text: 'Fraco como chá sem açúcar. Onde está a convicção?', color: '#e74c3c' },
];

const SCRIPT_TURN3_SERMAO: DialogueLine[] = [
  { speaker: 'sistema', text: 'Mestre Ancião usou Sermão da Raiz!', color: '#f39c12' },
  { speaker: 'anciao', text: 'O hambúrguer é uma mentira circular. A raiz de mandioca é a verdade linear. Você entende o que eu digo?', color: '#9b59b6' },
  { speaker: 'sistema', text: 'Wallaçaum ficou CONFUSO!', color: '#e67e22' },
];

const SCRIPT_TURN3_BURGAO: DialogueLine[] = [
  { speaker: 'anciao', text: 'Sacrilégio! Você usa gordura trans em solo sagrado?!', color: '#e74c3c' },
  { speaker: 'sistema', text: 'Wallaçaum recuperou HP! Mas o Mestre ficou FURIOSO! Ataque dele aumentou!', color: '#f39c12' },
];

const SCRIPT_TURN3_AGUA: DialogueLine[] = [
  { speaker: 'anciao', text: 'Água. Sensato. Talvez haja esperança.', color: '#9b59b6' },
  { speaker: 'sistema', text: 'Wallaçaum recuperou 20 HP.', color: '#2ecc71' },
];

const SCRIPT_TURN3_MEDITAR: DialogueLine[] = [
  { speaker: 'sistema', text: 'Wallaçaum meditou! Confusão curada. +10 HP.', color: '#2ecc71' },
  { speaker: 'anciao', text: 'Silêncio interior. O primeiro passo verdadeiro.', color: '#9b59b6' },
];

const SCRIPT_TURN4_INTRO: DialogueLine[] = [
  { speaker: 'sistema', text: 'Mestre Ancião usou Chamado do Trovão!', color: '#f1c40f' },
  { speaker: 'anciao', text: 'A chuva não pede licença para cair. Ela flui. Sua bufa deve ser o raio que corta o silêncio!', color: '#9b59b6' },
  { speaker: 'sistema', text: 'Sincronize a Bufa com o raio! Aperte Z ou C no momento certo!', color: '#f1c40f' },
];

const SCRIPT_TURN4_HIT: DialogueLine[] = [
  { speaker: 'sistema', text: 'PERFEITO! A Bufa desviou o raio do Mestre!', color: '#2ecc71' },
  { speaker: 'sistema', text: 'CXP chegou a 100%!', color: '#f1c40f' },
];

const SCRIPT_TURN4_MISS: DialogueLine[] = [
  { speaker: 'sistema', text: 'O raio acertou! -10 HP. Tente novamente!', color: '#e74c3c' },
  { speaker: 'anciao', text: 'O timing é tudo. O trovão não espera. Tente de novo.', color: '#9b59b6' },
];

const SCRIPT_FINAL: DialogueLine[] = [
  { speaker: 'anciao', text: 'As nuvens se dissiparam em seu espírito. A Bufa Celeste agora tem um mestre.', color: '#9b59b6' },
  { speaker: 'sistema', text: '⭐ Sua Bufa agora é DIRECIONAL!', color: '#f1c40f' },
  { speaker: 'sistema', text: '⭐ BUFA CARREGADA desbloqueada!', color: '#f39c12' },
  { speaker: 'sistema', text: '⭐ RESISTÊNCIA A GÁS ativa!', color: '#2ecc71' },
  { speaker: 'anciao', text: 'Tome. O Combo de Raízes. Cura para a descida.', color: '#9b59b6' },
  { speaker: 'sistema', text: 'Recebeu: Combo de Raízes! HP totalmente restaurado!', color: '#2ecc71' },
];

// ─────────────────────────────────────────────────────
//  Estado inicial
// ─────────────────────────────────────────────────────
function createInitialState(initialHp: number, initialScore: number): BattleState {
  return {
    phase: 'dialogue',
    turn: 0,
    playerHp: Math.min(PLAYER_MAX_HP, initialHp),
    playerMaxHp: PLAYER_MAX_HP,
    anciaoHp: ANCIAO_MAX_HP,
    anciaoMaxHp: ANCIAO_MAX_HP,
    cxp: 0,
    playerConfused: false,
    anciaoAngry: false,
    playerLevel: 60,
    anciaoLevel: 95,
    anciaoSprite: 'idle',
    wallacaumSprite: 'back',
    showFxRaio: false,
    showFxVento: false,
    showFxPoeira: false,
    showFxBufa: false,
    dialogueQueue: [...SCRIPT_OPENING],
    dialogueIndex: 0,
    currentText: '',
    textComplete: false,
    fullText: SCRIPT_OPENING[0]?.text ?? '',
    menuOptions: MAIN_MENU,
    menuIndex: 0,
    submenuOpen: false,
    submenuOptions: [],
    submenuIndex: 0,
    barPosition: 0,
    barDirection: 1,
    barSpeed: BAR_SPEED_BASE,
    barTargetMin: 35,
    barTargetMax: 65,
    barStopped: false,
    barResult: 'none',
    raioTimer: 0,
    raioWindow: false,
    raioWindowTimer: 0,
    raioResult: 'none',
    hasBurgao: true,
    hasAgua: true,
    powers: {
      bufaDirecional: false,
      bufaCarregada: false,
      socoEletrico: false,
      resistenciaGas: false,
      bufaAntiSintetica: false,
    },
    animTimer: 0,
    screenShake: 0,
    frame: 0,
    score: initialScore,
    // FIX 1: Pending state
    pendingDialogue: null,
    pendingTurn: null,
    pendingBarResult: false,
    pendingRaioResult: false,
    pendingComplete: false,
    twFrame: 0,
  };
}

// ─────────────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────────────
interface TrainingConfig {
  initialHp: number;
  initialScore: number;
  onComplete: (score: number, hp: number) => void;
  onGameOver: (score: number) => void;
}

// ═══════════════════════════════════════════════════════
//  HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════
export default function useTrainingEngine(cfg: TrainingConfig) {
  const stateRef = useRef<BattleState>(createInitialState(cfg.initialHp, cfg.initialScore));
  const keysRef = useRef<Record<string, boolean>>({});
  const keyPressedRef = useRef<Record<string, boolean>>({});
  const completedRef = useRef(false);
  const cfgRef = useRef(cfg);
  const [tick, setTick] = useState(0);

  // Mantém cfgRef sempre atualizado (evita stale closure)
  useEffect(() => { cfgRef.current = cfg; });

  // ── Teclado ──
  useEffect(() => {
    const d = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter', 'c', 'z', 'x', 'escape'].includes(k)) e.preventDefault();
      if (!keysRef.current[k]) keyPressedRef.current[k] = true;
      keysRef.current[k] = true;
    };
    const u = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    const blur = () => { keysRef.current = {}; keyPressedRef.current = {}; };
    window.addEventListener('keydown', d, { passive: false });
    window.addEventListener('keyup', u);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', d);
      window.removeEventListener('keyup', u);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // ── Game Loop ──
  useEffect(() => {
    if (completedRef.current) return;
    let animId: number;

    const loop = () => {
      const s = stateRef.current;
      const kp = keyPressedRef.current;
      s.frame++;

      const clearPressed = () => { keyPressedRef.current = {}; };

      // ── Shake decay ──
      if (s.screenShake > 0) s.screenShake--;

      // ─────────────────────────────────────────────
      // FIX 1: AnimTimer com Pending State
      // Substitui todos os setTimeout por um mecanismo
      // determinístico sincronizado com o game loop.
      // ─────────────────────────────────────────────
      if (s.animTimer > 0) {
        s.animTimer--;

        if (s.animTimer <= 0) {
          // Resetar sprites visuais
          s.anciaoSprite = s.anciaoAngry ? 'angry' : 'idle';
          s.wallacaumSprite = 'back';
          s.showFxVento = false;
          s.showFxPoeira = false;
          s.showFxBufa = false;

          // Processar pending turn antes do diálogo
          if (s.pendingTurn !== null) {
            s.turn = s.pendingTurn;
            s.pendingTurn = null;
          }
          // Processar pending dialogue
          if (s.pendingDialogue !== null) {
            startDialogue(s, s.pendingDialogue);
            s.pendingDialogue = null;
          }
          // Processar resultado da barra
          if (s.pendingBarResult) {
            s.pendingBarResult = false;
            processBarResult(s);
          }
          // Processar resultado do raio
          if (s.pendingRaioResult) {
            s.pendingRaioResult = false;
            processRaioResult(s);
          }
          // Completar fase
          if (s.pendingComplete) {
            s.pendingComplete = false;
            completedRef.current = true;
            cfgRef.current.onComplete(s.score, s.playerHp);
          }
        }

        clearPressed();
        setTick(s.frame);
        animId = requestAnimationFrame(loop);
        return;
      }

      // ══════════════════════════════════════════
      //  FASE: DIÁLOGO (typewriter)
      // ══════════════════════════════════════════
      if (s.phase === 'dialogue') {
        const dlg = s.dialogueQueue[s.dialogueIndex];

        if (!dlg) {
          advanceAfterDialogue(s, cfgRef.current);
          clearPressed();
          setTick(s.frame);
          animId = requestAnimationFrame(loop);
          return;
        }

        s.twFrame++;

        if (!s.textComplete) {
          if (s.currentText.length < s.fullText.length) {
            if (s.twFrame % TYPEWRITER_SPEED === 0) {
              s.currentText = s.fullText.slice(0, s.currentText.length + 1);
            }
          }
          if (s.currentText.length >= s.fullText.length) {
            s.textComplete = true;
          }
          // Pular typewriter
          if (kp[' '] || kp['enter'] || kp['c'] || kp['z']) {
            s.currentText = s.fullText;
            s.textComplete = true;
          }
        } else {
          // Avançar diálogo
          if (kp[' '] || kp['enter'] || kp['c'] || kp['z']) {
            s.dialogueIndex++;
            if (s.dialogueIndex < s.dialogueQueue.length) {
              const next = s.dialogueQueue[s.dialogueIndex];
              s.fullText = next.text;
              s.currentText = '';
              s.textComplete = false;
              s.twFrame = 0;
            }
          }
        }
      }

      // ══════════════════════════════════════════
      //  FASE: MENU PRINCIPAL
      // ══════════════════════════════════════════
      if (s.phase === 'menu' && !s.submenuOpen) {
        if (kp['arrowup'] || kp['w']) {
          s.menuIndex = (s.menuIndex - 1 + s.menuOptions.length) % s.menuOptions.length;
          playSFX('hit');
        }
        if (kp['arrowdown'] || kp['s']) {
          s.menuIndex = (s.menuIndex + 1) % s.menuOptions.length;
          playSFX('hit');
        }
        if (kp[' '] || kp['enter'] || kp['z'] || kp['c']) {
          handleMenuSelect(s);
        }
      }

      // ══════════════════════════════════════════
      //  FASE: SUBMENU
      // ══════════════════════════════════════════
      if (s.phase === 'menu' && s.submenuOpen) {
        if (kp['arrowup'] || kp['w']) {
          s.submenuIndex = (s.submenuIndex - 1 + s.submenuOptions.length) % s.submenuOptions.length;
          playSFX('hit');
        }
        if (kp['arrowdown'] || kp['s']) {
          s.submenuIndex = (s.submenuIndex + 1) % s.submenuOptions.length;
          playSFX('hit');
        }
        if (kp['escape'] || kp['x']) {
          s.submenuOpen = false;
          playSFX('jump');
        }
        if (kp[' '] || kp['enter'] || kp['z'] || kp['c']) {
          handleSubmenuSelect(s);
        }
      }

      // ══════════════════════════════════════════
      //  FASE: MINIGAME BARRA
      //  FIX 3: Detecção de tecla robusta
      // ══════════════════════════════════════════
      if (s.phase === 'minigame_bar') {
        if (!s.barStopped) {
          s.barPosition += s.barDirection * s.barSpeed;
          if (s.barPosition >= 100) { s.barPosition = 100; s.barDirection = -1; }
          if (s.barPosition <= 0) { s.barPosition = 0; s.barDirection = 1; }

          if (s.playerConfused && s.frame % 30 === 0) {
            s.barDirection *= -1;
          }

          // FIX: usa kp (just pressed) para parar a barra
          if (kp[' '] || kp['enter'] || kp['c'] || kp['z']) {
            s.barStopped = true;
            const inZone = s.barPosition >= s.barTargetMin && s.barPosition <= s.barTargetMax;
            s.barResult = inZone ? 'hit' : 'miss';
            playSFX(inZone ? 'eat' : 'shout');

            // FIX 1: usar animTimer + pendingBarResult em vez de setTimeout
            s.animTimer = 40;
            s.pendingBarResult = true;
          }
        }
      }

      // ══════════════════════════════════════════
      //  FASE: MINIGAME RAIO
      // ══════════════════════════════════════════
      if (s.phase === 'minigame_raio') {
        s.raioTimer--;

        if (s.raioTimer < 60 && s.raioTimer > 30) {
          s.showFxRaio = true;
        }

        if (s.raioTimer <= RAIO_WINDOW && s.raioTimer > 0) {
          s.raioWindow = true;
        }

        // Apertar durante a janela
        if (s.raioWindow && s.raioResult === 'none' && (kp[' '] || kp['enter'] || kp['c'] || kp['z'])) {
          s.raioResult = 'hit';
          s.raioWindow = false;
          s.showFxBufa = true;
          s.wallacaumSprite = 'bufa';
          s.screenShake = 15;
          playSFX('bufa');
          // FIX 1: usar animTimer + pendingRaioResult em vez de setTimeout
          s.animTimer = ANIM_DURATION;
          s.pendingRaioResult = true;
        }

        // Janela passou sem apertar
        if (s.raioTimer <= 0 && s.raioResult === 'none') {
          s.raioResult = 'miss';
          s.screenShake = 10;
          playSFX('shout');
          s.showFxRaio = true;
          // FIX 1: usar animTimer + pendingRaioResult
          s.animTimer = ANIM_DURATION;
          s.pendingRaioResult = true;
        }
      }

      // ══════════════════════════════════════════
      //  GAME OVER
      // ══════════════════════════════════════════
      if (s.playerHp <= 0 && s.phase !== 'complete' && !completedRef.current) {
        completedRef.current = true;
        cfgRef.current.onGameOver(s.score);
      }

      clearPressed();
      setTick(s.frame);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return {
    state: stateRef.current,
    keysRef,
    keyPressedRef,
    tick,
  };
}

// ═══════════════════════════════════════════════════════
//  LÓGICA: Menu principal
// ═══════════════════════════════════════════════════════
function handleMenuSelect(s: BattleState): void {
  const option = s.menuOptions[s.menuIndex];
  playSFX('hit');

  switch (option) {
    case 'GOLPE':
      // FIX 1: usar pending em vez de setTimeout
      s.phase = 'player_action';
      s.wallacaumSprite = 'punch';
      s.animTimer = ANIM_DURATION;
      s.anciaoSprite = 'idle';
      s.pendingDialogue = [...SCRIPT_TURN1_MISS];
      s.pendingTurn = 1;
      break;

    case 'BUFA':
      s.submenuOpen = true;
      s.submenuOptions = BUFA_SUBMENU;
      s.submenuIndex = 0;
      break;

    case 'ITEM': {
      const items: string[] = [];
      if (s.hasBurgao) items.push('Burgão Supremo');
      if (s.hasAgua) items.push('Água');
      if (items.length === 0) items.push('(vazio)');
      s.submenuOpen = true;
      s.submenuOptions = items;
      s.submenuIndex = 0;
      break;
    }

    case 'MEDITAR':
      s.phase = 'player_action';
      s.wallacaumSprite = 'back';
      s.animTimer = 40;
      s.playerConfused = false;
      s.playerHp = Math.min(s.playerMaxHp, s.playerHp + 10);
      s.score += 25;
      s.pendingDialogue = [...SCRIPT_TURN3_MEDITAR];
      s.pendingTurn = 4;
      s.cxp = Math.min(100, s.cxp + 25);
      break;
  }
}

// ═══════════════════════════════════════════════════════
//  LÓGICA: Submenu
// ═══════════════════════════════════════════════════════
function handleSubmenuSelect(s: BattleState): void {
  const option = s.submenuOptions[s.submenuIndex];
  playSFX('hit');
  s.submenuOpen = false;

  // ── BUFA ──
  if (option === 'Brisa (fraca)' || option === 'Ventania (média)' || option === 'Furacão (carregada)') {
    s.phase = 'minigame_bar';
    s.barPosition = 0;
    s.barDirection = 1;
    s.barStopped = false;
    s.barResult = 'none';

    if (option === 'Brisa (fraca)') {
      s.barSpeed = BAR_SPEED_BASE;
      s.barTargetMin = 20; s.barTargetMax = 50;
    } else if (option === 'Ventania (média)') {
      s.barSpeed = BAR_SPEED_BASE * 1.3;
      s.barTargetMin = 35; s.barTargetMax = 65;
    } else {
      s.barSpeed = BAR_SPEED_BASE * 1.8;
      s.barTargetMin = 40; s.barTargetMax = 60;
    }
    return;
  }

  // ── ITENS ──
  if (option === 'Burgão Supremo') {
    s.hasBurgao = false;
    s.playerHp = Math.min(s.playerMaxHp, s.playerHp + 35);
    s.anciaoAngry = true;
    s.anciaoSprite = 'angry';
    s.score += 10;
    s.cxp = Math.min(100, s.cxp + 25);
    startDialogue(s, SCRIPT_TURN3_BURGAO);
    s.turn = 4;
    return;
  }

  if (option === 'Água') {
    s.hasAgua = false;
    s.playerHp = Math.min(s.playerMaxHp, s.playerHp + 20);
    s.score += 10;
    s.cxp = Math.min(100, s.cxp + 25);
    startDialogue(s, SCRIPT_TURN3_AGUA);
    s.turn = 4;
    return;
  }

  if (option === '(vazio)') {
    s.submenuOpen = false;
    return;
  }
}

// ═══════════════════════════════════════════════════════
//  LÓGICA: Resultado do minigame barra
// ═══════════════════════════════════════════════════════
function processBarResult(s: BattleState): void {
  if (s.barResult === 'hit') {
    s.wallacaumSprite = 'bufa';
    s.showFxBufa = true;
    s.cxp = Math.min(100, s.cxp + 25);
    s.score += 100;
    s.screenShake = 5;
    s.anciaoSprite = 'hurt';
    s.anciaoHp = Math.max(0, s.anciaoHp - 15);
    startDialogue(s, SCRIPT_TURN2_HIT);
    s.turn = s.turn < 3 ? 3 : 4;
  } else {
    const tooStrong = s.barPosition > s.barTargetMax;
    if (tooStrong) {
      s.showFxPoeira = true;
      s.playerConfused = true;
      startDialogue(s, SCRIPT_TURN2_MISS_STRONG);
    } else {
      startDialogue(s, SCRIPT_TURN2_MISS_WEAK);
    }
    s.turn = 2;
  }
}

// ═══════════════════════════════════════════════════════
//  LÓGICA: Resultado do minigame raio
// ═══════════════════════════════════════════════════════
function processRaioResult(s: BattleState): void {
  if (s.raioResult === 'hit') {
    s.cxp = 100;
    s.score += 200;
    s.screenShake = 15;
    s.showFxBufa = true;
    startDialogue(s, SCRIPT_TURN4_HIT);
    s.turn = 5;
  } else {
    const dmg = s.anciaoAngry ? 15 : 10;
    s.playerHp = Math.max(0, s.playerHp - dmg);
    s.screenShake = 10;
    s.showFxRaio = false;
    startDialogue(s, SCRIPT_TURN4_MISS);
    s.raioResult = 'none';
    // Fica no turno 4, pode tentar de novo
  }
}

// ═══════════════════════════════════════════════════════
//  LÓGICA: O que acontece depois dos diálogos
//  FIX: default case evita travamento
// ═══════════════════════════════════════════════════════
function advanceAfterDialogue(s: BattleState, cfg: TrainingConfig): void {
  switch (s.turn) {
    case 0:
      s.phase = 'menu';
      s.menuIndex = 0;
      break;

    case 1:
      // FIX 1: usar pending em vez de setTimeout
      s.phase = 'enemy_action';
      s.anciaoSprite = 'attack';
      s.showFxVento = true;
      s.screenShake = 6;
      s.playerHp = Math.max(0, s.playerHp - 5);
      s.animTimer = ANIM_DURATION;
      playSFX('shout');
      s.pendingDialogue = [...SCRIPT_TURN1_ATTACK];
      s.pendingTurn = 2;
      break;

    case 2:
      s.phase = 'menu';
      s.menuIndex = 1;
      break;

    case 3:
      s.anciaoSprite = 'idle';
      startDialogue(s, SCRIPT_TURN3_SERMAO);
      s.turn = 31;
      break;

    case 31:
      s.phase = 'menu';
      s.menuIndex = 2;
      break;

    case 4:
      s.showFxRaio = false;
      startDialogue(s, SCRIPT_TURN4_INTRO);
      s.turn = 41;
      break;

    case 41:
      s.phase = 'minigame_raio';
      s.raioTimer = RAIO_COUNTDOWN;
      s.raioWindow = false;
      s.raioResult = 'none';
      s.showFxRaio = false;
      break;

    case 5:
      startDialogue(s, SCRIPT_FINAL);
      s.turn = 6;
      break;

    case 6:
      // FIX 1: usar animTimer + pendingComplete em vez de setTimeout
      s.phase = 'complete';
      s.powers.bufaDirecional = true;
      s.powers.bufaCarregada = true;
      s.powers.resistenciaGas = true;
      s.powers.bufaAntiSintetica = true;
      s.playerHp = s.playerMaxHp;
      s.anciaoSprite = 'approve';
      s.score += 500;
      s.animTimer = 120;
      s.pendingComplete = true;
      break;

    default:
      // FIX: nunca trava — volta pro menu
      s.phase = 'menu';
      s.menuIndex = 0;
      break;
  }
}

// ─────────────────────────────────────────────────────
//  Helper: iniciar sequência de diálogo
// ─────────────────────────────────────────────────────
function startDialogue(s: BattleState, lines: DialogueLine[]): void {
  s.phase = 'dialogue';
  s.dialogueQueue = [...lines];
  s.dialogueIndex = 0;
  s.twFrame = 0;
  if (lines.length > 0) {
    s.fullText = lines[0].text;
    s.currentText = '';
    s.textComplete = false;
  }
}