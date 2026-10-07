// Émojis BD : chaque émoji du jeu redessiné à l'encre, en aplats de la
// palette (contour #141414, petite ombre décalée, reflet blanc), pour ne
// jamais afficher les émojis du système.
//
// - <BdEmoji char="😄" /> ou <BdEmoji name="grin" /> dessine un émoji.
// - withBdEmoji(texte, taille) remplace dans un texte les émojis par leur
//   version BD (et les drapeaux par les drapeaux dessinés). Un émoji sans
//   dessin est retiré proprement, jamais affiché en natif.
import { useId } from "react";
import { FlagFromEmoji } from "./icons.jsx";

const INK = "#141414";
const W = "#ffffff";
const FACE = "#ffd23f";   // jaune des visages et des mains
const BALL = "#d6ef3c";   // jaune balle
const GREEN = "#1f7a45";
const VIOLET = "#5b2d8e";
const LILAC = "#c9b6ea";
const RED = "#c4302b";
const AMBER = "#e0a21b";
const BLUE = "#2c6fd1";
const CLAY = "#c4622d";
const CHOCO = "#6b3a1f";
const SKY = "#8fbcf2";

// ─── Briques de dessin (grille 24×24) ─────────────────────────────────────────
const gloss = (d = "M6.2 8.4 Q7.3 5.8 9.9 4.7") => <path d={d} fill="none" stroke={W} strokeWidth="1.5" />;
const face = (fill = FACE) => <><circle cx="12" cy="12" r="10" fill={fill} />{gloss()}</>;
const dot = (cx, cy, r = 1.35, fill = INK) => <circle cx={cx} cy={cy} r={r} fill={fill} stroke="none" />;
const dotEyes = (y = 10) => <>{dot(8.6, y)}{dot(15.4, y)}</>;
const happyEyes = <path d="M6.8 10.8 Q8.6 8 10.4 10.8 M13.6 10.8 Q15.4 8 17.2 10.8" fill="none" strokeWidth="1.6" />;
const smile = <path d="M7.4 14 Q12 18.6 16.6 14" fill="none" strokeWidth="1.7" />;
const grin = (
  <>
    <path d="M6.8 13.4 H17.2 Q16.8 19.4 12 19.4 Q7.2 19.4 6.8 13.4 Z" fill={RED} strokeWidth="1.5" />
    <path d="M7.1 13.4 H16.9 Q16.8 14.9 16.5 15 H7.5 Q7.2 14.9 7.1 13.4 Z" fill={W} strokeWidth="1.1" />
  </>
);
const blush = <><ellipse cx="6.3" cy="13.6" rx="1.7" ry="1" fill={RED} opacity="0.35" stroke="none" /><ellipse cx="17.7" cy="13.6" rx="1.7" ry="1" fill={RED} opacity="0.35" stroke="none" /></>;
const drop = (x, y, s = 1.8, fill = SKY) =>
  <path d={`M${x} ${y} Q${x + s} ${y + 1.5 * s} ${x + s} ${y + 2.1 * s} A${s} ${s} 0 0 1 ${x - s} ${y + 2.1 * s} Q${x - s} ${y + 1.5 * s} ${x} ${y} Z`} fill={fill} strokeWidth="1.3" />;
const star = (cx, cy, r, fill, sw = 1.2) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push((cx + rr * Math.cos(a)).toFixed(2) + " " + (cy + rr * Math.sin(a)).toFixed(2));
  }
  return <path d={"M" + pts.join(" L") + " Z"} fill={fill} strokeWidth={sw} />;
};
// Étincelle à quatre branches.
const sparkle = (cx, cy, r, fill = FACE, sw = 1.3) => {
  const k = r * 0.18;
  return <path d={`M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`} fill={fill} strokeWidth={sw} />;
};
// Membre « cerné » : trait d'encre large recouvert d'un trait coloré.
const limb = (d, fill = FACE, w = 3.2) => <><path d={d} fill="none" strokeWidth={w + 2.4} /><path d={d} fill="none" stroke={fill} strokeWidth={w} /></>;
const heart = (fill) => (
  <>
    <path d="M12 21 C12 21 2.5 15.2 2.5 8.6 A4.9 4.9 0 0 1 12 6.6 A4.9 4.9 0 0 1 21.5 8.6 C21.5 15.2 12 21 12 21 Z" fill={fill} strokeWidth="2" />
    <path d="M5.4 9 Q5.6 6.6 7.8 6" fill="none" stroke={W} strokeWidth="1.5" />
  </>
);
// Main ouverte, paume face à nous, doigts vers le haut.
const HAND_D = "M7 13 V6.5 a1.4 1.4 0 0 1 2.8 0 V11 V4.5 a1.4 1.4 0 0 1 2.8 0 V11 V5 a1.4 1.4 0 0 1 2.8 0 V11.5 V7.5 a1.4 1.4 0 0 1 2.8 0 V15 Q18.2 22 12 22 Q8.5 22 6.5 18.5 L3.6 13.6 a1.5 1.5 0 0 1 2.5 -1.6 L7 13 Z";
const hand = (sw = 1.7) => <path d={HAND_D} fill={FACE} strokeWidth={sw} />;
const arcPt = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
const f2 = (p) => p[0].toFixed(2) + " " + p[1].toFixed(2);

// Flèches du recyclage, calculées une fois.
const RECYCLE = [-90, 30, 150].map((a0) => {
  const r = 7.2, c = [12, 12.6], a1 = a0 + 82;
  const p0 = arcPt(c[0], c[1], r, a0 + 8), p1 = arcPt(c[0], c[1], r, a1);
  const tip = arcPt(c[0], c[1], r, a1 + 22), l = arcPt(c[0], c[1], r - 3.4, a1), rr = arcPt(c[0], c[1], r + 3.4, a1);
  return { arc: "M" + f2(p0) + " A" + r + " " + r + " 0 0 1 " + f2(p1), head: "M" + f2(l) + " L" + f2(tip) + " L" + f2(rr) + " Z" };
});

