// ═══════════════════════════════════════════════════════
//  combatEnvironment.ts — Objetos interativos do ambiente (zero React)
//
//  Mecânica central da Fase 3 (e reutilizada na Fase 5):
//  O jogador empurra objetos com bufa/soco e eles atingem inimigos.
//
//  | Objeto      | Ativação             | Efeito                          |
//  |-------------|----------------------|---------------------------------|
//  | Botijão     | Chutar ou bufa       | Desliza, explode ao tocar       |
//  | Carrinho    | Bufa direcional      | Óleo espirrando, dano + slow    |
//  | Poste       | Combo 5+             | Cai e eletrocuta em linha       |
//  | Placa       | Bufa direcional      | Projétil voador                 |
//  | Tanque      | Soco/bufa (Fase 5)   | Explode, dano em área grande    |
//  | Tubulação   | Soco/bufa (Fase 5)   | Vapor, slow zone                |
// ═══════════════════════════════════════════════════════
import type { EnvironmentObject, Enemy, Player, Particle, FloatingTextData, MutableRef } from './types';
import {
  WORLD_W, FLOOR_MIN, FLOOR_MAX,
  PUNCH_DURATION, PUNCH_ACTIVE, PUNCH_RANGE, PUNCH_DEPTH,
  BUFA_DURATION, BUFA_ACTIVE_START, BUFA_RANGE, BUFA_DEPTH,
  ENV_BOTIJAO_DAMAGE, ENV_BOTIJAO_RADIUS, ENV_BOTIJAO_SLIDE_SPEED,
  ENV_CARRINHO_DAMAGE, ENV_CARRINHO_SLOW_DURATION,
  ENV_POSTE_DAMAGE, ENV_POSTE_COMBO_REQ,
  ENV_PLACA_DAMAGE, ENV_PLACA_SPEED,
  ENV_TANQUE_DAMAGE, ENV_TANQUE_RADIUS,
  ENV_TUBULACAO_SLOW_DURATION,
  getEnemyWidth,
} from './constants';
import { clamp, uid, spawnParticles } from './utils';
import { playSFX } from './sfx';

// ─────────────────────────────────────────────────────
//  Atualiza física dos objetos (deslizar, desacelerar)
// ─────────────────────────────────────────────────────
export function updateEnvironmentObjects(
  objects: EnvironmentObject[],
  f: number,
): void {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];

    // Objetos em explosão: countdown e remover
    if (obj.exploding) {
      if (obj.explodeTimer !== undefined) obj.explodeTimer--;
      if (obj.explodeTimer !== undefined && obj.explodeTimer <= 0) {
        objects.splice(i, 1);
      }
      continue;
    }

    // Objetos inativos não se movem
    if (!obj.active) continue;

    // Deslizar (botijão, placa empurrada)
    if (Math.abs(obj.vx) > 0.1) {
      obj.x += obj.vx;
      obj.vx *= 0.96; // Desacelera com fricção

      // Limites do mundo
      if (obj.x < 10 || obj.x > WORLD_W - 10) {
        obj.vx = 0;
        obj.x = clamp(obj.x, 10, WORLD_W - 10);
      }
    } else {
      obj.vx = 0;
    }

    // Placa voadora: também move no y se tiver vy
    if (obj.type === 'placa' && obj.vy) {
      obj.y += obj.vy;
      obj.vy *= 0.98;
    }
  }
}

