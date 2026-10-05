// Thème : couleurs (clair/sombre, accent WTA), polices, styles globaux.

// ─── STYLES ───────────────────────────────────────────────────────────────────
// ─── DESIGN SYSTEM TOKENS ─────────────────────────────────────────────────────
// Direction « gazette BD » : une BD imprimée sur papier journal. Encre
// épaisse, trame de points partout, couleurs d'impression (cyan, magenta,
// jaune), cases cernées de noir avec une ombre décalée, lettrage à la main
// pour les bulles et les récitatifs.
export const T = {
  // Backgrounds (deepest to highest) — resolved via CSS variables so the whole
  // app can switch between dark and light themes by toggling a root class.
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
  cyan: "var(--tm-cyan)", magenta: "var(--tm-magenta)", dot: "var(--tm-dot)",
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

// Palette values per theme. The keys map to the --tm-* CSS variables above.
export const THEME_PALETTES = {
  // « Édition du soir » : papier sombre, encre claire, mêmes encres d'impression.
  dark: {
    bg0: "#1a1916", bg1: "#24221e", bg2: "#2d2a25", bg3: "#38342d", bg4: "#47423a",
    brd: "rgba(242,234,211,0.28)", brd2: "rgba(242,234,211,0.55)", brd3: "rgba(242,234,211,0.85)",
    fg: "#f2ead3", fg2: "#e2d9c0", fg3: "#c4ba9f", fg4: "#a59b81", fg5: "#867d66",
    green: "#3cc173", greenHi: "#55d088", greenDk: "#258a4e",
    greenSub: "rgba(60,193,115,0.16)", greenBrd: "rgba(60,193,115,0.50)",
    ball: "#ffd200",
    red: "#ff5c8a", redSub: "rgba(255,92,138,0.16)", redBrd: "rgba(255,92,138,0.50)",
    amber: "#ffc21a", amberSub: "rgba(255,194,26,0.16)", amberBrd: "rgba(255,194,26,0.50)",
    blue: "#38b6ee", blueSub: "rgba(56,182,238,0.16)", blueBrd: "rgba(56,182,238,0.50)",
    clay: "#ff7a3d",
    onAccent: "#161616",
    ink: "#f2ead3", paper: "#1a1916", gold: "#ffd200",
    cyan: "#38b6ee", magenta: "#ff4f86", dot: "rgba(242,234,211,0.09)",
    shadow: "rgba(0,0,0,0.45)",
    overlay: "rgba(10,10,9,0.74)",
  },
  // « Papier » : papier journal, encre noire, cyan, magenta, jaune.
  light: {
    bg0: "#f2ead3", bg1: "#fffdf6", bg2: "#ebe1c6", bg3: "#e0d5b6", bg4: "#cfc29e",
    brd: "rgba(22,22,22,0.30)", brd2: "rgba(22,22,22,0.62)", brd3: "#161616",
    fg: "#161616", fg2: "#262420", fg3: "#3f3b33", fg4: "#5b564b", fg5: "#7a7466",
    green: "#16804a", greenHi: "#1c9657", greenDk: "#0e5c34",
    greenSub: "rgba(22,128,74,0.12)", greenBrd: "rgba(22,128,74,0.50)",
    ball: "#8a6a00",
    red: "#c8204f", redSub: "rgba(200,32,79,0.10)", redBrd: "rgba(200,32,79,0.45)",
    amber: "#9c5d00", amberSub: "rgba(156,93,0,0.12)", amberBrd: "rgba(156,93,0,0.45)",
    blue: "#0a6f9f", blueSub: "rgba(10,111,159,0.10)", blueBrd: "rgba(10,111,159,0.45)",
    clay: "#d1491c",
    onAccent: "#ffffff",
    ink: "#161616", paper: "#f2ead3", gold: "#ffd200",
    cyan: "#0f9bd7", magenta: "#e6336f", dot: "rgba(22,22,22,0.13)",
    shadow: "rgba(22,22,22,0.20)",
    overlay: "rgba(22,22,22,0.55)",
  },
};

// Circuit WTA : le vert d'accent devient rose (l'ocre et le reste ne bougent pas).
export const WTA_ACCENT = {
  light: { green: "#b0185a", greenHi: "#c42468", greenDk: "#7d0f3f", greenSub: "rgba(176,24,90,0.10)", greenBrd: "rgba(176,24,90,0.45)" },
  dark:  { green: "#ff7fb0", greenHi: "#ff9cc2", greenDk: "#c2557f", greenSub: "rgba(255,127,176,0.16)", greenBrd: "rgba(255,127,176,0.50)" },
};

export function buildThemeVars(mode) {
  const p = THEME_PALETTES[mode] || THEME_PALETTES.dark;
  return Object.keys(p).map(k => "--tm-" + k + ":" + p[k] + ";").join("");
}

// Apply a theme by writing the CSS variables onto :root (and a data attribute).
export function applyTheme(mode, circuit) {
  if (typeof document === "undefined") return;
  const m = mode === "light" ? "light" : "dark";
  const p = circuit === "wta" ? { ...THEME_PALETTES[m], ...WTA_ACCENT[m] } : THEME_PALETTES[m];
  const root = document.documentElement;
  Object.keys(p).forEach(k => root.style.setProperty("--tm-" + k, p[k]));
  root.setAttribute("data-tm-theme", m);
  document.body.style.background = p.bg0;
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
    :root { ${buildThemeVars("light")} }
    :root[data-tm-theme="dark"] { ${buildThemeVars("dark")} }
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
    .tm-halftone-cyan { background-color: ${T.cyan}; background-image: radial-gradient(rgba(255,255,255,0.28) 1.6px, transparent 1.8px); background-size: 7px 7px; }
    .tm-halftone-magenta { background-color: ${T.magenta}; background-image: radial-gradient(rgba(255,210,0,0.35) 1.6px, transparent 1.8px); background-size: 7px 7px; }
    .tm-halftone-yellow { background-color: ${T.gold}; background-image: radial-gradient(rgba(230,51,111,0.22) 1.4px, transparent 1.6px); background-size: 6px 6px; color: #161616; }
    /* Case de BD : cernée d'encre, ombre décalée */
    .tm-panel { border: 2.5px solid ${T.ink}; box-shadow: 4px 4px 0 ${T.ink}; }
    /* Rubrique : titre en capitales posé sur un trait d'encre */
    .tm-rubric { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2.5px solid ${T.ink}; padding-bottom: 3px; margin-bottom: 8px; }
    .tm-rubric > :first-child { font-family: ${T.display}; font-size: 17px; text-transform: uppercase; color: ${T.fg}; }
  `;
  document.head.appendChild(tag);
}
