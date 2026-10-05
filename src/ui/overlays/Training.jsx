// Animations d'entraînement : une planche de BD en trois cases.
import { useState, useEffect, useRef } from "react";
import { Avatar } from "../avatar.jsx";
import { T } from "../theme.js";

// ─── TRAINING ANIMATION OVERLAY ─────────────────────────────────────────────
// Chaque séance se raconte en trois cases qui apparaissent l'une après
// l'autre : 1. le joueur et ce qu'il travaille (récitatif + bulle),
// 2. l'action (court, balle, onomatopée), 3. le résultat chiffré, puis la
// pastille du gain. Toucher l'écran passe l'animation.
//
// Props :
//   mod    — le module d'entraînement (nom + stat)
//   gain   — gain de la stat, affiché à la fin
//   avatar — avatar du joueur, dessiné dans la première case
//   onDone — appelé à la fin
const INK = "#161616";
const PAPER = "#fffdf6";
const DURATION = 4600;
const PANEL_START = [0, 0.24, 0.5];
const STAT_LABEL = { serve: "service", forehand: "coup droit", backhand: "revers", stamina: "endurance", mental: "mental", net: "filet" };

// Textes de la planche, par exercice.
const SCRIPT = {
  serve: {
    caption1: "Séance de service.", bubble: "Lancer haut, frapper au sommet.",
    caption2: "Cent services d'affilée…", sfx: "BAM !",
    caption3: "Dans le coin, à pleine vitesse.",
  },
  forehand: {
    caption1: "Séance de coup droit.", bubble: "Croisé, encore et encore.",
    caption2: "Le panier de balles se vide…", sfx: "POK !",
    caption3: "Précision dans la cible.",
  },
  backhand: {
    caption1: "Séance de revers.", bubble: "Long de ligne, sans trembler.",
    caption2: "Revers à deux mains…", sfx: "CLAC !",
    caption3: "Précision dans la cible.",
  },
  net: {
    caption1: "Séance au filet.", bubble: "Je monte, je coupe l'angle.",
    caption2: "Volée après volée…", sfx: "TCHAK !",
    caption3: "Volées gagnantes.",
  },
  stamina: {
    caption1: "Préparation physique.", bubble: "Encore un tour. Allez !",
    caption2: "Slalom entre les plots…", sfx: "HOP ! HOP !",
    caption3: "Le chrono tombe.",
  },
  mental: {
    caption1: "Travail mental : jouer sous pression.", bubble: "Balle de match contre moi…",
    caption2: "Le public siffle, le coach crie. Rester dans sa bulle.", sfx: "",
    caption3: "Respirer. Le cœur ralentit.",
  },
};

