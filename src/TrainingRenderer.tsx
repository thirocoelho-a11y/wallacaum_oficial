// ═══════════════════════════════════════════════════════
//  TrainingRenderer.tsx — Visual da Fase 4 (RPG por Turnos)
//
//  ✅ FIX BUG1: Wallaçaum scaleX(-1) → olha pra DIREITA
//  ✅ FIX BUG2: Ancião attack scaleX(-1) → mira à ESQUERDA
//  ✅ AUDIT: Barra usa willChange pra GPU compositing
//  ✅ AUDIT: Phase 'game_over_delay' renderizada
// ═══════════════════════════════════════════════════════
import React, { memo } from 'react';
import type { BattleState } from './useTrainingEngine';
import { BASE_W, BASE_H } from './constants';
import {
  CENARIO_FASE4, ANCIAO_SIZE, WALLACAUM_SIZE,
  getAnciaoSprite, getWallacaumSprite,
  FX_RAIO, FX_VENTO, FX_POEIRA, FX_BUFA_FLASH,
  ITEM_BURGAO, ITEM_AGUA,
} from './spritesFase4';

interface Props {
  state: BattleState;
  tick: number;
  muted: boolean;
  onToggleMute: () => void;
}

function has(src: string): boolean { return !!src && src.length > 10; }

const BATTLE_H = BASE_H * 0.62;
const UI_TOP = BATTLE_H;

function speakerColor(s: string): string {
  switch (s) { case 'anciao': return '#9b59b6'; case 'wallacaum': return '#2ecc71'; case 'davisaum': return '#3498db'; case 'sistema': return '#f1c40f'; default: return '#fff'; }
}
function speakerName(s: string): string {
  switch (s) { case 'anciao': return 'MESTRE ANCIÃO'; case 'wallacaum': return 'WALLAÇAUM'; case 'davisaum': return 'DAVISAUM'; default: return ''; }
}

