// ═══════════════════════════════════════════════════════
//  aiFase3.ts — IA dos inimigos da Fase 3 (zero React)
//  - Zumbi Flatulento (comum, gás passivo, regenera)
//  - Zumbi Turbinado (variante rara, maior, regen rápido)
//  - Suka Mark II (boss, 3 fases de combate)
// ═══════════════════════════════════════════════════════
import type { Enemy, Player, Davisaum, Particle, FloatingTextData, MutableRef } from './types';
import {
  ENEMY_SPEED, FLOOR_MIN, FLOOR_MAX, WORLD_W,
  ZUMBI_SPEED, ZUMBI_REGEN_TIME, ZUMBI_REGEN_AMOUNT,
  ZUMBI_GAS_DAMAGE, ZUMBI_GAS_RANGE, ZUMBI_GAS_INTERVAL,
  ZUMBI_TURBO_SPEED, ZUMBI_TURBO_REGEN_TIME,
  SUKA_MK2_SWORD_DAMAGE, SUKA_MK2_SWORD_RANGE, SUKA_MK2_SWORD_PUSHBACK,
  SUKA_MK2_SONIC_DAMAGE, SUKA_MK2_SONIC_RANGE, SUKA_MK2_SONIC_STUN,
  SUKA_MK2_SHIELD_DURATION, SUKA_MK2_COUNTER_DAMAGE, SUKA_MK2_COUNTER_RANGE,
  SUKA_MK2_FLY_THRESHOLD, SUKA_MK2_FAIL_THRESHOLD,
} from './constants';
import { clamp, uid, spawnParticles } from './utils';
import { playSFX } from './sfx';

