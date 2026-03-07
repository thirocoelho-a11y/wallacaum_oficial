// ═══════════════════════════════════════════════════════
//  gameStyles.ts — CSS global de animações
// ═══════════════════════════════════════════════════════

export const GAME_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}
  html,body{margin:0;padding:0;overflow:hidden;background:#000;touch-action:none;position:fixed;width:100%;height:100%}
  @keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}50%{opacity:0.8;transform:translateY(-20px) scale(1.1)}100%{opacity:0;transform:translateY(-45px) scale(0.8)}}
  @keyframes pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.1);opacity:1}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  @keyframes smokeRise{0%{opacity:0.6;transform:scale(0.5) translateY(0)}100%{opacity:0;transform:scale(1.8) translateY(-40px)}}
  @keyframes smokeDrift{0%{transform:translateX(0) rotate(0deg) scale(1)}25%{transform:translateX(-8px) rotate(-3deg) scale(1.05)}50%{transform:translateX(4px) rotate(2deg) scale(0.97)}75%{transform:translateX(-4px) rotate(-1deg) scale(1.03)}100%{transform:translateX(0) rotate(0deg) scale(1)}}
  @keyframes smokeExpand{0%{transform:scale(0.3) rotate(0deg);opacity:0}15%{opacity:0.9}50%{transform:scale(1.1) rotate(5deg);opacity:0.7}100%{transform:scale(1.5) rotate(-3deg);opacity:0.3}}
  @keyframes smokeFade{0%{transform:scale(1) rotate(0deg);opacity:0.6}100%{transform:scale(1.8) rotate(8deg);opacity:0}}
  @keyframes sonicWave{0%{transform:scale(0.5);opacity:0.7}100%{transform:scale(2.5);opacity:0}}
  @keyframes itemFloat{0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)}}
  @keyframes crumbFall{0%{opacity:0.9;transform:translateY(0) translateX(0)}100%{opacity:0;transform:translateY(25px) translateX(5px)}}
`;