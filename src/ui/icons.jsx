// Icônes : drapeaux, surfaces, pictogrammes dessinés et composant Icon.
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronLeft, ChevronRight, CircleDot, Loader2, Lock, Plus, Square, X,
} from "lucide-react";
import { useId } from "react";
import { FLAG_DATA } from "../data/flags.js";
import { T } from "./theme.js";

// Flag rendering using flag-icons (vectorized country flags)
export function Flag({ code, size = 14, style }) {
  const clipId = "tm-flag-" + useId().replace(/:/g, "");
  if (!code) return null;
  const cc = code.toLowerCase();
  const src = FLAG_DATA[cc];
  if (!src) {
    // Unknown flag: show the country abbreviation instead.
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: size * 1.4, height: size, padding: "0 2px",
        fontSize: Math.max(8, size * 0.6), fontWeight: 800, letterSpacing: 0.3,
        background: "#ffffff", color: T.ink, border: Math.max(1.2, size * 0.1) + "px solid " + T.ink,
        verticalAlign: "middle", flexShrink: 0, lineHeight: 1, ...style,
      }}>{cc.toUpperCase()}</span>
    );
  }
  // Cadre BD : contour encré légèrement de travers (déformation propre à
  // chaque pays, stable d'un rendu à l'autre) et petite ombre décalée.
  const path = flagFramePath(cc);
  const strokePx = Math.max(1.2, size * 0.1);
  const sw = strokePx * 100 / size; // épaisseur en unités du viewBox (hauteur 100)
  const sh = Math.max(1, size * 0.09) * 100 / size;
  return (
    <svg
      role="img"
      aria-label={cc.toUpperCase()}
      width={size * 1.4}
      height={size}
      viewBox="0 0 140 100"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, overflow: "visible", ...style }}
    >
      <defs>
        <clipPath id={clipId}><path d={path} /></clipPath>
        <pattern id={clipId + "-dots"} width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.8" fill="#141414" /><circle cx="9" cy="9" r="1.8" fill="#141414" />
        </pattern>
      </defs>
      <path d={path} fill="#141414" transform={"translate(" + sh + " " + sh + ")"} />
      <image href={src} x="0" y="0" width="140" height="100" preserveAspectRatio="xMidYMid slice" clipPath={"url(#" + clipId + ")"} />
      {/* Trame d'impression, seulement quand le drapeau est assez grand pour la voir */}
      {size >= 16 && <rect x="0" y="0" width="140" height="100" fill={"url(#" + clipId + "-dots)"} opacity="0.13" clipPath={"url(#" + clipId + ")"} />}
      <path d={path} fill="none" stroke="#141414" strokeWidth={sw} strokeLinejoin="round" />
    </svg>
  );
}

// Contour « dessiné à la main » d'un drapeau (viewBox 140×100) : coins
// décalés et côtés légèrement bombés, tirés d'un hash du code pays.
const frameCache = {};
function flagFramePath(cc) {
  if (frameCache[cc]) return frameCache[cc];
  let h = 0;
  for (const ch of cc) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) / 16777216; };
  const j = (amp) => (rnd() * 2 - 1) * amp;
  const tl = [4 + j(3), 4 + j(3)], tr = [136 + j(3), 3 + j(3)], br = [137 + j(3), 96 + j(3)], bl = [3 + j(3), 97 + j(3)];
  const mid = (a, b, dx, dy) => [(a[0] + b[0]) / 2 + dx, (a[1] + b[1]) / 2 + dy];
  const top = mid(tl, tr, j(6), j(3)), right = mid(tr, br, j(3), j(5)), bottom = mid(br, bl, j(6), j(3)), left = mid(bl, tl, j(3), j(5));
  const f = (p) => p[0].toFixed(1) + " " + p[1].toFixed(1);
  const d = "M" + f(tl) + " Q" + f(top) + " " + f(tr) + " Q" + f(right) + " " + f(br) + " Q" + f(bottom) + " " + f(bl) + " Q" + f(left) + " " + f(tl) + " Z";
  frameCache[cc] = d;
  return d;
}

// Convert emoji flag to ISO country code (e.g. 🇫🇷 → "fr")
// Regional indicator symbols are 127462 (🇦) onwards.
export function flagEmojiToCode(emoji) {
  if (!emoji || emoji.length < 2) return null;
  const cps = [...emoji];
  if (cps.length < 2) return null;
  const c1 = cps[0].codePointAt(0);
  const c2 = cps[1].codePointAt(0);
  if (c1 < 0x1F1E6 || c2 < 0x1F1E6) return null;
  const a = String.fromCharCode(65 + (c1 - 0x1F1E6));
  const b = String.fromCharCode(65 + (c2 - 0x1F1E6));
  return (a + b).toLowerCase();
}

// Renders a text string, replacing any emoji flag with a designed flag.
export const FLAG_EMOJI_RE = /([\u{1F1E6}-\u{1F1FF}]{2})/u;
export function withFlags(text, size = 12) {
  if (typeof text !== "string" || !FLAG_EMOJI_RE.test(text)) return text;
  return text.split(FLAG_EMOJI_RE).map((part, i) =>
    i % 2 === 1 ? <FlagFromEmoji key={i} emoji={part} size={size} style={{ margin: "0 1px", position: "relative", top: -1 }} /> : part
  );
}

// FlagFromEmoji: convenience wrapper that handles legacy emoji-flag strings
export function FlagFromEmoji({ emoji, size = 14, style }) {
  const code = flagEmojiToCode(emoji);
  if (!code) return null;
  return <Flag code={code} size={size} style={style} />;
}


// Logos de surface version BD : un court vu en plongée, cerné d'encre avec
// une ombre portée, et une texture propre à chaque surface (bandes de tonte
// et touffes pour le gazon, traces de glissade et poussière pour la terre
// battue, liseré et reflet pour le dur, toit et projecteur pour l'indoor).
const SURFACE_STYLE = {
  "Gazon": { fill: "#1f7a45", light: "#2f9a5a", dark: "#145c33" },
  "Terre battue": { fill: "#c4622d", light: "#e48a52", dark: "#8f4219" },
  "Dur": { fill: "#2c6fd1", light: "#7fb0f0", dark: "#1d4f9c" },
  "Indoor": { fill: "#5b2d8e", light: "#c9b6ea", dark: "#3d1d63" },
};