// ─────────────────────────────────────────────────────
//  Jogador ativa objetos (soco/bufa empurra)
// ─────────────────────────────────────────────────────
export function checkPlayerActivatesObject(
  obj: EnvironmentObject, p: Player,
  particles: Particle[], texts: FloatingTextData[], f: number,
  screenShakeRef: MutableRef<number>,
): void {
  if (!obj.active || obj.exploding) return;

  const dx = obj.x - p.x;
  const hx = Math.abs(dx);
  const hy = Math.abs(obj.y - p.y);
  const facing = p.dir === 'right' ? dx > 0 : dx < 0;
  const pushDir = p.dir === 'right' ? 1 : -1;
  const punchFrame = PUNCH_DURATION - p.atkTimer;

  // ── Soco ativa objeto ──
  const punchHit = p.attacking
    && punchFrame >= PUNCH_ACTIVE[0] && punchFrame <= PUNCH_ACTIVE[1]
    && hx < PUNCH_RANGE + 20 && hy < PUNCH_DEPTH + 10 && facing;

  // ── Bufa ativa objeto ──
  const bufaHit = p.buffing
    && p.buffTimer < (BUFA_DURATION - BUFA_ACTIVE_START)
    && hx < BUFA_RANGE && hy < BUFA_DEPTH;

  if (!punchHit && !bufaHit) return;

  switch (obj.type) {

    // ─── BOTIJÃO: Desliza na direção, explode ao tocar inimigo ───
    case 'botijao': {
      const speed = bufaHit ? ENV_BOTIJAO_SLIDE_SPEED * 1.3 : ENV_BOTIJAO_SLIDE_SPEED;
      obj.vx = pushDir * speed;
      spawnParticles(particles, 3, obj.x, obj.y - 15, '#ff4444', 'spark', 3, 12, 3);
      texts.push({ id: uid(), text: '💥', x: obj.x, y: obj.y - 35, color: '#ff6600', size: 16, t: f });
      playSFX('hit');
      break;
    }

    // ─── CARRINHO: Bufa empurra, óleo espirrando ───
    case 'carrinho': {
      if (!bufaHit) break; // Só bufa ativa carrinho
      obj.vx = pushDir * 4;
      obj.active = false; // Uso único
      spawnParticles(particles, 6, obj.x, obj.y - 10, '#d4a017', 'spark', 5, 20, 4);
      texts.push({ id: uid(), text: '🛒 ÓLEO!', x: obj.x, y: obj.y - 40, color: '#d4a017', size: 12, t: f });
      break;
    }

    // ─── POSTE: Precisa combo 5+ pra derrubar ───
    case 'poste': {
      if (!punchHit || p.combo < ENV_POSTE_COMBO_REQ) {
        if (punchHit && p.combo < ENV_POSTE_COMBO_REQ) {
          texts.push({ id: uid(), text: `COMBO ${ENV_POSTE_COMBO_REQ}+ NECESSÁRIO!`, x: obj.x, y: obj.y - 45, color: '#888', size: 8, t: f });
        }
        break;
      }
      obj.active = false;
      obj.vx = pushDir * 2; // Cai na direção
      screenShakeRef.current = 10;
      spawnParticles(particles, 8, obj.x, obj.y - 30, '#f1c40f', 'electric', 6, 25, 5);
      texts.push({ id: uid(), text: '⚡ POSTE DERRUBADO!', x: obj.x, y: obj.y - 50, color: '#f1c40f', size: 14, t: f });
      playSFX('shout');
      break;
    }

    // ─── PLACA: Bufa transforma em projétil voador ───
    case 'placa': {
      if (!bufaHit) break;
      obj.vx = pushDir * ENV_PLACA_SPEED;
      obj.vy = -1; // Leve arco pra cima
      spawnParticles(particles, 3, obj.x, obj.y - 20, '#e67e22', 'spark', 3, 15, 3);
      texts.push({ id: uid(), text: '🪧 VOOU!', x: obj.x, y: obj.y - 40, color: '#e67e22', size: 12, t: f });
      break;
    }

    // ─── TANQUE (Fase 5): Explode imediatamente em área ───
    case 'tanque': {
      obj.active = false;
      obj.exploding = true;
      obj.explodeTimer = 30; // Animação de explosão
      screenShakeRef.current = 15;
      spawnParticles(particles, 15, obj.x, obj.y - 25, '#44ff44', 'ring', 10, 30, 12);
      spawnParticles(particles, 10, obj.x, obj.y - 25, '#22cc22', 'spark', 8, 20, 5);
      texts.push({ id: uid(), text: '💀 TANQUE EXPLODIU!', x: obj.x, y: obj.y - 55, color: '#44ff44', size: 14, t: f });
      playSFX('shout');
      break;
    }

    // ─── TUBULAÇÃO (Fase 5): Quebra, libera vapor slow zone ───
    case 'tubulacao': {
      obj.active = false;
      obj.exploding = true;
      obj.explodeTimer = ENV_TUBULACAO_SLOW_DURATION; // Vapor dura 4s
      spawnParticles(particles, 8, obj.x, obj.y - 20, 'rgba(200,200,200,0.5)', 'gas', 6, 40, 10);
      texts.push({ id: uid(), text: '💨 VAPOR!', x: obj.x, y: obj.y - 45, color: '#cccccc', size: 12, t: f });
      break;
    }
  }
}

