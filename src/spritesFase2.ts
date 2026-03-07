// ═══════════════════════════════════════════════════════
//  spritesFase2.ts — Sprites dos inimigos da Fase 2 (Fábrica NutriControl)
//
//  Operário/Segurança, Cientista, Fúria (normal + super)
//
//  Para adicionar sprite: cole o base64 entre as aspas.
//  Formato: 'data:image/png;base64,iVBOR...'
//  Tamanho recomendado: 120x120px
// ═══════════════════════════════════════════════════════

export const FASE2_SPRITES = {

  // ─────────────────────────────────────────────────────
  //  OPERÁRIO / SEGURANÇA (common enemy)
  //  Visual: uniforme de trabalho, capacete, postura rígida
  //  7 poses
  // ─────────────────────────────────────────────────────
  operario_parado:    '',  // Idle: em pé firme, braços ao lado, capacete
  operario_andando1:  '',  // Walk 1: marcha esquerda, braços mecânicos
  operario_andando2:  '',  // Walk 2: marcha direita, alternância
  operario_socando:   '',  // Soco: golpe pesado de cima pra baixo, peso do corpo
  operario_dano:      '',  // Dano: capacete voando, corpo dobrando ★ NOVO
  operario_grab:      '',  // Agarrão: braços estendidos tentando segurar ★ NOVO
  operario_morrendo:  '',  // Morte: caindo de frente, capacete quicando ★ NOVO

  // ─────────────────────────────────────────────────────
  //  CIENTISTA NUTRICONTROL (common enemy)
  //  Visual: jaleco branco, óculos, seringa/frasco
  //  7 poses
  // ─────────────────────────────────────────────────────
  cientista_parado:    '',  // Idle: parado com seringa/clipboard, curvado, sinistro
  cientista_andando1:  '',  // Walk 1: apressado esquerda, jaleco esvoaçando
  cientista_andando2:  '',  // Walk 2: apressado direita, alternância
  cientista_socando:   '',  // Ataque: investida com seringa ou joga frasco
  cientista_dano:      '',  // Dano: óculos voando, clipboard caindo ★ NOVO
  cientista_panico:    '',  // Pânico: recuando, mãos pra cima, covarde ★ NOVO
  cientista_morrendo:  '',  // Morte: no chão em posição fetal, óculos quebrados ★ NOVO

  // ─────────────────────────────────────────────────────
  //  FÚRIA — MODO NORMAL (Boss Fase 2)
  //  Visual: armadura cyber prata/cinza, pele escura,
  //  cabelo curto, visual tech-militar
  //  6 poses
  // ─────────────────────────────────────────────────────
  furia_parado:    '',  // Idle: stance de combate, punhos cerrados, placa peitoral
  furia_andando1:  '',  // Walk 1: passada blindada esquerda, botas pesadas
  furia_andando2:  '',  // Walk 2: passada blindada direita, alternância
  furia_socando:   '',  // Soco: punho blindado direito estendido, corpo girado
  furia_carga:     '',  // Carga: sprint blindado, ombro à frente, aríete
  furia_dano:      '',  // Dano: armadura amassando, faíscas, raiva ★ NOVO

  // ─────────────────────────────────────────────────────
  //  FÚRIA — MODO SUPER / FÚRIA MÁXIMA (< 35% HP)
  //  Visual: mesma armadura mas RACHADA, energia AZUL
  //  vazando pelas rachaduras, punhos carregados azul
  //  6 poses
  // ─────────────────────────────────────────────────────
  furia_super_parado:   '',  // Idle: energia azul pulsando, armadura deslocada
  furia_super_andando:  '',  // Walk: passo trovejante, energia azul trailing ★ NOVO
  furia_super_socando:  '',  // Soco: duplo punho azul, explosão de energia
  furia_super_carga:    '',  // Carga: sprint com rastro azul, relâmpago azul
  furia_super_dano:     '',  // Dano: armadura rachando, pedaços caindo, azul instável ★ NOVO
  furia_super_morrendo: '',  // Morte: de joelhos, armadura quebrando, azul apagando ★ NOVO
};
