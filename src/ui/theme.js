// Thème : couleurs (palette unique, accent WTA), polices, styles globaux.

// ─── STYLES ───────────────────────────────────────────────────────────────────
// ─── DESIGN SYSTEM TOKENS ─────────────────────────────────────────────────────
// Direction « gazette BD », palette « Wimbledon pop » : une BD imprimée sur
// papier craie. Encre épaisse, trame de points partout, vert gazon, violet
// club, jaune balle fluo et lilas ; cases cernées de noir avec une ombre
// décalée, lettrage à la main pour les bulles et les récitatifs.
// (Les noms de jetons cyan/magenta/gold sont historiques : cyan = gazon,
// magenta = violet club, gold = jaune balle.)
export const T = {
  // Backgrounds (deepest to highest) — resolved via CSS variables so the
  // accent can switch between the men's and women's circuits.
  bg0:  "var(--tm-bg0)",
  bg1:  "var(--tm-bg1)",
  bg2:  "var(--tm-bg2)",
  bg3:  "var(--tm-bg3)",
  bg4:  "var(--tm-bg4)",
  // Borders
  brd:  "var(--tm-brd)",
  brd2: "var(--tm-brd2)",
  brd3: "var(--tm-brd3)",
  // Text
  fg:   "var(--tm-fg)",
  fg2:  "var(--tm-fg2)",
  fg3:  "var(--tm-fg3)",
  fg4:  "var(--tm-fg4)",
  fg5:  "var(--tm-fg5)",
  // Tennis green
  green:    "var(--tm-green)",
  greenHi:  "var(--tm-greenHi)",
  greenDk:  "var(--tm-greenDk)",
  greenSub: "var(--tm-greenSub)",
  greenBrd: "var(--tm-greenBrd)",
  // Ball yellow
  ball: "var(--tm-ball)",
  // Critical / warning
  red:  "var(--tm-red)",
  redSub: "var(--tm-redSub)",
  amber: "var(--tm-amber)",
  amberSub: "var(--tm-amberSub)",
  // Modal/dialog backdrop, theme-aware (avoids hard black on light mode)
  overlay: "var(--tm-overlay)",
  // Type families
  display: "'Archivo Black', 'Arial Black', sans-serif",
  body:    "'Archivo', system-ui, -apple-system, sans-serif",
  serif:   "'Archivo', system-ui, sans-serif",
  hand:    "'Kalam', 'Comic Neue', cursive",
  cyan: "var(--tm-cyan)", magenta: "var(--tm-magenta)", lilac: "var(--tm-lilac)", dot: "var(--tm-dot)",
  mono:    "'IBM Plex Mono', ui-monospace, monospace",
  ink: "var(--tm-ink)", paper: "var(--tm-paper)", gold: "var(--tm-gold)",
  blue: "var(--tm-blue)", blueSub: "var(--tm-blueSub)", blueBrd: "var(--tm-blueBrd)",
  redBrd: "var(--tm-redBrd)", amberBrd: "var(--tm-amberBrd)",
  clay: "var(--tm-clay)", onAccent: "var(--tm-onAccent)", shadow: "var(--tm-shadow)",
  // Chrome (top bar + bottom nav) — follow the active theme.
  barBg:   "var(--tm-bg1)",
  barBg2:  "var(--tm-bg2)",
  barBg3:  "var(--tm-bg3)",
  barBrd:  "var(--tm-brd)",
  barBrd2: "var(--tm-brd2)",
  barFg:   "var(--tm-fg)",
  barFg3:  "var(--tm-fg3)",
  barFg4:  "var(--tm-fg4)",
  barFg5:  "var(--tm-fg5)",
  barGreen:"var(--tm-green)",
  barBall: "var(--tm-ball)",
  barAmber:"var(--tm-amber)",
  barRed:  "var(--tm-red)",
};

// Valeurs de la palette « Wimbledon pop » : papier craie, encre, vert
// gazon, violet club, jaune balle, lilas. Les clés donnent les variables
// CSS --tm-* ci-dessus.
export const PALETTE = {
  bg0: "#f4f2e9", bg1: "#ffffff", bg2: "#ebe8da", bg3: "#dedac8", bg4: "#cbc6af",
  brd: "rgba(20,20,20,0.30)", brd2: "rgba(20,20,20,0.62)", brd3: "#141414",
  fg: "#141414", fg2: "#24241f", fg3: "#3c3c34", fg4: "#5a5a50", fg5: "#7a7a6e",
  green: "#1f7a45", greenHi: "#258f51", greenDk: "#135232",
  greenSub: "rgba(31,122,69,0.12)", greenBrd: "rgba(31,122,69,0.50)",
  ball: "#6e7d00",
  red: "#c4302b", redSub: "rgba(196,48,43,0.10)", redBrd: "rgba(196,48,43,0.45)",
  amber: "#946200", amberSub: "rgba(148,98,0,0.12)", amberBrd: "rgba(148,98,0,0.45)",
  blue: "#5b2d8e", blueSub: "rgba(91,45,142,0.10)", blueBrd: "rgba(91,45,142,0.45)",
  clay: "#c4572b",
  onAccent: "#ffffff",
  ink: "#141414", paper: "#f4f2e9", gold: "#d6ef3c",
  cyan: "#1f7a45", magenta: "#5b2d8e", lilac: "#c9b6ea", dot: "rgba(20,20,20,0.11)",
  shadow: "rgba(20,20,20,0.20)",
  overlay: "rgba(20,20,20,0.55)",
};