// ─────────────────────────────────────────────────────
//  Objetos em movimento atingem inimigos
// ─────────────────────────────────────────────────────
export function checkEnvironmentHitsEnemy(
  obj: EnvironmentObject, e: Enemy,
  particles: Particle[], texts: FloatingTextData[], f: number,
  screenShakeRef: MutableRef<number>,
): boolean {
  // Objetos parados ou já explodindo não causam hit por contato
  // (tanque/tubulação causam dano em área, tratado separadamente)
  if (obj.exploding && obj.type !== 'tanque') return false;

  const ew = getEnemyWidth(e.type) / 2;
  const hx = Math.abs(obj.x - e.x);
  const hy = Math.abs(obj.y - e.y);

  // ── Tanque explodindo: dano em área (raio grande) ──
  if (obj.type === 'tanque' && obj.exploding && obj.explodeTimer !== undefined && obj.explodeTimer > 25) {
    // Só aplica dano no primeiro frame da explosão
    if (hx < ENV_TANQUE_RADIUS && hy < ENV_TANQUE_RADIUS * 0.6) {
      e.hp -= ENV_TANQUE_DAMAGE; e.hurt = true; e.hurtTimer = 15;
      e.kbx = (e.x - obj.x) > 0 ? 12 : -12;
      spawnParticles(particles, 6, e.x, e.y - 30, '#44ff44', 'hit', 5, 15, 5);
      texts.push({ id: uid(), text: `-${ENV_TANQUE_DAMAGE}`, x: e.x, y: e.y - 50, color: '#44ff44', size: 16, t: f });
      return e.hp <= 0;
    }
    return false;
  }

  // Precisa estar se movendo pra causar dano por contato
  if (Math.abs(obj.vx) < 1) return false;
  if (hx > ew + 25 || hy > 40) return false;

  switch (obj.type) {

    // ─── BOTIJÃO: Explode ao tocar inimigo ───
    case 'botijao': {
      obj.active = false;
      obj.exploding = true;
      obj.explodeTimer = 25;
      obj.vx = 0;
      screenShakeRef.current = 12;
      spawnParticles(particles, 12, obj.x, obj.y - 20, '#ff4400', 'ring', 8, 25, 10);
      spawnParticles(particles, 8, obj.x, obj.y - 20, '#ff6600', 'spark', 6, 18, 5);
      playSFX('shout');

      // Dano no inimigo que tocou
      e.hp -= ENV_BOTIJAO_DAMAGE; e.hurt = true; e.hurtTimer = 18;
      e.kbx = (e.x - obj.x) > 0 ? 14 : -14;
      texts.push({ id: uid(), text: `-${ENV_BOTIJAO_DAMAGE} 💥`, x: e.x, y: e.y - 50, color: '#ff4400', size: 18, t: f });
      return e.hp <= 0;
    }

    // ─── CARRINHO: Dano + slow (flag no enemy) ───
    case 'carrinho': {
      e.hp -= ENV_CARRINHO_DAMAGE; e.hurt = true; e.hurtTimer = 12;
      e.kbx = (e.x - obj.x) > 0 ? 6 : -6;
      // O slow é simulado via atkCd alto (não ataca por 3s)
      e.atkCd = Math.max(e.atkCd, ENV_CARRINHO_SLOW_DURATION);
      spawnParticles(particles, 5, e.x, e.y - 25, '#d4a017', 'spark', 4, 15, 4);
      texts.push({ id: uid(), text: `-${ENV_CARRINHO_DAMAGE} 🐌`, x: e.x, y: e.y - 50, color: '#d4a017', size: 14, t: f });
      return e.hp <= 0;
    }

    // ─── POSTE: Dano em linha (todos na faixa) ───
    // O poste já caiu — checa se o inimigo está na "linha" de queda
    case 'poste': {
      e.hp -= ENV_POSTE_DAMAGE; e.hurt = true; e.hurtTimer = 20;
      e.kbx = 0; // Eletrocuta no lugar
      // Stun longo (eletrocução)
      e.atkCd = Math.max(e.atkCd, 120);
      spawnParticles(particles, 6, e.x, e.y - 35, '#f1c40f', 'electric', 5, 20, 4);
      texts.push({ id: uid(), text: `-${ENV_POSTE_DAMAGE} ⚡`, x: e.x, y: e.y - 50, color: '#f1c40f', size: 16, t: f });
      return e.hp <= 0;
    }

    // ─── PLACA: Projétil, dano simples ───
    case 'placa': {
      e.hp -= ENV_PLACA_DAMAGE; e.hurt = true; e.hurtTimer = 12;
      e.kbx = obj.vx > 0 ? 8 : -8;
      obj.active = false; // Placa some ao atingir
      obj.vx = 0;
      spawnParticles(particles, 4, e.x, e.y - 30, '#e67e22', 'hit', 4, 12, 4);
      texts.push({ id: uid(), text: `-${ENV_PLACA_DAMAGE}`, x: e.x, y: e.y - 50, color: '#e67e22', size: 14, t: f });
      return e.hp <= 0;
    }

    default:
      return false;
  }
}