export default memo(function TrainingRenderer({ state: s, tick, muted, onToggleMute }: Props) {
  const f = s.frame;
  const sx = s.screenShake > 0 ? (Math.random() - 0.5) * s.screenShake * 2 : 0;
  const sy = s.screenShake > 0 ? (Math.random() - 0.5) * s.screenShake * 2 : 0;

  const anciaoSpr = getAnciaoSprite(s.anciaoSprite);
  const wallSpr = getWallacaumSprite(s.wallacaumSprite);
  const currentDlg = s.dialogueQueue[s.dialogueIndex];
  const anciaoFlip = s.anciaoSprite === 'attack';

  return (
    <div style={{
      position: 'absolute', inset: 0, width: BASE_W, height: BASE_H, overflow: 'hidden',
      transform: `translate(${sx}px, ${sy}px)`,
      fontFamily: '"Press Start 2P", monospace, system-ui',
    }}>

      {/* ════ ÁREA DE BATALHA (62%) ════ */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: BATTLE_H, overflow: 'hidden' }}>

        {/* Cenário */}
        {has(CENARIO_FASE4) ? (
          <img src={CENARIO_FASE4} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated', zIndex: 0 }} />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1a0a2e 0%, #4a1942 25%, #c0392b 50%, #e67e22 70%, #f39c12 85%, #2d2d44 85%, #1a1a2e 100%)', zIndex: 0 }} />
            <svg viewBox="0 0 800 280" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1 }}>
              <polygon points="0,280 80,120 160,180 250,80 340,160 420,60 500,140 580,90 660,150 740,100 800,180 800,280" fill="#2d2040" />
              <polygon points="0,280 100,180 200,220 300,160 400,200 500,170 600,210 700,180 800,230 800,280" fill="#1a1a2e" />
            </svg>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%', background: 'linear-gradient(180deg, #3d3055 0%, #2a2040 100%)', zIndex: 2 }} />
            {[120, 350, 580, 700].map((x, i) => (
              <div key={`t${i}`} style={{ position: 'absolute', bottom: '16%', left: x, width: 0, height: 0, borderLeft: `${8 + i * 2}px solid transparent`, borderRight: `${8 + i * 2}px solid transparent`, borderBottom: `${20 + i * 4}px solid #1a3a20`, zIndex: 1, opacity: 0.6 }} />
            ))}
          </>
        )}

        {/* HUD Ancião */}
        <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 20, background: 'rgba(0,0,0,0.75)', border: '3px solid #f1c40f', borderRadius: 6, padding: '8px 12px', minWidth: 180 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: '#fff', fontWeight: 900 }}>MESTRE ANCIÃO</span>
            <span style={{ fontSize: 7, color: '#aaa' }}>L{s.anciaoLevel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 7, color: '#2ecc71', fontWeight: 900 }}>HP</span>
            <div style={{ flex: 1, height: 8, background: '#333', borderRadius: 4, border: '1px solid #555' }}>
              <div style={{ width: `${(s.anciaoHp / s.anciaoMaxHp) * 100}%`, height: '100%', background: s.anciaoHp > 50 ? '#2ecc71' : s.anciaoHp > 25 ? '#f39c12' : '#e74c3c', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
          <div style={{ fontSize: 7, color: '#aaa', textAlign: 'right', marginTop: 2 }}>{s.anciaoHp}/{s.anciaoMaxHp}</div>
        </div>

        {/* HUD Wallaçaum */}
        <div style={{ position: 'absolute', top: 12, right: 16, zIndex: 20, background: 'rgba(0,0,0,0.75)', border: '3px solid #f1c40f', borderRadius: 6, padding: '8px 12px', minWidth: 180 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: '#fff', fontWeight: 900 }}>WALLAÇAUM</span>
            <span style={{ fontSize: 7, color: '#aaa' }}>L{s.playerLevel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 7, color: '#2ecc71', fontWeight: 900 }}>HP</span>
            <div style={{ flex: 1, height: 8, background: '#333', borderRadius: 4, border: '1px solid #555' }}>
              <div style={{ width: `${(s.playerHp / s.playerMaxHp) * 100}%`, height: '100%', background: s.playerHp > 50 ? '#2ecc71' : s.playerHp > 25 ? '#f39c12' : '#e74c3c', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
          <div style={{ fontSize: 7, color: '#aaa', textAlign: 'right', marginTop: 2 }}>{s.playerHp}/{s.playerMaxHp}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 6, color: '#3498db', fontWeight: 900 }}>CXP</span>
            <div style={{ flex: 1, height: 6, background: '#333', borderRadius: 3, border: '1px solid #444' }}>
              <div style={{ width: `${s.cxp}%`, height: '100%', background: s.cxp >= 100 ? '#f1c40f' : '#3498db', borderRadius: 2, transition: 'width 0.5s' }} />
            </div>
          </div>
        </div>

        {/* ✅ BUG2: Ancião — scaleX(-1) quando atacando */}
        <div style={{
          position: 'absolute', right: 80, bottom: '12%',
          width: ANCIAO_SIZE.width, height: ANCIAO_SIZE.height, zIndex: 10,
          opacity: s.anciaoSprite === 'hurt' ? (f % 4 < 2 ? 0.4 : 1) : 1,
          filter: s.anciaoSprite === 'hurt' ? 'brightness(1.5)' : 'none',
          transform: [anciaoFlip ? 'scaleX(-1)' : '', s.anciaoSprite === 'attack' ? 'translateX(-15px)' : ''].filter(Boolean).join(' ') || 'none',
          transition: 'transform 0.2s, filter 0.1s',
        }}>
          {has(anciaoSpr) ? (
            <img src={anciaoSpr} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 0, height: 0, borderLeft: '40px solid transparent', borderRight: '40px solid transparent', borderBottom: '30px solid #8B7355' }} />
              <div style={{ width: 70, flex: 1, background: s.anciaoSprite === 'angry' ? '#c0392b' : s.anciaoSprite === 'hurt' ? '#ff6666' : '#4a7c59', borderRadius: '12px 12px 4px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                {s.anciaoSprite === 'approve' ? '😌' : s.anciaoSprite === 'angry' ? '😡' : s.anciaoSprite === 'hurt' ? '😤' : s.anciaoSprite === 'attack' ? '🖐️' : '🧘'}
              </div>
              <div style={{ width: 50, height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: '50%', marginTop: 2 }} />
            </div>
          )}
        </div>

        {/* ✅ BUG1: Wallaçaum — scaleX(-1) permanente */}
        <div style={{
          position: 'absolute', left: 60, bottom: '8%',
          width: WALLACAUM_SIZE.width, height: WALLACAUM_SIZE.height, zIndex: 12,
          transform: [
            'scaleX(-1)',
            s.wallacaumSprite === 'punch' ? 'translateX(-20px)' : '',
            s.wallacaumSprite === 'bufa' ? 'scale(-1.05, 1.05)' : '',
          ].filter(Boolean).join(' '),
          transition: 'transform 0.15s',
        }}>
          {has(wallSpr) ? (
            <img src={wallSpr} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
              <div style={{ width: 25, height: 20, background: '#333', borderRadius: '6px 6px 0 0' }} />
              <div style={{ width: 80, height: 110, background: s.wallacaumSprite === 'bufa' ? '#27ae60' : s.wallacaumSprite === 'punch' ? '#f39c12' : '#444', borderRadius: '8px 8px 4px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: s.wallacaumSprite === 'bufa' ? '0 0 20px rgba(46,204,113,0.5)' : 'none' }}>
                <div style={{ fontSize: 20 }}>{s.wallacaumSprite === 'punch' ? '👊' : s.wallacaumSprite === 'bufa' ? '💨' : '🎸'}</div>
              </div>
              <div style={{ width: 60, height: 8, background: 'rgba(0,0,0,0.25)', borderRadius: '50%', marginTop: 2 }} />
            </div>
          )}
        </div>

        {/* Efeitos */}
        {s.showFxRaio && (
          <div style={{ position: 'absolute', top: 0, left: '35%', width: 60, height: '100%', zIndex: 15, animation: 'pulse 0.1s infinite' }}>
            {has(FX_RAIO) ? <img src={FX_RAIO} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} /> : <div style={{ width: 4, height: '100%', margin: '0 auto', background: 'linear-gradient(180deg, #f1c40f, #fff, #f1c40f)', boxShadow: '0 0 20px #f1c40f, 0 0 40px #f39c12' }} />}
          </div>
        )}
        {s.showFxVento && (
          <div style={{ position: 'absolute', top: '30%', left: '25%', right: '25%', height: 60, zIndex: 14, opacity: 0.6 }}>
            {has(FX_VENTO) ? <img src={FX_VENTO} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} /> : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(200,200,200,0.4), transparent)', borderRadius: 20 }} />}
          </div>
        )}
        {s.showFxBufa && <div style={{ position: 'absolute', inset: 0, zIndex: 16, background: 'radial-gradient(circle at 30% 60%, rgba(46,204,113,0.4), transparent 60%)', animation: 'pulse 0.2s infinite' }} />}
        {s.showFxPoeira && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', zIndex: 14, opacity: 0.5, background: 'linear-gradient(180deg, transparent, rgba(139,115,85,0.4))' }} />}
        {s.playerConfused && <div style={{ position: 'absolute', left: 90, bottom: '30%', zIndex: 18, fontSize: 18, animation: 'shake 0.5s infinite' }}>😵‍💫</div>}
        <div onClick={onToggleMute} style={{ position: 'absolute', top: BATTLE_H - 24, left: BASE_W / 2 - 10, fontSize: 14, cursor: 'pointer', zIndex: 25, opacity: 0.4 }}>{muted ? '🔇' : '🔊'}</div>
      </div>

      {/* ════ ÁREA DE UI (38%) ════ */}
      <div style={{ position: 'absolute', top: UI_TOP, left: 0, right: 0, bottom: 0, background: '#111', borderTop: '4px solid #f1c40f', zIndex: 30 }}>

        {/* Diálogo */}
        {s.phase === 'dialogue' && currentDlg && (
          <div style={{ position: 'absolute', inset: 8, background: '#000', border: '3px solid #f1c40f', borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {speakerName(currentDlg.speaker) && <div style={{ fontSize: 8, color: speakerColor(currentDlg.speaker), fontWeight: 900, marginBottom: 6, letterSpacing: 1 }}>{speakerName(currentDlg.speaker)}:</div>}
            <div style={{ fontSize: 9, color: currentDlg.speaker === 'sistema' ? speakerColor(currentDlg.speaker) : '#fff', lineHeight: 2, fontWeight: currentDlg.speaker === 'sistema' ? 900 : 700 }}>
              {s.currentText}{!s.textComplete && <span style={{ opacity: f % 20 < 10 ? 1 : 0 }}>▌</span>}
            </div>
            {s.textComplete && <div style={{ position: 'absolute', bottom: 10, right: 16, fontSize: 10, color: '#f1c40f', animation: 'pulse 0.8s infinite alternate' }}>▼</div>}
          </div>
        )}

        {/* Menu */}
        {s.phase === 'menu' && !s.submenuOpen && (
          <div style={{ position: 'absolute', inset: 8, background: '#000', border: '3px solid #f1c40f', borderRadius: 8, padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, alignContent: 'center' }}>
            {s.menuOptions.map((opt, i) => (
              <div key={opt} style={{ padding: '8px 12px', background: i === s.menuIndex ? 'rgba(241,196,15,0.15)' : 'transparent', border: i === s.menuIndex ? '2px solid #f1c40f' : '2px solid #333', borderRadius: 6, color: i === s.menuIndex ? '#f1c40f' : '#888', fontSize: 9, fontWeight: 900, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.1s' }}>
                {i === s.menuIndex ? '▶ ' : '  '}{opt}
              </div>
            ))}
          </div>
        )}

        {/* Submenu */}
        {s.phase === 'menu' && s.submenuOpen && (
          <div style={{ position: 'absolute', inset: 8, background: '#000', border: '3px solid #9b59b6', borderRadius: 8, padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
            <div style={{ fontSize: 7, color: '#666', marginBottom: 4 }}>X = VOLTAR</div>
            {s.submenuOptions.map((opt, i) => (
              <div key={opt} style={{ padding: '6px 12px', background: i === s.submenuIndex ? 'rgba(155,89,182,0.15)' : 'transparent', border: i === s.submenuIndex ? '2px solid #9b59b6' : '2px solid #333', borderRadius: 6, color: i === s.submenuIndex ? '#bb88dd' : '#888', fontSize: 8, fontWeight: 900, cursor: 'pointer', opacity: opt === '(vazio)' ? 0.3 : 1 }}>
                {i === s.submenuIndex ? '▶ ' : '  '}{opt}
              </div>
            ))}
          </div>
        )}

        {/* Minigame Barra */}
        {s.phase === 'minigame_bar' && (
          <div style={{ position: 'absolute', inset: 8, background: '#000', border: '3px solid #2ecc71', borderRadius: 8, padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ fontSize: 8, color: '#fff', fontWeight: 900 }}>PARE A BARRA NA ZONA VERDE!</div>
            <div style={{ position: 'relative', width: '90%', height: 24, background: '#222', border: '2px solid #555', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: `${s.barTargetMin}%`, width: `${s.barTargetMax - s.barTargetMin}%`, top: 0, bottom: 0, background: 'rgba(46,204,113,0.3)', borderLeft: '2px solid #2ecc71', borderRight: '2px solid #2ecc71' }} />
              <div style={{ position: 'absolute', top: 2, left: 4, fontSize: 6, color: '#e74c3c', fontWeight: 900 }}>FRACO</div>
              <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 6, color: '#2ecc71', fontWeight: 900 }}>IDEAL</div>
              <div style={{ position: 'absolute', top: 2, right: 4, fontSize: 6, color: '#e74c3c', fontWeight: 900 }}>FORTE</div>
              {/* ✅ AUDIT: willChange pra GPU compositing */}
              <div style={{
                position: 'absolute', left: `${s.barPosition}%`, top: 0, bottom: 0, width: 4,
                background: s.barStopped ? (s.barResult === 'hit' ? '#2ecc71' : '#e74c3c') : '#fff',
                boxShadow: `0 0 8px ${s.barStopped ? (s.barResult === 'hit' ? '#2ecc71' : '#e74c3c') : '#fff'}`,
                willChange: 'left',
              }} />
            </div>
            <div style={{ fontSize: 7, color: '#f1c40f', animation: 'pulse 0.5s infinite alternate' }}>
              {s.barStopped ? (s.barResult === 'hit' ? '✓ PERFEITO!' : '✗ ERROU!') : 'Aperte Z / C / ENTER pra parar!'}
            </div>
            {s.playerConfused && <div style={{ fontSize: 6, color: '#e67e22' }}>😵‍💫 CONFUSO — barra instável!</div>}
          </div>
        )}

        {/* Minigame Raio */}
        {s.phase === 'minigame_raio' && (
          <div style={{ position: 'absolute', inset: 8, background: '#000', border: '3px solid #f1c40f', borderRadius: 8, padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 8, color: '#fff', fontWeight: 900 }}>SINCRONIZE COM O RAIO!</div>
            <div style={{ width: '80%', height: 16, background: '#222', border: '2px solid #555', borderRadius: 8 }}>
              <div style={{ width: `${Math.max(0, (s.raioTimer / 180) * 100)}%`, height: '100%', background: s.raioWindow ? '#f1c40f' : '#555', borderRadius: 6, transition: 'width 0.05s, background 0.1s', boxShadow: s.raioWindow ? '0 0 15px #f1c40f' : 'none' }} />
            </div>
            <div style={{ fontSize: s.raioWindow ? 14 : 9, color: s.raioWindow ? '#f1c40f' : '#888', fontWeight: 900, animation: s.raioWindow ? 'pulse 0.2s infinite alternate' : 'none', textShadow: s.raioWindow ? '0 0 10px #f1c40f' : 'none' }}>
              {s.raioWindow ? '⚡ AGORA! ⚡' : s.raioTimer > 120 ? 'Prepare-se...' : s.raioTimer > 60 ? 'O raio se aproxima...' : 'Quase...!'}
            </div>
            {s.raioResult !== 'none' && <div style={{ fontSize: 12, fontWeight: 900, color: s.raioResult === 'hit' ? '#2ecc71' : '#e74c3c' }}>{s.raioResult === 'hit' ? '✓ PERFEITO!' : '✗ ERROU!'}</div>}
          </div>
        )}

        {/* Animação */}
        {(s.phase === 'player_action' || s.phase === 'enemy_action') && (
          <div style={{ position: 'absolute', inset: 8, background: '#000', border: '3px solid #555', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 10, color: '#fff', fontWeight: 900, animation: 'pulse 0.3s infinite alternate' }}>{s.phase === 'player_action' ? '💥' : '⚡'}</div>
          </div>
        )}

        {/* Game Over Delay */}
        {s.phase === 'game_over_delay' && (
          <div style={{ position: 'absolute', inset: 8, background: '#000', border: '3px solid #e74c3c', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#e74c3c', fontWeight: 900, animation: 'pulse 0.5s infinite alternate' }}>💀 DERROTADO...</div>
            <div style={{ fontSize: 8, color: '#888' }}>SCORE: {s.score}</div>
          </div>
        )}

        {/* Complete */}
        {s.phase === 'complete' && (
          <div style={{ position: 'absolute', inset: 8, background: '#000', border: '3px solid #f1c40f', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ fontSize: 12, color: '#f1c40f', fontWeight: 900 }}>⭐ TREINO COMPLETO! ⭐</div>
            <div style={{ fontSize: 8, color: '#2ecc71' }}>SCORE: {s.score}</div>
          </div>
        )}
      </div>
    </div>
  );
});