export function SurfaceIcon({ name, size = 14 }) {
  const clipId = "tm-surf-" + useId().replace(/:/g, "");
  const s = SURFACE_STYLE[name] || { fill: "#8a8a8a", light: "#c2c2c2", dark: "#5a5a5a" };
  const INK = "#141414";
  const indoor = name === "Indoor";
  // Trapèze du court : haut (t, demi-largeur a), bas (b, demi-largeur c).
  const t = indoor ? 10.5 : 4.6, b = indoor ? 21 : 19.6;
  const a = indoor ? 6.2 : 7.2, c = indoor ? 9.6 : 10.4;
  const hw = (y) => a + (c - a) * (y - t) / (b - t);
  const pts = (tt, bb, k) => [
    [12 - hw(tt) * k, tt], [12 + hw(tt) * k, tt], [12 + hw(bb) * k, bb], [12 - hw(bb) * k, bb],
  ].map(p => p.map(n => n.toFixed(2)).join(",")).join(" ");
  const outer = pts(t, b, 1);
  const L = b - t;
  const yNet = t + 0.44 * L, ySvT = t + 0.2 * L, ySvB = t + 0.72 * L;
  const k = 0.8; // couloirs : lignes de simple en retrait
  const hline = (y, kk) => `M${(12 - hw(y) * kk).toFixed(2)} ${y.toFixed(2)}H${(12 + hw(y) * kk).toFixed(2)}`;
  const lw = 0.9;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}><polygon points={outer} /></clipPath>
      </defs>
      {indoor && (
        <>
          {/* Toit de la salle */}
          <path d="M1.2 11.6 Q12 -2.6 22.8 11.6" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <path d="M4.6 7.4 L19.4 7.4" stroke={INK} strokeWidth="1" opacity="0.55" />
        </>
      )}
      {/* Ombre portée encrée */}
      <polygon points={outer} fill={INK} transform="translate(1.1 1.1)" />
      <polygon points={outer} fill={s.fill} />
      <g clipPath={`url(#${clipId})`}>
        {name === "Gazon" && [0, 2, 4].map(i => (
          <rect key={i} x="0" y={t + (i + 0.5) * L / 6} width="24" height={L / 6} fill={s.light} />
        ))}
        {name === "Terre battue" && (
          <>
            <path d={`M5.6 ${b - 2.2} Q9 ${b - 4.4} 13.5 ${b - 3.2}`} fill="none" stroke={s.light} strokeWidth="1.5" strokeLinecap="round" />
            <path d={`M6.4 ${b - 1} Q10 ${b - 2.8} 14.4 ${b - 1.9}`} fill="none" stroke={s.light} strokeWidth="1" strokeLinecap="round" />
            <circle cx="16.6" cy={t + 3} r="0.6" fill={s.dark} />
            <circle cx="8" cy={t + 2.2} r="0.5" fill={s.dark} />
            <circle cx="17.6" cy={b - 4.4} r="0.55" fill={s.dark} />
          </>
        )}
        {name === "Dur" && (
          <polygon points={pts(t + 0.4, b - 0.6, 0.9)} fill={s.dark} opacity="0.55" />
        )}
        {indoor && (
          <polygon points={`12,${t - 6} ${12 - hw(b) * 0.7},${b} ${12 + hw(b) * 0.7},${b}`} fill={s.light} opacity="0.35" />
        )}
        {/* Lignes blanches */}
        <g fill="none" stroke="#ffffff" strokeWidth={lw} strokeLinecap="square">
          <polygon points={pts(t + 0.9, b - 1.1, k)} />
          <path d={hline(ySvT, k) + hline(ySvB, k)} />
          <path d={`M12 ${ySvT.toFixed(2)}V${ySvB.toFixed(2)}`} />
        </g>
      </g>
      {/* Contour d'encre */}
      <polygon points={outer} fill="none" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      {/* Filet */}
      <path d={hline(yNet, 1.08)} stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
      {name === "Gazon" && (
        // Touffes d'herbe qui débordent du court
        <g fill={s.fill} stroke={INK} strokeWidth="0.9" strokeLinejoin="round">
          <path d="M0.6 21.8 L1.4 17.6 L2.4 20.4 L3.4 16.8 L4.2 20.6 L5.2 18.4 L5.6 21.8 Z" />
          <path d="M17.8 21.8 L18.4 18.6 L19.4 20.6 L20.4 17 L21.2 20.4 L22.4 17.8 L23.2 21.8 Z" />
        </g>
      )}
      {name === "Terre battue" && (
        // Nuage de poussière de glissade
        <g fill="#f3c9a4" stroke={INK} strokeWidth="0.9">
          <circle cx="19.6" cy="20.4" r="1.6" />
          <circle cx="21.9" cy="19.6" r="1.25" />
        </g>
      )}
      {name === "Dur" && (
        // Reflet : la surface brille
        <path d="M15.4 7.4 L17.4 6.4 M15.8 9 L18.6 7.6" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
      )}
      {indoor && (
        // Projecteur au plafond
        <circle cx="12" cy="4.6" r="1.7" fill="#d6ef3c" stroke={INK} strokeWidth="1" />
      )}
    </svg>
  );
}

// Pictos BD des jauges de vie (Bonheur, Popularité, Image) et des coûts
// d'activité (énergie, argent) : aplats de couleur cernés d'encre avec une
// ombre portée décalée, lisibles de 12 à 32 px.
const STAT_SHAPES = {
  happiness: [
    { d: "M12 20.6C5 15.6 2.5 12.1 2.5 8.7 2.5 5.7 4.8 3.6 7.4 3.6c2 0 3.6 1.2 4.6 3 1-1.8 2.6-3 4.6-3 2.6 0 4.9 2.1 4.9 5.1 0 3.4-2.5 6.9-9.5 11.9z", fill: "#c4302b" },
  ],
  popularity: [
    { d: "M10 1.2Q11.3 8.7 18.8 10 11.3 11.3 10 18.8 8.7 11.3 1.2 10 8.7 8.7 10 1.2z", fill: "#d6ef3c" },
    { d: "M18.6 12.8Q19.2 16.8 23 17.4 19.2 18 18.6 22 18 18 14.2 17.4 18 16.8 18.6 12.8z", fill: "#c9b6ea" },
  ],
  image: [
    { d: "M10.6 20.4c0-4.4 2.4-7 5.4-7s5.4 2.6 5.4 7z", fill: "#c9b6ea" },
    { circle: [16, 8, 3], fill: "#c9b6ea" },
    { d: "M2.4 21.6c0-5 2.9-7.8 6.6-7.8s6.6 2.8 6.6 7.8z", fill: "#2c6fd1" },
    { circle: [9, 8.8, 3.5], fill: "#2c6fd1" },
  ],
  energy: [
    { d: "M13.8 1.8 4.4 13.6h6.4l-1.6 8.6 10.4-12.8h-6.6z", fill: "#d6ef3c" },
  ],
  money: [
    { circle: [12, 12, 9], fill: "#e0a21b" },
  ],
};
// Détails posés sur les pictos de jauge (mini-langage des logos BD, plus bas).
const STAT_DETAILS = {
  happiness: [{ h: "M5.4 8.6Q5.6 6.4 7.6 6", w: 1.5 }],
  popularity: [{ l: "M17.6 4.4l2-2M19.4 7.2l2.6-.6", w: 1.6 }],
  image: [{ h: "M6.6 7.4Q7.2 6 8.6 5.8", w: 1.2 }],
  energy: [],
  money: [
    { c: [12, 12, 6.6], f: "none", sw: 0.8, op: 0.5 },
    { l: "M15 8.6a4 4 0 1 0 0 6.8M7.6 11h5.2M7.6 13.2h5.2", w: 1.5 },
  ],
};

export function StatIcon({ name, size = 16, halo, style }) {
  if (!STAT_SHAPES[name]) return null;
  return <BdIcon name={name} size={size} halo={halo} style={style} />;
}