// ─────────────────────────────────────────────────────
//  Botijão explodindo: dano em área a TODOS os inimigos perto
//  (chamado separado do hit por contato)
// ─────────────────────────────────────────────────────
export function checkBotijaoAreaDamage(
  obj: EnvironmentObject, enemies: Enemy[],
  particles: Particle[], texts: FloatingTextData[], f: number,
): void {
  // Só aplica no frame exato da explosão (timer = explodeTimer inicial - 1)
  if (obj.type !== 'botijao' || !obj.exploding) return;
  if (obj.explodeTimer !== 24) return; // Um frame após explodir

  for (const e of enemies) {
    const hx = Math.abs(obj.x - e.x);
    const hy = Math.abs(obj.y - e.y);
    if (hx < ENV_BOTIJAO_RADIUS && hy < ENV_BOTIJAO_RADIUS * 0.6 && !e.hurt) {
      e.hp -= Math.floor(ENV_BOTIJAO_DAMAGE * 0.6); // Dano de área menor que contato direto
      e.hurt = true; e.hurtTimer = 12;
      e.kbx = (e.x - obj.x) > 0 ? 10 : -10;
      const areaDmg = Math.floor(ENV_BOTIJAO_DAMAGE * 0.6);
      spawnParticles(particles, 3, e.x, e.y - 30, '#ff6600', 'hit', 3, 12, 4);
      texts.push({ id: uid(), text: `-${areaDmg} 🔥`, x: e.x, y: e.y - 45, color: '#ff6600', size: 12, t: f });
    }
  }
}

