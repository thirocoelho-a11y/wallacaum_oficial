// ═══════════════════════════════════════════════════════
//  utils.ts — Funções utilitárias puras (zero React)
// ═══════════════════════════════════════════════════════
import type { Particle } from './types';
import { MAX_PARTICLES } from './constants';

export const rng = (a: number, b: number): number => Math.random() * (b - a) + a;
export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
export const dist = (ax: number, ay: number, bx: number, by: number): number =>
  Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);

let _id = 0;
export const uid = (): string => `u${++_id}`;
export const resetUid = (): void => { _id = 0; };

export function spawnParticles(
  arr: Particle[], count: number, x: number, y: number,
  color: string, type: Particle['type'] = 'hit',
  spread = 4, life = 20, size = 4,
): void {
  for (let i = 0; i < count && arr.length < MAX_PARTICLES; i++) {
    arr.push({
      id: uid(), x, y,
      vx: rng(-spread, spread),
      vy: rng(-spread * 0.8, -0.5),
      life, maxLife: life, color,
      size: rng(size * 0.5, size * 1.2), type,
    });
  }
}