// ─── Logos BD ─────────────────────────────────────────────────────────────
// Toutes les icônes « logos » du jeu (onglets, activités, boutique, staff,
// styles de jeu, trophées…) sont dessinées ici en BD : aplats de la palette,
// contour d'encre, ombre portée décalée et petit reflet blanc. Grille 24.
// Mini-langage des éléments :
//   { p: "d" | c: [cx,cy,r] | e: [cx,cy,rx,ry] | r: [x,y,w,h,rx], f: couleur }
//       forme pleine cernée d'encre (sw : épaisseur, 0 = sans contour)
//   { o: "d", f, w }  trait coloré cerné d'encre (manche, flèche…)
//   { l: "d", w, k }  trait simple (encre par défaut)
//   { h: "d" }        reflet blanc
//   m: 1 → couleur principale, remplaçable par la prop `fill` de <Icon>.
//   t : transformation propre à l'élément. Dans `s` : éléments avec ombre ;
//   dans `d` : détails posés par-dessus, sans ombre. `t` global : rotation.
const INK = "#141414";
const C = {
  W: "#ffffff", G: "#1f7a45", GL: "#8fc46a", V: "#5b2d8e", VD: "#3d1d63", Y: "#d6ef3c", L: "#c9b6ea",
  R: "#c4302b", A: "#e0a21b", B: "#2c6fd1", BL: "#7fb0f0", BR: "#9a5a2c", SK: "#f2c29b",
  ST: "#a7b0ba", PA: "#f3ecd8", GR: "#e2e2e2", PK: "#e88aa6",
};
const BD_OUTLINE = 1.6;
const BD_SHADOW = 1.2;

function starPath(cx, cy, R, r, n = 5) {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / n;
    const rad = i % 2 ? r : R;
    d += (i ? "L" : "M") + (cx + rad * Math.cos(a)).toFixed(2) + " " + (cy + rad * Math.sin(a)).toFixed(2);
  }
  return d + "Z";
}
function gearPath(cx, cy, R, r, n) {
  let d = "";
  const step = 2 * Math.PI / n;
  const pt = (a, rad) => (cx + rad * Math.cos(a)).toFixed(2) + " " + (cy + rad * Math.sin(a)).toFixed(2);
  for (let i = 0; i < n; i++) {
    const a = i * step;
    d += (i ? "L" : "M") + pt(a - step * 0.3, r) + "L" + pt(a - step * 0.18, R) + "L" + pt(a + step * 0.18, R) + "L" + pt(a + step * 0.3, r);
  }
  return d + "Z";
}

const FACE = [{ c: [12, 12, 9.6], f: C.Y, m: 1 }];
const BRIEFCASE = {
  s: [
    { o: "M9 7.6V5.2Q9 4 10.2 4H13.8Q15 4 15 5.2V7.6", f: C.BR, w: 1.4 },
    { r: [2.5, 7.5, 19, 13, 1.2], f: C.BR, m: 1 },
  ],
  d: [{ l: "M2.5 12.8H21.5", w: 1.4 }, { r: [10.2, 11.2, 3.6, 3.2], f: C.A }, { h: "M4.8 10H8.4" }],
};
const SHOE = {
  s: [
    { p: "M2.6 17.6V13.4C2.6 12 3.6 11 5 11C7 11 8.2 9.4 8.6 7.4L9 5.8C11 6.2 12.6 7.6 13.2 9.6L18.8 12C20.8 12.8 21.6 14 21.6 15.6V17.6Z", f: C.R, m: 1 },
    { r: [2, 17.6, 20, 2.8, 1], f: C.W },
  ],
  d: [
    { l: "M10 9.8L11.8 9M10.8 11.6L12.8 10.8M11.6 13.4L13.8 12.6", w: 1.2 },
    { l: "M1.4 6.6H4.6M2.2 9H5.2", w: 1.4 },
    { h: "M15.4 13.6L18.4 14.8" },
  ],
};
const PERSON = (shirt) => ({
  s: [
    { p: "M4 21.6C4 16.4 7.4 13.2 12 13.2S20 16.4 20 21.6Z", f: shirt, m: 1 },
    { c: [12, 7.6, 4.3], f: C.SK },
  ],
  d: [{ h: "M9.2 6.6Q9.6 5 11 4.6" }],
});