// ─────────────────────────────────────────────────────
//  Tubulação: slow zone contínuo (jogador e inimigos)
// ─────────────────────────────────────────────────────
export function checkTubulacaoSlowZone(
  obj: EnvironmentObject, p: Player, enemies: Enemy[],
  particles: Particle[], f: number,
): void {
  if (obj.type !== 'tubulacao' || !obj.exploding) return;

  const SLOW_RADIUS = 70;

  // Partículas de vapor contínuas
  if (f % 12 === 0) {
    spawnParticles(particles, 2, obj.x + (Math.random() - 0.5) * 60, obj.y - 15, 'rgba(200,200,200,0.3)', 'gas', 2, 25, 8);
  }

  // Slow no jogador (reduz velocidade temporariamente)
  const pdx = Math.abs(p.x - obj.x);
  const pdy = Math.abs(p.y - obj.y);
  if (pdx < SLOW_RADIUS && pdy < SLOW_RADIUS * 0.6) {
    p.vx *= 0.7;
    p.vy *= 0.7;
  }

  // Slow nos inimigos
  for (const e of enemies) {
    const edx = Math.abs(e.x - obj.x);
    const edy = Math.abs(e.y - obj.y);
    if (edx < SLOW_RADIUS && edy < SLOW_RADIUS * 0.6) {
      e.kbx *= 0.5; // Desacelera knockback
      // Aumenta cooldown de ataque (simulando lentidão)
      if (e.atkCd < 30) e.atkCd = 30;
    }
  }
}

// ─────────────────────────────────────────────────────
//  Criar layout de objetos pra cada fase
//  (chamado na inicialização da fase)
// ─────────────────────────────────────────────────────

/** Gera objetos de ambiente da Fase 3 */
export function createFase3Objects(): EnvironmentObject[] {
  return [
    // Botijões (3 espalhados)
    { id: uid(), type: 'botijao', x: 500,  y: FLOOR_MIN + 30, hp: 1, active: true, vx: 0 },
    { id: uid(), type: 'botijao', x: 1200, y: FLOOR_MAX - 20, hp: 1, active: true, vx: 0 },
    { id: uid(), type: 'botijao', x: 2200, y: FLOOR_MIN + 50, hp: 1, active: true, vx: 0 },

    // Carrinhos de fritura (2)
    { id: uid(), type: 'carrinho', x: 800,  y: FLOOR_MIN + 40, hp: 1, active: true, vx: 0 },
    { id: uid(), type: 'carrinho', x: 1800, y: FLOOR_MAX - 15, hp: 1, active: true, vx: 0 },

    // Postes de luz (2)
    { id: uid(), type: 'poste', x: 1000, y: FLOOR_MIN + 20, hp: 1, active: true, vx: 0 },
    { id: uid(), type: 'poste', x: 2500, y: FLOOR_MIN + 35, hp: 1, active: true, vx: 0 },

    // Placas de lanchonete (3)
    { id: uid(), type: 'placa', x: 600,  y: FLOOR_MIN + 25, hp: 1, active: true, vx: 0 },
    { id: uid(), type: 'placa', x: 1500, y: FLOOR_MAX - 25, hp: 1, active: true, vx: 0 },
    { id: uid(), type: 'placa', x: 2800, y: FLOOR_MIN + 45, hp: 1, active: true, vx: 0 },
  ];
}

/** Gera objetos de ambiente da Fase 5 */
export function createFase5Objects(): EnvironmentObject[] {
  return [
    // Botijões (mesma mecânica da Fase 3)
    { id: uid(), type: 'botijao', x: 400,  y: FLOOR_MIN + 30, hp: 1, active: true, vx: 0 },
    { id: uid(), type: 'botijao', x: 1400, y: FLOOR_MAX - 20, hp: 1, active: true, vx: 0 },
    { id: uid(), type: 'botijao', x: 2000, y: FLOOR_MIN + 40, hp: 1, active: true, vx: 0 },
    { id: uid(), type: 'botijao', x: 2800, y: FLOOR_MAX - 10, hp: 1, active: true, vx: 0 },

    // Tanques de líquido verde (2)
    { id: uid(), type: 'tanque', x: 900,  y: FLOOR_MIN + 25, hp: 1, active: true, vx: 0 },
    { id: uid(), type: 'tanque', x: 2400, y: FLOOR_MIN + 35, hp: 1, active: true, vx: 0 },

    // Tubulações (2)
    { id: uid(), type: 'tubulacao', x: 1100, y: FLOOR_MIN + 20, hp: 1, active: true, vx: 0 },
    { id: uid(), type: 'tubulacao', x: 2100, y: FLOOR_MAX - 15, hp: 1, active: true, vx: 0 },
  ];
}
