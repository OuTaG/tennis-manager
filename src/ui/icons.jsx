// Icônes : drapeaux, surfaces, pictogrammes dessinés et composant Icon.
import {
  Activity, AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Award, Ban, BarChart3, Brain, Briefcase, Building2, Calendar, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, ClipboardList, CloudRain, Dices, DollarSign, Droplet, Dumbbell, FileText, Flag as FlagIcon, Flame, Footprints, Frown, Goal, GraduationCap, Hand, Handshake, Heart, HeartPulse, History, Home, Info, Lightbulb, Loader2, Lock, MapPin, Pencil, Megaphone, MessageCircle, Mic, Newspaper, Pill, Plane, Play, Plus, Rocket, ScrollText, Search, Settings, Shield, Smile, Sparkles, Square, Star, Target, Theater, Ticket, Trash2, TrendingDown, TrendingUp, Trophy, Turtle, Tv, User, Users, Wallet, Wrench, X, XCircle, Zap,
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
const STAT_DECOR = {
  happiness: <path d="M5.4 8.6Q5.6 6.4 7.6 6" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />,
  popularity: <path d="M17.6 4.4l2-2M19.4 7.2l2.6-.6" fill="none" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />,
  image: <path d="M6.6 7.4Q7.2 6 8.6 5.8" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />,
  money: (
    <g fill="none" stroke="#141414" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="6.6" strokeWidth="0.8" opacity="0.5" />
      <path d="M15 8.6a4 4 0 1 0 0 6.8" />
      <path d="M7.6 11h5.2M7.6 13.2h5.2" />
    </g>
  ),
};

export function StatIcon({ name, size = 16, style }) {
  const shapes = STAT_SHAPES[name];
  if (!shapes) return null;
  const draw = (sh, i, shadow) => {
    const p = shadow
      ? { fill: "#141414", transform: "translate(1.2 1.2)" }
      : { fill: sh.fill, stroke: "#141414", strokeWidth: 1.6, strokeLinejoin: "round" };
    return sh.circle
      ? <circle key={(shadow ? "s" : "f") + i} cx={sh.circle[0]} cy={sh.circle[1]} r={sh.circle[2]} {...p} />
      : <path key={(shadow ? "s" : "f") + i} d={sh.d} {...p} />;
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", overflow: "visible", ...style }}>
      {shapes.map((sh, i) => draw(sh, i, true))}
      {shapes.map((sh, i) => draw(sh, i, false))}
      {STAT_DECOR[name]}
    </svg>
  );
}

// Unified Icon component with size + color props
// Boxing glove, drawn in the same line style as the lucide icons.
export function BoxingGloveIcon({ size = 14, color = "currentColor", strokeWidth = 2, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}>
      {/* Padded mitt */}
      <path d="M8 15C6.2 13.4 5.6 11 6 8.6 6.7 5 9.8 3 13.4 3 17.4 3 20 6 20 9.6c0 2.9-1.4 4.8-4 5.4" />
      {/* Thumb */}
      <path d="M6.3 10.6c-2-.2-3 1.7-2 3.3.8 1.2 2.5 1.4 3.9.7" />
      {/* Knuckle seam */}
      <path d="M10.5 7.6c1.9-1 4.4-.7 5.8.9" />
      {/* Cuff */}
      <path d="M8 15h8v5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" />
      <path d="M8 17.8h8" />
    </svg>
  );
}