// Circuit WTA : le vert d'accent devient rose (l'ocre et le reste ne bougent pas).
export const WTA_ACCENT = { green: "#a3267c", greenHi: "#b8318d", greenDk: "#731a57", greenSub: "rgba(163,38,124,0.10)", greenBrd: "rgba(163,38,124,0.45)" };

const cssVars = (p) => Object.keys(p).map(k => "--tm-" + k + ":" + p[k] + ";").join("");

// Applique l'accent du circuit en écrivant les variables CSS sur :root.
export function applyCircuitAccent(circuit) {
  if (typeof document === "undefined") return;
  const p = circuit === "wta" ? { ...PALETTE, ...WTA_ACCENT } : PALETTE;
  const root = document.documentElement;
  Object.keys(p).forEach(k => root.style.setProperty("--tm-" + k, p[k]));
}

// Inject Google Fonts + global CSS once
if (typeof document !== "undefined" && !document.getElementById("tm-global-styles")) {
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700;800&family=Kalam:wght@700&family=IBM+Plex+Mono:wght@500;600&display=swap";
  document.head.appendChild(fontLink);

  const tag = document.createElement("style");
  tag.id = "tm-global-styles";
  tag.innerHTML = `
    :root { ${cssVars(PALETTE)} }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body { margin: 0; padding: 0; background: ${T.bg0}; }
    body {
      font-family: ${T.body};
      color: ${T.fg};
      -webkit-font-smoothing: antialiased;
      line-height: 1.4;
    }
    button { font-family: inherit; }
    button:disabled { cursor: default; }
    button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid ${T.green}; outline-offset: 2px; }

    /* Paper grain */
    .tm-grain::before {
      content: "";
      position: absolute; inset: 0;
      pointer-events: none;
      opacity: 0.06;
      mix-blend-mode: multiply;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>");
    }

    /* Court lines (discrètes) */
    .tm-court { position: relative; overflow: hidden; }
    .tm-court::after {
      content: "";
      position: absolute; inset: 10px;
      pointer-events: none;
      border: 1px dashed ${T.brd2};
      border-radius: 10px;
    }

    /* Animations (douces) */
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
    @keyframes tm-bounce-x { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-4px); } }
    @keyframes tm-fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    @keyframes tm-pulse-green { 0%,100% { box-shadow: 0 0 0 0 ${T.greenBrd}; } 50% { box-shadow: 0 0 0 5px transparent; } }
    @keyframes tm-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

    .tm-fade-up { animation: tm-fade-up 0.28s ease-out both; }
    .tm-pulse { animation: tm-pulse-green 1.8s ease-out infinite; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${T.brd3}; border-radius: 3px; }

    button:active:not(:disabled) { transform: translateY(1px); }
    .tm-card { transition: border-color 0.15s; }
    .tm-card:hover { border-color: ${T.brd3}; }

    input[type=number]::-webkit-inner-spin-button { display: none; }

    .tm-num { font-variant-numeric: tabular-nums; font-family: ${T.body}; letter-spacing: 0; }
    .tm-display { font-family: ${T.display}; font-weight: 400; letter-spacing: -0.01em; text-transform: uppercase; }
    .tm-eyebrow { font-family: ${T.body}; font-size: 10.5px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: ${T.fg4}; }
    .tm-serif { font-family: ${T.body}; }
    .tm-lettering { font-family: ${T.hand}; font-weight: 700; line-height: 1.1; }
    /* Papier journal tramé : sur tout l'écran, bandeaux compris */
    .tm-paper { background-color: ${T.bg0}; background-image: radial-gradient(${T.dot} 1.1px, transparent 1.3px); background-size: 6px 6px; }
    /* Aplats tramés d'impression */
    .tm-halftone-cyan { background-color: ${T.cyan}; background-image: radial-gradient(rgba(214,239,60,0.30) 1.6px, transparent 1.8px); background-size: 7px 7px; }
    .tm-halftone-magenta { background-color: ${T.magenta}; background-image: radial-gradient(rgba(201,182,234,0.40) 1.6px, transparent 1.8px); background-size: 7px 7px; }
    .tm-halftone-yellow { background-color: ${T.gold}; background-image: radial-gradient(rgba(31,122,69,0.22) 1.4px, transparent 1.6px); background-size: 6px 6px; color: #141414; }
    .tm-halftone-lilac { background-color: ${T.lilac}; background-image: radial-gradient(rgba(91,45,142,0.22) 1.4px, transparent 1.6px); background-size: 6px 6px; color: #141414; }
    /* Case de BD : cernée d'encre, ombre décalée */
    .tm-panel { border: 2.5px solid ${T.ink}; box-shadow: 4px 4px 0 ${T.ink}; }
    /* Rubrique : titre en capitales posé sur un trait d'encre */
    .tm-rubric { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2.5px solid ${T.ink}; padding-bottom: 3px; margin-bottom: 8px; }
    .tm-rubric > :first-child { font-family: ${T.display}; font-size: 17px; text-transform: uppercase; color: ${T.fg}; }
  `;
  document.head.appendChild(tag);
}
