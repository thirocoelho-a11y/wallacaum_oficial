// ═══════════════════════════════════════════════════════
//  Fase3.tsx — Configuração da Fase 3
//  "Tempestade sobre São Burgão"
//
//  Cenário: Rua das Fritas em caos — lanchonetes fechadas,
//  carros capotados, nuvens de gás colorido, chuva.
//
//  Inimigos: Zumbi Flatulento (absorve bufa), Zumbi Turbinado
//  Boss: Suka Mark II (armadura cyber, 3 fases de combate)
//
//  Mecânica nova: Objetos do ambiente (botijão, carrinho,
//  poste, placa) — jogador empurra com bufa/soco.
//
//  Pós-boss: Horda massiva → cutscene → Fase 3½ (moto)
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useEffect } from 'react';
import PhaseRenderer from './PhaseRenderer';
import { createFase3Objects } from './combatEnvironment';
import {
  FASE3_SPAWN_INTERVAL, FASE3_BOSS_THRESHOLD,
  SUKA_MK2_HP, ZUMBI_HP, ZUMBI_TURBO_HP,
  DEFAULT_POWERS,
} from './constants';
import { CENARIO_FASE3, preloadFase3Sprites } from './spritesFase3';

export interface Fase3Props {
  initialScore: number;
  initialHp: number;
  muted: boolean;
  onToggleMute: () => void;
  onComplete: (score: number, hp: number) => void;
  onGameOver: (score: number) => void;
  onRestart: () => void;
}

export default function Fase3({
  initialScore, initialHp, muted, onToggleMute,
  onComplete, onGameOver,
}: Fase3Props) {

  // ── Pré-carregar sprites da Fase 3 ──
  useEffect(() => {
    preloadFase3Sprites();
  }, []);

  // ── Rastrear mortes de zumbis pra spawn do Turbinado ──
  // Quando 3+ zumbis morrem "juntos" (dentro de ~2s), spawna Zumbi Turbinado.
  // Isso é controlado aqui pra não poluir o engine genérico.
  const [zumbiDeathCluster, setZumbiDeathCluster] = useState(0);

  // ── Transição pós-boss: horda → cutscene → moto ──
  const [showHordeCutscene, setShowHordeCutscene] = useState(false);

  const handleComplete = useCallback((score: number, hp: number) => {
    // Suka MK2 derrotada → mostrar cutscene da horda antes de ir pra moto
    setShowHordeCutscene(true);

    // Após a cutscene, propagar pro App.tsx (que roteará pra Fase 3½)
    setTimeout(() => {
      onComplete(score, hp);
    }, 6000); // 6s de cutscene
  }, [onComplete]);

  // ── Cutscene da horda ──
  if (showHordeCutscene) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 99999,
        background: 'radial-gradient(ellipse at center, rgba(0,20,0,0.9) 0%, rgba(0,0,0,0.98) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Linha 1 */}
        <div style={{
          color: '#e74c3c', fontSize: 10, fontWeight: 900, letterSpacing: 2,
          textShadow: '0 0 15px rgba(231,76,60,0.5)',
          animation: 'pulse 1s infinite alternate',
        }}>
          ⚠️ A Bufa Celeste não tem mais efeito sobre os zumbis.
        </div>

        {/* Linha 2 */}
        <div style={{
          color: '#f1c40f', fontSize: 11, fontWeight: 900, marginTop: 16,
          letterSpacing: 2, textShadow: '1px 1px 0 #000',
        }}>
          Wallaçaum precisa evoluir seu poder.
        </div>

        {/* Linha 3 */}
        <div style={{
          color: '#aaa', fontSize: 9, marginTop: 10,
          fontStyle: 'italic', textShadow: '1px 1px 0 #000',
        }}>
          Há apenas um lugar onde isso é possível.
        </div>

        {/* Separador */}
        <div style={{
          width: 300, height: 2, margin: '20px 0',
          background: 'linear-gradient(90deg, transparent, #888, transparent)',
        }} />

        {/* Montanha */}
        <div style={{
          fontSize: 22, color: '#95a5a6', fontWeight: 900,
          fontFamily: '"Press Start 2P", monospace',
          textShadow: '3px 3px 0 #000, 0 0 20px rgba(149,165,166,0.3)',
          animation: 'pulse 1.5s infinite alternate',
          letterSpacing: 2,
        }}>
          🏔️ A MONTANHA DAS PEDRAS AGUDAS
        </div>

        {/* Davisaum aparece com moto */}
        <div style={{
          color: '#3498db', fontSize: 8, marginTop: 18,
          textAlign: 'center', lineHeight: 1.8,
          textShadow: '1px 1px 0 #000',
        }}>
          Davisaum aparece com uma moto.<br />
          "SOBE! SOBE! SOBE AGORA!"
        </div>
      </div>
    );
  }

  // ── Render normal: PhaseRenderer com config da Fase 3 ──
  return (
    <PhaseRenderer
      phase={3}
      bgImage={CENARIO_FASE3}
      muted={muted}
      onToggleMute={onToggleMute}
      overlay
      engineConfig={{
        initialScore,
        initialHp,
        bossThreshold: FASE3_BOSS_THRESHOLD,
        spawnIntervalMs: FASE3_SPAWN_INTERVAL,
        bossType: 'suka_mk2',
        bossHp: SUKA_MK2_HP,
        bossAnnounce: '🤖 SUKA MARK II!',
        bossAnnounceColor: '#9b59b6',
        bossDeathColor: '#aa44ff',
        bossDeathParticles: '#cc88ff',

        // Inimigos: zumbis flatulentos (chance rara de turbinado)
        getNormalEnemyType: () => {
          // 15% chance de Zumbi Turbinado (se condições não forem por cluster)
          if (Math.random() < 0.15) return 'zumbi_turbo';
          return 'zumbi';
        },
        getNormalEnemyHp: (tp) => {
          if (tp === 'zumbi_turbo') return ZUMBI_TURBO_HP;
          return ZUMBI_HP;
        },

        onGameOver,
        onComplete: handleComplete,

        // ── Mecânicas novas da Fase 3 ──
        environmentObjects: createFase3Objects(),
        playerPowers: { ...DEFAULT_POWERS }, // Sem power-ups (pré-treino)
      }}
    />
  );
}