// Petit jeu d'icônes dessinées à la main pour le vocabulaire du tennis et la
// navigation. Même grammaire que lucide (grille 24, trait rond) mais formes
// plus douces, pour que l'interface ait sa propre personnalité.
export const HAND_ICONS = {
  racquet: (
    <>
      <ellipse cx="9.6" cy="9.4" rx="6.4" ry="7.6" transform="rotate(-40 9.6 9.4)" />
      <path d="M6.3 6.8l7 6.6M8.4 4.6l6.8 6.8M4.6 9.6l5.4 5.2M5.6 11.6l6.6-6.6M7.9 14l6.4-6.4" opacity="0.45" />
      <path d="M13.9 14.2l1.8 1.7" />
      <path d="M15.3 15.3l4.6 4.6a1.5 1.5 0 0 1-2.1 2.1l-4.6-4.6" />
    </>
  ),
  ball: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M5.2 6.8c2.9 2.4 2.9 8 0 10.4" />
      <path d="M18.8 6.8c-2.9 2.4-2.9 8 0 10.4" />
    </>
  ),
  court: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2.4" />
      <path d="M3 12h18" strokeWidth="2.2" />
      <path d="M7 7.5h10M7 16.5h10M12 7.5v9" opacity="0.6" />
    </>
  ),
  home: (
    <>
      <path d="M3.8 11.2L12 4.4l8.2 6.8" />
      <path d="M6 9.6v8.9c0 .8.6 1.5 1.4 1.5H10v-5.2h4V20h2.6c.8 0 1.4-.7 1.4-1.5V9.6" />
    </>
  ),
  money: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M15.2 8.6a4.2 4.2 0 1 0 0 6.8" />
      <path d="M7.8 11h5.4M7.8 13.2h5.4" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4L6 18M18 18l-1.6-1.6M7.6 7.6L6 6" />
      <circle cx="12" cy="12" r="6.3" opacity="0.5" />
    </>
  ),
  player: (
    <>
      <circle cx="11" cy="6" r="2.6" />
      <path d="M11 9.2v5.2l-3 5.8M11 14.4l3.2 5.6M7 11.6l4-1.4 4.2 1.8" />
      <circle cx="18.6" cy="8.6" r="1.6" />
    </>
  ),
  bag: (
    <>
      <path d="M5.5 8.5h13l-1 10.6a1.6 1.6 0 0 1-1.6 1.4H8.1a1.6 1.6 0 0 1-1.6-1.4z" />
      <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
    </>
  ),
  office: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.6" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <path d="M3.5 12.5h17" opacity="0.6" />
    </>
  ),
};

// Pictos BD accessibles via <Icon name="happiness" /> etc.
const STAT_ICON_NAMES = { happiness: "happiness", popularity: "popularity", image: "image" };

export function Icon({ name, size = 14, color = "currentColor", strokeWidth = 1.8, style }) {
  if (HAND_ICONS[name]) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}>
        {HAND_ICONS[name]}
      </svg>
    );
  }
  const map = {
    trophy: Trophy, energy: Zap, target: Target, dumbbell: Dumbbell,
    flag: FlagIcon, warning: AlertTriangle, plane: Plane, location: MapPin,
    chart: BarChart3, trending: TrendingUp, check: Check, x: X,
    rocket: Rocket, run: Footprints, yoga: Brain, success: CheckCircle2,
    fail: XCircle, home: Home, news: Newspaper, ticket: Ticket,
    shield: Shield, goal: Goal, pill: Pill, tv: Tv, drop: Droplet,
    fire: Flame, sad: Frown, calendar: Calendar, lightbulb: Lightbulb,
    megaphone: Megaphone, graduation: GraduationCap, mic: Mic,
    scroll: ScrollText, star: Star, stadium: Building2, sparkles: Sparkles,
    brain: Brain, rain: CloudRain, theater: Theater, chat: MessageCircle,
    ban: Ban, slow: Turtle, bandage: HeartPulse, hand: Hand, foot: Footprints,
    smile: Smile, briefcase: Briefcase, handshake: Handshake,
    document: FileText, wallet: Wallet, money: DollarSign,
    arrowRight: ArrowRight, arrowLeft: ArrowLeft, chevronRight: ChevronRight,
    "chevron-right": ChevronRight, chevronLeft: ChevronLeft, arrowUp: ArrowUp, arrowDown: ArrowDown,
    search: Search, users: Users, loader: Loader2, clipboard: ClipboardList, edit: Pencil,
    user: User, party: Sparkles, activity: Activity, racquet: Activity,
    wrench: Wrench, award: Award, heart: Heart, down: TrendingDown,
    dot: CircleDot, square: Square, trash: Trash2, play: Play,
    history: History,
    cog: Settings,
    info: Info,
    dice: Dices,
    lock: Lock, plus: Plus,
  };
  if (STAT_ICON_NAMES[name]) return <StatIcon name={STAT_ICON_NAMES[name]} size={size} style={style} />;
  if (name === "glove") return <BoxingGloveIcon size={size} color={color} strokeWidth={strokeWidth} style={style} />;
  const C = map[name];
  if (!C) return null;
  return <C size={size} color={color} strokeWidth={strokeWidth} style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }} />;
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
