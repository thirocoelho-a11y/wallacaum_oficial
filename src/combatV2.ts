// ═══════════════════════════════════════════════════════
//  combatV2.ts — Sistema de combate evoluído (Fases 3-5)
//
//  Substitui updatePlayerAttacks e checkPlayerHits nas fases novas.
//  Fases 1-2 continuam usando combat.ts original.
//
//  Mecânicas novas:
//  ┌─────────────────────────┬──────────────────────────────────┐
//  │ Pré-treino (Fases 3/3½) │ Pós-treino (Fases 4/5)          │
//  ├─────────────────────────┼──────────────────────────────────┤
//  │ Bufa 360° (original)    │ Bufa Direcional (na dir. olhada) │
//  │ Zumbis ABSORVEM bufa    │ Bufa Anti-Sintética (dano zumbi) │
//  │ Suka MK2 absorve bufa   │ Bufa Carregada (segurar C 2s)    │
//  │ Soco normal             │ Soco Elétrico (combo 8+)         │
//  │ Dano cheio de gás       │ Resistência a gás (50%)          │
//  └─────────────────────────┴──────────────────────────────────┘
// ═══════════════════════════════════════════════════════
import type { Player, Enemy, Particle, FloatingTextData, MutableRef } from './types';
import {
  PUNCH_DURATION, PUNCH_ACTIVE, PUNCH_RANGE, PUNCH_DEPTH, PUNCH_DAMAGE,
  BUFA_DURATION, BUFA_ACTIVE_START, BUFA_RANGE, BUFA_DEPTH,
  BUFA_DAMAGE_NORMAL, BUFA_DAMAGE_BOSS,
  HITSTOP_FRAMES, COMBO_TIMEOUT,
  BUFA_CHARGE_TIME_FULL, BUFA_CHARGED_DAMAGE, BUFA_CHARGED_RANGE, BUFA_CHARGED_DEPTH,
  SOCO_ELETRICO_COMBO_REQ, SOCO_ELETRICO_BONUS_DAMAGE, SOCO_ELETRICO_STUN,
  BUFA_ANTI_SINTETICA_DAMAGE,
  getEnemyWidth, isBossType,
} from './constants';
import { uid, spawnParticles } from './utils';
import { playSFX } from './sfx';

// ─────────────────────────────────────────────────────
//  Helper: inimigo é tipo zumbi?
// ─────────────────────────────────────────────────────
function isZumbiType(type: string): boolean {
  return type === 'zumbi' || type === 'zumbi_turbo' || type === 'zumbi_blindado';
}

// ─────────────────────────────────────────────────────
//  Helper: inimigo absorve bufa? (pré power-up)
//  Zumbis absorvem a bufa original.
//  Suka MK2 absorve quando escudo ativo.
// ─────────────────────────────────────────────────────
function enemyAbsorbsBufa(e: Enemy, playerHasAntiSintetica: boolean): boolean {
  // Pós power-up: bufa V2 não é mais absorvida por zumbis
  if (playerHasAntiSintetica && isZumbiType(e.type)) return false;

  // Zumbis sem power-up: absorvem
  if (isZumbiType(e.type) && !playerHasAntiSintetica) return true;

  // Suka MK2 com escudo ativo: absorve
  if (e.type === 'suka_mk2' && e.absorbing) return true;

  // Fúria Final com armadura (100% bufa no estágio 1): não absorve mas resiste
  // → tratado no dano reduzido, não na absorção completa

  return false;
}