const BD_ICONS = {
  home: {
    s: [
      { r: [15.4, 3.6, 2.8, 5], f: C.BR },
      { r: [5, 10, 14, 11.2], f: C.PA },
      { p: "M2.2 11.6L12 3L21.8 11.6Z", f: C.R, m: 1 },
    ],
    d: [{ r: [10, 14.4, 4, 6.8], f: C.B }, { r: [6.4, 13.2, 2.6, 2.6], f: C.Y }, { r: [15, 13.2, 2.6, 2.6], f: C.Y }, { h: "M5.6 10L10.4 5.8" }],
  },
  court: {
    s: [{ p: "M6.6 3.6H17.4L21.8 20.8H2.2Z", f: C.G, m: 1 }, { c: [19.6, 4.4, 2.6], f: C.Y }],
    d: [
      { l: "M7.9 5.6H16.1L19.3 18.8H4.7ZM7.2 8.4H16.8M5.6 15.4H18.4M12 8.4V15.4", k: C.W, w: 1 },
      { l: "M3.4 11.6H20.6", w: 2.2 },
      { l: "M3.4 10V13M20.6 10V13", w: 1.6 },
    ],
  },
  racquet: {
    t: "rotate(40 12 12)",
    s: [
      { r: [10.7, 15.4, 2.6, 7.4, 0.6], f: C.V },
      { o: "M10.2 14.2L12 16.6L13.8 14.2", f: C.R, w: 1.4 },
      { e: [12, 8.6, 5.6, 6.8], f: C.R, m: 1 },
      { c: [21.3, 12.8, 2.6], f: C.Y },
    ],
    d: [
      { e: [12, 8.6, 3.7, 4.9], f: C.W, sw: 1.2 },
      { l: "M10.2 4.4V12.8M12 3.8V13.4M13.8 4.4V12.8M8.6 6.6H15.4M8.4 8.6H15.6M8.6 10.6H15.4", w: 0.7, op: 0.7 },
      { l: "M10.9 18.2L13.1 17.2M10.9 20.4L13.1 19.4", k: C.W, w: 0.8 },
    ],
  },
  chart: {
    s: [{ r: [3, 12.5, 5, 8.5], f: C.B }, { r: [9.5, 8, 5, 13], f: C.Y }, { r: [16, 3.5, 5, 17.5], f: C.G, m: 1 }],
    d: [{ l: "M1.6 21H22.4", w: 2.2 }, { h: "M4.6 14.4V17M11.1 10V13M17.6 5.6V8.6" }],
  },
  office: BRIEFCASE,
  briefcase: BRIEFCASE,
  calendar: {
    s: [{ r: [3, 4.6, 18, 16.6], f: C.W, m: 1 }],
    d: [
      { r: [3, 4.6, 18, 5], f: C.R },
      { r: [6.6, 2.2, 2.2, 4.6, 1], f: C.ST },
      { r: [15.2, 2.2, 2.2, 4.6, 1], f: C.ST },
      { p: "M6 12.4h2v2H6zM11 12.4h2v2h-2zM16 12.4h2v2h-2zM6 16.4h2v2H6zM11 16.4h2v2h-2z", f: INK, sw: 0 },
      { r: [15.6, 16, 2.8, 2.8], f: C.Y, sw: 1.2 },
    ],
  },
  plane: {
    t: "rotate(45 12 12)",
    s: [{ p: "M12 2C13.3 2 13.6 3.5 13.6 5V9.5L21.5 14V16.2L13.6 13.8V18.4L16.2 20.4V22L12 21L7.8 22V20.4L10.4 18.4V13.8L2.5 16.2V14L10.4 9.5V5C10.4 3.5 10.7 2 12 2Z", f: C.B, m: 1 }],
    d: [{ p: "M10.4 11L4.6 14.4V15.4L10.4 13.6Z", f: C.W, sw: 0 }, { h: "M12 4.4V8.6" }],
  },
  dumbbell: {
    s: [
      { r: [5, 10.2, 14, 3.6], f: C.ST },
      { r: [1.2, 4.8, 4.6, 14.4, 1], f: C.R, m: 1 },
      { r: [5.6, 7, 3, 10, 0.8], f: C.R, m: 1 },
      { r: [18.2, 4.8, 4.6, 14.4, 1], f: C.R, m: 1 },
      { r: [15.4, 7, 3, 10, 0.8], f: C.R, m: 1 },
    ],
    d: [{ h: "M2.8 7.4V11.4M19.8 7.4V11.4" }],
  },
  chat: {
    s: [
      { p: "M8.5 2.8H21.5V12.4H20V15.2L17.2 12.4H8.5Z", f: C.L },
      { p: "M2.5 8.2H15.5V17H8.6L4.8 20.6V17H2.5Z", f: C.W, m: 1 },
    ],
    d: [{ c: [6, 12.6, 1.15], f: INK, sw: 0 }, { c: [9, 12.6, 1.15], f: INK, sw: 0 }, { c: [12, 12.6, 1.15], f: INK, sw: 0 }],
  },
  bag: {
    s: [
      { l: "M8.6 10.2V7.2a3.4 3.4 0 0 1 6.8 0V10.2", w: 1.9 },
      { p: "M4.5 8.6H19.5L18.4 21.2H5.6Z", f: C.R, m: 1 },
    ],
    d: [
      { c: [8.6, 11.2, 0.9], f: INK, sw: 0 }, { c: [15.4, 11.2, 0.9], f: INK, sw: 0 },
      { p: starPath(12, 15.8, 3.4, 1.5), f: C.Y, sw: 1.1 },
      { h: "M6.6 11.2L7 17.6" },
    ],
  },
  trophy: {
    s: [
      { o: "M7.2 5.6H4.2V7.2A3.6 3.6 0 0 0 7.8 10.8", f: C.A, w: 1.6, m: 1 },
      { o: "M16.8 5.6H19.8V7.2A3.6 3.6 0 0 1 16.2 10.8", f: C.A, w: 1.6, m: 1 },
      { r: [10.6, 13, 2.8, 4.4], f: C.A, m: 1 },
      { r: [6.8, 17.2, 10.4, 4.2, 0.6], f: C.BR },
      { p: "M6.8 2.8H17.2V8.6A5.2 5.2 0 0 1 6.8 8.6Z", f: C.A, m: 1 },
    ],
    d: [{ r: [9.6, 18.5, 4.8, 1.6], f: C.Y, sw: 0.8 }, { h: "M9.2 4.8V8.6" }],
  },
  target: {
    s: [{ c: [11, 13, 9], f: C.R, m: 1 }],
    d: [
      { c: [11, 13, 6.1], f: C.W },
      { c: [11, 13, 3.2], f: C.R, m: 1 },
      { o: "M11 13L19.4 4.6", f: C.BR, w: 1.1 },
      { p: "M18.4 5.6L18.8 1.8L20.6 3.4L22.2 3.4L22.2 5.2Z", f: C.Y, sw: 1.1 },
    ],
  },
  trending: {
    s: [{ o: "M2.8 18L9 11.8L13 15.4L19 9.2", f: C.G, w: 2.6, m: 1 }, { p: "M14 6.6H21.6V14.2Z", f: C.G, m: 1 }],
  },
  down: {
    s: [{ o: "M2.8 6L9 12.2L13 8.6L19 14.8", f: C.R, w: 2.6, m: 1 }, { p: "M14 17.4H21.6V9.8Z", f: C.R, m: 1 }],
  },
  user: PERSON(C.B),
  player: PERSON(C.G),
  users: {
    s: [
      { p: "M10.6 20.6c0-4.4 2.4-7.2 5.4-7.2s5.4 2.8 5.4 7.2z", f: C.L },
      { c: [16, 8, 3.1], f: C.SK },
      { p: "M2.4 21.6c0-5 2.9-7.8 6.6-7.8s6.6 2.8 6.6 7.8z", f: C.G, m: 1 },
      { c: [9, 8.8, 3.6], f: C.SK },
    ],
    d: [{ h: "M6.8 8Q7.2 6.6 8.4 6.2" }],
  },
  star: { s: [{ p: starPath(12, 12.8, 10.4, 4.4), f: C.Y, m: 1 }], d: [{ h: "M8.4 10.6L10.2 10.4" }] },
  news: {
    s: [{ r: [17.4, 7, 4.2, 13.6], f: C.GR }, { r: [2.4, 3.4, 16, 17.2], f: C.W, m: 1 }],
    d: [
      { r: [4.8, 5.8, 11.2, 3], f: INK, sw: 0 },
      { r: [4.8, 11, 5.2, 5.6], f: C.B, sw: 1.1 },
      { l: "M12 11.6H16M12 14H16M12 16.4H16M4.8 18.6H16", w: 1 },
    ],
  },
  location: {
    s: [{ p: "M12 22.2S4.6 14.8 4.6 9.6A7.4 7.4 0 0 1 19.4 9.6C19.4 14.8 12 22.2 12 22.2Z", f: C.R, m: 1 }],
    d: [{ c: [12, 9.6, 2.8], f: C.W }, { h: "M7.4 8.2Q7.8 5.8 9.8 4.8" }],
  },
  flag: {
    s: [
      { r: [3.4, 2.2, 2.2, 20, 0.6], f: C.BR },
      { p: "M5.6 3.4C9 1.8 11.6 5.4 15 3.8S19.6 3 21 3.4V12.6C18.6 14 15.8 11.4 12.6 12.8S8 13.8 5.6 13.2Z", f: C.R, m: 1 },
    ],
    d: [{ h: "M8 5.4Q10 5 11.6 6" }],
  },
  warning: {
    s: [{ p: "M12 2.6L22.2 20.6H1.8Z", f: C.Y, m: 1 }],
    d: [{ l: "M12 8.8V14.2", w: 2.6 }, { c: [12, 17.3, 1.45], f: INK, sw: 0 }],
  },
  info: {
    s: [{ c: [12, 12, 9.6], f: C.B, m: 1 }],
    d: [{ c: [12, 7.2, 1.7], f: C.W, sw: 1.2 }, { r: [10.5, 10.2, 3, 7.6, 0.4], f: C.W, sw: 1.2 }],
  },
  cog: {
    s: [{ p: gearPath(12, 12, 10.2, 7.6, 8), f: C.ST, m: 1 }],
    d: [{ c: [12, 12, 3.3], f: C.W }, { h: "M6.8 10Q7.6 7.6 10 6.8" }],
  },
  ticket: {
    t: "rotate(-14 12 12)",
    s: [{ p: "M2.5 7H21.5V10.2A1.9 1.9 0 0 0 21.5 13.8V17H2.5V13.8A1.9 1.9 0 0 0 2.5 10.2Z", f: C.Y, m: 1 }],
    d: [{ l: "M15.6 7.8V16.2", w: 1.1, da: "1.6 1.4" }, { p: starPath(8.8, 12, 3.1, 1.3), f: C.R, sw: 1 }],
  },
  shield: {
    s: [{ p: "M12 2.4L20.2 5.4V11.4C20.2 16.6 16.6 19.9 12 21.8C7.4 19.9 3.8 16.6 3.8 11.4V5.4Z", f: C.B, m: 1 }],
    d: [
      { p: "M12 2.4V21.8C7.4 19.9 3.8 16.6 3.8 11.4V5.4Z", f: C.BL },
      { p: starPath(12, 11.8, 4.4, 1.9), f: C.Y, sw: 1.1 },
    ],
  },
  goal: {
    s: [
      { r: [1.5, 7.4, 2.2, 14.2, 0.4], f: C.BR },
      { r: [20.3, 7.4, 2.2, 14.2, 0.4], f: C.BR },
      { r: [3.7, 9.6, 16.6, 8.6], f: C.W, m: 1 },
      { c: [16.5, 4.4, 2.6], f: C.Y },
    ],
    d: [
      { l: "M3.7 12.6H20.3M3.7 15.4H20.3M6.5 9.6V18.2M9.3 9.6V18.2M12 9.6V18.2M14.7 9.6V18.2M17.5 9.6V18.2", w: 0.7 },
      { r: [3.7, 8.6, 16.6, 2], f: C.W, sw: 1.2 },
    ],
  },
  run: SHOE,
  foot: SHOE,
  brain: {
    s: [{ p: "M12 4.5C10.5 3 7.5 3 6.5 5C4 5 3 7.5 4 9.2C2.5 10.5 2.6 13.4 4.4 14.4C4 16.8 6 18.8 8.3 18.2C9 20 11 20.4 12 19.4C13 20.4 15 20 15.7 18.2C18 18.8 20 16.8 19.6 14.4C21.4 13.4 21.5 10.5 20 9.2C21 7.5 20 5 17.5 5C16.5 3 13.5 3 12 4.5Z", f: C.PK, m: 1 }],
    d: [
      { l: "M12 4.6V19.2", w: 1.3 },
      { l: "M7 9C8.5 9 9.5 10 9.5 11.5M17 9C15.5 9 14.5 10 14.5 11.5M7.4 14.6C8.6 14 9.8 14.4 10.4 15.4M16.6 14.6C15.4 14 14.2 14.4 13.6 15.4", w: 1.1 },
      { h: "M5.6 7.6Q6 6.4 7.4 6.2" },
    ],
  },
  rocket: {
    t: "rotate(45 12 12)",
    s: [
      { p: "M8 10.5L4.6 14.6V17.4L8.4 15.6Z", f: C.R },
      { p: "M16 10.5L19.4 14.6V17.4L15.6 15.6Z", f: C.R },
      { p: "M9.6 15.2H14.4L13.4 19.4L12 22.2L10.6 19.4Z", f: C.A },
      { p: "M12 1.8C15.6 4.4 16.6 8.6 16 15.4H8C7.4 8.6 8.4 4.4 12 1.8Z", f: C.W, m: 1 },
    ],
    d: [
      { p: "M12 1.8C13.6 3 14.6 4.4 15.2 6H8.8C9.4 4.4 10.4 3 12 1.8Z", f: C.R },
      { c: [12, 9.4, 2], f: C.B },
      { p: "M10.9 15.6H13.1L12.6 18L12 19.4L11.4 18Z", f: C.Y, sw: 0.8 },
    ],
  },
  success: {
    s: [{ c: [12, 12, 9.6], f: C.G, m: 1 }],
    d: [{ o: "M7.4 12.4L10.6 15.6L16.6 8.8", f: C.W, w: 2.2 }],
  },
  fail: {
    s: [{ c: [12, 12, 9.6], f: C.R, m: 1 }],
    d: [{ o: "M8.6 8.6L15.4 15.4M15.4 8.6L8.6 15.4", f: C.W, w: 2.2 }],
  },
  pill: {
    t: "rotate(45 12 12)",
    s: [{ p: "M8 12V6.5a4 4 0 0 1 8 0V12Z", f: C.R, m: 1 }, { p: "M8 12v5.5a4 4 0 0 0 8 0V12Z", f: C.W }],
    d: [{ h: "M10 5.8V9.4" }],
  },
  tv: {
    s: [{ l: "M8 2.4L12 6.4L16 2.4", w: 1.6 }, { r: [2.5, 6.4, 19, 14, 1.2], f: C.V, m: 1 }],
    d: [{ r: [4.6, 8.6, 11.8, 9.6, 0.6], f: C.BL }, { c: [19, 10.6, 1.1], f: C.Y, sw: 1 }, { c: [19, 14.4, 1.1], f: C.Y, sw: 1 }, { h: "M6.6 11.6Q6.8 10.6 8 10.4" }],
  },
  drop: {
    s: [{ p: "M12 2.4C12 2.4 5 10.4 5 15A7 7 0 0 0 19 15C19 10.4 12 2.4 12 2.4Z", f: C.B, m: 1 }],
    d: [{ h: "M8.6 14.6A3.4 3.4 0 0 0 11 18.2" }],
  },
  fire: {
    s: [{ p: "M12 22c-4.6 0-7.5-3-7.5-7 0-3.6 2.5-5.6 3.6-8.6.6 1.6 1.5 2.6 2.6 3 .3-3.4 1.9-5.9 4.3-7.4-.3 2.6.8 4.6 2.4 6.4 1.4 1.6 2.6 3.6 2.6 6.6 0 4-2.9 7-8 7z", f: C.R, m: 1 }],
    d: [
      { p: "M12 21.2c-2.8 0-4.4-1.8-4.4-4 0-2.2 1.8-3.4 2.5-5.4 1.3 1.1 1.8 2.2 1.8 3.4.9-.7 1.6-1.8 1.8-3.2 1.6 1.6 2.6 3.2 2.6 5.2 0 2.2-1.6 4-4.3 4z", f: C.A, sw: 1.2 },
      { p: "M12 20.6c-1.3 0-2-.8-2-1.8s.8-1.6 1.2-2.6c.6.6.9 1.2.9 1.8.4-.3.8-.8.9-1.4.7.7 1 1.4 1 2.2 0 1-.7 1.8-2 1.8z", f: C.Y, sw: 0 },
    ],
  },
  smile: {
    s: FACE,
    d: [
      { e: [8.8, 9.8, 1.1, 1.6], f: INK, sw: 0 }, { e: [15.2, 9.8, 1.1, 1.6], f: INK, sw: 0 },
      { l: "M7.4 14Q12 18.8 16.6 14", w: 1.6 }, { h: "M5.4 9Q6 6.6 8.2 5.4" },
    ],
  },
  sad: {
    s: FACE,
    d: [
      { e: [8.8, 9.8, 1.1, 1.6], f: INK, sw: 0 }, { e: [15.2, 9.8, 1.1, 1.6], f: INK, sw: 0 },
      { l: "M8 17Q12 13.4 16 17", w: 1.6 },
      { p: "M17.6 12.4q-1.2 1.8-1.2 2.6a1.2 1.2 0 0 0 2.4 0q0-.8-1.2-2.6z", f: C.BL, sw: 1 },
    ],
  },
  lightbulb: {
    s: [
      { r: [9, 16.6, 6, 5, 0.8], f: C.ST },
      { p: "M12 2.4A6.8 6.8 0 0 0 8 14.7C8.8 15.3 9.2 16 9.2 16.8H14.8C14.8 16 15.2 15.3 16 14.7A6.8 6.8 0 0 0 12 2.4Z", f: C.Y, m: 1 },
    ],
    d: [
      { l: "M9.2 19H14.8", w: 1 },
      { l: "M10.2 12.8L12 10.6L13.8 12.8", w: 1.1 },
      { l: "M1.6 8.6H3.4M20.6 8.6H22.4M3.4 2.6L4.8 4M20.6 2.6L19.2 4", w: 1.4 },
      { h: "M8.6 7.6Q9 5.6 11 4.8" },
    ],
  },
  megaphone: {
    s: [
      { p: "M7 15L8.6 21H11.4L10.2 15.6Z", f: C.BR },
      { r: [2, 9.2, 3.6, 5.6, 0.6], f: C.ST },
      { p: "M5.4 9.2L15.4 3.8V20.2L5.4 14.8Z", f: C.R, m: 1 },
      { e: [15.4, 12, 2, 8.2], f: C.W },
    ],
    d: [{ l: "M19 7.8L21.6 6.2M19.6 12H22.6M19 16.2L21.6 17.8", w: 1.5 }, { h: "M7.4 10.6L12.6 7.8" }],
  },
  graduation: {
    s: [
      { p: "M6 11.2V16.2C6 18 8.8 19.4 12 19.4S18 18 18 16.2V11.2L12 14Z", f: C.VD },
      { p: "M12 4L22.4 9L12 14L1.6 9Z", f: C.V, m: 1 },
    ],
    d: [{ l: "M12 9L19.6 11.2V16", w: 1.2 }, { c: [19.6, 17, 1.5], f: C.Y, sw: 1 }, { h: "M6.6 8.8L11 6.8" }],
  },
  mic: {
    s: [
      { l: "M5.8 11.4A6.2 6.2 0 0 0 18.2 11.4M12 17.6V21.4M8.6 21.4H15.4", w: 1.8 },
      { r: [8.5, 2.2, 7, 12.4, 3.5], f: C.R, m: 1 },
    ],
    d: [
      { p: "M8.5 9.4V5.7a3.5 3.5 0 0 1 7 0V9.4Z", f: C.ST },
      { l: "M10 5.4H14M9.4 7.4H14.6", w: 0.8 },
      { h: "M10.2 11.4V13" },
    ],
  },
  scroll: {
    s: [
      { r: [5, 4, 14, 16], f: C.PA, m: 1 },
      { r: [3.4, 2.2, 17.2, 3.6, 1.8], f: "#e5cf8f" },
      { r: [3.4, 18.4, 17.2, 3.6, 1.8], f: "#e5cf8f" },
    ],
    d: [{ l: "M7.6 8.6H16.4M7.6 11.2H16.4M7.6 13.8H12.6", w: 1 }, { c: [15.4, 15.2, 1.9], f: C.R, sw: 1 }],
  },
  stadium: {
    s: [{ e: [12, 13.6, 10.2, 7.4], f: C.ST, m: 1 }],
    d: [
      { e: [12, 13.6, 6.6, 4.3], f: C.G },
      { l: "M12 9.3V17.9", k: C.W, w: 0.9 },
      { l: "M4.8 8.2V2.4M19.2 8.2V2.4", w: 1.2 },
      { p: "M4.8 2.4L8.2 3.5L4.8 4.6Z", f: C.R, sw: 0.9 },
      { p: "M19.2 2.4L22.6 3.5L19.2 4.6Z", f: C.Y, sw: 0.9 },
    ],
  },
  rain: {
    s: [
      { o: "M7.6 18.2L6.6 20.8M12 18.2L11 20.8M16.4 18.2L15.4 20.8", f: C.B, w: 1.4 },
      { p: "M6.6 15.4A4.2 4.2 0 0 1 6.2 7A5.6 5.6 0 0 1 17 5.8A4.4 4.4 0 0 1 17.8 15.4Z", f: C.W, m: 1 },
    ],
  },
  theater: {
    s: [
      { p: "M2.6 3.8C5.6 5 8.6 5 11.8 3.8V10.2C11.8 14.2 9.6 16.8 7.2 16.8S2.6 14.2 2.6 10.2Z", f: C.Y, m: 1 },
      { p: "M12.2 7.6C15.4 8.8 18.4 8.8 21.4 7.6V14C21.4 18 19.2 20.6 16.8 20.6S12.2 18 12.2 14Z", f: C.L },
    ],
    d: [
      { e: [5.4, 8.6, 1, 0.8], f: INK, sw: 0 }, { e: [9.2, 8.6, 1, 0.8], f: INK, sw: 0 },
      { l: "M4.6 11.6Q7.2 14.4 9.8 11.6", w: 1.3 },
      { e: [14.8, 12.4, 1, 0.8], f: INK, sw: 0 }, { e: [18.8, 12.4, 1, 0.8], f: INK, sw: 0 },
      { l: "M14.4 17.4Q16.8 15 19.2 17.4", w: 1.3 },
    ],
  },
  ban: {
    s: [{ c: [12, 12, 9.6], f: C.R, m: 1 }],
    d: [{ c: [12, 12, 6.3], f: C.W }, { o: "M7.6 16.4L16.4 7.6", f: C.R, w: 2.6 }],
  },
  slow: {
    s: [
      { p: "M18.6 13.6C18.8 11.2 20.4 10.4 21.6 11C22.8 11.6 22.8 13.6 21.4 14.4L19 15.2Z", f: C.GL },
      { r: [5, 15, 3, 4.4, 0.8], f: C.GL },
      { r: [14.4, 15, 3, 4.4, 0.8], f: C.GL },
      { p: "M2.8 16.4A8.8 8 0 0 1 20.4 16.4Z", f: C.G, m: 1 },
    ],
    d: [
      { l: "M7.2 16.4L9 11.4H14.2L16 16.4M9 11.4L8.2 8.9M14.2 11.4L15.2 8.9M11.6 11.4V8.6", w: 1 },
      { c: [21.2, 12.4, 0.6], f: INK, sw: 0 },
      { h: "M5.6 13.4Q6.2 11.6 7.6 10.8" },
    ],
  },
  bandage: {
    t: "rotate(-40 12 12)",
    s: [{ r: [2, 8.2, 20, 7.6, 3.8], f: "#e7b48a", m: 1 }],
    d: [
      { r: [8.8, 8.2, 6.4, 7.6], f: C.PA, sw: 1.2 },
      { p: "M4.4 10.6h1v1h-1zM4.4 12.6h1v1h-1zM18.6 10.6h1v1h-1zM18.6 12.6h1v1h-1z", f: INK, sw: 0 },
      { p: "M11.2 9.8H12.8V11.2H14.2V12.8H12.8V14.2H11.2V12.8H9.8V11.2H11.2Z", f: C.R, sw: 0.7 },
    ],
  },
  hand: {
    s: [{ p: "M7.4 21.4C5.4 18.6 4.6 15.6 4.6 12.8V9.6a1.5 1.5 0 0 1 3 0V12V5.2a1.5 1.5 0 0 1 3 0V11V3.8a1.5 1.5 0 0 1 3 0V11V5.4a1.5 1.5 0 0 1 3 0V13.2C17 12.2 18 11 19.4 11.2c.9.1 1.3.9.9 1.7L17 18.4C16 20.4 14.4 21.4 12.4 21.4Z", f: C.SK, m: 1 }],
    d: [{ h: "M6.1 10.2V12" }],
  },
  handshake: {
    s: [
      { p: "M1.4 9.2L6 7.4L8.6 14.6L4 16.4Z", f: C.B },
      { p: "M22.6 9.2L18 7.4L15.4 14.6L20 16.4Z", f: C.V },
      { p: "M6.4 9C9 7.4 11 7 13 8L17.6 8.4L16 14.6C14.6 16.6 12.6 17.8 10.6 17.6C9 17.4 8 16.2 7.8 14.6Z", f: C.SK, m: 1 },
    ],
    d: [{ l: "M10 12.2L12.6 14.6M11.6 10.8L14.2 13.2M13.4 9.6L15.6 11.6", w: 1 }],
  },
  document: {
    s: [{ p: "M5 2.4H14.6L19.2 7V21.6H5Z", f: C.W, m: 1 }],
    d: [
      { p: "M14.6 2.4V7H19.2Z", f: C.GR },
      { l: "M7.6 10.4H16.4M7.6 13H16.4M7.6 15.6H12.4", w: 1 },
      { c: [15.6, 18, 1.8], f: C.R, sw: 1 },
    ],
  },
  wallet: {
    s: [{ p: "M4.4 6.6L15.6 2.6L17 6.6Z", f: C.GL }, { r: [2.4, 6.2, 19, 14.6, 1.4], f: C.BR, m: 1 }],
    d: [{ r: [14.2, 10.4, 7.8, 5.8, 1], f: C.A }, { c: [17.2, 13.3, 1], f: INK, sw: 0 }, { h: "M4.6 9V17.6" }],
  },
  search: {
    s: [{ o: "M15.2 15.2L21 21", f: C.BR, w: 3 }, { c: [10, 10, 7], f: C.BL, m: 1 }],
    d: [{ h: "M6.4 9Q6.8 6.8 9 6.2" }],
  },
  clipboard: {
    s: [{ r: [4, 3.6, 16, 18.6, 1.2], f: C.BR, m: 1 }],
    d: [
      { r: [6.2, 6.4, 11.6, 13.6], f: C.W, sw: 1.2 },
      { r: [8.6, 2, 6.8, 3.8, 0.8], f: C.ST },
      { l: "M8.6 10.6H15.4M8.6 13.4H15.4M8.6 16.2H12.6", w: 1 },
    ],
  },
  edit: {
    t: "rotate(45 12 12)",
    s: [
      { p: "M9.6 16.4H14.4L12 21.8Z", f: C.SK },
      { r: [9.6, 4.8, 4.8, 11.6], f: C.A, m: 1 },
      { r: [9.6, 1.8, 4.8, 3.4, 0.8], f: C.PK },
    ],
    d: [
      { r: [9.6, 4.4, 4.8, 1.6], f: C.ST, sw: 1.2 },
      { p: "M11.1 19.6H12.9L12 21.8Z", f: INK, sw: 0 },
      { l: "M12 6V16.4", w: 0.8, op: 0.55 },
    ],
  },
  ball: {
    s: [{ c: [12, 12, 9.4], f: C.Y, m: 1 }],
    d: [{ l: "M4.6 6.4C8 9 8 15 4.6 17.6M19.4 6.4C16 9 16 15 19.4 17.6", k: C.W, w: 1.8 }],
  },
  wrench: {
    t: "rotate(45 12 12)",
    s: [{ r: [10.4, 9, 3.2, 13.4, 1.6], f: C.ST }, { c: [12, 6.4, 5], f: C.ST, m: 1 }],
    d: [{ r: [10.3, 0.4, 3.4, 6.2], f: INK, sw: 0 }, { h: "M8.6 6.4Q8.6 4.6 9.6 3.8" }],
  },
  award: {
    s: [
      { p: "M7 2.2H11.2L13.6 10.4H9.4Z", f: C.B },
      { p: "M17 2.2H12.8L10.4 10.4H14.6Z", f: C.R },
      { c: [12, 15.2, 6.4], f: C.A, m: 1 },
    ],
    d: [{ p: starPath(12, 15.4, 3.6, 1.6), f: C.Y, sw: 1 }, { h: "M8 14Q8.6 11.8 10.6 11.2" }],
  },
  trash: {
    s: [
      { r: [9.4, 2.2, 5.2, 2.6, 0.6], f: C.ST },
      { p: "M5.4 7.2H18.6L17.4 21.4H6.6Z", f: C.ST, m: 1 },
      { r: [3.4, 4.6, 17.2, 2.8, 0.6], f: C.ST },
    ],
    d: [{ l: "M9.4 10V18.6M12 10V18.6M14.6 10V18.6", w: 1.1 }],
  },
  play: { s: [{ p: "M6.6 3.6L20.4 12L6.6 20.4Z", f: C.G, m: 1 }], d: [{ h: "M8.6 7.6V11" }] },
  history: {
    s: [{ c: [12, 12, 9.6], f: C.B, m: 1 }],
    d: [
      { c: [12, 12, 7], f: C.W },
      { l: "M12 5.6V6.8M18.4 12H17.2M12 18.4V17.2M5.6 12H6.8", w: 1 },
      { l: "M12 7.6V12L15.2 14", w: 1.8 },
      { c: [12, 12, 1], f: INK, sw: 0 },
    ],
  },
  dice: {
    t: "rotate(-10 12 12)",
    s: [{ r: [3.6, 3.6, 16.8, 16.8, 3], f: C.W, m: 1 }],
    d: [[8, 8], [16, 8], [12, 12], [8, 16], [16, 16]].map(([x, y]) => ({ c: [x, y, 1.6], f: C.R, sw: 0 })),
  },
  glove: {
    s: [
      { r: [7.4, 15, 9.2, 6.6, 0.8], f: C.W },
      { p: "M7.6 15.2C5.6 13.4 5 10.8 5.4 8.4 6.1 4.8 9.4 2.6 13 2.6 17 2.6 20 5.6 20 9.4c0 3-1.4 5-4 5.8Z", f: C.R, m: 1 },
      { p: "M6.2 9.4C3.8 9.2 2.4 11.4 3.4 13.4 4.3 15 6.4 15.4 7.8 14.6Z", f: C.R, m: 1 },
    ],
    d: [{ l: "M7.4 18H16.6", w: 1.2 }, { h: "M10.8 5.8C12.4 5 14.4 5.2 15.6 6.2" }],
  },
};
// Alias : même dessin, autre nom d'appel.
Object.assign(BD_ICONS, { yoga: BD_ICONS.brain, activity: BD_ICONS.ball });
// Pictos de jauge (Bonheur, Popularité, Image, énergie, argent).
for (const [k, shapes] of Object.entries(STAT_SHAPES)) {
  BD_ICONS[k] = {
    s: shapes.map(sh => (sh.circle ? { c: sh.circle, f: sh.fill, m: 1 } : { p: sh.d, f: sh.fill, m: 1 })),
    d: STAT_DETAILS[k],
  };
}
Object.assign(BD_ICONS, { heart: BD_ICONS.happiness, sparkles: BD_ICONS.popularity, party: BD_ICONS.popularity });

