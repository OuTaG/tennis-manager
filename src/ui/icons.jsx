// Icônes : drapeaux, surfaces, pictogrammes dessinés et composant Icon.
import {
  Activity, AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Award, Ban, BarChart3, Brain, Briefcase, Building2, Calendar, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, ClipboardList, CloudRain, Dices, DollarSign, Droplet, Dumbbell, FileText, Flag as FlagIcon, Flame, Footprints, Frown, Goal, GraduationCap, Hand, Handshake, Heart, HeartPulse, History, Home, Info, Lightbulb, Loader2, Lock, MapPin, Megaphone, MessageCircle, Mic, Newspaper, Pill, Plane, Play, Plus, Rocket, ScrollText, Search, Settings, Shield, Smile, Sparkles, Square, Star, Target, Theater, Ticket, Trash2, TrendingDown, TrendingUp, Trophy, Turtle, Tv, User, Users, Wallet, Wrench, X, XCircle, Zap,
} from "lucide-react";
import { FLAG_DATA } from "../data/flags.js";
import { T } from "./theme.js";

// Flag rendering using flag-icons (vectorized country flags)
export function Flag({ code, size = 14, style }) {
  if (!code) return null;
  const cc = code.toLowerCase();
  const src = FLAG_DATA[cc];
  if (!src) {
    // Unknown flag: show the country abbreviation instead.
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: size * 1.4, height: size, padding: "0 2px", borderRadius: 2,
        fontSize: Math.max(8, size * 0.6), fontWeight: 800, letterSpacing: 0.3,
        background: T.bg3, color: T.fg3, border: "1px solid " + T.brd2,
        verticalAlign: "middle", flexShrink: 0, lineHeight: 1, ...style,
      }}>{cc.toUpperCase()}</span>
    );
  }
  return (
    <span
      role="img"
      aria-label={cc.toUpperCase()}
      style={{
        display: "inline-block",
        width: size * 1.4,
        height: size,
        borderRadius: 2,
        verticalAlign: "middle",
        backgroundImage: "url(\"" + src + "\")",
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: "0 0 0 0.5px rgba(0,0,0,0.25)",
        flexShrink: 0,
        ...style,
      }}
    />
  );
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


export function SurfaceIcon({ name, size = 14 }) {
  const colors = {
    "Dur": "#4a7896",          // bleu ardoise
    "Terre battue": "#b95d38", // terre battue
    "Gazon": "#5b8a45",        // gazon
    "Indoor": "#7a6a8e",       // salle (lilas grisé)
  };
  const c = colors[name] || T.fg5;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle" }}>
      <rect x="1" y="3" width="14" height="10" rx="1" fill={c} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
      <line x1="8" y1="3" x2="8" y2="13" stroke="white" strokeWidth="0.6" opacity="0.7" />
      <line x1="1" y1="8" x2="15" y2="8" stroke="white" strokeWidth="0.4" opacity="0.5" />
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
    search: Search, users: Users, loader: Loader2, clipboard: ClipboardList,
    user: User, party: Sparkles, activity: Activity, racquet: Activity,
    wrench: Wrench, award: Award, heart: Heart, down: TrendingDown,
    dot: CircleDot, square: Square, trash: Trash2, play: Play,
    history: History,
    cog: Settings,
    info: Info,
    dice: Dices,
    lock: Lock, plus: Plus,
  };
  if (name === "glove") return <BoxingGloveIcon size={size} color={color} strokeWidth={strokeWidth} style={style} />;
  const C = map[name];
  if (!C) return null;
  return <C size={size} color={color} strokeWidth={strokeWidth} style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }} />;
}