export function TrainingOverlay({ mod, gain, avatar, onDone }) {
  const [p, setP] = useState(0);
  const rafRef = useRef(null);
  const doneRef = useRef(false);
  // Variante tirée une fois (purement visuelle : chiffres affichés).
  const seedRef = useRef(Math.random());
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    if (onDone) onDone();
  };

  useEffect(() => {
    let start = null;
    const step = (now) => {
      if (start === null) start = now;
      const q = Math.min(1, (now - start) / DURATION);
      setP(q);
      if (q < 1) rafRef.current = requestAnimationFrame(step);
      else setTimeout(finish, 650);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const stat = SCRIPT[mod?.stat] ? mod.stat : "serve";
  const sc = SCRIPT[stat];
  const seed = seedRef.current;
  // Avancement propre à chaque case (0 → 1 pendant ~45 % de l'animation).
  const local = (i) => Math.max(0, Math.min(1, (p - PANEL_START[i]) / 0.42));
  const shown = (i) => p >= PANEL_START[i];

  return (
    <div
      onClick={finish}
      className="tm-paper"
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 16, cursor: "pointer",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "3px solid " + INK, paddingBottom: 4 }}>
          <span className="tm-display" style={{ fontSize: 22, color: T.fg }}>{mod?.name || "Entraînement"}</span>
          <span className="tm-eyebrow" style={{ color: T.fg }}>Entraînement</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10 }}>
          <Panel visible={shown(0)} className="tm-halftone-cyan" caption={sc.caption1} height={190}>
            <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)" }}>
              {avatar ? <Avatar config={avatar} size={150} bare /> : null}
            </div>
            <Bubble text={sc.bubble} k={local(0)} />
          </Panel>
          <Panel visible={shown(1)} className={stat === "mental" ? "tm-halftone-magenta" : "tm-halftone-yellow"} caption={sc.caption2} height={190}>
            <ActionScene stat={stat} k={local(1)} sfx={sc.sfx} avatar={avatar} />
          </Panel>
        </div>

        <Panel visible={shown(2)} className="" caption={sc.caption3} height={170}>
          <ResultScene stat={stat} k={local(2)} seed={seed} />
          {p > 0.84 && typeof gain === "number" && gain > 0 && (
            <div className="tm-display" style={{
              position: "absolute", right: 10, top: 10, zIndex: 4,
              background: T.magenta, color: "#ffffff", border: "3px solid " + INK, boxShadow: "3px 3px 0 " + INK,
              padding: "4px 10px", fontSize: 20, transform: "rotate(-6deg)",
              animation: "tm-pop 0.25s ease-out both",
            }}>
              +{gain.toFixed(2).replace(".", ",")} {STAT_LABEL[stat]}
            </div>
          )}
        </Panel>

        <div className="tm-eyebrow" style={{ textAlign: "center", color: T.fg4 }}>Toucher pour passer</div>
      </div>
      <style>{"@keyframes tm-pop { from { transform: scale(0.6) rotate(-6deg); opacity: 0; } to { transform: scale(1) rotate(-6deg); opacity: 1; } } @keyframes tm-panel-in { from { transform: scale(0.92); opacity: 0; } to { transform: none; opacity: 1; } }"}</style>
    </div>
  );
}

// Case de BD : cadre d'encre, ombre décalée, récitatif en haut à gauche.
function Panel({ visible, className, caption, height, children }) {
  return (
    <div className={className} style={{
      position: "relative", height, overflow: "hidden",
      background: className ? undefined : PAPER,
      border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK,
      opacity: visible ? 1 : 0.08,
      animation: visible ? "tm-panel-in 0.22s ease-out both" : "none",
    }}>
      {visible && children}
      {visible && caption && (
        <div className="tm-lettering" style={{
          position: "absolute", left: 0, top: 0, maxWidth: "88%",
          background: "#d6ef3c", color: INK, borderRight: "2.5px solid " + INK, borderBottom: "2.5px solid " + INK,
          padding: "2px 7px", fontSize: 13.5, zIndex: 3,
        }}>{caption}</div>
      )}
    </div>
  );
}

function Bubble({ text, k }) {
  if (k < 0.15) return null;
  return (
    <>
      <div className="tm-lettering" style={{
        position: "absolute", right: 6, top: 34, width: "62%", zIndex: 2,
        background: "#ffffff", color: INK, border: "2.5px solid " + INK, borderRadius: "50% / 44%",
        padding: "9px 8px", fontSize: 13, textAlign: "center",
      }}>{text}</div>
    </>
  );
}

// Onomatopée de BD : lettres épaisses, contour d'encre, légère rotation.
function Sfx({ x, y, text, size = 26, rot = -10, color = "#d6ef3c" }) {
  return (
    <text x={x} y={y} transform={"rotate(" + rot + " " + x + " " + y + ")"} textAnchor="middle"
      fontFamily="'Archivo Black', 'Arial Black', sans-serif" fontSize={size}
      fill={color} stroke={INK} strokeWidth="2.2" paintOrder="stroke" strokeLinejoin="round">{text}</text>
  );
}