function bdShape(el, key, props) {
  if (el.c) return <circle key={key} cx={el.c[0]} cy={el.c[1]} r={el.c[2]} {...props} />;
  if (el.e) return <ellipse key={key} cx={el.e[0]} cy={el.e[1]} rx={el.e[2]} ry={el.e[3]} {...props} />;
  if (el.r) return <rect key={key} x={el.r[0]} y={el.r[1]} width={el.r[2]} height={el.r[3]} rx={el.r[4] || 0} {...props} />;
  return <path key={key} d={el.p} {...props} />;
}
const ROUND = { strokeLinecap: "round", strokeLinejoin: "round" };
// shadow : false (dessin), true (ombre d'encre) ou "halo" (liseré blanc).
function bdElement(el, key, shadow, fillOverride) {
  const tr = el.t ? { transform: el.t } : {};
  const color = el.m && fillOverride ? fillOverride : el.f;
  const sc = shadow === "halo" ? "#ffffff" : INK;
  const extra = shadow === "halo" ? 3.6 : 0;
  if (el.h) return shadow ? null : <path key={key} d={el.h} fill="none" stroke="#ffffff" strokeWidth={el.w || 1.3} {...ROUND} {...tr} />;
  if (el.o) {
    const outer = <path d={el.o} fill="none" stroke={sc} strokeWidth={el.w + 2.8 + extra} {...ROUND} />;
    return shadow
      ? <g key={key} {...tr}>{outer}</g>
      : <g key={key} {...tr}>{outer}<path d={el.o} fill="none" stroke={color} strokeWidth={el.w} {...ROUND} /></g>;
  }
  if (el.l) {
    return <path key={key} d={el.l} fill="none" stroke={shadow ? sc : (el.k || INK)} strokeWidth={(el.w || 1.4) + extra}
      strokeDasharray={shadow ? undefined : el.da} opacity={shadow ? undefined : el.op} {...ROUND} {...tr} />;
  }
  const sw = el.sw === undefined ? BD_OUTLINE : el.sw;
  return bdShape(el, key, shadow
    ? { fill: sc, stroke: sc, strokeWidth: (sw || 0) + extra, strokeLinejoin: "round", ...tr }
    : { fill: color, stroke: sw ? INK : "none", strokeWidth: sw, strokeLinejoin: "round", opacity: el.op, ...tr });
}