// ─── Le catalogue ─────────────────────────────────────────────────────────────
// Chaque dessin : grille 24×24, trait d'encre par défaut (largeur 1,9).
const DRAW = {
  // Visages
  grin: () => <>{face()}{happyEyes}{grin}</>,
  sweat: () => <>{face()}{happyEyes}{grin}{drop(19.6, 1.4, 1.9)}</>,
  joy: () => (
    <>
      {face()}
      <path d="M6.6 8.6 L10 10.2 L6.8 11.6 M17.4 8.6 L14 10.2 L17.2 11.6" fill="none" strokeWidth="1.6" />
      {grin}
      {drop(2.6, 10.2, 1.7)}{drop(21.4, 10.2, 1.7)}
    </>
  ),
  blush: () => <>{face()}{happyEyes}{blush}{smile}</>,
  cool: () => (
    <>
      {face()}
      <path d="M3.8 8.6 H20.2 V10.2 Q19.6 14.2 16 14.2 Q13.2 14.2 12.7 10.8 H11.3 Q10.8 14.2 8 14.2 Q4.4 14.2 3.8 10.2 Z" fill={INK} strokeWidth="1.2" />
      <path d="M6 10 L7.6 11.6 M14.4 10 L16 11.6" stroke={W} strokeWidth="1.2" />
      <path d="M8.4 16.2 Q12.6 18.8 16.2 15.4" fill="none" strokeWidth="1.7" />
    </>
  ),
  wink: () => <>{face()}{dot(8.6, 10)}<path d="M13.6 10.4 Q15.4 8.6 17.2 10.4" fill="none" strokeWidth="1.6" />{smile}</>,
  smirk: () => (
    <>
      {face()}
      <path d="M6.6 9.6 H10.6 M13.4 9.6 H17.4" fill="none" strokeWidth="1.6" />
      {dot(9.6, 11)}{dot(16.4, 11)}
      <path d="M8.8 16 Q13.4 17.4 16.6 13.6" fill="none" strokeWidth="1.7" />
    </>
  ),
  sleep: () => (
    <>
      {face()}
      <path d="M6.8 10.6 Q8.6 12.4 10.4 10.6 M13.6 10.6 Q15.4 12.4 17.2 10.6" fill="none" strokeWidth="1.6" />
      <ellipse cx="12" cy="16" rx="1.6" ry="1.9" fill={INK} stroke="none" />
      <path d="M16.6 1.2 H20.6 L16.6 5.2 H20.6" fill="none" stroke={BLUE} strokeWidth="1.6" />
    </>
  ),
  grimace: () => (
    <>
      {face()}{dotEyes(9.6)}
      <rect x="6.4" y="13.2" width="11.2" height="4.6" rx="1.6" fill={W} strokeWidth="1.5" />
      <path d="M6.4 15.5 H17.6 M9.2 13.2 V17.8 M12 13.2 V17.8 M14.8 13.2 V17.8" fill="none" strokeWidth="1.1" />
    </>
  ),
  devil: () => (
    <>
      <path d="M4.6 7.4 L3 1.4 L9 4.4 Z M19.4 7.4 L21 1.4 L15 4.4 Z" fill={VIOLET} strokeWidth="1.5" />
      {face(LILAC)}
      <path d="M6.4 8 L10.4 10 M17.6 8 L13.6 10" fill="none" strokeWidth="1.7" />
      {dot(9, 11.6)}{dot(15, 11.6)}
      <path d="M7.4 14.4 Q12 19.2 16.6 14.4" fill="none" strokeWidth="1.7" />
    </>
  ),
  huff: () => (
    <>
      {face()}
      <path d="M6.4 8 L10.4 9.6 M17.6 8 L13.6 9.6" fill="none" strokeWidth="1.7" />
      {dot(8.8, 11.4)}{dot(15.2, 11.4)}
      <path d="M9 16.8 Q12 15 15 16.8" fill="none" strokeWidth="1.7" />
      <path d="M1.4 19.6 a1.6 1.6 0 0 1 2.4 -1.8 a1.6 1.6 0 0 1 2.8 0.6 a1.4 1.4 0 0 1 -0.6 2.6 H2.6 a1.3 1.3 0 0 1 -1.2 -1.4 Z" fill={W} strokeWidth="1.2" />
      <path d="M22.6 19.6 a1.6 1.6 0 0 0 -2.4 -1.8 a1.6 1.6 0 0 0 -2.8 0.6 a1.4 1.4 0 0 0 0.6 2.6 H21.4 a1.3 1.3 0 0 0 1.2 -1.4 Z" fill={W} strokeWidth="1.2" />
    </>
  ),
  eyeroll: () => (
    <>
      {face()}
      <circle cx="8.6" cy="10" r="2.6" fill={W} strokeWidth="1.3" /><circle cx="15.4" cy="10" r="2.6" fill={W} strokeWidth="1.3" />
      {dot(8.6, 8.4, 1.2)}{dot(15.4, 8.4, 1.2)}
      <path d="M9 16.2 H15" fill="none" strokeWidth="1.7" />
    </>
  ),
  unamused: () => (
    <>
      {face()}
      <path d="M6.4 9.6 H10.8 M13.2 9.6 H17.6" fill="none" strokeWidth="1.6" />
      {dot(10, 11)}{dot(16.8, 11)}
      <path d="M8.6 16.6 Q12 14.6 15.4 16.6" fill="none" strokeWidth="1.7" />
    </>
  ),
  scream: () => (
    <>
      <circle cx="12" cy="12" r="10" fill={FACE} />
      <path d="M2.84 8 A10 10 0 0 1 21.16 8 Z" fill={SKY} stroke="none" />
      <circle cx="12" cy="12" r="10" fill="none" />
      <ellipse cx="8.6" cy="9.8" rx="1.9" ry="2.5" fill={W} strokeWidth="1.3" /><ellipse cx="15.4" cy="9.8" rx="1.9" ry="2.5" fill={W} strokeWidth="1.3" />
      {dot(8.6, 10, 0.8)}{dot(15.4, 10, 0.8)}
      <ellipse cx="12" cy="16.2" rx="2" ry="3" fill={INK} stroke="none" />
      <ellipse cx="3.6" cy="15.6" rx="2.2" ry="3.4" fill={FACE} strokeWidth="1.5" />
      <ellipse cx="20.4" cy="15.6" rx="2.2" ry="3.4" fill={FACE} strokeWidth="1.5" />
    </>
  ),
  mindblown: () => (
    <>
      {face()}
      <path d="M12 -1.4 L13.8 2.4 L17.8 0.4 L16.6 4.4 L20.8 4.8 L17.6 7.6 H6.4 L3.2 4.8 L7.4 4.4 L6.2 0.4 L10.2 2.4 Z" fill={AMBER} strokeWidth="1.4" />
      <path d="M12 2.6 L13 4.8 L15.4 4 L14.6 6 L16 7.4 H8 L9.4 6 L8.6 4 L11 4.8 Z" fill={RED} stroke="none" />
      <path d="M4.6 7.6 H19.4" fill="none" strokeWidth="1.6" />
      <circle cx="8.6" cy="11.4" r="2" fill={W} strokeWidth="1.3" /><circle cx="15.4" cy="11.4" r="2" fill={W} strokeWidth="1.3" />
      {dot(8.6, 11.4, 0.9)}{dot(15.4, 11.4, 0.9)}
      <ellipse cx="12" cy="16.6" rx="1.8" ry="2" fill={INK} stroke="none" />
    </>
  ),
  tearyeyes: () => (
    <>
      {face()}
      <circle cx="8.4" cy="10.4" r="2.8" fill={W} strokeWidth="1.3" /><circle cx="15.6" cy="10.4" r="2.8" fill={W} strokeWidth="1.3" />
      {dot(8.6, 10.8, 1.8)}{dot(15.4, 10.8, 1.8)}
      {dot(9.3, 10, 0.6, W)}{dot(16.1, 10, 0.6, W)}
      <path d="M5.8 13.6 Q8.4 14.8 11 13.6 M13 13.6 Q15.6 14.8 18.2 13.6" fill="none" stroke={BLUE} strokeWidth="1.4" />
      <path d="M9.6 17.2 Q12 15.8 14.4 17.2" fill="none" strokeWidth="1.6" />
    </>
  ),
  starstruck: () => <>{face()}{star(8.4, 10, 3, RED, 1)}{star(15.6, 10, 3, RED, 1)}{grin}</>,
  shush: () => (
    <>
      {face()}
      {dot(8.6, 9.4)}{dot(15.4, 9.4)}
      <path d="M8.6 15.6 Q12 14.4 15.4 15.6" fill="none" strokeWidth="1.6" />
      <path d="M10.6 22.4 V13.6 A1.4 1.4 0 0 1 13.4 13.6 V22.4" fill={FACE} strokeWidth="1.6" />
    </>
  ),
  seenoevil: () => (
    <>
      <circle cx="3.4" cy="11.4" r="2.6" fill={CLAY} /><circle cx="20.6" cy="11.4" r="2.6" fill={CLAY} />
      <circle cx="12" cy="12" r="9.6" fill={CLAY} />
      <ellipse cx="12" cy="15.6" rx="6.2" ry="4.6" fill="#f2c39b" strokeWidth="1.5" />
      {dot(10.8, 14.4, 0.6)}{dot(13.2, 14.4, 0.6)}
      <path d="M9.6 16.8 Q12 18.6 14.4 16.8" fill="none" strokeWidth="1.5" />
      <ellipse cx="7.8" cy="9.6" rx="3.8" ry="2.9" fill={CLAY} strokeWidth="1.5" transform="rotate(-12 7.8 9.6)" />
      <ellipse cx="16.2" cy="9.6" rx="3.8" ry="2.9" fill={CLAY} strokeWidth="1.5" transform="rotate(12 16.2 9.6)" />
      <path d="M6 8.4 L8.8 9.4 M5.8 10.2 L8.6 11 M18 8.4 L15.2 9.4 M18.2 10.2 L15.4 11" fill="none" strokeWidth="1" />
      {gloss("M5.4 6 Q6.6 4 8.8 3.2")}
    </>
  ),
  raisehand: () => (
    <>
      <path d="M3 23.4 Q3 16.2 11 16.2 Q17 16.2 18.6 20 L19 23.4 Z" fill={VIOLET} />
      {limb("M17.2 17 L20 7", FACE, 3)}
      <circle cx="20.4" cy="5.4" r="2.2" fill={FACE} strokeWidth="1.5" />
      <circle cx="10.6" cy="9.4" r="5.6" fill={FACE} />
      <path d="M5.4 7.6 Q7 3.4 11 3.6 Q15.6 3.8 16 8 Q12.6 7.8 10.4 5.8 Q8.6 7.6 5.4 7.6 Z" fill={CHOCO} strokeWidth="1.4" />
      {dot(8.6, 9.8, 0.9)}{dot(12.6, 9.8, 0.9)}
      <path d="M8.6 12 Q10.6 13.8 12.6 12" fill="none" strokeWidth="1.3" />
    </>
  ),
  shrug: () => (
    <>
      <path d="M5 23.4 Q5 16.4 12 16.4 Q19 16.4 19 23.4 Z" fill={BLUE} />
      {limb("M6.2 18.6 L3.4 15.6 L2.6 12.4", FACE, 2.6)}
      {limb("M17.8 18.6 L20.6 15.6 L21.4 12.4", FACE, 2.6)}
      <circle cx="12" cy="9.2" r="5.6" fill={FACE} />
      <path d="M8.4 6.6 L10.4 6 M15.6 6.6 L13.6 6" fill="none" strokeWidth="1.2" />
      {dot(9.8, 8.8, 0.9)}{dot(14.2, 8.8, 0.9)}
      <path d="M9.8 12.2 H14.2" fill="none" strokeWidth="1.3" />
    </>
  ),
  baby: () => (
    <>
      {face()}
      <path d="M10.4 2.6 Q12.6 0.2 14.4 2.2 Q13.6 3.6 12.4 2.8" fill="none" strokeWidth="1.5" />
      {dotEyes(10.4)}{blush}
      <circle cx="12" cy="16" r="2.2" fill={LILAC} strokeWidth="1.3" />
      <circle cx="12" cy="16" r="0.8" fill={W} stroke="none" />
    </>
  ),

  // Mains
  hand: () => hand(),
  wave: () => (
    <>
      <g transform="rotate(-18 12 14)">{hand()}</g>
      <path d="M3.4 3 Q1.6 5.4 2.2 8.2 M21 17.2 Q22.8 15.6 22.8 12.8" fill="none" strokeWidth="1.5" />
    </>
  ),
  raisinghands: () => (
    <>
      <g transform="translate(-1 6.6) scale(0.66)">{hand(2.6)}</g>
      <g transform="translate(25 6.6) scale(-0.66 0.66)">{hand(2.6)}</g>
      <path d="M3.6 4.2 L2.8 2.2 M7 3.6 L7.2 1.4 M17 3.6 L16.8 1.4 M20.4 4.2 L21.2 2.2 M12 4 V1.6" fill="none" stroke={RED} strokeWidth="1.5" />
    </>
  ),
  pray: () => (
    <>
      <path d="M12 2.6 Q9.8 2.6 9.2 5.4 L7.4 13.6 L3.4 17 L6.6 21 L12 18.6 Z" fill={FACE} strokeWidth="1.7" />
      <path d="M12 2.6 Q14.2 2.6 14.8 5.4 L16.6 13.6 L20.6 17 L17.4 21 L12 18.6 Z" fill={FACE} strokeWidth="1.7" />
      <path d="M12 3 V18.4" fill="none" strokeWidth="1.3" />
      <path d="M4.4 3.4 L5.6 5.2 M2.4 7 L4.4 7.8 M19.6 3.4 L18.4 5.2 M21.6 7 L19.6 7.8" fill="none" stroke={AMBER} strokeWidth="1.5" />
    </>
  ),
  pointdown: () => (
    <>
      <path d="M10.4 11 V20.6 a1.6 1.6 0 0 0 3.2 0 V11" fill={FACE} strokeWidth="1.7" />
      <rect x="5.6" y="2.6" width="12.8" height="10" rx="3.2" fill={FACE} strokeWidth="1.7" />
      <path d="M8.6 12.4 V9.6 M15.6 12.4 V9.6 M5.8 6.4 Q8 7.6 9.4 5.8" fill="none" strokeWidth="1.2" />
    </>
  ),
  clap: () => (
    <>
      <g transform="translate(-2.4 2) rotate(-22 12 14) scale(0.86)">{hand(2)}</g>
      <g transform="translate(26.4 2) scale(-1 1) rotate(-22 12 14) scale(0.86)">{hand(2)}</g>
      <path d="M12 1.2 V3.6 M8.2 2.2 L9.2 4.2 M15.8 2.2 L14.8 4.2" fill="none" stroke={RED} strokeWidth="1.5" />
    </>
  ),
  muscle: () => (
    <>
      <path d="M2.6 21 Q2.6 12.6 8 9.4 L9.8 4.8 Q10.8 2.6 13 3.4 L14.8 4.4 Q15.6 6.2 13.8 7 L12.8 9.6 Q16.2 8.2 18.8 10.2 Q22 12.8 20.8 16.8 Q19.6 21 14 21 Z" fill={FACE} strokeWidth="1.8" />
      <path d="M13.6 12.4 Q17 11.8 17.6 15.4" fill="none" strokeWidth="1.3" />
      {gloss("M4.8 17 Q5 13.4 7.6 11.4")}
    </>
  ),
  writing: () => (
    <>
      <path d="M2.6 21.4 L3.8 17 L15 5.8 L18.2 9 L7 20.2 Z" fill={AMBER} strokeWidth="1.6" />
      <path d="M2.6 21.4 L3.8 17 L7 20.2 Z" fill={W} strokeWidth="1.3" />
      <path d="M2.6 21.4 L3.1 19.6 L4.4 20.9 Z" fill={INK} stroke="none" />
      <path d="M12.6 10.4 Q13 5.2 17.4 4.6 Q22.4 4.6 22 10 Q21.6 15 17 15.4 Q13.6 15.4 12.6 12.4 Z" fill={FACE} strokeWidth="1.7" />
      <path d="M15.6 8.6 Q17.6 8 19.4 9.4 M15 11.8 Q17 11.4 18.6 12.6" fill="none" strokeWidth="1.2" />
    </>
  ),
  crossedfingers: () => (
    <>
      {limb("M14.6 13.6 L9.6 3.8", FACE, 3)}
      {limb("M9.4 13.6 L13.6 3.4", FACE, 3)}
      <rect x="6.4" y="11.6" width="11.2" height="10" rx="3.4" fill={FACE} strokeWidth="1.7" />
      <path d="M6.6 15.4 Q10 16.6 12.4 14.6" fill="none" strokeWidth="1.2" />
    </>
  ),
  hearthands: () => (
    <>
      {heart(RED)}
      <path d="M12 21.6 C12 21.6 1.6 15.4 1.6 8.4 A5.6 5.6 0 0 1 12 6" fill="none" strokeWidth="5.4" />
      <path d="M12 21.6 C12 21.6 1.6 15.4 1.6 8.4 A5.6 5.6 0 0 1 12 6" fill="none" stroke={FACE} strokeWidth="3" />
      <path d="M12 21.6 C12 21.6 22.4 15.4 22.4 8.4 A5.6 5.6 0 0 0 12 6" fill="none" strokeWidth="5.4" />
      <path d="M12 21.6 C12 21.6 22.4 15.4 22.4 8.4 A5.6 5.6 0 0 0 12 6" fill="none" stroke={FACE} strokeWidth="3" />
    </>
  ),

  // Cœurs
  heartred: () => heart(RED),
  heartgreen: () => heart(GREEN),
  heartorange: () => heart(CLAY),

  // Tennis et sport
  ball: () => (
    <>
      <circle cx="12" cy="12" r="9.8" fill={BALL} strokeWidth="2" />
      <path d="M4.6 5.6 Q9.4 12 4.6 18.4 M19.4 5.6 Q14.6 12 19.4 18.4" fill="none" stroke={W} strokeWidth="1.9" />
      {gloss("M7.6 5.2 Q9.4 4 11.4 3.8")}
    </>
  ),
  trophy: () => (
    <>
      <path d="M6.4 5 H3.4 Q2.8 10.6 7.4 11.6 M17.6 5 H20.6 Q21.2 10.6 16.6 11.6" fill="none" strokeWidth="1.7" />
      <path d="M6 2.6 H18 V8.6 Q18 14 12 14.6 Q6 14 6 8.6 Z" fill={AMBER} strokeWidth="1.8" />
      <rect x="10.4" y="14.4" width="3.2" height="3" fill={AMBER} strokeWidth="1.5" />
      <rect x="7" y="17.4" width="10" height="4.2" fill={VIOLET} strokeWidth="1.7" />
      <path d="M8.4 4.6 V8.6 Q8.6 10.6 9.8 11.6" fill="none" stroke={W} strokeWidth="1.4" />
    </>
  ),
  target: () => (
    <>
      <circle cx="11" cy="13" r="9.4" fill={RED} />
      <circle cx="11" cy="13" r="6.4" fill={W} strokeWidth="1.4" />
      <circle cx="11" cy="13" r="3.4" fill={RED} strokeWidth="1.4" />
      <path d="M11 13 L20.4 3.6" fill="none" strokeWidth="1.8" />
      <path d="M19.2 2.2 L22.6 1.4 L21.8 4.8 L20.4 3.6 Z" fill={BLUE} strokeWidth="1.2" />
    </>
  ),

  // Nourriture
  plate: () => (
    <>
      <circle cx="12" cy="12.4" r="7" fill={W} />
      <circle cx="12" cy="12.4" r="4.4" fill={LILAC} strokeWidth="1.3" />
      <path d="M2.4 2.6 V8 Q2.4 9.6 3.6 9.6 Q4.8 9.6 4.8 8 V2.6 M3.6 2.6 V21.4" fill="none" strokeWidth="1.5" />
      <path d="M21.4 2.6 Q18.4 6.6 19.4 12 H21.4 Z M21.4 12 V21.4" fill={W} strokeWidth="1.5" />
    </>
  ),
  spaghetti: () => (
    <>
      <ellipse cx="12" cy="17.4" rx="10.4" ry="4.4" fill={W} />
      <path d="M4.4 16.6 Q4.4 7.8 12 7.8 Q19.6 7.8 19.6 16.6 Z" fill={FACE} strokeWidth="1.7" />
      <path d="M6.4 14.4 Q8.4 11.4 10.4 14.4 Q12.4 11.4 14.4 14.4 Q16.4 11.4 17.8 14" fill="none" strokeWidth="1.1" />
      <path d="M8.6 9.4 Q12 8 15.4 9.4 Q14.6 11.8 12 11.8 Q9.4 11.8 8.6 9.4 Z" fill={RED} strokeWidth="1.3" />
      <path d="M17.6 1.4 V9.4 M16.4 1.4 V4.2 M18.8 1.4 V4.2" fill="none" strokeWidth="1.3" />
    </>
  ),
  burger: () => (
    <>
      <path d="M2.8 10.8 Q2.8 3.2 12 3.2 Q21.2 3.2 21.2 10.8 Z" fill={AMBER} />
      <path d="M7.6 6.4 l1 -0.4 M12 5.4 l1 0.2 M15.8 7 l0.8 0.6 M10 8.4 l1 -0.2" fill="none" stroke={W} strokeWidth="1.3" />
      <path d="M2.2 12 Q3.6 10.2 5.2 12 T8.2 12 T11.2 12 T14.2 12 T17.2 12 T20.2 12 T21.8 11.4 V13.6 H2.2 Z" fill={GREEN} strokeWidth="1.4" />
      <rect x="2.4" y="13.2" width="19.2" height="3.4" rx="1.7" fill={CHOCO} strokeWidth="1.6" />
      <rect x="3" y="16.6" width="18" height="4.6" rx="2" fill={AMBER} />
    </>
  ),
  chocolate: () => (
    <g transform="rotate(-14 12 12)">
      <rect x="5.4" y="1.6" width="13.2" height="20.8" rx="1" fill={CHOCO} />
      <path d="M12 2 V12 M5.6 6.6 H18.4" fill="none" stroke="#8a5530" strokeWidth="1.2" />
      <path d="M5.4 11.4 L18.6 9.4 V22.4 H5.4 Z" fill={RED} strokeWidth="1.7" />
      <path d="M5.4 15 L18.6 13 V15.4 L5.4 17.4 Z" fill={W} strokeWidth="1.1" />
    </g>
  ),
  cooking: () => (
    <>
      <path d="M15.4 17.8 L22 22.4" fill="none" strokeWidth="3.6" />
      <circle cx="10" cy="11.6" r="8.4" fill="#3a3a3a" />
      <path d="M5.4 10.6 Q5 6.4 9 6.2 Q11.6 4.8 13.8 7 Q16.4 8.4 15 11.4 Q15.6 15.6 11.4 15.8 Q8.6 17.4 6.6 15 Q4.2 13.8 5.4 10.6 Z" fill={W} strokeWidth="1.3" />
      <circle cx="10.2" cy="11" r="2.6" fill={AMBER} strokeWidth="1.3" />
      {dot(9.4, 10.2, 0.6, W)}
    </>
  ),
  croissant: () => (
    <>
      <ellipse cx="3.6" cy="16.6" rx="2.6" ry="1.8" fill={AMBER} transform="rotate(30 3.6 16.6)" strokeWidth="1.5" />
      <ellipse cx="20.4" cy="16.6" rx="2.6" ry="1.8" fill={AMBER} transform="rotate(-30 20.4 16.6)" strokeWidth="1.5" />
      <ellipse cx="7" cy="13.4" rx="3.6" ry="4" fill={AMBER} transform="rotate(30 7 13.4)" strokeWidth="1.6" />
      <ellipse cx="17" cy="13.4" rx="3.6" ry="4" fill={AMBER} transform="rotate(-30 17 13.4)" strokeWidth="1.6" />
      <ellipse cx="12" cy="11" rx="4.4" ry="5.6" fill={AMBER} strokeWidth="1.7" />
      <path d="M10 7.6 Q11 6.6 12.4 6.6" fill="none" stroke={W} strokeWidth="1.3" />
    </>
  ),
  cake: () => (
    <>
      <rect x="7" y="5.4" width="1.8" height="5" fill={RED} strokeWidth="1.2" />
      <rect x="11.1" y="4.4" width="1.8" height="6" fill={BLUE} strokeWidth="1.2" />
      <rect x="15.2" y="5.4" width="1.8" height="5" fill={GREEN} strokeWidth="1.2" />
      {drop(7.9, 1.4, 1, AMBER)}{drop(12, 0.4, 1, AMBER)}{drop(16.1, 1.4, 1, AMBER)}
      <rect x="3.4" y="10.4" width="17.2" height="9.4" fill={LILAC} />
      <path d="M3.4 10.4 H20.6 V13 Q19.2 15.2 17.8 13 Q16.4 15.2 15 13 Q13.6 15.2 12.2 13 Q10.8 15.2 9.4 13 Q8 15.2 6.6 13 Q5 15.2 3.4 13 Z" fill={W} strokeWidth="1.4" />
      <path d="M1.4 20.6 H22.6" fill="none" strokeWidth="2" />
    </>
  ),

  // Objets et lieux
  tshirt: () => (
    <>
      <path d="M8 2.6 L3 5.2 L1.4 10.4 L5 11.6 L5.4 21.4 H18.6 L19 11.6 L22.6 10.4 L21 5.2 L16 2.6 Q12 6.4 8 2.6 Z" fill={BLUE} />
      <path d="M8.6 3 Q12 5.6 15.4 3" fill="none" stroke={W} strokeWidth="1.3" />
      <path d="M7.6 8 V12" fill="none" stroke={W} strokeWidth="1.3" />
    </>
  ),
  rain: () => (
    <>
      <path d="M6 15 A4 4 0 0 1 6.2 7 A5.6 5.6 0 0 1 17 5.8 A4.6 4.6 0 0 1 18.2 15 Z" fill={W} />
      <path d="M8 17.6 L6.8 21 M12.4 17.6 L11.2 21 M16.8 17.6 L15.6 21" fill="none" stroke={BLUE} strokeWidth="2" />
      <path d="M7.6 9.4 Q8.4 8 10 8" fill="none" stroke={SKY} strokeWidth="1.3" />
    </>
  ),
  recycle: () => (
    <>
      {RECYCLE.map((r, i) => <g key={i}>{limb(r.arc, GREEN, 2.6)}<path d={r.head} fill={GREEN} strokeWidth="1.4" /></g>)}
    </>
  ),
  siren: () => (
    <>
      <path d="M12 0.8 V3 M4 3.6 L5.6 5.2 M20 3.6 L18.4 5.2 M1.2 10.6 H3.4 M20.6 10.6 H22.8" fill="none" stroke={RED} strokeWidth="1.8" />
      <path d="M6 16.4 V11.6 A6 6 0 0 1 18 11.6 V16.4 Z" fill={RED} />
      <path d="M8.8 14.4 V11.6 Q8.8 9 10.6 8.2" fill="none" stroke={W} strokeWidth="1.5" />
      <rect x="3.6" y="16.4" width="16.8" height="4.6" rx="1" fill={INK} />
    </>
  ),
  barchart: () => (
    <>
      <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="1.4" fill={W} />
      <rect x="5.2" y="12" width="3.6" height="7" fill={GREEN} strokeWidth="1.3" />
      <rect x="10.2" y="6.4" width="3.6" height="12.6" fill={BLUE} strokeWidth="1.3" />
      <rect x="15.2" y="9.6" width="3.6" height="9.4" fill={RED} strokeWidth="1.3" />
    </>
  ),
  chartup: () => (
    <>
      <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="1.4" fill={W} />
      <path d="M2.4 9 H21.6 M2.4 15 H21.6 M9 2.4 V21.6 M15 2.4 V21.6" fill="none" stroke={LILAC} strokeWidth="1" />
      <path d="M4.8 18 L9.4 12.6 L13 15 L18.4 7.4" fill="none" stroke={GREEN} strokeWidth="2.2" />
      <path d="M15.6 6.6 L19.6 5.4 L19.4 9.6 Z" fill={GREEN} strokeWidth="1.1" />
    </>
  ),
  moneybag: () => (
    <>
      <path d="M9 6.2 Q7.4 3.6 8.8 2.4 Q12 4 15.2 2.4 Q16.6 3.6 15 6.2 Q21 10.2 20.6 16 Q20.2 21.6 12 21.6 Q3.8 21.6 3.4 16 Q3 10.2 9 6.2 Z" fill={AMBER} />
      <path d="M8.6 6.6 H15.4" fill="none" strokeWidth="1.7" />
      <text x="12" y="18.2" textAnchor="middle" fontFamily="'Archivo Black', 'Arial Black', sans-serif" fontSize="9" fill={INK} stroke="none">€</text>
      {gloss("M6.2 13.2 Q6.6 10.6 8.6 9")}
    </>
  ),
  moneywings: () => (
    <>
      <path d="M7 9.4 Q2 5 0.8 9.4 Q2.6 10.4 1.6 12.2 Q4 13.2 7 12.6 Z" fill={W} strokeWidth="1.4" />
      <path d="M17 9.4 Q22 5 23.2 9.4 Q21.4 10.4 22.4 12.2 Q20 13.2 17 12.6 Z" fill={W} strokeWidth="1.4" />
      <rect x="5.4" y="8" width="13.2" height="8.8" rx="0.8" fill={GREEN} transform="rotate(-6 12 12.4)" />
      <circle cx="12" cy="12.4" r="2.4" fill={W} strokeWidth="1.2" />
      <path d="M8 21 L7 22.6 M12 19.6 V22.4 M16 21 L17 22.6" fill="none" strokeWidth="1.2" />
    </>
  ),
  sparkles: () => <>{sparkle(10, 13.4, 8.6)}{sparkle(18.8, 4.8, 3.6, BALL, 1.1)}{sparkle(19.4, 18, 2.6, W, 1)}</>,
  headphones: () => (
    <>
      {limb("M4.4 14 V12 A7.6 7.6 0 0 1 19.6 12 V14", VIOLET, 2)}
      <rect x="2.2" y="12.6" width="5.2" height="8.6" rx="2" fill={VIOLET} />
      <rect x="16.6" y="12.6" width="5.2" height="8.6" rx="2" fill={VIOLET} />
      <path d="M5.8 14.6 V19.2 M18.2 14.6 V19.2" fill="none" stroke={LILAC} strokeWidth="1.3" />
    </>
  ),
  fire: () => (
    <>
      <path d="M12 22.4 Q4.4 22.4 4.4 15 Q4.4 10 9 5.8 Q9 9.4 11 10 Q10 4.8 14.2 1.6 Q14 7 17.6 10 Q19.6 12.6 19.6 15 Q19.6 22.4 12 22.4 Z" fill={RED} />
      <path d="M12 21 Q7.8 21 7.8 17.4 Q7.8 14.8 10.4 12.8 Q10.4 15 12 15.6 Q12 12.8 14.2 11.2 Q14.6 14 15.6 15.4 Q16.2 16.4 16.2 17.4 Q16.2 21 12 21 Z" fill={AMBER} strokeWidth="1.3" />
      <path d="M12 21 Q10.2 21 10.2 19.2 Q10.2 17.8 12 16.6 Q13.8 17.8 13.8 19.2 Q13.8 21 12 21 Z" fill={FACE} stroke="none" />
    </>
  ),
  gamepad: () => (
    <>
      <path d="M7 7 H17 Q22 7 22.6 14 Q23 19.2 19.6 19.2 Q17.6 19.2 16 16 H8 Q6.4 19.2 4.4 19.2 Q1 19.2 1.4 14 Q2 7 7 7 Z" fill={VIOLET} />
      <path d="M6.4 10 V14.4 M4.2 12.2 H8.6" fill="none" stroke={W} strokeWidth="1.8" />
      {dot(16.8, 10.4, 1.2, RED)}{dot(19, 12.4, 1.2, BALL)}{dot(14.6, 12.4, 1.2, BLUE)}{dot(16.8, 14.4, 1.2, GREEN)}
    </>
  ),
  beach: () => (
    <>
      <path d="M0.8 22.6 Q12 16.6 23.2 22.6 Z" fill={AMBER} />
      <path d="M11.4 6.4 L14.2 20" fill="none" strokeWidth="1.7" />
      <path d="M2.4 11.4 Q10.6 0.4 21 7.6 Z" fill={W} />
      <path d="M2.4 11.4 Q5.6 5.8 9 4.6 L9.6 9.6 Z M13.4 4 Q17.6 4.2 21 7.6 L15.4 8.6 Z" fill={RED} strokeWidth="1.2" />
      <path d="M2.4 11.4 Q10.6 0.4 21 7.6 Z" fill="none" />
    </>
  ),
  mountain: () => (
    <>
      <path d="M1.2 21.4 L9 5.6 L13.2 12.8 L15.8 9.2 L22.8 21.4 Z" fill={LILAC} />
      <path d="M9 5.6 L11.4 10.4 L10 9.8 L8.6 11 L7.2 9.6 Z" fill={W} strokeWidth="1.3" />
      <path d="M15.8 9.2 L17.4 12 L16.2 11.6 L14.8 12.2 Z" fill={W} strokeWidth="1.2" />
    </>
  ),
  sunrise: () => (
    <>
      <rect x="1.4" y="3" width="21.2" height="18.4" rx="1.4" fill={AMBER} />
      <path d="M6.4 14.4 A5.6 5.6 0 0 1 17.6 14.4 Z" fill={FACE} strokeWidth="1.5" />
      <path d="M12 4.6 V6.6 M5.2 7.4 L6.6 8.8 M18.8 7.4 L17.4 8.8" fill="none" strokeWidth="1.4" />
      <path d="M1.4 14.4 H22.6 V20 Q22.6 21.4 21.2 21.4 H2.8 Q1.4 21.4 1.4 20 Z" fill={BLUE} strokeWidth="1.6" />
      <path d="M5 17.4 H9 M13.6 17.4 H19 M8 19.6 H15" fill="none" stroke={W} strokeWidth="1.2" />
    </>
  ),
  dog: () => (
    <>
      <circle cx="12" cy="12.8" r="8.8" fill={W} />
      <path d="M10.6 4.2 Q15.4 3.6 17 7.6 Q14 8.6 12.4 7 Z" fill={CLAY} strokeWidth="1.2" />
      <ellipse cx="3.6" cy="10.6" rx="2.6" ry="5" fill={CLAY} transform="rotate(16 3.6 10.6)" />
      <ellipse cx="20.4" cy="10.6" rx="2.6" ry="5" fill={CLAY} transform="rotate(-16 20.4 10.6)" />
      {dot(8.8, 11.4)}{dot(15.2, 11.4)}
      <ellipse cx="12" cy="14.6" rx="1.9" ry="1.3" fill={INK} stroke="none" />
      <path d="M12 15.6 V16.8 M9.8 16.8 Q12 18.6 14.2 16.8" fill="none" strokeWidth="1.3" />
      <path d="M11 17.6 Q12 20.4 13 17.6" fill={RED} strokeWidth="1" />
    </>
  ),
  cat: () => (
    <>
      <path d="M3.6 11 L4.2 2.4 L10 6.2 Z M20.4 11 L19.8 2.4 L14 6.2 Z" fill={AMBER} strokeWidth="1.6" />
      <circle cx="12" cy="13" r="8.8" fill={AMBER} />
      <path d="M5.4 5.6 L6 8 M18.6 5.6 L18 8" fill="none" stroke={RED} strokeWidth="1.2" />
      {dot(8.8, 11.6)}{dot(15.2, 11.6)}
      <path d="M11 14 H13 L12 15.2 Z" fill={RED} strokeWidth="1" />
      <path d="M12 15.2 Q11 17 9.6 16 M12 15.2 Q13 17 14.4 16 M1.6 13.4 L6.4 14.4 M1.8 16.6 L6.4 15.8 M22.4 13.4 L17.6 14.4 M22.2 16.6 L17.6 15.8" fill="none" strokeWidth="1.1" />
    </>
  ),
  fish: () => (
    <>
      <path d="M17.4 12 L23 6.6 L22 12 L23 17.4 Z" fill={BLUE} strokeWidth="1.6" />
      <path d="M9 6.8 Q11 4 14 5.6 L13 7.4 Z" fill={BLUE} strokeWidth="1.3" />
      <ellipse cx="10.6" cy="12" rx="8.6" ry="5.8" fill={SKY} />
      <circle cx="6" cy="10.8" r="1.8" fill={W} strokeWidth="1.1" />
      {dot(6.3, 10.9, 0.8)}
      <path d="M9.4 8.4 Q11 12 9.4 15.6" fill="none" strokeWidth="1.2" />
      <path d="M12.6 10 Q14 9.4 15.4 10.2" fill="none" stroke={W} strokeWidth="1.2" />
    </>
  ),
  books: () => (
    <>
      <rect x="2.4" y="16" width="19" height="5.4" rx="0.8" fill={RED} />
      <rect x="4.4" y="10.6" width="16.4" height="5.4" rx="0.8" fill={GREEN} />
      <rect x="3.2" y="5.2" width="17.6" height="5.4" rx="0.8" fill={BLUE} />
      <path d="M17.4 17.4 H21.4 M17.4 20 H21.4 M16.6 12 H20.8 M16.6 14.6 H20.8 M16.8 6.6 H20.8 M16.8 9.2 H20.8" fill="none" stroke={W} strokeWidth="1.1" />
    </>
  ),
  backpack: () => (
    <>
      <path d="M9 5.4 Q9 2 12 2 Q15 2 15 5.4" fill="none" strokeWidth="1.8" />
      <rect x="4.6" y="5" width="14.8" height="17" rx="4" fill={RED} />
      <path d="M4.8 10.4 Q12 13 19.2 10.4" fill="none" strokeWidth="1.5" />
      <rect x="7.6" y="13.6" width="8.8" height="6" rx="1.6" fill="#e05a54" strokeWidth="1.5" />
      <path d="M7.2 7.4 Q8 6.4 9.4 6.4" fill="none" stroke={W} strokeWidth="1.3" />
    </>
  ),
  globe: () => (
    <>
      <circle cx="12" cy="12" r="10" fill={BLUE} />
      <path d="M10.4 2.8 Q13.4 3.4 12.8 6.6 Q15.4 7.6 15.8 10.8 Q16.8 14 14.4 17 Q13.4 19.8 12.8 21 Q11.2 18 10.8 15 Q8.2 14 8.2 11.4 Q8.6 9 10.8 8.6 Q9.4 5.8 10.4 2.8 Z" fill={GREEN} strokeWidth="1.3" />
      <path d="M3 8.4 Q5.6 7 6.6 9.8 Q5.4 12.4 2.6 12.2 Q2.4 10 3 8.4 Z M18 4.6 Q20.4 6 21.2 8.4 Q19 8.8 17.6 6.8 Z" fill={GREEN} strokeWidth="1.2" />
      {gloss("M5 7 Q6.4 4.6 9 3.6")}
    </>
  ),
  alarm: () => (
    <>
      <circle cx="5" cy="5" r="3" fill={RED} /><circle cx="19" cy="5" r="3" fill={RED} />
      <path d="M6.4 19.4 L4.4 22 M17.6 19.4 L19.6 22" fill="none" strokeWidth="1.8" />
      <circle cx="12" cy="13" r="8.6" fill={RED} />
      <circle cx="12" cy="13" r="6.2" fill={W} strokeWidth="1.4" />
      <path d="M12 13 V8.8 M12 13 L15 14.6" fill="none" strokeWidth="1.6" />
    </>
  ),
  socks: () => (
    <>
      <path d="M7.4 1.6 H15.4 V11.6 L18.6 15 Q21 18.2 18.4 21 Q15.6 23.4 12.8 21 L7.8 15.8 Q6.6 14.4 7.4 12.4 Z" fill={W} />
      <path d="M7.4 1.6 H15.4 V4.4 H7.4 Z M7.4 6.4 H15.4 V8.2 H7.4 Z" fill={RED} strokeWidth="1.3" />
      <path d="M17.8 14.2 Q20.8 17.8 18.4 21 Q16 23 13.4 21.4 Q16.8 19.6 17.8 14.2 Z" fill={RED} strokeWidth="1.2" />
    </>
  ),
  camera: () => (
    <>
      <path d="M6.6 7.4 L8.2 4.6 H13.8 L15.4 7.4" fill={INK} strokeWidth="1.6" />
      <rect x="1.8" y="7.2" width="20.4" height="13.6" rx="2.4" fill={BLUE} />
      <circle cx="11" cy="14" r="4.6" fill={W} strokeWidth="1.6" />
      <circle cx="11" cy="14" r="2.4" fill={INK} stroke="none" />
      {dot(10.2, 13.2, 0.7, W)}
      {sparkle(19.4, 4, 3.4, FACE, 1.1)}
    </>
  ),
  crayon: () => (
    <g transform="rotate(-45 12 12)">
      <path d="M17 8.8 L22.6 12 L17 15.2 Z" fill={W} strokeWidth="1.5" />
      <path d="M20.6 10.8 L22.6 12 L20.6 13.2 Z" fill={RED} stroke="none" />
      <rect x="1.6" y="8.8" width="15.4" height="6.4" rx="1" fill={RED} />
      <path d="M5 8.8 V15.2 M13.6 8.8 V15.2" fill="none" stroke={W} strokeWidth="1.3" />
    </g>
  ),
  clapper: () => (
    <>
      <rect x="2.4" y="9.4" width="19.2" height="12" rx="0.8" fill={INK} />
      <path d="M5 13.4 H19 M5 16.4 H15" fill="none" stroke={W} strokeWidth="1.2" />
      <g transform="rotate(-14 2.4 9)">
        <rect x="2.4" y="4.8" width="19.2" height="4.2" fill={W} />
        <path d="M4.6 4.8 L7 9 H9.8 L7.4 4.8 Z M10.2 4.8 L12.6 9 H15.4 L13 4.8 Z M15.8 4.8 L18.2 9 H21 L18.6 4.8 Z" fill={INK} stroke="none" />
      </g>
    </>
  ),
  tv: () => (
    <>
      <path d="M8 1.6 L12 5.6 L16.4 1.6" fill="none" strokeWidth="1.6" />
      <rect x="1.6" y="5.6" width="20.8" height="15.2" rx="2" fill={CLAY} />
      <rect x="3.6" y="7.8" width="12.6" height="10.8" rx="1.6" fill={SKY} strokeWidth="1.5" />
      <path d="M5.6 10.4 Q6.4 9.2 8 9.2" fill="none" stroke={W} strokeWidth="1.3" />
      {dot(19.4, 10.4, 1.2, AMBER)}{dot(19.4, 14.6, 1.2, AMBER)}
    </>
  ),
  eyes: () => (
    <>
      <ellipse cx="7.6" cy="12" rx="4.4" ry="6.6" fill={W} />
      <ellipse cx="16.6" cy="12" rx="4.4" ry="6.6" fill={W} />
      {dot(9.4, 12.6, 2.4)}{dot(18.4, 12.6, 2.4)}
      {dot(10.2, 11.6, 0.7, W)}{dot(19.2, 11.6, 0.7, W)}
    </>
  ),
  bandage: () => (
    <g transform="rotate(-45 12 12)">
      <rect x="1" y="7.8" width="22" height="8.4" rx="4.2" fill={AMBER} />
      <rect x="8.4" y="7.8" width="7.2" height="8.4" fill="#f3d9a6" strokeWidth="1.4" />
      {dot(10.4, 10.4, 0.6)}{dot(13.6, 10.4, 0.6)}{dot(10.4, 13.6, 0.6)}{dot(13.6, 13.6, 0.6)}
    </g>
  ),
  map: () => (
    <>
      <path d="M1.6 5.6 L8 3.4 L16 5.6 L22.4 3.4 V18.4 L16 20.6 L8 18.4 L1.6 20.6 Z" fill="#f3e6c0" />
      <path d="M8 3.4 L16 5.6 V20.6 L8 18.4 Z" fill="#e3cf94" strokeWidth="1.4" />
      <path d="M3.4 9 Q6 7.6 7 10.4 Q5.6 13.4 3.4 12.6 Z M17.4 12.4 Q20.6 11 21 14.6 Q19 16.8 17.4 15.6 Z" fill={GREEN} strokeWidth="1.1" />
      <path d="M4.6 16.6 Q8 14.4 11 15 Q13.6 11.4 17.2 9.6" fill="none" stroke={RED} strokeWidth="1.4" strokeDasharray="1.6 1.6" />
      <path d="M17.6 7.4 L20 9.8 M20 7.4 L17.6 9.8" fill="none" stroke={RED} strokeWidth="1.6" />
    </>
  ),

  // Corps (blessures)
  leg: () => <>{limb("M9.4 2 L10.6 12 L8.6 20.6", FACE, 4.6)}<path d="M8.6 20.6 H15.4" fill="none" strokeWidth="5.6" /><path d="M8.6 20.6 H15" fill="none" stroke={FACE} strokeWidth="3.2" /></>,
  knee: () => <>{limb("M4 4.6 L11.6 12.4 L6.4 21", FACE, 4.6)}<circle cx="11.6" cy="12.4" r="3.4" fill="none" stroke={RED} strokeWidth="1.6" /><path d="M16.4 9.6 L19.4 8.4 M16.8 13.4 L20 13.6 M15.4 16.6 L17.8 18.6" fill="none" stroke={RED} strokeWidth="1.5" /></>,
  foot: () => (
    <>
      <path d="M7 3 Q11.6 2 12.4 7 Q13 11 15.4 14 Q19.4 16 19 19.4 Q18.4 22 13.8 21.6 L7.4 21.2 Q4.6 20.6 5.2 17 Q6 13 5.6 9 Q5.2 4.2 7 3 Z" fill={FACE} />
      <path d="M7.6 6.8 Q8.8 7.6 10 6.6" fill="none" strokeWidth="1.1" />
    </>
  ),
  back: () => (
    <>
      <path d="M6 2.4 Q4 9 6.4 12.6 Q4.6 18 6.6 21.6 H17.4 Q19.4 18 17.6 12.6 Q20 9 18 2.4 Z" fill={FACE} />
      <path d="M12 3.4 V20.6" fill="none" stroke={RED} strokeWidth="1.6" strokeDasharray="1.6 1.4" />
      <path d="M8.4 7 Q10 8.6 9.6 11 M15.6 7 Q14 8.6 14.4 11" fill="none" strokeWidth="1.1" />
    </>
  ),
};

