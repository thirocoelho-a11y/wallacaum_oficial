// ═══════════════════════════════════════════════════════
//  screens.tsx — Telas de UI (título, transições, game over, vitória)
//
//  ✅ Adicionado: MotoToPhase4TransitionScreen
// ═══════════════════════════════════════════════════════
import React from 'react';

// ─────────────────────────────────────────────────────
//  Tela Título
// ─────────────────────────────────────────────────────
export function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 99999, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.95) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 28, color: '#f1c40f', fontWeight: 900, fontFamily: '"Press Start 2P", monospace', textShadow: '3px 3px 0 #c0392b, 5px 5px 0 rgba(0,0,0,0.5)', animation: 'pulse 1.5s infinite alternate', letterSpacing: 2 }}>WALLAÇAUM</div>
      <div style={{ fontSize: 9, color: '#e74c3c', marginTop: 6, letterSpacing: 2, fontWeight: 700, textShadow: '1px 1px 0 #000' }}>A CONSPIRAÇÃO DO SUPLEMENTO</div>
      <div onClick={onStart} style={{ marginTop: 22, padding: '12px 36px', background: 'linear-gradient(180deg, #e74c3c, #c0392b)', color: '#fff', fontWeight: 900, fontSize: 12, border: '3px solid #fff', borderRadius: 4, cursor: 'pointer', letterSpacing: 2, boxShadow: '0 4px 20px rgba(231,76,60,0.4)', animation: 'pulse 1.2s infinite alternate' }}>PRESS START</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  Transição Fase 1 → 2 (Suka derrotada, entra na fábrica)
// ─────────────────────────────────────────────────────
export function PhaseTransitionScreen({ score, onContinue }: { score: number; onContinue: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 99999, background: 'radial-gradient(ellipse at center, rgba(20,10,0,0.9) 0%, rgba(0,0,0,0.98) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#2ecc71', fontSize: 14, fontWeight: 900, letterSpacing: 3, textShadow: '0 0 15px rgba(46,204,113,0.5)' }}>✅ SUKA BARULHENTA DERROTADA!</div>
      <div style={{ color: '#888', fontSize: 9, marginTop: 8 }}>SCORE: {score}</div>
      <div style={{ width: 300, height: 2, background: 'linear-gradient(90deg, transparent, #ff4500, transparent)', margin: '18px 0' }} />
      <div style={{ fontSize: 22, color: '#ff4500', fontWeight: 900, fontFamily: '"Press Start 2P", monospace', textShadow: '3px 3px 0 #000, 0 0 20px rgba(255,69,0,0.4)', animation: 'pulse 1s infinite alternate', letterSpacing: 2 }}>FASE 2</div>
      <div style={{ fontSize: 10, color: '#ff8844', marginTop: 6, letterSpacing: 2, fontWeight: 700, textShadow: '1px 1px 0 #000' }}>FÁBRICA NUTRICONTROL</div>
      <div style={{ color: '#aaa', fontSize: 8, marginTop: 12, textAlign: 'center', maxWidth: 350, lineHeight: 1.6 }}>Wallaçaum invade a fábrica de suplementos.<br />FURIO, o chefe da NutriControl, está esperando.</div>
      <div onClick={onContinue} style={{ marginTop: 20, padding: '12px 36px', background: 'linear-gradient(180deg, #ff4500, #cc3300)', color: '#fff', fontWeight: 900, fontSize: 11, border: '3px solid #ff8844', borderRadius: 4, cursor: 'pointer', letterSpacing: 2, boxShadow: '0 4px 20px rgba(255,69,0,0.4)', animation: 'pulse 1.2s infinite alternate' }}>ENTRAR NA FÁBRICA</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  Transição Fase 2 → 3 (Furio derrotado, São Burgão em caos)