function SpeedLines({ x, y, n = 5, len = 22, angle = 0 }) {
  return (
    <g transform={"translate(" + x + "," + y + ") rotate(" + angle + ")"} stroke={INK} strokeWidth="2" strokeLinecap="round">
      {Array.from({ length: n }).map((_, i) => (
        <line key={i} x1={-len - (i % 2) * 6} y1={(i - (n - 1) / 2) * 6} x2={-6} y2={(i - (n - 1) / 2) * 6} />
      ))}
    </g>
  );
}

function BallSvg({ x, y, r = 6 }) {
  return (
    <g transform={"translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")"}>
      <circle r={r} fill="#d6ef3c" stroke={INK} strokeWidth="2" />
      <path d={"M " + (-r * 0.7) + " " + (-r * 0.6) + " Q 0 0 " + (-r * 0.7) + " " + (r * 0.6)} fill="none" stroke={INK} strokeWidth="1.3" />
    </g>
  );
}

function Racket({ x, y, angle }) {
  return (
    <g transform={"translate(" + x + "," + y + ") rotate(" + angle + ")"}>
      <rect x="-2.5" y="0" width="5" height="26" fill={INK} />
      <ellipse cx="0" cy="-15" rx="12" ry="16" fill="#ffffff" stroke={INK} strokeWidth="3" />
      <path d="M -8 -24 L 8 -6 M -11 -15 L 11 -15 M -8 -6 L 8 -24 M 0 -30 L 0 0" stroke={INK} strokeWidth="0.9" opacity="0.5" />
    </g>
  );
}

