// Animations d'entraînement.
import { useState, useEffect, useRef } from "react";
import { T } from "../theme.js";

// ─── TRAINING ANIMATION OVERLAY ─────────────────────────────────────────────
// Plays a short, type-specific animation when the player completes a training
// session. Each stat has its own scene built from the same visual language as
// FlightOverlay (T tokens, dark backdrop, SVG, eyebrow + title + progress bar).
//
// Scenes:
//   serve     — top-down court; ball arcs from baseline to opp service box,
//               impact pulse on landing.
//   forehand  — court; ball swings to the right side with a curved follow-through.
//   backhand  — mirror of forehand on the left side.
//   stamina   — running silhouette across cones with speed ladder underneath.
//   mental    — pulsing brain/eye with concentric focus rings.
//   net       — short, low volley dropping just over the net.
//
// Props:
//   mod         — the training module (used for label + stat id)
//   gain        — numeric stat gain to celebrate at the end (optional)
//   onDone      — called when the animation finishes
export function TrainingOverlay({ mod, gain, onDone }) {
  const [t, setT] = useState(0); // 0..1 progress for the main loop (eased)
  const [raw, setRaw] = useState(0); // 0..1 linear progress (service : rythme réel)
  const rafRef = useRef(null);
  const DURATION = 2400;

  useEffect(() => {
    let start = null;
    const ease = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const step = (now) => {
      if (start === null) start = now;
      const p = Math.min(1, (now - start) / DURATION);
      setT(ease(p));
      setRaw(p);
      if (p < 1) { rafRef.current = requestAnimationFrame(step); }
      else { setTimeout(() => onDone && onDone(), 480); }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stat = mod?.stat || "serve";

  // ── Court geometry shared by court-based scenes (serve, fh, bh, net) ─────
  // viewBox 0..200 × 0..120, net at x=100. Player on the right, opp on the left.
  const COURT = { x0: 16, x1: 184, y0: 14, y1: 106 };
  const cw = COURT.x1 - COURT.x0, ch = COURT.y1 - COURT.y0;
  const netX = (COURT.x0 + COURT.x1) / 2;
  const midY = (COURT.y0 + COURT.y1) / 2;

  // Reusable top-down court SVG block.
  const LINE = "#ffffff";
  const sTopY = COURT.y0 + ch * 0.12, sBotY = COURT.y1 - ch * 0.12;
  const CourtBackdrop = (
    <>
      {/* Pourtour du court, un ton plus sombre */}
      <rect x="0" y="0" width="200" height="120" fill={T.greenDk} />
      {/* Surface : aplat vert + bandes de tonte très légères pour la crédibilité */}
      <rect x={COURT.x0 - 8} y={COURT.y0 - 7} width={cw + 16} height={ch + 14} rx="2" fill={T.green} />
      {[0, 1, 2, 3, 4, 5, 6].map(k => k % 2 === 0 ? null : (
        <rect key={k} x={COURT.x0 - 8 + k * (cw + 16) / 7} y={COURT.y0 - 7} width={(cw + 16) / 7} height={ch + 14} fill="#ffffff" opacity="0.05" />
      ))}
      <g stroke={LINE} strokeLinecap="square" fill="none">
        {/* Double (contour) */}
        <rect x={COURT.x0} y={COURT.y0} width={cw} height={ch} strokeWidth="1.2" />
        {/* Couloirs du simple */}
        <line x1={COURT.x0} y1={sTopY} x2={COURT.x1} y2={sTopY} strokeWidth="0.9" />
        <line x1={COURT.x0} y1={sBotY} x2={COURT.x1} y2={sBotY} strokeWidth="0.9" />
        {/* Lignes de service + ligne médiane */}
        <line x1={COURT.x0 + cw * 0.30} y1={sTopY} x2={COURT.x0 + cw * 0.30} y2={sBotY} strokeWidth="0.9" />
        <line x1={COURT.x1 - cw * 0.30} y1={sTopY} x2={COURT.x1 - cw * 0.30} y2={sBotY} strokeWidth="0.9" />
        <line x1={COURT.x0 + cw * 0.30} y1={midY} x2={COURT.x1 - cw * 0.30} y2={midY} strokeWidth="0.9" />
        {/* Marques centrales sur les lignes de fond */}
        <line x1={COURT.x0} y1={midY} x2={COURT.x0 + 3} y2={midY} strokeWidth="0.9" />
        <line x1={COURT.x1 - 3} y1={midY} x2={COURT.x1} y2={midY} strokeWidth="0.9" />
      </g>
      {/* Filet : ombre portée + bande blanche + poteaux */}
      <line x1={netX + 1.2} y1={COURT.y0 - 4} x2={netX + 1.2} y2={COURT.y1 + 4} stroke="#000000" strokeWidth="1.6" opacity="0.18" />
      <line x1={netX} y1={COURT.y0 - 4} x2={netX} y2={COURT.y1 + 4} stroke="#f4eee3" strokeWidth="1.3" />
      <circle cx={netX} cy={COURT.y0 - 4.5} r="1.4" fill="#2b2620" />
      <circle cx={netX} cy={COURT.y1 + 4.5} r="1.4" fill="#2b2620" />
    </>
  );

  // Balle : aplat ocre, couture blanche, petite ombre au sol (lift = hauteur).
  const Ball = ({ x, y, lift = 0 }) => (
    <g transform={"translate(" + x.toFixed(2) + "," + y.toFixed(2) + ")"}>
      <ellipse cx={0.8 + lift * 0.5} cy={1.6 + lift} rx="2.3" ry="1.1" fill="#000000" opacity={Math.max(0.08, 0.22 - lift * 0.02)} />
      <g transform={"translate(0," + (-lift).toFixed(2) + ")"}>
        <circle r="2.5" fill={T.amber} />
        <path d="M -1.6 -1.8 C -0.2 -0.6 -0.2 0.6 -1.6 1.8" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.9" strokeLinecap="round" />
      </g>
    </g>
  );

  // Helper: quadratic bezier point (used by serve & shot trajectories)
  const bez = (p0, p1, p2, tt) => {
    const u = 1 - tt;
    return { x: u * u * p0.x + 2 * u * tt * p1.x + tt * tt * p2.x, y: u * u * p0.y + 2 * u * tt * p1.y + tt * tt * p2.y };
  };

  // Pick a stable variant for this session so each entraînement looks a bit
  // different. Chosen once on mount.
  const variantRef = useRef(Math.floor(Math.random() * 10000));
  const variant = variantRef.current;

  // ── Per-stat scenes ──────────────────────────────────────────────────────
  let scene = null;
  let label = mod?.name || "Entraînement";

  if (stat === "serve") {
    // Player serves from the RIGHT baseline (deuce or ad side depending on
    // variant). Ball travels in a taut, near-straight line to land inside the
    // opponent's service box. 4 tactical variants.
    // Opp service box: x ∈ [COURT.x0, COURT.x0 + cw*0.30], y ∈ [COURT.y0 + ch*0.12, COURT.y1 - ch*0.12]
    // Opponent's service boxes: x between the service line (x0 + 30%) and the
    // net, y split by the centre line. The serve always goes CROSS-COURT: a
    // server standing below the centre mark serves into the upper box.
    const svcLineX = COURT.x0 + cw * 0.30;
    const sTop = COURT.y0 + ch * 0.12, sBot = COURT.y1 - ch * 0.12;
    const serves = [
      // Server below the centre mark → upper box: wide / body / T
      { serverY: midY + ch * 0.07, ballEndX: svcLineX + cw * 0.03, ballEndY: sTop + ch * 0.05 },
      { serverY: midY + ch * 0.07, ballEndX: svcLineX + cw * 0.06, ballEndY: (sTop + midY) / 2 },
      { serverY: midY + ch * 0.07, ballEndX: svcLineX + cw * 0.02, ballEndY: midY - ch * 0.04 },
      // Server above the centre mark → lower box: wide / body / T
      { serverY: midY - ch * 0.07, ballEndX: svcLineX + cw * 0.03, ballEndY: sBot - ch * 0.05 },
      { serverY: midY - ch * 0.07, ballEndX: svcLineX + cw * 0.06, ballEndY: (sBot + midY) / 2 },
      { serverY: midY - ch * 0.07, ballEndX: svcLineX + cw * 0.02, ballEndY: midY + ch * 0.04 },
    ];
    const v = serves[variant % serves.length];
    // Server stands just BEHIND the baseline.
    const playerPos = { x: COURT.x1 + 4, y: v.serverY };
    const start = { x: COURT.x1 + 1, y: v.serverY - 1 };
    const end   = { x: v.ballEndX, y: v.ballEndY };
    // Rythme réel d'un service (progression linéaire, sans easing) :
    //   0.00–0.30  lancer de balle (la balle monte au-dessus du serveur)
    //   0.30–0.41  frappe → rebond dans le carré (~0,25 s, trajectoire tendue)
    //   0.41–0.56  la balle file après le rebond vers le fond du court
    const r = raw;
    const TOSS = 0.30, BOUNCE = 0.41, OUT = 0.56;
    const lerp = (a1, b1, k) => a1 + (b1 - a1) * k;
    // Après le rebond, la balle continue dans le même axe jusqu'au fond.
    const dx = end.x - start.x, dy = end.y - start.y;
    const kOut = (COURT.x0 - 8 - end.x) / dx; // prolongement jusqu'au-delà de la ligne de fond
    const outPt = { x: end.x + dx * kOut, y: end.y + dy * kOut };
    let ballPos, lift;
    if (r < TOSS) {
      const k = r / TOSS;
      ballPos = { x: start.x - 0.5, y: start.y - 1.5 };
      lift = 9 * Math.sin(k * Math.PI * 0.55) ; // monte, frappée près du sommet
    } else if (r < BOUNCE) {
      const k = (r - TOSS) / (BOUNCE - TOSS);
      ballPos = { x: lerp(start.x, end.x, k), y: lerp(start.y - 1.5, end.y, k) };
      lift = lerp(9 * Math.sin(Math.PI * 0.55), 0, k);
    } else {
      const k = Math.min(1, (r - BOUNCE) / (OUT - BOUNCE));
      ballPos = { x: lerp(end.x, outPt.x, k), y: lerp(end.y, outPt.y, k) };
      lift = 3.5 * Math.sin(k * Math.PI * 0.8);
    }
    const ballVisible = r < OUT + 0.02;
    const swing = Math.max(0, Math.min(1, (r - (TOSS - 0.05)) / 0.09)); // geste de frappe
    const impactK = (r - BOUNCE) / 0.14;
    scene = (
      <>
        {CourtBackdrop}
        {/* Serveur */}
        <g transform={"translate(" + playerPos.x + "," + playerPos.y + ")"}>
          <circle r="3.2" fill="#f4eee3" stroke="#2b2620" strokeWidth="0.6" />
          {swing > 0 && swing < 1 && (
            <path
              d={"M 1 -5 A 7 7 0 0 0 " + (-6 * swing).toFixed(2) + " " + (-4 + 6 * swing).toFixed(2)}
              fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity={0.9}
            />
          )}
        </g>
        {/* Trace de la balle pendant le vol */}
        {r >= TOSS && r < BOUNCE + 0.06 && (
          <line x1={start.x} y1={start.y - 1.5} x2={ballPos.x} y2={ballPos.y} stroke="#ffffff" strokeWidth="0.5" opacity={0.35} strokeDasharray="1.5 1.5" />
        )}
        {ballVisible && <Ball x={ballPos.x} y={ballPos.y} lift={lift} />}
        {/* Marque du rebond dans le carré */}
        {impactK > 0 && impactK < 1 && (
          <circle cx={end.x} cy={end.y} r={2.5 + impactK * 6} fill="none" stroke="#ffffff" strokeWidth="0.8" opacity={1 - impactK} />
        )}
      </>
    );
  } else if (stat === "forehand" || stat === "backhand" || stat === "net") {
    // Même rythme que le service : progression linéaire, trajectoires tendues
    // vues de dessus, hauteur de balle rendue par l'ombre, rebond marqué.
    const clamp01 = (x) => Math.max(0, Math.min(1, x));
    const lerpP = (A, B, k) => ({ x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k });
    // Prolonge le segment A→B au-delà de B d'une longueur `len`.
    const beyond = (A, B, len) => {
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
      return { x: B.x + dx / d * len, y: B.y + dy / d * len };
    };
    const isNet = stat === "net";
    const sign = stat === "backhand" ? -1 : 1;
    const playerPos = isNet ? { x: netX + 12, y: midY } : { x: COURT.x1 - 12, y: midY + sign * 6 };
    const contactPt = { x: playerPos.x - 4, y: playerPos.y + (isNet ? 0 : sign * 2) };

    // Coups joués (fond de court ou volée), 5 variantes chacun.
    const groundShots = [
      { name: "Long de ligne",     end: { x: COURT.x0 + cw * 0.08, y: midY - sign * 32 }, peak: 5, dur: 0.15 },
      { name: "Croisé court",      end: { x: COURT.x0 + cw * 0.22, y: midY + sign * 33 }, peak: 5, dur: 0.14 },
      { name: "Croisé profond",    end: { x: COURT.x0 + cw * 0.07, y: midY + sign * 28 }, peak: 6, dur: 0.16 },
      { name: "Amortie",           end: { x: COURT.x0 + cw * 0.40, y: midY + sign * 10 }, peak: 7, dur: 0.22, drop: true },
      { name: "Contre-pied",       end: { x: COURT.x0 + cw * 0.10, y: midY - sign * 20 }, peak: 5, dur: 0.15 },
    ];
    const volleyShots = [
      { end: { x: COURT.x0 + cw * 0.12, y: midY - ch * 0.32 }, peak: 2, dur: 0.12 },
      { end: { x: netX - 14, y: midY + 7 }, peak: 3, dur: 0.14, drop: true },
      { end: { x: COURT.x0 + cw * 0.22, y: midY + ch * 0.34 }, peak: 2, dur: 0.12 },
      { end: { x: COURT.x0 + cw * 0.08, y: midY + ch * 0.20 }, peak: 1, dur: 0.10, smash: true },
      { end: { x: COURT.x0 + cw * 0.10, y: midY - ch * 0.10 }, peak: 3, dur: 0.13 },
    ];
    // Deux échanges pendant la séance (variantes différentes), au même
    // rythme que le service : chaque échange dure la moitié de l'animation.
    const exchange = (vIdx, r) => {
    const sv = (isNet ? volleyShots : groundShots)[vIdx % 5];

    // Balle adverse : départ du fond de court d'en face.
    const oppPos = isNet
      ? (sv.smash ? { x: COURT.x0 + cw * 0.12, y: midY - ch * 0.28 } : { x: COURT.x0 + cw * 0.10, y: midY - 10 })
      : { x: COURT.x0 + 6, y: midY - sign * 18 };

    // Phases : [r0, r1, départ, arrivée, hauteur de départ, d'arrivée, flèche]
    const phases = [];
    const bounces = [];
    let tHit;
    if (isNet) {
      // Volée : pas de rebond avant la frappe. Smash = lob haut et plus lent.
      const inEnd = sv.smash ? 0.30 : 0.20;
      phases.push({ r0: 0, r1: inEnd, A: oppPos, B: contactPt, h0: 1, h1: sv.smash ? 7 : 2.5, peak: sv.smash ? 14 : 3 });
      tHit = inEnd;
    } else {
      // Fond de court : la balle adverse rebondit devant le joueur puis monte vers lui.
      const inBounce = { x: contactPt.x - 24, y: lerpP(oppPos, contactPt, 0.85).y };
      phases.push({ r0: 0, r1: 0.20, A: oppPos, B: inBounce, h0: 1, h1: 0, peak: 5 });
      bounces.push({ r: 0.20, p: inBounce });
      phases.push({ r0: 0.20, r1: 0.28, A: inBounce, B: contactPt, h0: 0, h1: 2.5, peak: 2 });
      tHit = 0.28;
    }
    // Coup du joueur → rebond dans le camp adverse → la balle file ensuite.
    const outBounce = tHit + sv.dur;
    phases.push({ r0: tHit, r1: outBounce, A: contactPt, B: sv.end, h0: isNet ? (sv.smash ? 7 : 2.5) : 2.5, h1: 0, peak: sv.peak });
    bounces.push({ r: outBounce, p: sv.end });
    const after = beyond(contactPt, sv.end, sv.drop ? 10 : 34);
    phases.push({ r0: outBounce, r1: outBounce + (sv.drop ? 0.12 : 0.14), A: sv.end, B: after, h0: 0, h1: 0, peak: sv.drop ? 1.2 : 3.5 });
    if (sv.drop) {
      // Amortie : deuxième petit rebond qui meurt.
      const after2 = beyond(contactPt, sv.end, 16);
      bounces.push({ r: outBounce + 0.12, p: after });
      phases.push({ r0: outBounce + 0.12, r1: outBounce + 0.20, A: after, B: after2, h0: 0, h1: 0, peak: 0.5 });
    }

    const cur = phases.find(ph => r >= ph.r0 && r < ph.r1);
    let ballPos = null, lift = 0, trailFrom = null;
    if (cur) {
      const k = clamp01((r - cur.r0) / (cur.r1 - cur.r0));
      ballPos = lerpP(cur.A, cur.B, k);
      lift = cur.h0 + (cur.h1 - cur.h0) * k + cur.peak * Math.sin(Math.PI * k);
      if (cur.peak >= 2) trailFrom = cur.A;
    }
    const swing = clamp01((r - (tHit - 0.05)) / 0.09);
    return { oppPos, ballPos, lift, trailFrom, bounces, swing, r };
    };
    const first = raw < 0.5;
    const ex = exchange(variant + (first ? 0 : 2), (first ? raw : raw - 0.5) * 1.3);
    const { oppPos, ballPos, lift, trailFrom, bounces, swing } = ex;
    const r = ex.r;
    scene = (
      <>
        {CourtBackdrop}
        {/* Adversaire (renvoyeur) */}
        <circle cx={oppPos.x - 3} cy={oppPos.y} r="2.6" fill="#2b2620" opacity="0.55" />
        {/* Joueur */}
        <g transform={"translate(" + playerPos.x + "," + playerPos.y + ")"}>
          <circle r="3.2" fill="#f4eee3" stroke="#2b2620" strokeWidth="0.6" />
          {swing > 0 && swing < 1 && (
            <path
              d={isNet
                ? "M -1 -5 L -1 " + (-5 + 10 * swing).toFixed(2)
                : (sign > 0
                  ? "M 1 5 A 7 7 0 0 1 " + (-6 * swing).toFixed(2) + " " + (5 - 10 * swing).toFixed(2)
                  : "M 1 -5 A 7 7 0 0 0 " + (-6 * swing).toFixed(2) + " " + (-5 + 10 * swing).toFixed(2))}
              fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"
            />
          )}
        </g>
        {/* Trace pendant le vol */}
        {ballPos && trailFrom && (
          <line x1={trailFrom.x} y1={trailFrom.y} x2={ballPos.x} y2={ballPos.y} stroke="#ffffff" strokeWidth="0.5" opacity="0.35" strokeDasharray="1.5 1.5" />
        )}
        {ballPos && <Ball x={ballPos.x} y={ballPos.y} lift={lift} />}
        {/* Marques de rebond */}
        {bounces.map((bn, i) => {
          const k = (r - bn.r) / 0.14;
          return k > 0 && k < 1
            ? <circle key={i} cx={bn.p.x} cy={bn.p.y} r={2.5 + k * 6} fill="none" stroke="#ffffff" strokeWidth="0.8" opacity={1 - k} />
            : null;
        })}
      </>
    );
  } else if (stat === "stamina") {
    // Top-down view: the player (dot) slaloms between a line of cones, leaving
    // a trail, on the same court backdrop as the other drills.
    // 4 plots répartis sur toute la longueur : le joueur les passe tous.
    const spacing = 36;
    const cones = [0, 1, 2, 3].map(i => COURT.x0 + 30 + i * spacing);
    const amp = ch * 0.20;
    const xStart = COURT.x0 + 8, xEnd = cones[cones.length - 1] + 14;
    const posAt = (tt) => {
      const x = xStart + tt * (xEnd - xStart);
      // At each cone the runner is at max lateral offset, alternating sides.
      const y = midY + amp * Math.cos(Math.PI * (x - cones[0]) / spacing);
      return { x, y };
    };
    const run = Math.min(1, raw / 0.95); // vitesse constante
    const cur = posAt(run);
    const trail = [];
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const q = posAt((run * i) / N);
      trail.push(q.x.toFixed(1) + "," + q.y.toFixed(1));
    }
    scene = (
      <>
        {CourtBackdrop}
        {/* Trail */}
        <polyline points={trail.join(" ")} fill="none" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
        {/* Cones (seen from above) */}
        {cones.map((cx, i) => {
          const passed = cur.x > cx + 4;
          return (
            <g key={i} transform={"translate(" + cx + "," + midY + ")"} opacity={passed ? 0.45 : 1}>
              <circle r="3.4" fill={T.clay} />
              <circle r="1.4" fill="#f4eee3" opacity="0.8" />
            </g>
          );
        })}
        {/* Runner */}
        <g transform={"translate(" + cur.x.toFixed(2) + "," + cur.y.toFixed(2) + ")"}>
          <circle r="3.2" fill="#f4eee3" stroke="#2b2620" strokeWidth="0.6" />
        </g>
      </>
    );
  } else if (stat === "mental") {
    // Jeu de réflexes : des plots s'allument au hasard autour du joueur, il
    // doit les toucher le plus vite possible. Temps de réaction affiché.
    const center = { x: 100, y: 62 };
    const pods = [
      { x: 58, y: 32 }, { x: 100, y: 24 }, { x: 142, y: 32 },
      { x: 58, y: 92 }, { x: 100, y: 100 }, { x: 142, y: 92 },
      { x: 40, y: 62 }, { x: 160, y: 62 },
    ];
    // Séquence stable pour la séance : 6 allumages, temps de réaction 190–330 ms.
    let seed = variant * 9301 + 49297;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const CYCLE = 0.155, START = 0.04;
    const seq = [];
    let prev = -1;
    for (let i = 0; i < 6; i++) {
      let idx = Math.floor(rnd() * pods.length);
      if (idx === prev) idx = (idx + 3) % pods.length;
      prev = idx;
      const reactMs = Math.round(190 + rnd() * 140);
      const on = START + i * CYCLE;
      seq.push({ idx, on, hit: on + reactMs / DURATION, reactMs });
    }
    const r = raw;
    const active = seq.filter(e => r >= e.on && r < e.hit + 0.09);
    const done = seq.filter(e => r >= e.hit);
    const lastHit = done[done.length - 1];
    const cur = active[active.length - 1];
    // Position de la main : part du centre vers le plot allumé, touche à `hit`.
    let hand = center;
    if (cur) {
      const k = Math.max(0, Math.min(1, (r - cur.on) / (cur.hit - cur.on)));
      const back = r > cur.hit ? Math.min(1, (r - cur.hit) / 0.08) : 0;
      const kk = Math.pow(k, 2.2) * (1 - back);
      const P = pods[cur.idx];
      hand = { x: center.x + (P.x - center.x) * kk * 0.86, y: center.y + (P.y - center.y) * kk * 0.86 };
    }
    const avg = done.length ? Math.round(done.reduce((a1, e) => a1 + e.reactMs, 0) / done.length) : null;
    scene = (
      <>
        {CourtBackdrop}
        {/* Plots */}
        {pods.map((P, i) => {
          const lit = active.find(e => e.idx === i && r < e.hit);
          const flash = active.find(e => e.idx === i && r >= e.hit);
          const fk = flash ? (r - flash.hit) / 0.09 : 0;
          return (
            <g key={i} transform={"translate(" + P.x + "," + P.y + ")"}>
              <ellipse cx="0.8" cy="1.6" rx="6.2" ry="3" fill="#000000" opacity="0.18" />
              <circle r="6" fill="#2b2620" />
              <circle r="4.4" fill={lit ? T.amber : flash ? "#f4eee3" : "#473f35"} />
              {lit && <circle r={4.4 + ((r - lit.on) * 60) % 5} fill="none" stroke={T.amber} strokeWidth="0.7" opacity="0.7" />}
              {flash && <circle r={6 + fk * 7} fill="none" stroke="#ffffff" strokeWidth="0.8" opacity={1 - fk} />}
            </g>
          );
        })}
        {/* Trait de la main vers le plot */}
        {cur && (
          <line x1={center.x} y1={center.y} x2={hand.x} y2={hand.y} stroke="#ffffff" strokeWidth="0.6" opacity="0.5" strokeDasharray="1.5 1.5" />
        )}
        {/* Joueur + main */}
        <circle cx={center.x} cy={center.y} r="3.4" fill="#f4eee3" stroke="#2b2620" strokeWidth="0.6" />
        <circle cx={hand.x} cy={hand.y} r="1.6" fill="#f4eee3" stroke="#2b2620" strokeWidth="0.4" />
        {/* Tableau de score */}
        <g transform="translate(10,9)">
          <rect x="0" y="0" width="46" height="15" rx="3" fill="#2b2620" opacity="0.85" />
          <text x="5" y="10.2" fontSize="7" fill="#f4eee3" fontFamily="IBM Plex Mono, monospace">{done.length}/6</text>
          <text x="22" y="10.2" fontSize="6.2" fill={T.amber} fontFamily="IBM Plex Mono, monospace">{lastHit ? lastHit.reactMs + " ms" : "—"}</text>
        </g>
        {avg !== null && done.length === seq.length && (
          <g transform="translate(144,9)">
            <rect x="0" y="0" width="46" height="15" rx="3" fill="#2b2620" opacity="0.85" />
            <text x="23" y="10.2" fontSize="6.2" fill="#f4eee3" textAnchor="middle" fontFamily="IBM Plex Mono, monospace">moy. {avg} ms</text>
          </g>
        )}
      </>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: T.bg0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 18,
      animation: "tm-fade-up 0.25s ease-out both",
    }}>
      <div className="tm-eyebrow" style={{ color: T.green, marginBottom: 6 }}>Entraînement</div>
      <div style={{ color: T.fg, fontSize: 20, fontWeight: 800, letterSpacing: 0.3, marginBottom: 4, textAlign: "center" }}>
        {label}
      </div>
      <div style={{ color: T.fg4, fontSize: 12, fontFamily: T.mono, marginBottom: 16 }}>
        {typeof gain === "number" && gain > 0 ? "+" + gain.toFixed(2) + " " + ({ serve: "service", forehand: "coup droit", backhand: "revers", stamina: "endurance", mental: "mental", net: "filet" }[mod?.stat] || "") : "session en cours…"}
      </div>

      <div style={{
        width: "100%", maxWidth: 460,
        borderRadius: 16, overflow: "hidden",
        border: "1px solid " + T.brd2,
        background: T.bg1,
        boxShadow: "0 10px 30px var(--tm-shadow)",
      }}>
        <svg viewBox="0 0 200 120" style={{ width: "100%", display: "block", background: T.greenDk }}>
          {scene}
        </svg>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 16, height: 5, width: "100%", maxWidth: 460, background: T.bg3, borderRadius: 3, overflow: "hidden", border: "1px solid " + T.brd }}>
        <div style={{ height: "100%", width: (t * 100).toFixed(1) + "%", background: "linear-gradient(90deg,var(--tm-green),var(--tm-ball))", borderRadius: 3, transition: "width 0.05s linear" }} />
      </div>
    </div>
  );
}