// ─── Correspondance émoji → dessin ────────────────────────────────────────────
// Clés sans sélecteur de variante (U+FE0F) ni teinte de peau.
const EMOJI_TO_NAME = {
  "😄": "grin", "😅": "sweat", "😂": "joy", "😊": "blush", "😎": "cool", "😉": "wink",
  "😏": "smirk", "😴": "sleep", "😬": "grimace", "😈": "devil", "😤": "huff", "🙄": "eyeroll",
  "😒": "unamused", "😱": "scream", "🤯": "mindblown", "🥹": "tearyeyes", "🤩": "starstruck",
  "🤫": "shush", "🙈": "seenoevil", "🙋": "raisehand", "🤷": "shrug", "👶": "baby",
  "✋": "hand", "👋": "wave", "🙌": "raisinghands", "🙏": "pray", "👇": "pointdown", "👏": "clap",
  "💪": "muscle", "✍": "writing", "🤞": "crossedfingers", "🫶": "hearthands",
  "❤": "heartred", "💚": "heartgreen", "🧡": "heartorange",
  "🎾": "ball", "🏆": "trophy", "🎯": "target",
  "🍽": "plate", "🍝": "spaghetti", "🍔": "burger", "🍫": "chocolate", "🍳": "cooking", "🥐": "croissant", "🎂": "cake",
  "👕": "tshirt", "🌧": "rain", "♻": "recycle", "🚨": "siren", "📊": "barchart", "📈": "chartup",
  "💰": "moneybag", "💸": "moneywings", "✨": "sparkles", "🎧": "headphones", "🔥": "fire",
  "🎮": "gamepad", "🏖": "beach", "⛰": "mountain", "🌅": "sunrise", "🐶": "dog", "🐱": "cat",
  "🐟": "fish", "📚": "books", "🎒": "backpack", "🌍": "globe", "⏰": "alarm", "🧦": "socks",
  "📸": "camera", "🖍": "crayon", "🎬": "clapper", "📺": "tv", "👀": "eyes", "🩹": "bandage",
  "🗺": "map", "🦵": "leg", "🦿": "knee", "🦶": "foot",
};