// Logo BD par nom (null si aucun dessin BD n'existe).
// `halo` : liseré blanc autour du dessin, pour les fonds noirs.
export function BdIcon({ name, size = 16, fill, halo, style }) {
  const def = BD_ICONS[name];
  if (!def) return null;
  const g = def.t ? { transform: def.t } : {};
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", overflow: "visible", ...style }}>
      {halo && (
        <g {...g}>{def.s.map((el, i) => bdElement(el, "w" + i, "halo"))}</g>
      )}
      <g transform={"translate(" + BD_SHADOW + " " + BD_SHADOW + ")"}>
        <g {...g}>{def.s.map((el, i) => bdElement(el, "s" + i, true))}</g>
      </g>
      <g {...g}>
        {def.s.map((el, i) => bdElement(el, "f" + i, false, fill))}
        {(def.d || []).map((el, i) => bdElement(el, "d" + i, false, fill))}
      </g>
    </svg>
  );
}
export const BD_ICON_NAMES = Object.keys(BD_ICONS);

// Petits pictos fonctionnels (flèches, chevrons, croix, coche, cadenas,
// chargement…) : restent au trait, mais encrés épais.
const LINE_ICONS = {
  arrowRight: ArrowRight, arrowLeft: ArrowLeft, arrowUp: ArrowUp, arrowDown: ArrowDown,
  chevronRight: ChevronRight, "chevron-right": ChevronRight, chevronLeft: ChevronLeft,
  check: Check, x: X, lock: Lock, loader: Loader2, plus: Plus, dot: CircleDot, square: Square,
};