// ─────────────────────────────────────────────────────
//  ZUMBI FLATULENTO (inimigo comum Fase 3)
//
//  Comportamento:
//  - Anda lento e errático (muda de direção aleatoriamente)
//  - Emite gás passivo que dá dano se o jogador ficar perto
//  - ABSORVE Bufa Celeste (cura em vez de tomar dano) → tratado em combatV2.ts
//  - Regenera HP se não morrer rápido (8s timer)
// ─────────────────────────────────────────────────────
export function updateZumbiAI(
  e: Enemy, p: Player,
  particles: Particle[], texts: FloatingTextData[], f: number,
): 'dead' | 'alive' {
  if (e.punchTimer > 0) e.punchTimer--;

  const dx = p.x - e.x, dy = p.y - e.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  e.dir = dx > 0 ? 'right' : 'left';

  // ── Movimento errático ──
  // A cada ~2s muda levemente a direção, simulando tropeço de zumbi
  if (f % 120 === 0) {
    e.chargeDir = Math.random() < 0.5 ? 1 : -1; // reuso chargeDir como offset errático
  }
  const erratic = (e.chargeDir || 1) * 0.3;

  if (d > 40) {
    const spd = e.type === 'zumbi_turbo' ? ZUMBI_TURBO_SPEED : ZUMBI_SPEED;
    e.x += (dx / d) * spd + erratic;
    e.y += (dy / d) * spd * 0.5;
    e.walking = true;
  } else {
    e.walking = false;
  }
  e.y = clamp(e.y, FLOOR_MIN, FLOOR_MAX);
  e.x = clamp(e.x, 10, WORLD_W - 10);

  // ── Gás passivo (dano ao jogador se perto) ──
  if (!e.gasTimer) e.gasTimer = 0;
  e.gasTimer++;

  if (e.gasTimer >= ZUMBI_GAS_INTERVAL) {
    e.gasTimer = 0;

    // Partículas de gás visual (sempre, pra feedback)
    const gasColors = ['rgba(255,150,200,0.5)', 'rgba(150,255,150,0.5)', 'rgba(255,255,150,0.5)'];
    const gc = gasColors[Math.floor(Math.random() * gasColors.length)];
    spawnParticles(particles, 2, e.x, e.y - 30, gc, 'gas', 3, 30, 8);

    // Dano se perto
    if (d < ZUMBI_GAS_RANGE && p.invincible <= 0 && p.z < 15) {
      const gasDmg = p.powers?.resistenciaGas ? Math.ceil(ZUMBI_GAS_DAMAGE * 0.5) : ZUMBI_GAS_DAMAGE;
      p.hp -= gasDmg;
      p.hurt = true; p.hurtTimer = 10; p.invincible = 20;
      spawnParticles(particles, 3, p.x, p.y - 30, 'rgba(100,255,100,0.6)', 'gas', 2, 15, 5);
      texts.push({ id: uid(), text: `-${gasDmg} ☁`, x: p.x, y: p.y - 45 - p.z, color: '#88ff88', size: 12, t: f });
      if (p.hp <= 0) return 'dead';
    }
  }

  // ── Regeneração ──
  if (!e.regenTimer) e.regenTimer = 0;
  e.regenTimer++;

  const regenTime = e.type === 'zumbi_turbo' ? ZUMBI_TURBO_REGEN_TIME : ZUMBI_REGEN_TIME;
  if (e.regenTimer >= regenTime && e.hp < e.maxHp) {
    e.hp = Math.min(e.maxHp, e.hp + ZUMBI_REGEN_AMOUNT);
    e.regenTimer = 0;
    spawnParticles(particles, 3, e.x, e.y - 40, '#44ff44', 'spark', 2, 20, 3);
    texts.push({ id: uid(), text: `+${ZUMBI_REGEN_AMOUNT} ♻`, x: e.x, y: e.y - 55, color: '#44ff44', size: 10, t: f });
  }

  // ── Ataque corpo-a-corpo (lento, fraco) ──
  if (e.atkCd > 0) e.atkCd--;
  if (d < 45 && p.invincible <= 0 && p.z < 10 && e.atkCd <= 0) {
    e.atkCd = 90; // Ataca a cada 1.5s (lento)
    e.punchTimer = 15;
    const meleeDmg = e.type === 'zumbi_turbo' ? 8 : 5;
    p.hp -= meleeDmg; p.hurt = true; p.hurtTimer = 20; p.invincible = 45;
    p.vx = e.x > p.x ? -4 : 4;  // ✅ Knockback
    p.combo = 0; p.comboTimer = 0;
    spawnParticles(particles, 4, p.x, p.y - 30 - p.z, '#88ff88', 'hit', 3, 12, 4);
    texts.push({ id: uid(), text: `-${meleeDmg}`, x: p.x, y: p.y - 40 - p.z, color: '#88ff88', size: 14, t: f });
    if (p.hp <= 0) return 'dead';
  }

  return 'alive';
}