// ─────────────────────────────────────────────────────
//  updatePlayerAttacksV2
//  Substitui updatePlayerAttacks para fases 3-5.
//  Adiciona: bufa carregada (segurar C), soco elétrico.
// ─────────────────────────────────────────────────────
export function updatePlayerAttacksV2(
  p: Player, k: Record<string, boolean>,
  enemies: Enemy[], screenShakeRef: MutableRef<number>,
  particles: Particle[], texts: FloatingTextData[], f: number,
): void {
  const hasPowers = !!p.powers;
  const hasCharge = p.powers?.bufaCarregada ?? false;

  // ── Soco (mesmo do original) ──
  if (k['x'] && !p.attacking && !p.buffing && p.atkTimer <= 0) {
    p.attacking = true; p.atkTimer = PUNCH_DURATION;
    enemies.forEach(e => e.hitThisSwing = false);
  }
  if (p.atkTimer > 0) { p.atkTimer--; if (p.atkTimer <= 0) p.attacking = false; }

  // ── Bufa com sistema de carga ──
  if (hasCharge) {
    // Segurando C: carrega
    if (k['c'] && !p.buffing && !p.attacking) {
      if (!p.chargeTimer) p.chargeTimer = 0;
      p.chargeTimer++;

      // Feedback visual de carga
      if (p.chargeTimer === 1) {
        texts.push({ id: uid(), text: '⚡ CARREGANDO...', x: p.x, y: p.y - 70, color: '#2ecc71', size: 8, t: f });
      }
      if (p.chargeTimer === BUFA_CHARGE_TIME_FULL) {
        p.chargeReady = true;
        texts.push({ id: uid(), text: '🔥 BUFA MÁXIMA!', x: p.x, y: p.y - 80, color: '#f1c40f', size: 12, t: f });
        spawnParticles(particles, 6, p.x, p.y - 40, '#f1c40f', 'spark', 4, 20, 5);
        screenShakeRef.current = 6;
      }
      // Partículas durante carga
      if (p.chargeTimer > 30 && f % 8 === 0) {
        const chargeColor = p.chargeReady ? '#f1c40f' : '#2ecc71';
        spawnParticles(particles, 1, p.x + (Math.random() - 0.5) * 30, p.y - 30, chargeColor, 'spark', 2, 12, 3);
      }

    // Soltou C: dispara bufa (normal ou carregada)
    } else if (!k['c'] && p.chargeTimer && p.chargeTimer > 0 && !p.buffing) {
      if (p.chargeReady) {
        // ── BUFA CARREGADA ──
        p.buffing = true; p.buffTimer = BUFA_DURATION + 10;
        playSFX('bufa');
        enemies.forEach(e => e.hitThisSwing = false);
        screenShakeRef.current = 16;
        spawnParticles(particles, 12, p.x, p.y - 35, '#f1c40f', 'ring', 10, 25, 10);
        spawnParticles(particles, 8, p.x, p.y - 35, '#2ecc71', 'spark', 8, 18, 6);
        texts.push({ id: uid(), text: '⚡ BUFA CELESTE V2! ⚡', x: p.x, y: p.y - 90, color: '#f1c40f', size: 14, t: f });
      } else {
        // ── Bufa normal (toque rápido ou carga insuficiente) ──
        p.buffing = true; p.buffTimer = BUFA_DURATION;
        playSFX('bufa');
        enemies.forEach(e => e.hitThisSwing = false);
        screenShakeRef.current = 8;
      }
      p.chargeTimer = 0;
      p.chargeReady = false;

    // Nem segurando nem soltando: reset
    } else if (!k['c']) {
      p.chargeTimer = 0;
      p.chargeReady = false;
    }
  } else {
    // ── Bufa sem carga (pré-treino, comportamento original) ──
    if (k['c'] && !p.buffing && !p.attacking && p.buffTimer <= 0) {
      p.buffing = true; p.buffTimer = BUFA_DURATION;
      playSFX('bufa');
      enemies.forEach(e => e.hitThisSwing = false);
      screenShakeRef.current = 8;
    }
  }

  if (p.buffTimer > 0) { p.buffTimer--; if (p.buffTimer <= 0) p.buffing = false; }

  // Hurt / invincible / combo decay (mesmo do original)
  if (p.hurtTimer > 0) { p.hurtTimer--; if (p.hurtTimer <= 0) p.hurt = false; }
  if (p.invincible > 0) p.invincible--;
  if (p.comboTimer > 0) { p.comboTimer--; if (p.comboTimer <= 0) p.combo = 0; }
  if (screenShakeRef.current > 0) screenShakeRef.current--;
}