// Case 2 : l'action.
function ActionScene({ stat, k, sfx, avatar }) {
  const W = 180, H = 184;
  if (stat === "mental") {
    // Le joueur au centre, les cris du public autour. Une bulle de calme
    // grandit et repousse le bruit.
    const shouts = [
      { x: 16, y: 54, t: "HOUUU !", r: -12 }, { x: 110, y: 50, t: "Il va craquer !", r: 8 },
      { x: 10, y: 120, t: "BOUH !", r: 6 }, { x: 112, y: 128, t: "Allez !!", r: -8 },
    ];
    const calm = Math.max(0, (k - 0.35) / 0.65);
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", left: "50%", bottom: -6, transform: "translateX(-50%)" }}>
          {avatar ? <Avatar config={avatar} size={120} bare /> : null}
        </div>
        <svg viewBox={"0 0 " + W + " " + H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
          <circle cx={W / 2} cy={H - 56} r={36 + calm * 40} fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="6 5" opacity={0.3 + calm * 0.7} />
        </svg>
        {shouts.map((s, i) => {
          const appear = k > 0.05 + i * 0.07;
          const fade = Math.max(0, 1 - calm * 1.4);
          return appear ? (
            <div key={i} className="tm-display" style={{
              position: "absolute", left: s.x, top: s.y, transform: "rotate(" + s.r + "deg) scale(" + (0.85 + fade * 0.15) + ")",
              background: "#ffffff", color: INK, border: "2px solid " + INK, padding: "1px 5px", fontSize: 11,
              opacity: fade,
            }}>{s.t}</div>
          ) : null;
        })}
        {calm > 0.6 && (
          <div className="tm-lettering" style={{ position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)", background: "#ffffff", border: "2px solid " + INK, padding: "1px 8px", fontSize: 13, color: INK, whiteSpace: "nowrap" }}>… silence.</div>
        )}
      </div>
    );
  }
  if (stat === "stamina") {
    // Baskets qui zigzaguent entre trois plots, nuage de poussière.
    const cones = [40, 90, 140];
    const x = 14 + k * 156;
    const y = 120 + Math.sin(k * Math.PI * 3) * 26;
    return (
      <svg viewBox={"0 0 " + W + " " + H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
        <path d={"M 0 150 L " + W + " 150"} stroke={INK} strokeWidth="2.5" />
        {cones.map((c, i) => (
          <path key={i} d={"M " + (c - 9) + " 150 L " + c + " 118 L " + (c + 9) + " 150 Z"} fill="#ff7a1a" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        ))}
        <g transform={"translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")"}>
          <ellipse cx="-14" cy="6" rx="9" ry="5" fill="#ffffff" stroke={INK} strokeWidth="2" opacity="0.8" />
          <path d="M -10 -6 L 10 -6 L 14 2 L -10 2 Z" fill="#ffffff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M -10 2 L 14 2" stroke="#5b2d8e" strokeWidth="3" />
        </g>
        {k > 0.15 && <SpeedLines x={x - 14} y={y - 2} n={3} len={16} />}
        {k > 0.25 && <Sfx x={W / 2} y={84} text={sfx} size={24} rot={-6} />}
      </svg>
    );
  }
  // Coups : la balle arrive, la raquette frappe, onomatopée et traits de vitesse.
  const isServe = stat === "serve";
  const hit = isServe ? 0.5 : 0.45;
  const swingAngle = stat === "backhand" ? 40 - Math.min(1, k / hit) * 110 : -40 + Math.min(1, k / hit) * 110;
  let ball;
  if (isServe) {
    ball = k < hit
      ? { x: 70, y: 150 - Math.sin((k / hit) * Math.PI * 0.6) * 120 }
      : { x: 70 + (k - hit) * 260, y: 46 + (k - hit) * 120 };
  } else {
    ball = k < hit
      ? { x: 175 - (k / hit) * 95, y: 80 + Math.sin((k / hit) * Math.PI) * -30 }
      : { x: 80 + (k - hit) * 240, y: 90 - (k - hit) * 70 };
  }
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
      {stat === "net" && <path d="M 0 140 L 180 140 M 0 140 L 0 112 M 180 140 L 180 112 M 0 112 L 180 112" stroke={INK} strokeWidth="2.5" fill="none" />}
      {stat === "net" && <path d="M 0 118 L 180 118 M 0 126 L 180 126 M 0 134 L 180 134" stroke={INK} strokeWidth="1" opacity="0.5" />}
      <Racket x={isServe ? 60 : 70} y={isServe ? 120 : 112} angle={isServe ? -20 + Math.min(1, k / hit) * 70 : swingAngle} />
      {k >= hit - 0.02 && k < 0.95 && <SpeedLines x={ball.x} y={ball.y} n={4} len={22} angle={isServe ? 25 : -16} />}
      <BallSvg x={ball.x} y={ball.y} r={7} />
      {k >= hit && <Sfx x={isServe ? 124 : 116} y={isServe ? 96 : 84} text={sfx} size={30} rot={-12} />}
    </svg>
  );
}

// Case 3 : le résultat chiffré.
function ResultScene({ stat, k, seed }) {
  const W = 360, H = 164;
  if (stat === "mental") {
    // Moniteur cardiaque : la courbe s'apaise, le pouls descend.
    const from = 148 + Math.round(seed * 14), to = 96 + Math.round(seed * 16);
    const bpm = Math.round(from - (from - to) * k);
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const x = 20 + i * 1.9;
      const amp = 34 * (1 - (i / 120) * k * 0.9);
      const beat = i % 12 === 6 ? -amp : i % 12 === 7 ? amp * 0.6 : 0;
      pts.push(x.toFixed(1) + "," + (96 + beat).toFixed(1));
    }
    const visible = Math.max(2, Math.round(121 * Math.min(1, k * 1.2)));
    return (
      <svg viewBox={"0 0 " + W + " " + H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
        <rect x="14" y="40" width="236" height="108" fill="#161616" />
        <polyline points={pts.slice(0, visible).join(" ")} fill="none" stroke="#3cc173" strokeWidth="3" strokeLinejoin="round" />
        <text x="262" y="86" fontFamily="'Archivo Black', sans-serif" fontSize="34" fill={INK}>{bpm}</text>
        <text x="262" y="104" fontFamily="'Archivo', sans-serif" fontWeight="800" fontSize="11" fill={INK}>PULS./MIN</text>
        {k > 0.7 && <text x="262" y="124" fontFamily="'Archivo', sans-serif" fontWeight="800" fontSize="11" fill="#16804a">CALME</text>}
      </svg>
    );
  }
  if (stat === "stamina") {
    const secs = Math.round(38 + seed * 10 - k * 4);
    const sweep = k * 330;
    const rad = (a) => (a - 90) * Math.PI / 180;
    return (
      <svg viewBox={"0 0 " + W + " " + H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
        <g transform="translate(110,96)">
          <rect x="-8" y="-62" width="16" height="10" fill={INK} />
          <circle r="50" fill="#ffffff" stroke={INK} strokeWidth="4" />
          <line x1="0" y1="0" x2={(Math.cos(rad(sweep)) * 40).toFixed(1)} y2={(Math.sin(rad(sweep)) * 40).toFixed(1)} stroke="#5b2d8e" strokeWidth="4" strokeLinecap="round" />
          <circle r="4" fill={INK} />
        </g>
        <text x="190" y="100" fontFamily="'Archivo Black', sans-serif" fontSize="40" fill={INK}>{"0:" + String(Math.max(30, secs)).padStart(2, "0")}</text>
        {k > 0.6 && <path d="M 300 52 q 6 10 0 16 q -6 -6 0 -16 Z M 318 70 q 5 8 0 13 q -5 -5 0 -13 Z" fill="#1f7a45" stroke={INK} strokeWidth="2" />}
      </svg>
    );
  }
  if (stat === "serve") {
    const kmh = Math.round(178 + seed * 32);
    const land = Math.min(1, k * 1.4);
    return (
      <svg viewBox={"0 0 " + W + " " + H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
        <rect x="20" y="40" width="200" height="110" fill="#1f7a45" stroke={INK} strokeWidth="3" />
        <path d="M 120 40 L 120 150 M 20 95 L 220 95" stroke="#ffffff" strokeWidth="3" />
        <BallSvg x={30 + land * 76} y={140 - land * 92} r={8} />
        {k > 0.7 && <Sfx x={292} y={100} text="ACE !" size={34} rot={-8} color="#5b2d8e" />}
        <text x="240" y="142" fontFamily="'Archivo Black', sans-serif" fontSize="24" fill={INK}>{kmh} km/h</text>
      </svg>
    );
  }
  // Coups et volées : une cible, les impacts s'accumulent.
  const hits = 6 + Math.round(seed * 3);
  const shownHits = Math.round(10 * Math.min(1, k * 1.3));
  const marks = [];
  for (let i = 0; i < shownHits; i++) {
    const inT = i < Math.round(hits * shownHits / 10);
    const a = (i * 137.5) * Math.PI / 180;
    const d = inT ? 6 + (i * 7) % 26 : 46 + (i * 5) % 10;
    marks.push({ x: 110 + Math.cos(a) * d, y: 96 + Math.sin(a) * d * 0.8, inT });
  }
  const scored = marks.filter(m => m.inT).length;
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
      <g transform="translate(110,96)">
        <ellipse rx="60" ry="48" fill="#ffffff" stroke={INK} strokeWidth="3" />
        <ellipse rx="40" ry="32" fill="#d6ef3c" stroke={INK} strokeWidth="3" />
        <ellipse rx="20" ry="16" fill="#5b2d8e" stroke={INK} strokeWidth="3" />
      </g>
      {marks.map((m, i) => (
        <g key={i} transform={"translate(" + m.x.toFixed(1) + "," + m.y.toFixed(1) + ")"}>
          <path d="M -5 -5 L 5 5 M -5 5 L 5 -5" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <text x="196" y="90" fontFamily="'Archivo Black', sans-serif" fontSize="38" fill={INK}>{scored}/10</text>
      <text x="198" y="110" fontFamily="'Archivo', sans-serif" fontWeight="800" fontSize="12" fill={INK}>DANS LA CIBLE</text>
    </svg>
  );
}