// ─────────────────────────────────────────────────────
//  SUKA MARK II (Boss Fase 3)
//
//  Armadura cyber roxa/prata + espada energética.
//  100% resistente à Bufa Celeste (absorve).
//
//  3 Fases de combate:
//  100-50% HP → Melee (espada) + Grito sônico MK2
//  50-25% HP  → Propulsores, ataques aéreos
//  25-0% HP   → Armadura falha (relâmpagos do Ancião), aberturas pra bufa
// ─────────────────────────────────────────────────────
export function updateSukaMK2AI(
  e: Enemy, p: Player, dav: Davisaum,
  particles: Particle[], texts: FloatingTextData[],
  f: number, screenShakeRef: MutableRef<number>,
): 'dead' | 'alive' {
  const dx = p.x - e.x, dy = p.y - e.y;
  const hx = Math.abs(dx), hy = Math.abs(dy);
  e.dir = dx > 0 ? 'right' : 'left';
  if (e.punchTimer > 0) e.punchTimer--;
  if (e.atkCd > 0) e.atkCd--;
  if (e.absorbTimer && e.absorbTimer > 0) e.absorbTimer--;
  if (e.absorbTimer !== undefined && e.absorbTimer <= 0) e.absorbing = false;

  const hpPct = e.hp / e.maxHp;

  // ── Determinar fase de combate ──
  const wasFlying = e.flying;
  const wasArmFail = e.armorFailing;

  if (hpPct <= SUKA_MK2_FAIL_THRESHOLD && !e.armorFailing) {
    // Transição para fase 3: armadura falha
    e.armorFailing = true;
    e.flying = false;
    screenShakeRef.current = 20;
    texts.push({ id: uid(), text: 'NÃO! A ARMADURA! OS RAIOS ESTÃO—', x: e.x, y: e.y - 80, color: '#9b59b6', size: 12, t: f });
    spawnParticles(particles, 10, e.x, e.y - 40, '#aa88ff', 'electric', 8, 30, 6);
    playSFX('shout');
  } else if (hpPct <= SUKA_MK2_FLY_THRESHOLD && !e.flying && !e.armorFailing) {
    // Transição para fase 2: voo
    e.flying = true;
    texts.push({ id: uid(), text: '⚡ PROPULSORES ATIVADOS!', x: e.x, y: e.y - 80, color: '#aa44ff', size: 14, t: f });
    spawnParticles(particles, 8, e.x, e.y - 20, '#9944ff', 'spark', 6, 20, 5);
    screenShakeRef.current = 12;
  }

  // ═════════════════════════════════════════
  //  FASE 3 da boss: Armadura falhando (<25%)
  //  Mais lenta, aberturas maiores, vulnerável à bufa
  // ═════════════════════════════════════════
  if (e.armorFailing) {
    // Efeito visual: faíscas constantes de armadura quebrando
    if (f % 15 === 0) {
      spawnParticles(particles, 2, e.x + (Math.random() - 0.5) * 40, e.y - 40, '#aa88ff', 'electric', 3, 15, 3);
    }

    // Movimentação lenta, desorientada
    e.walking = true;
    if (hx > 60) e.x += Math.sign(dx) * ENEMY_SPEED * 0.5;
    if (hy > 10) e.y += Math.sign(dy) * ENEMY_SPEED * 0.3;
    e.y = clamp(e.y, FLOOR_MIN, FLOOR_MAX);

    // Ataque de espada mais lento (aberturas maiores)
    if (hx < SUKA_MK2_SWORD_RANGE && hy < 50 && e.atkCd <= 0 && p.invincible <= 0 && p.z < 10) {
      e.atkCd = 100; // Muito mais lenta
      e.punchTimer = 20;
      const dmg = Math.floor(SUKA_MK2_SWORD_DAMAGE * 0.7); // Dano reduzido
      p.hp -= dmg; p.hurt = true; p.hurtTimer = 20; p.invincible = 45;
      p.vx = (dx > 0 ? -1 : 1) * 8;
      p.combo = 0; p.comboTimer = 0;
      spawnParticles(particles, 5, p.x, p.y - 30, '#9b59b6', 'hit', 4, 14, 5);
      texts.push({ id: uid(), text: `-${dmg}`, x: p.x, y: p.y - 45, color: '#9b59b6', size: 16, t: f });
      if (p.hp <= 0) return 'dead';
    }

    return 'alive';
  }

  // ═════════════════════════════════════════
  //  FASE 2 da boss: Voo (50-25% HP)
  //  Propulsores, ataques aéreos, mais rápida
  // ═════════════════════════════════════════
  if (e.flying) {
    // Hover visual: z oscila
    e.z = 25 + Math.sin(f * 0.08) * 8;

    // Partículas de propulsão
    if (f % 8 === 0) {
      spawnParticles(particles, 2, e.x, e.y, '#9944ff', 'spark', 2, 12, 3);
    }

    // Movimentação rápida aérea
    e.walking = true;
    if (hx > 100) e.x += Math.sign(dx) * ENEMY_SPEED * 1.5;
    if (hy > 15) e.y += Math.sign(dy) * ENEMY_SPEED * 0.8;
    e.y = clamp(e.y, FLOOR_MIN, FLOOR_MAX);

    // Ataque: mergulho aéreo
    if (hx < 120 && hy < 60 && e.atkCd <= 0) {
      e.walking = false; e.stateTimer++;

      if (e.stateTimer === 1) {
        texts.push({ id: uid(), text: '⚠ ATAQUE AÉREO!', x: e.x, y: e.y - 90, color: '#aa44ff', size: 12, t: f });
      }

      if (e.stateTimer > 30) {
        e.atkCd = 120; e.stateTimer = 0;
        screenShakeRef.current = 10;
        spawnParticles(particles, 8, e.x, e.y - 20, '#9944ff', 'ring', 6, 20, 8);
        playSFX('shout');

        // Dano em área ao aterrissar
        if (hx < 100 && hy < 70 && p.invincible <= 0) {
          const diveDmg = 18;
          p.hp -= diveDmg; p.hurt = true; p.hurtTimer = 20; p.invincible = 40;
          p.vx = (dx > 0 ? -1 : 1) * 14;
          p.combo = 0; p.comboTimer = 0;
          spawnParticles(particles, 8, p.x, p.y - 30, '#aa44ff', 'hit', 5, 18, 6);
          texts.push({ id: uid(), text: `-${diveDmg}`, x: p.x, y: p.y - 50, color: '#aa44ff', size: 20, t: f });
          if (p.hp <= 0) return 'dead';
        }
      }
    } else {
      e.stateTimer = 0;
    }

    // Escudo de absorção (pode ativar durante voo também)
    if (f % 360 === 0 && !e.absorbing) {
      e.absorbing = true;
      e.absorbTimer = SUKA_MK2_SHIELD_DURATION;
      texts.push({ id: uid(), text: '🛡 ESCUDO!', x: e.x, y: e.y - 70, color: '#8844ff', size: 12, t: f });
      spawnParticles(particles, 6, e.x, e.y - 30, '#8844ff', 'ring', 4, 25, 10);
    }

    return 'alive';
  }

  // ═════════════════════════════════════════
  //  FASE 1 da boss: Melee + Grito (100-50% HP)
  //  Espada + onda sônica + escudo de absorção
  // ═════════════════════════════════════════

  // ── Escudo de absorção (a cada ~6s) ──
  if (f % 360 === 0 && !e.absorbing && e.atkCd <= 0) {
    e.absorbing = true;
    e.absorbTimer = SUKA_MK2_SHIELD_DURATION;
    e.atkCd = 60;
    texts.push({ id: uid(), text: '🛡 ESCUDO DE ABSORÇÃO!', x: e.x, y: e.y - 70, color: '#8844ff', size: 12, t: f });
    spawnParticles(particles, 6, e.x, e.y - 30, '#8844ff', 'ring', 4, 25, 10);
  }

  // ── Contra-ataque elétrico (após escudo acabar com carga) ──
  if (e.absorbing && e.absorbTimer !== undefined && e.absorbTimer <= 1) {
    // Dispara contra-ataque ao final do escudo
    screenShakeRef.current = 12;
    spawnParticles(particles, 10, e.x, e.y - 30, '#aa44ff', 'electric', 8, 20, 6);
    texts.push({ id: uid(), text: '⚡ CONTRA-ATAQUE!', x: e.x, y: e.y - 60, color: '#aa44ff', size: 14, t: f });
    playSFX('shout');

    if (hx < SUKA_MK2_COUNTER_RANGE && hy < 60 && p.invincible <= 0 && p.z < 20) {
      p.hp -= SUKA_MK2_COUNTER_DAMAGE; p.hurt = true; p.hurtTimer = 20; p.invincible = 45;
      p.vx = (dx > 0 ? -1 : 1) * 16;
      p.combo = 0; p.comboTimer = 0;
      spawnParticles(particles, 8, p.x, p.y - 30, '#aa44ff', 'hit', 6, 18, 6);
      texts.push({ id: uid(), text: `-${SUKA_MK2_COUNTER_DAMAGE}`, x: p.x, y: p.y - 50, color: '#aa44ff', size: 22, t: f });
      if (p.hp <= 0) return 'dead';
    }
  }

  // Se absorvendo, fica parada (não ataca)
  if (e.absorbing) {
    e.walking = false;
    // Visual do escudo
    if (f % 10 === 0) {
      spawnParticles(particles, 1, e.x + (Math.random() - 0.5) * 50, e.y - 40, '#8844ff', 'ring', 2, 15, 6);
    }
    return 'alive';
  }

  // ── Onda sônica Mark II ──
  if (hx < SUKA_MK2_SONIC_RANGE && hy < 60 && e.atkCd <= 0 && hx > SUKA_MK2_SWORD_RANGE) {
    e.walking = false; e.stateTimer++;

    if (e.stateTimer === 1) {
      texts.push({ id: uid(), text: '⚠ ONDA SÔNICA!', x: e.x, y: e.y - 70, color: '#9b59b6', size: 12, t: f });
    }

    if (e.stateTimer > 45) {
      playSFX('shout');
      e.atkCd = 150; e.stateTimer = 0;
      texts.push({ id: uid(), text: 'KRRAAAHH MK2!!!', x: e.x, y: e.y - 40, color: '#9b59b6', size: 20, t: f });
      screenShakeRef.current = 14;
      spawnParticles(particles, 8, e.x, e.y - 30, 'rgba(155,89,182,0.6)', 'ring', 10, 25, 12);

      if (hx < SUKA_MK2_SONIC_RANGE && hy < 70 && p.z < 20 && p.invincible <= 0) {
        p.hp -= SUKA_MK2_SONIC_DAMAGE; p.hurt = true; p.hurtTimer = 20; p.invincible = SUKA_MK2_SONIC_STUN;
        p.vx = (dx > 0 ? -1 : 1) * 10;
        dav.x += (dx > 0 ? 1 : -1) * 100;
        p.combo = 0; p.comboTimer = 0;
        spawnParticles(particles, 6, p.x, p.y - 30 - p.z, '#9b59b6', 'hit', 5, 18, 6);
        texts.push({ id: uid(), text: `-${SUKA_MK2_SONIC_DAMAGE}`, x: p.x, y: p.y - 50 - p.z, color: '#9b59b6', size: 20, t: f });
        if (p.hp <= 0) return 'dead';
      }
    }

  // ── Golpe de espada (melee) ──
  } else if (hx < SUKA_MK2_SWORD_RANGE && hy < 45 && e.atkCd <= 0 && p.invincible <= 0 && p.z < 10) {
    e.atkCd = 70; e.punchTimer = 18; e.stateTimer = 0;
    p.hp -= SUKA_MK2_SWORD_DAMAGE; p.hurt = true; p.hurtTimer = 18; p.invincible = 35;
    p.vx = (dx > 0 ? -1 : 1) * SUKA_MK2_SWORD_PUSHBACK;
    p.combo = 0; p.comboTimer = 0;
    spawnParticles(particles, 6, (p.x + e.x) / 2, e.y - 40, '#cc66ff', 'spark', 5, 15, 5);
    texts.push({ id: uid(), text: `-${SUKA_MK2_SWORD_DAMAGE}`, x: p.x, y: p.y - 45, color: '#cc66ff', size: 18, t: f });
    screenShakeRef.current = 8;
    if (p.hp <= 0) return 'dead';

  // ── Movimento ──
  } else {
    e.stateTimer = 0; e.walking = true;
    if (hx > 55) e.x += Math.sign(dx) * ENEMY_SPEED * 1.0;
    if (hy > 10) e.y += Math.sign(dy) * ENEMY_SPEED * 0.6;
    e.y = clamp(e.y, FLOOR_MIN, FLOOR_MAX);
  }

  return 'alive';
}