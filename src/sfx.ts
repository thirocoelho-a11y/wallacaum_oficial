// ═══════════════════════════════════════════════════════
//  sfx.ts — Gerador Procedural de Efeitos Sonoros 8-bits
// ═══════════════════════════════════════════════════════

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
export let isSFXMuted = false;

export const setSFXMute = (muted: boolean) => {
  isSFXMuted = muted;
};

export type SFXType = 'jump' | 'hit' | 'bufa' | 'eat' | 'shout';

export function playSFX(type: SFXType) {
  if (isSFXMuted) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  const now = audioCtx.currentTime;

  switch (type) {
    case 'jump':
      // Som rápido e agudo subindo
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
      break;

    case 'hit':
      // Impacto seco
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
      break;

    case 'bufa':
      // Onda grave descendente (vibração)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.4);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      break;

    case 'eat':
      // Dois bipes rápidos felizes
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
      break;

    case 'shout':
      // Som estridente e agressivo
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(450, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
      break;
  }
}