export const BD_EMOJI_NAMES = Object.keys(DRAW);
export const BD_EMOJI_CHARS = Object.keys(EMOJI_TO_NAME);

const MODIFIERS_RE = /[︎️\u{1F3FB}-\u{1F3FF}]/gu;
export function bdEmojiName(char) {
  if (!char) return null;
  const clean = String(char).replace(MODIFIERS_RE, "");
  if (EMOJI_TO_NAME[clean]) return EMOJI_TO_NAME[clean];
  // Séquence ZWJ : on se rabat sur le premier élément.
  const first = clean.split("‍")[0];
  return EMOJI_TO_NAME[first] || null;
}

// Un émoji dessiné. `name` (clé du catalogue) ou `char` (l'émoji d'origine).
export function BdEmoji({ name, char, size = 16, title, style }) {
  const uid = "tm-bde-" + useId().replace(/:/g, "");
  const key = name || bdEmojiName(char);
  const draw = key && DRAW[key];
  if (!draw) return null;
  // Ombre d'encre décalée vers le bas à droite, comme les cases.
  const off = 1.5;
  return (
    <svg
      className="tm-bd-emoji"
      role="img"
      aria-label={title || char || key}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, overflow: "visible", ...style }}
    >
      <defs>
        <filter id={uid} x="-20%" y="-20%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feFlood floodColor={INK} result="ink" />
          <feComposite in="ink" in2="SourceAlpha" operator="in" result="sil" />
          <feOffset in="sil" dx={off} dy={off} result="shadow" />
          <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={"url(#" + uid + ")"} stroke={INK} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {draw()}
      </g>
    </svg>
  );
}

