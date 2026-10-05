// Thème : couleurs (clair/sombre, accent WTA), polices, styles globaux.

// ─── STYLES ───────────────────────────────────────────────────────────────────
// ─── DESIGN SYSTEM TOKENS ─────────────────────────────────────────────────────
// Direction « presse sportive imprimée » : papier journal, encre, vert de
// tableau d'affichage, terre battue et bleu du dur ; titres condensés,
// articles en serif, chiffres alignés.
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
  display: "'Big Shoulders Display', 'Arial Narrow', sans-serif",
  body:    "'Libre Franklin', system-ui, -apple-system, sans-serif",
  serif:   "'Newsreader', Georgia, serif",
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
  // « Édition du soir » : papier sombre, encre claire.
  dark: {
    bg0: "#171612", bg1: "#201e19", bg2: "#28251f", bg3: "#322e27", bg4: "#3e3930",
    brd: "rgba(239,233,220,0.12)", brd2: "rgba(239,233,220,0.22)", brd3: "rgba(239,233,220,0.40)",
    fg: "#efe9dc", fg2: "#ddd5c5", fg3: "#bdb3a1", fg4: "#9d9382", fg5: "#7f7666",
    green: "#5fae84", greenHi: "#74c096", greenDk: "#3b7a58",
    greenSub: "rgba(95,174,132,0.14)", greenBrd: "rgba(95,174,132,0.42)",
    ball: "#e0c25a",
    red: "#e8805f", redSub: "rgba(232,128,95,0.14)", redBrd: "rgba(232,128,95,0.42)",
    amber: "#e9ad4f", amberSub: "rgba(233,173,79,0.14)", amberBrd: "rgba(233,173,79,0.42)",
    blue: "#7ea3e0", blueSub: "rgba(126,163,224,0.14)", blueBrd: "rgba(126,163,224,0.42)",
    clay: "#ec7f4a",
    onAccent: "#171612",
    ink: "#efe9dc", paper: "#171612", gold: "#f2b544",
    shadow: "rgba(0,0,0,0.35)",
    overlay: "rgba(12,11,9,0.74)",
  },
  // « Papier » : papier journal, encre noire, vert de tableau d'affichage,
  // terre battue, bleu du dur.
  light: {
    bg0: "#f3eee2", bg1: "#faf7ef", bg2: "#ece6d8", bg3: "#e2dbca", bg4: "#d1c8b3",
    brd: "rgba(26,26,23,0.16)", brd2: "rgba(26,26,23,0.30)", brd3: "rgba(26,26,23,0.55)",
    fg: "#1a1a17", fg2: "#2e2c27", fg3: "#4a463e", fg4: "#655f54", fg5: "#857e70",
    green: "#1f5c3f", greenHi: "#277150", greenDk: "#143e2a",
    greenSub: "rgba(31,92,63,0.10)", greenBrd: "rgba(31,92,63,0.40)",
    ball: "#8f6a0c",
    red: "#b33a1f", redSub: "rgba(179,58,31,0.10)", redBrd: "rgba(179,58,31,0.38)",
    amber: "#a4620f", amberSub: "rgba(164,98,15,0.11)", amberBrd: "rgba(164,98,15,0.38)",
    blue: "#2b5ba8", blueSub: "rgba(43,91,168,0.10)", blueBrd: "rgba(43,91,168,0.38)",
    clay: "#c4521f",
    onAccent: "#f3eee2",
    ink: "#1a1a17", paper: "#f3eee2", gold: "#f2b544",
    shadow: "rgba(26,26,23,0.12)",
    overlay: "rgba(26,26,23,0.50)",
  },
};

// Circuit WTA : le vert d'accent devient rose (l'ocre et le reste ne bougent pas).
export const WTA_ACCENT = {
  light: { green: "#8e2a5a", greenHi: "#a3366a", greenDk: "#651c3f", greenSub: "rgba(142,42,90,0.10)", greenBrd: "rgba(142,42,90,0.40)" },
  dark:  { green: "#e38ab2", greenHi: "#eba1c2", greenDk: "#a85a7c", greenSub: "rgba(227,138,178,0.14)", greenBrd: "rgba(227,138,178,0.42)" },
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
  fontLink.href = "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Libre+Franklin:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,500&family=IBM+Plex+Mono:wght@500;600&display=swap";
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
    .tm-display { font-family: ${T.display}; font-weight: 800; letter-spacing: 0.01em; text-transform: uppercase; }
    .tm-eyebrow { font-family: ${T.body}; font-size: 10.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.fg4}; }
    .tm-serif { font-family: ${T.serif}; }
    /* Papier journal : fine trame d'impression */
    .tm-paper { background-image: radial-gradient(rgba(26,26,23,0.05) 1px, transparent 1.2px); background-size: 3px 3px; }
    :root[data-tm-theme="dark"] .tm-paper { background-image: radial-gradient(rgba(239,233,220,0.04) 1px, transparent 1.2px); }
    /* Rubrique : titre condensé posé sur un filet épais */
    .tm-rubric { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 3px solid ${T.ink}; padding-bottom: 3px; margin-bottom: 8px; }
    .tm-rubric > :first-child { font-family: ${T.display}; font-weight: 800; font-size: 18px; text-transform: uppercase; letter-spacing: 0.02em; color: ${T.fg}; }
  `;
  document.head.appendChild(tag);
}