// ─────────────────────────────────────────────────────
//  checkPlayerHitsV2
//  Substitui checkPlayerHits para fases 3-5.
//  Adiciona: absorção, bufa direcional, soco elétrico,
//            bufa anti-sintética, bufa carregada.
// ─────────────────────────────────────────────────────
export function checkPlayerHitsV2(
  e: Enemy, p: Player,
  particles: Particle[], texts: FloatingTextData[], f: number,
): boolean {
  const ew = getEnemyWidth(e.type) / 2;
  const hx = Math.max(0, Math.abs(e.x - p.x) - ew);
  const hy = Math.abs(e.y - p.y);
  const pf2 = PUNCH_DURATION - p.atkTimer;

  const hasPowers = !!p.powers;
  const hasDirecional = p.powers?.bufaDirecional ?? false;
  const hasAntiSint = p.powers?.bufaAntiSintetica ?? false;
  const hasEletrico = p.powers?.socoEletrico ?? false;
  const isCharged = (p.buffTimer ?? 0) > BUFA_DURATION; // Bufa carregada tem timer > BUFA_DURATION

  // ── Facing check ──
  // Bufa direcional: só atinge na direção olhada
  // Bufa original (pré-treino): 360°, sem check de facing
  const facPunch = p.dir === 'right' ? e.x > p.x - 10 : e.x < p.x + 10;
  const facBufa = hasDirecional ? facPunch : true; // 360° se não tem direcional

  // ═══════════════════════════════════════
  //  SOCO (com soco elétrico se combo 8+)
  // ═══════════════════════════════════════
  if (p.attacking && pf2 >= PUNCH_ACTIVE[0] && pf2 <= PUNCH_ACTIVE[1]
    && hx < PUNCH_RANGE && hy < PUNCH_DEPTH && facPunch && !e.hitThisSwing) {
    e.hitThisSwing = true; playSFX('hit');

    let dmg = PUNCH_DAMAGE;
    let particleColor = '#f1c40f';
    let stunBonus = 0;

    // Soco Elétrico: combo 8+ com power-up
    if (hasEletrico && p.combo >= SOCO_ELETRICO_COMBO_REQ) {
      dmg += SOCO_ELETRICO_BONUS_DAMAGE;
      stunBonus = SOCO_ELETRICO_STUN;
      particleColor = '#3498db';
      spawnParticles(particles, 4, (p.x + e.x) / 2, e.y - 40, '#3498db', 'electric', 5, 15, 4);
      texts.push({ id: uid(), text: `⚡ -${dmg}`, x: e.x, y: e.y - 60, color: '#3498db', size: 16, t: f });
    } else {
      texts.push({ id: uid(), text: `-${dmg}`, x: e.x, y: e.y - 50, color: '#f1c40f', size: 14, t: f });
    }

    e.hp -= dmg; e.hurt = true; e.hurtTimer = 10 + stunBonus;
    e.kbx = p.dir === 'right' ? 7 : -7; e.kby = (e.y - p.y) * 0.05;
    if (stunBonus > 0) e.atkCd = Math.max(e.atkCd, stunBonus);
    p.combo++; p.comboTimer = COMBO_TIMEOUT; p.hitstop = HITSTOP_FRAMES;
    spawnParticles(particles, 5, (p.x + e.x) / 2, e.y - 40, particleColor, 'spark', 4, 12, 4);

    // Bufa anti-sintética passiva no soco: reseta regen dos zumbis
    if (hasAntiSint && isZumbiType(e.type)) {
      e.regenTimer = 0;
    }
  }

  // ═══════════════════════════════════════
  //  BUFA (com absorção / direcional / carregada / anti-sintética)
  // ═══════════════════════════════════════
  const bufaActive = p.buffing && p.buffTimer < (BUFA_DURATION - BUFA_ACTIVE_START);
  const chargedBufaActive = p.buffing && isCharged && p.buffTimer < (BUFA_DURATION + 10 - BUFA_ACTIVE_START);

  // Range: carregada tem range/depth muito maiores
  const bufaRange = chargedBufaActive ? BUFA_CHARGED_RANGE : BUFA_RANGE;
  const bufaDepth = chargedBufaActive ? BUFA_CHARGED_DEPTH : BUFA_DEPTH;

  if ((bufaActive || chargedBufaActive) && hx < bufaRange && hy < bufaDepth && facBufa && !e.hitThisSwing) {

    // ── CHECK: Inimigo absorve bufa? ──
    if (enemyAbsorbsBufa(e, hasAntiSint)) {
      e.hitThisSwing = true;

      if (isZumbiType(e.type)) {
        // Zumbi CURA com a bufa original
        const healAmt = 2;
        e.hp = Math.min(e.maxHp, e.hp + healAmt);
        e.regenTimer = 0; // Reset regen timer
        spawnParticles(particles, 5, e.x, e.y - 35, '#44ff44', 'ring', 4, 20, 6);
        texts.push({ id: uid(), text: `+${healAmt} ABSORVEU!`, x: e.x, y: e.y - 55, color: '#44ff44', size: 12, t: f });
      } else if (e.type === 'suka_mk2' && e.absorbing) {
        // Suka MK2 absorve pra contra-ataque (carrega energia)
        spawnParticles(particles, 6, e.x, e.y - 35, '#8844ff', 'ring', 5, 20, 8);
        texts.push({ id: uid(), text: '🛡 ABSORVIDO!', x: e.x, y: e.y - 55, color: '#8844ff', size: 12, t: f });
      }

      return false; // Não morreu, absorveu
    }

    // ── Bufa atinge normalmente ──
    e.hitThisSwing = true;

    let dmg: number;
    let kbForce: number;
    let particleColor = '#2ecc71';
    let particleType: 'spark' | 'ring' | 'electric' = 'spark';

    if (chargedBufaActive) {
      // BUFA CARREGADA: dano massivo, knockback enorme
      dmg = BUFA_CHARGED_DAMAGE;
      kbForce = 20;
      particleColor = '#f1c40f';
      particleType = 'ring';
      spawnParticles(particles, 10, (p.x + e.x) / 2, e.y - 40, '#f1c40f', 'ring', 8, 25, 10);
      spawnParticles(particles, 6, (p.x + e.x) / 2, e.y - 40, '#2ecc71', 'spark', 6, 18, 5);
      texts.push({ id: uid(), text: `💥 -${dmg}`, x: e.x, y: e.y - 55, color: '#f1c40f', size: 20, t: f });
    } else if (hasAntiSint && isZumbiType(e.type)) {
      // BUFA ANTI-SINTÉTICA: dano em zumbis + bloqueia regen
      dmg = BUFA_ANTI_SINTETICA_DAMAGE;
      kbForce = 14;
      particleColor = '#00ccff';
      e.regenTimer = 0; // Impede regeneração
      spawnParticles(particles, 6, (p.x + e.x) / 2, e.y - 40, '#00ccff', 'electric', 5, 16, 5);
      texts.push({ id: uid(), text: `-${dmg} 🚫`, x: e.x, y: e.y - 55, color: '#00ccff', size: 16, t: f });
    } else {
      // BUFA NORMAL (direcional ou 360°)
      dmg = isBossType(e.type) ? BUFA_DAMAGE_BOSS : BUFA_DAMAGE_NORMAL;
      kbForce = 14;
      texts.push({ id: uid(), text: `-${dmg}`, x: e.x, y: e.y - 50, color: '#2ecc71', size: 18, t: f });
    }

    e.hp -= dmg; e.hurt = true; e.hurtTimer = 18;
    e.kbx = (e.x - p.x) > 0 ? kbForce : -kbForce;
    e.kby = (e.y - p.y) * 0.08;
    p.combo++; p.comboTimer = COMBO_TIMEOUT;
    p.hitstop = chargedBufaActive ? HITSTOP_FRAMES + 4 : HITSTOP_FRAMES + 2;
    spawnParticles(particles, 8, (p.x + e.x) / 2, e.y - 40, particleColor, particleType, 6, 16, 5);
    if (!chargedBufaActive) {
      spawnParticles(particles, 3, (p.x + e.x) / 2, e.y - 40, '#2ecc71', 'ring', 2, 20, 8);
    }
  }

  return e.hp <= 0;
}