// Composant unique : logo BD en priorité, sinon picto fonctionnel au trait.
// `fill` remplace la couleur principale d'un logo BD (ex. médaille or/argent).
export function Icon({ name, size = 14, color = "currentColor", strokeWidth = 2.5, fill, halo, style }) {
  if (BD_ICONS[name]) return <BdIcon name={name} size={size} fill={fill} halo={halo} style={style} />;
  const L = LINE_ICONS[name];
  if (!L) return null;
  return <L size={size} color={color} strokeWidth={Math.max(2.5, strokeWidth)} style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }} />;
}

// Point d'exclamation BD : petite explosion rouge cerclée d'encre, posée en
// coin d'un bouton ou d'une carte (le parent doit être en position relative).
export function BangBadge({ size = 22, top = -8, right = -6, style }) {
  return (
    <svg aria-label="Nouveau" role="img" width={size} height={size} viewBox="0 0 40 40"
      style={{ position: "absolute", top, right, zIndex: 3, pointerEvents: "none", overflow: "visible", ...style }}>
      <path d="M20 1 L24 10 L33 5 L30 15 L39 17 L31 23 L37 31 L27 30 L26 39 L20 32 L13 38 L13 29 L3 31 L9 23 L1 16 L11 14 L8 4 L16 10 Z"
        fill="#c4302b" stroke="#141414" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="20" y="27.5" textAnchor="middle" fontFamily="'Archivo Black', sans-serif" fontSize="19" fill="#ffffff" stroke="#141414" strokeWidth="1" paintOrder="stroke">!</text>
    </svg>
  );
}
