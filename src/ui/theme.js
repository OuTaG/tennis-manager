// Thème : couleurs (clair/sombre, accent WTA), polices, styles globaux.

// ─── STYLES ───────────────────────────────────────────────────────────────────
// ─── DESIGN SYSTEM TOKENS ─────────────────────────────────────────────────────
// "Apple Sports premium" aesthetic: deep blacks, tennis-court green accents,
// editorial typography, surgical precision.
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
  display: "'Barlow Semi Condensed', 'Arial Narrow', sans-serif",
  body:    "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
  mono:    "'IBM Plex Mono', ui-monospace, monospace",
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
  // "Soir" : charbon chaud, vert gazon délavé, ocre, terre battue.
  dark: {
    bg0: "#1c1a17", bg1: "#25221e", bg2: "#2d2924", bg3: "#36312b", bg4: "#433d35",
    brd: "rgba(240,225,200,0.08)", brd2: "rgba(240,225,200,0.13)", brd3: "rgba(240,225,200,0.22)",
    fg: "#efe6d8", fg2: "#d8cdbc", fg3: "#b3a794", fg4: "#8f8474", fg5: "#716759",
    green: "#93b877", greenHi: "#a6c98b", greenDk: "#5f7f49",
    greenSub: "rgba(147,184,119,0.14)", greenBrd: "rgba(147,184,119,0.38)",
    ball: "#e3c46a",
    red: "#df7a5c", redSub: "rgba(223,122,92,0.13)", redBrd: "rgba(223,122,92,0.40)",
    amber: "#e0a459", amberSub: "rgba(224,164,89,0.14)", amberBrd: "rgba(224,164,89,0.40)",
    blue: "#8fb0c9", blueSub: "rgba(143,176,201,0.14)", blueBrd: "rgba(143,176,201,0.40)",
    clay: "#c9704a",
    onAccent: "#1c1a17",
    shadow: "rgba(0,0,0,0.35)",
    overlay: "rgba(18,16,13,0.72)",
  },
  // "Papier" : sable clair, encre brune, gazon, ocre, terre battue.
  light: {
    bg0: "#efe8db", bg1: "#fbf8f2", bg2: "#f4eee3", bg3: "#e9e1d2", bg4: "#dbd1bf",
    brd: "rgba(70,52,30,0.11)", brd2: "rgba(70,52,30,0.18)", brd3: "rgba(70,52,30,0.28)",
    fg: "#2b2620", fg2: "#473f35", fg3: "#665c4f", fg4: "#857a6b", fg5: "#a49885",
    green: "#4d7a3a", greenHi: "#5b8c45", greenDk: "#35572a",
    greenSub: "rgba(77,122,58,0.11)", greenBrd: "rgba(77,122,58,0.35)",
    ball: "#a97c1f",
    red: "#b44a2f", redSub: "rgba(180,74,47,0.10)", redBrd: "rgba(180,74,47,0.35)",
    amber: "#b9781f", amberSub: "rgba(185,120,31,0.12)", amberBrd: "rgba(185,120,31,0.35)",
    blue: "#3f6f8f", blueSub: "rgba(63,111,143,0.10)", blueBrd: "rgba(63,111,143,0.35)",
    clay: "#b95d38",
    onAccent: "#fbf8f2",
    shadow: "rgba(70,52,30,0.10)",
    overlay: "rgba(43,38,32,0.45)",
  },
};

// Circuit WTA : le vert d'accent devient rose (l'ocre et le reste ne bougent pas).
export const WTA_ACCENT = {
  light: { green: "#b23f73", greenHi: "#c25386", greenDk: "#842a53", greenSub: "rgba(178,63,115,0.10)", greenBrd: "rgba(178,63,115,0.35)" },
  dark:  { green: "#e08aae", greenHi: "#e9a0bf", greenDk: "#a85a7c", greenSub: "rgba(224,138,174,0.14)", greenBrd: "rgba(224,138,174,0.38)" },
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
  fontLink.href = "https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap";
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

    .tm-num { font-variant-numeric: tabular-nums; font-family: ${T.mono}; letter-spacing: -0.01em; }
    .tm-display { font-family: ${T.display}; font-weight: 600; letter-spacing: -0.01em; text-transform: none; }
    .tm-eyebrow { font-family: ${T.body}; font-size: 11px; font-weight: 600; letter-spacing: 0.01em; text-transform: none; color: ${T.fg4}; }
  `;
  document.head.appendChild(tag);
}