// ─────────────────────────────────────────────────────
export function Phase2to3TransitionScreen({ score, onContinue }: { score: number; onContinue: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 99999,
      background: 'radial-gradient(ellipse at center, rgba(0,10,20,0.9) 0%, rgba(0,0,0,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ color: '#2ecc71', fontSize: 12, fontWeight: 900, letterSpacing: 3, textShadow: '0 0 15px rgba(46,204,113,0.5)' }}>
        ✅ FURIO DERROTADO!
      </div>
      <div style={{ color: '#888', fontSize: 9, marginTop: 8 }}>SCORE: {score}</div>
      <div style={{ width: 300, height: 2, margin: '16px 0', background: 'linear-gradient(90deg, transparent, #95a5a6, transparent)' }} />
      <div style={{ color: '#e74c3c', fontSize: 8, textAlign: 'center', maxWidth: 380, lineHeight: 1.8, textShadow: '1px 1px 0 #000' }}>
        A fábrica foi destruída... mas os zumbis flatulentos<br />
        já infestaram São Burgão. As lanchonetes fecharam.<br />
        O Projeto Bufa Sintética criou algo incontrolável.
      </div>
      <div style={{ width: 300, height: 2, margin: '16px 0', background: 'linear-gradient(90deg, transparent, #9b59b6, transparent)' }} />
      <div style={{ fontSize: 18, color: '#9b59b6', fontWeight: 900, fontFamily: '"Press Start 2P", monospace', textShadow: '3px 3px 0 #000, 0 0 20px rgba(155,89,182,0.4)', animation: 'pulse 1s infinite alternate', letterSpacing: 2 }}>
        FASE 3
      </div>
      <div style={{ fontSize: 10, color: '#bb88dd', marginTop: 6, letterSpacing: 2, fontWeight: 700, textShadow: '1px 1px 0 #000' }}>
        TEMPESTADE SOBRE SÃO BURGÃO
      </div>
      <div style={{ color: '#aaa', fontSize: 8, marginTop: 12, textAlign: 'center', maxWidth: 350, lineHeight: 1.6 }}>
        A Bufa Celeste original alimenta os zumbis em vez de derrotá-los.<br />
        Use os objetos do ambiente a seu favor.<br />
        SUKA voltou — com armadura nova.
      </div>
      <div onClick={onContinue} style={{
        marginTop: 20, padding: '12px 36px',
        background: 'linear-gradient(180deg, #9b59b6, #7d3c98)',
        color: '#fff', fontWeight: 900, fontSize: 11,
        border: '3px solid #bb88dd', borderRadius: 4,
        cursor: 'pointer', letterSpacing: 2,
        boxShadow: '0 4px 20px rgba(155,89,182,0.4)',
        animation: 'pulse 1.2s infinite alternate',
      }}>
        ENTRAR EM SÃO BURGÃO
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  Transição Fase 3 → 3½ (pós-cutscene horda, moto)
// ─────────────────────────────────────────────────────
export function Phase3toMotoTransitionScreen({ score, onContinue }: { score: number; onContinue: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 99999,
      background: 'radial-gradient(ellipse at center, rgba(10,5,0,0.95) 0%, rgba(0,0,0,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontSize: 16, color: '#e67e22', fontWeight: 900,
        fontFamily: '"Press Start 2P", monospace',
        textShadow: '3px 3px 0 #000, 0 0 15px rgba(230,126,34,0.4)',
        animation: 'pulse 0.8s infinite alternate', letterSpacing: 2,
      }}>
        🏍️ FUGA!
      </div>
      <div style={{
        fontSize: 9, color: '#f39c12', marginTop: 8,
        letterSpacing: 2, fontWeight: 700, textShadow: '1px 1px 0 #000',
      }}>
        ESTRADA PARA A MONTANHA
      </div>
      <div style={{ width: 300, height: 2, margin: '16px 0', background: 'linear-gradient(90deg, transparent, #e67e22, transparent)' }} />
      <div style={{
        color: '#aaa', fontSize: 8, textAlign: 'center',
        maxWidth: 350, lineHeight: 1.8,
      }}>
        Davisaum no guidão. Horda nos calcanhares.<br />
        ↑↓ Mudar faixa &nbsp; Z Pular &nbsp; X Soco lateral<br />
        Sobreviva até a montanha!
      </div>
      <div onClick={onContinue} style={{
        marginTop: 20, padding: '12px 36px',
        background: 'linear-gradient(180deg, #e67e22, #d35400)',
        color: '#fff', fontWeight: 900, fontSize: 11,
        border: '3px solid #f39c12', borderRadius: 4,
        cursor: 'pointer', letterSpacing: 2,
        boxShadow: '0 4px 20px rgba(230,126,34,0.4)',
        animation: 'pulse 1.2s infinite alternate',
      }}>
        ACELERAR
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  ✅ NOVO: Transição Moto → Fase 4 (chegou na montanha)
// ─────────────────────────────────────────────────────
export function MotoToPhase4TransitionScreen({ score, onContinue }: { score: number; onContinue: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 99999,
      background: 'radial-gradient(ellipse at center, rgba(5,5,15,0.95) 0%, rgba(0,0,0,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Vitória da moto */}
      <div style={{
        color: '#2ecc71', fontSize: 12, fontWeight: 900, letterSpacing: 3,
        textShadow: '0 0 15px rgba(46,204,113,0.5)',
      }}>
        ✅ FUGA BEM-SUCEDIDA!
      </div>
      <div style={{ color: '#888', fontSize: 9, marginTop: 6 }}>SCORE: {score}</div>

      {/* Davisaum aliviado */}
      <div style={{
        color: '#3498db', fontSize: 8, marginTop: 12,
        fontStyle: 'italic', textShadow: '1px 1px 0 #000',
      }}>
        Davisaum: "CHEGAMOS! EU AINDA TO INTEIRO?! CONFERE PRA MIM!"
      </div>

      {/* Separador */}
      <div style={{
        width: 300, height: 2, margin: '16px 0',
        background: 'linear-gradient(90deg, transparent, #95a5a6, transparent)',
      }} />

      {/* Montanha */}
      <div style={{
        fontSize: 22, color: '#95a5a6', fontWeight: 900,
        fontFamily: '"Press Start 2P", monospace',
        textShadow: '3px 3px 0 #000, 0 0 20px rgba(149,165,166,0.3)',
        animation: 'pulse 1.5s infinite alternate',
        letterSpacing: 2,
      }}>
        🏔️ MONTANHA DAS PEDRAS AGUDAS
      </div>

      {/* Narrativa */}
      <div style={{
        color: '#aaa', fontSize: 8, marginTop: 14,
        textAlign: 'center', maxWidth: 380, lineHeight: 1.8,
        textShadow: '1px 1px 0 #000',
      }}>
        O Mestre Ancião os esperava.<br />
        <br />
        <span style={{ color: '#f1c40f', fontWeight: 700 }}>
          "É hora de evoluir a Bufa Celeste."
        </span>
      </div>

      {/* Separador */}
      <div style={{
        width: 300, height: 2, margin: '16px 0',
        background: 'linear-gradient(90deg, transparent, #f1c40f33, transparent)',
      }} />

      {/* Botão */}
      <div onClick={onContinue} style={{
        marginTop: 8, padding: '12px 36px',
        background: 'linear-gradient(180deg, #95a5a6, #7f8c8d)',
        color: '#fff', fontWeight: 900, fontSize: 11,
        border: '3px solid #bdc3c7', borderRadius: 4,
        cursor: 'pointer', letterSpacing: 2,
        boxShadow: '0 4px 20px rgba(149,165,166,0.3)',
        animation: 'pulse 1.2s infinite alternate',
      }}>
        INICIAR TREINO
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  Game Over
// ─────────────────────────────────────────────────────
export function GameOverScreen({ score, onRetry }: { score: number; onRetry: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 99999, background: 'radial-gradient(ellipse at center, rgba(40,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 28, color: '#e74c3c', fontWeight: 900, textShadow: '3px 3px 0 #000, 0 0 20px rgba(231,76,60,0.5)', animation: 'shake 0.5s infinite' }}>GAME OVER</div>
      <div style={{ color: '#f1c40f', fontSize: 12, marginTop: 8, fontWeight: 700 }}>SCORE: {score}</div>
      <div onClick={onRetry} style={{ marginTop: 14, padding: '10px 28px', background: 'linear-gradient(180deg, #e74c3c, #c0392b)', color: '#fff', fontWeight: 900, fontSize: 11, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 4 }}>TENTAR DE NOVO</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  Vitória (será atualizada quando Fase 5 existir)
// ─────────────────────────────────────────────────────
export function VictoryScreen({ score, onRetry }: { score: number; onRetry: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 99999, background: 'radial-gradient(ellipse at center, rgba(0,40,20,0.85) 0%, rgba(0,0,0,0.95) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 28, color: '#f1c40f', fontWeight: 900, textShadow: '3px 3px 0 #000, 0 0 25px rgba(241,196,15,0.5)', animation: 'pulse 1s infinite alternate' }}>🏆 VITÓRIA TOTAL! 🏆</div>
      <div style={{ color: '#2ecc71', fontSize: 10, marginTop: 8 }}>FURIO E A NUTRICONTROL FORAM DERROTADOS!</div>
      <div style={{ color: '#95a5a6', fontSize: 9, marginTop: 4, fontStyle: 'italic' }}>São Burgão está livre dos suplementos falsos.</div>
      <div style={{ color: '#f1c40f', fontSize: 14, marginTop: 8, fontWeight: 900 }}>SCORE FINAL: {score}</div>
      <div onClick={onRetry} style={{ marginTop: 14, padding: '10px 28px', background: 'linear-gradient(180deg, #f1c40f, #e67e22)', color: '#000', fontWeight: 900, fontSize: 11, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 4 }}>JOGAR DE NOVO</div>
    </div>
  );
}