// ─────────────────────────────────────────────────────
//  updateRainEffect
//  Fase 5 estágio 3: chuva enfraquece Bufa Sintética
//  → Fúria perde HP passivamente
// ─────────────────────────────────────────────────────
export function updateRainEffect(
  enemies: Enemy[],
  particles: Particle[], texts: FloatingTextData[], f: number,
  active: boolean,
): void {
  if (!active) return;

  // Partículas de chuva globais (visual)
  if (f % 3 === 0) {
    const rx = Math.random() * 800;
    spawnParticles(particles, 1, rx, 0, 'rgba(100,150,255,0.3)', 'rain', 0.5, 40, 2);
  }

  // Dano passivo no Fúria Final pela chuva
  if (f % 60 === 0) { // 1x por segundo
    for (const e of enemies) {
      if (e.type === 'furia_final') {
        e.hp -= 1;
        if (f % 180 === 0) { // Texto a cada 3s (não spammar)
          texts.push({ id: uid(), text: '-1 🌧', x: e.x, y: e.y - 60, color: '#6688cc', size: 10, t: f });
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────
//  updateLightningZones
//  Fase 5 estágio 3: Ancião cria zonas eletrificadas
// ─────────────────────────────────────────────────────
import type { LightningZone } from './types';

export function updateLightningZones(
  zones: LightningZone[],
  enemies: Enemy[], p: Player,
  particles: Particle[], texts: FloatingTextData[], f: number,
  screenShakeRef: MutableRef<number>,
): void {
  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i];
    z.timer--;

    // Warning phase: pisca antes de ativar
    if (z.warning && z.warningTimer !== undefined && z.warningTimer > 0) {
      z.warningTimer--;
      // Partículas de aviso
      if (f % 10 === 0) {
        spawnParticles(particles, 2, z.x, z.y, 'rgba(255,255,100,0.4)', 'electric', 3, 15, 4);
      }
      if (z.warningTimer <= 0) {
        // ATIVA! Relâmpago cai
        z.warning = false;
        screenShakeRef.current = 10;
        spawnParticles(particles, 12, z.x, z.y - 20, '#f1c40f', 'electric', 10, 20, 6);
        spawnParticles(particles, 6, z.x, z.y - 20, '#ffffff', 'ring', 8, 15, 10);
        playSFX('shout');

        // Dano em inimigos na zona
        for (const e of enemies) {
          const edx = Math.abs(e.x - z.x);
          const edy = Math.abs(e.y - z.y);
          if (edx < z.radius && edy < z.radius * 0.6) {
            e.hp -= z.damage; e.hurt = true; e.hurtTimer = 20;
            e.atkCd = Math.max(e.atkCd, 60); // Stun
            texts.push({ id: uid(), text: `-${z.damage} ⚡`, x: e.x, y: e.y - 50, color: '#f1c40f', size: 16, t: f });
          }
        }

        // Dano no jogador se estiver na zona (evitável!)
        const pdx = Math.abs(p.x - z.x);
        const pdy = Math.abs(p.y - z.y);
        if (pdx < z.radius && pdy < z.radius * 0.6 && p.invincible <= 0 && p.z < 15) {
          const pDmg = Math.floor(z.damage * 0.5); // Meio dano no jogador
          p.hp -= pDmg; p.hurt = true; p.hurtTimer = 15; p.invincible = 30;
          texts.push({ id: uid(), text: `-${pDmg} ⚡`, x: p.x, y: p.y - 50, color: '#ff6644', size: 14, t: f });
        }
      }
      continue;
    }

    // Zona ativa: partículas contínuas
    if (f % 6 === 0) {
      spawnParticles(particles, 1, z.x + (Math.random() - 0.5) * z.radius, z.y, '#f1c40f', 'electric', 2, 10, 3);
    }

    // Expirou
    if (z.timer <= 0) {
      zones.splice(i, 1);
    }
  }
}