// Repère un drapeau (deux indicateurs régionaux) ou un émoji pictographique,
// avec ses modificateurs (variante, teinte de peau, séquences ZWJ).
const TOKEN_RE = /([\u{1F1E6}-\u{1F1FF}]{2}|\p{Extended_Pictographic}[︎️\u{1F3FB}-\u{1F3FF}]*(?:‍\p{Extended_Pictographic}[︎️\u{1F3FB}-\u{1F3FF}]*)*)/u;
const TOKEN_TEST_RE = /[\u{1F1E6}-\u{1F1FF}\p{Extended_Pictographic}️‍]/u;
const EMOJI_PRESENTATION_RE = /\p{Emoji_Presentation}|️|‍/u;

// Émoji sans dessin : on le garde seulement s'il s'agit d'un symbole
// typographique (★, ▶, ©…) qui s'affiche en texte ; sinon on le retire.
function isNativeEmoji(tok) {
  return EMOJI_PRESENTATION_RE.test(tok);
}

// Remplace drapeaux et émojis d'un texte par leurs versions BD.
// Renvoie le texte tel quel s'il n'y a rien à remplacer.
export function withBdEmoji(text, size = 16) {
  if (typeof text !== "string" || !TOKEN_TEST_RE.test(text)) return text;
  const parts = text.split(TOKEN_RE);
  const out = [];
  let dropped = false;
  parts.forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 0) {
      // Texte : on retire les sélecteurs orphelins, et l'espace laissé par un émoji retiré.
      let t = part.replace(/[️‍]/g, "");
      const last = out[out.length - 1];
      if (dropped && (!out.length || (typeof last === "string" && /\s$/.test(last)))) t = t.replace(/^ +/, "");
      dropped = false;
      if (t) out.push(t);
      return;
    }
    if (/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(part)) {
      out.push(<FlagFromEmoji key={i} emoji={part} size={Math.round(size * 0.8)} style={{ margin: "0 1px", position: "relative", top: -1 }} />);
      return;
    }
    const name = bdEmojiName(part);
    if (name) {
      out.push(<BdEmoji key={i} name={name} char={part.replace(MODIFIERS_RE, "")} size={size} style={{ margin: "0 1px", position: "relative", top: -1 }} />);
    } else if (!isNativeEmoji(part)) {
      out.push(part);
    } else {
      dropped = true;
    }
  });
  // Fin de texte après un émoji retiré : pas d'espace pendante.
  if (dropped && typeof out[out.length - 1] === "string") out[out.length - 1] = out[out.length - 1].replace(/ +$/, "");
  return out;
}

// Version texte seule (pour un title, un aria-label…) : émojis retirés.
export function stripEmoji(text) {
  if (typeof text !== "string") return text;
  return text.replace(new RegExp(TOKEN_RE.source, "gu"), (tok) => (/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(tok) || isNativeEmoji(tok) ? "" : tok))
    .replace(/[️‍]/g, "").replace(/ {2,}/g, " ").trim();
}
