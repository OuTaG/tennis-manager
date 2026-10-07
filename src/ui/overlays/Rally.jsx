// Animation des points pendant un match.
import { useState, useEffect, useRef } from "react";
import { FlagFromEmoji } from "../icons.jsx";
import { T } from "../theme.js";

// Plays out a single game (or tiebreak) point-by-point on a top-down tennis
// court. The ball shuttles left↔right across the net for a number of exchanges
// proportional to the point's rally length, then "lands" on the loser's side.
// The live game score (0/15/30/40/AV) updates after each point. Designed to
// build tension: break/set points pulse red, the final point lingers, and the
// scoreline shakes on swing points. Matches the app's visual language (T tokens,
// mono/display fonts, tennis-green + ball-yellow palette).
//
// Props:
//   points        : [{ winner:'p'|'o', kind, rallies, label, servingPlayer }]
//   playerName, oppName, playerFlag, oppFlag
//   isTiebreak    : bool (changes header label)
//   contextLabel  : e.g. "Set 2 · 5-4 · Vous servez"
//   isBreakPoint  : (idx) => bool  — highlight tension points (optional)
//   onDone        : called when the whole sequence finishes
//   speed         : ms multiplier (default 1)
export function RallyOverlay({
  points = [],
  playerName = "Vous",
  oppName = "Adversaire",
  playerFlag = "🎾",
  oppFlag = "🎾",
  isTiebreak = false,
  contextLabel = "",
  finalGameWinner = "p",
  onPointAdvance,
  onDone,
  onSkip,
}) {
  const [idx, setIdx] = useState(0);          // current point index
  const [phase, setPhase] = useState("rally"); // "rally" | "resolve"
  const [marks, setMarks] = useState([]);     // impact marks of the current point
  const [resolvedKind, setResolvedKind] = useState(null); // ace | winner | error
  const [lastWinner, setLastWinner] = useState(null);
  const [flash, setFlash] = useState(null);   // 'p' | 'o' | null — point-won flash
  const [shake, setShake] = useState(false);
  const rafRef = useRef(null);
  const timersRef = useRef([]);

  const total = points.length;
  const cur = points[idx] || null;

  // ── Court geometry (shared by the animation logic and the render) ─────────
  // viewBox 0..200 x, 0..120 y. Net is the vertical centre line at x=100.
  const COURT = { x0: 16, x1: 184, y0: 14, y1: 106 };
  const cw = COURT.x1 - COURT.x0, ch = COURT.y1 - COURT.y0;
  const netX = (COURT.x0 + COURT.x1) / 2;
  const svcL = COURT.x0 + cw * 0.30, svcR = COURT.x1 - cw * 0.30;
  const midY = (COURT.y0 + COURT.y1) / 2;

  // Singles court bounds (impacts in play land inside the singles lines).
  const sy0 = COURT.y0 + ch * 0.12, sy1 = COURT.y1 - ch * 0.12, sh = sy1 - sy0;
  const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
  // x for a given side at depth d (0 = baseline, 0.5 = net).
  const xAt = (side, d) => side === "p" ? COURT.x0 + cw * d : COURT.x1 - cw * d;

  // Impact positions by shot type. `side` = half of the court where it lands.
  const serveIn = (side, deuce) => ({
    x: xAt(side, rnd(0.32, 0.46)),
    y: deuce ? rnd(midY + 2, sy1 - 2) : rnd(sy0 + 2, midY - 2),
  });
  const serveFault = (side, deuce) => ({
    x: xAt(side, rnd(0.23, 0.285)),               // just long of the service line
    y: deuce ? rnd(midY + 3, sy1 - 3) : rnd(sy0 + 3, midY - 3),
  });
  const groundstroke = (side) => ({ x: xAt(side, rnd(0.04, 0.26)), y: rnd(sy0 + sh * 0.08, sy1 - sh * 0.08) });
  const volley = (side) => ({
    x: xAt(side, rnd(0.20, 0.42)),
    y: Math.random() < 0.5 ? rnd(sy0 + 2, sy0 + sh * 0.3) : rnd(sy1 - sh * 0.3, sy1 - 2),
  });
  const outBall = (side) => Math.random() < 0.5
    ? { x: xAt(side, rnd(-0.06, -0.02)), y: rnd(sy0 + sh * 0.1, sy1 - sh * 0.1) }      // long
    : { x: xAt(side, rnd(0.06, 0.40)), y: Math.random() < 0.5 ? sy0 - rnd(2, 5) : sy1 + rnd(2, 5) }; // wide

  // Build the full list of impacts for a point.
  const buildShots = (pt, pointIdx) => {
    const server = pt.servingPlayer ? "p" : "o";
    const receiver = server === "p" ? "o" : "p";
    const other = (sd) => sd === "p" ? "o" : "p";
    const winner = pt.winner === "p" ? "p" : "o";
    const loser = other(winner);
    const deuce = pointIdx % 2 === 0;

    let kind = pt.kind;
    if (kind === "rally" || kind === "long_rally") kind = Math.random() < 0.55 ? "winner" : "error";
    if (kind === "ace" && winner !== server) kind = "winner"; // return winner

    let n = kind === "ace" ? 1 : Math.max(2, pt.rallies || 2);
    const hitterOf = (k) => (k % 2 === 1 ? server : receiver);
    const finalHitter = kind === "error" ? loser : winner;
    if (hitterOf(n) !== finalHitter) n++;

    // Double fault: occasionally, a point lost by the server on an error.
    if (kind === "error" && loser === server && Math.random() < 0.15) {
      return {
        kind: "double_fault",
        shots: [
          { ...serveFault(receiver, deuce), type: "fault" },
          // 2nd serve: the first cross is cleared before it appears.
          { ...serveFault(receiver, deuce), type: "fault", replacePrev: true },
        ],
      };
    }

    const shots = [];
    // Optional first-serve fault — only if the point doesn't already end on a
    // fault (a single fault per point).
    if (kind !== "error" && Math.random() < 0.28) shots.push({ ...serveFault(receiver, deuce), type: "fault" });
    for (let k = 1; k <= n; k++) {
      const target = other(hitterOf(k));
      const isLast = k === n;
      if (k === 1) {
        if (isLast && kind === "error") shots.push({ ...serveFault(target, deuce), type: "fault" });
        else shots.push({ ...serveIn(target, deuce), type: "serve" });
      } else if (isLast && kind === "error") {
        shots.push({ ...outBall(target), type: "fault" });
      } else {
        const isVolley = k >= 3 && Math.random() < (isLast ? 0.35 : 0.15);
        shots.push(isVolley ? { ...volley(target), type: "volley" } : { ...groundstroke(target), type: "ground" });
      }
    }
    return { shots, kind };
  };

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
  const after = (ms, fn) => { const id = setTimeout(fn, ms); timersRef.current.push(id); return id; };

  // Play a single point: impacts appear one after the other, then resolve.
  useEffect(() => {
    clearTimers();
    if (!cur) { return; }

    const isKeyPoint = cur.label === "AV. JOUEUR" || cur.label === "AV. ADV." ||
      cur.label === "40-30" || cur.label === "30-40" || cur.label === "ÉGALITÉ" ||
      idx === total - 1;

    const { shots, kind } = buildShots(cur, idx);
    const step = 360; // same pace for every point

    setPhase("rally");
    setFlash(null);
    setMarks([]);
    setResolvedKind(kind);

    const resolveNow = () => {
      setPhase("resolve");
      setLastWinner(cur.winner);
      setFlash(cur.winner);
      if (onPointAdvance) onPointAdvance(cur.label, cur.winner);
      if (isKeyPoint) { setShake(true); after(380, () => setShake(false)); }
      const hold = 700; // same pause for every point
      after(hold, () => {
        setFlash(null);
        if (idx < total - 1) { setIdx(idx + 1); }
        else { after(250, () => onDone && onDone()); }
      });
    };

    shots.forEach((sh, i) => {
      after(400 + i * step, () => {
        setMarks(m => (sh.replacePrev ? [sh] : [...m, sh]));
        if (i === shots.length - 1) after(260, resolveNow);
      });
    });

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, total]);

  useEffect(() => () => clearTimers(), []);

  if (!cur) return null;

  const curScore = phase === "resolve" ? cur.label : (idx === 0 ? (isTiebreak ? "0-0" : "0-0") : (points[idx - 1]?.label || "0-0"));
  const isKey = cur.label === "AV. JOUEUR" || cur.label === "AV. ADV." ||
    cur.label === "40-30" || cur.label === "30-40" || cur.label === "ÉGALITÉ" ||
    idx === total - 1;

  const kindLabel = {
    ace: "ACE !", winner: "Coup gagnant", error: "Faute directe", double_fault: "Double faute",
    rally: "Échange", long_rally: "Échange interminable",
  }[resolvedKind || cur.kind] || "Échange";

  const INK = T.ink;
  const lineW = "#ffffff";
  return (
    <div className="tm-paper" style={{
      position: "fixed", inset: 0, zIndex: 65,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 16,
      animation: "tm-fade-up 0.2s ease-out both",
      color: "#141414",
    }}>
      {/* Header: live tag + context */}
      <div style={{ width: "100%", maxWidth: 460, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="tm-display" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#c4302b", color: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK,
            fontSize: 12, padding: "2px 8px", textTransform: "uppercase", letterSpacing: 0.3,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffffff", border: "1.5px solid " + INK, animation: "pulse 1.4s infinite" }} />
            {isTiebreak ? "Tie-break en direct" : "Jeu en direct"}
          </span>
        </div>
        {onSkip && (
          <button onClick={() => { clearTimers(); onSkip(); }} style={{
            background: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, color: "#141414",
            borderRadius: 0, padding: "4px 12px", fontSize: 12, fontWeight: 800,
            letterSpacing: 0.3, textTransform: "none", cursor: "pointer", fontFamily: T.body,
          }}>Passer</button>
        )}
      </div>

      {contextLabel && (
        <div style={{ background: INK, color: "#ffffff", fontSize: 11.5, fontWeight: 800, padding: "2px 8px", marginBottom: 12, textAlign: "center", letterSpacing: 0.3 }}>{contextLabel}</div>
      )}

      {/* Players + giant point score */}
      <div style={{ width: "100%", maxWidth: 460, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
        <PlayerTag flag={playerFlag} name={playerName} active={cur.servingPlayer} side="left" highlight={flash === "p"} />
        <div className="tm-display" style={{
          fontVariantNumeric: "tabular-nums",
          fontSize: curScore.length > 5 ? 20 : 30, lineHeight: 1.1,
          color: "#141414", background: isKey ? "#d6ef3c" : "#ffffff",
          border: "3px solid " + INK, boxShadow: "3px 3px 0 " + INK,
          padding: "4px 8px", textAlign: "center", minWidth: 96, boxSizing: "border-box",
          transition: "background 0.2s",
          transform: shake ? "translateX(" + (Math.random() * 6 - 3).toFixed(1) + "px) rotate(-2deg)" : "none",
        }}>{curScore}</div>
        <PlayerTag flag={oppFlag} name={oppName} active={!cur.servingPlayer} side="right" highlight={flash === "o"} />
      </div>

      {/* Court */}
      <div style={{
        width: "100%", maxWidth: 460, overflow: "hidden", boxSizing: "border-box",
        border: "3px solid " + INK, background: "#1f7a45",
        boxShadow: "5px 5px 0 " + INK,
        transform: shake ? "translateX(" + (Math.random() * 4 - 2).toFixed(1) + "px)" : "none",
      }}>
        <svg viewBox="0 0 200 120" style={{ width: "100%", display: "block", background: "#1f7a45" }}>
          <defs>
            <pattern id="tm-court-dots" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.7" fill="#141414" opacity="0.18" />
            </pattern>
          </defs>

          {/* Court surface */}
          <rect x={COURT.x0 - 8} y={COURT.y0 - 8} width={cw + 16} height={ch + 16} fill="#2a8a52" stroke={INK} strokeWidth="1.2" />
          <rect x={COURT.x0 - 8} y={COURT.y0 - 8} width={cw + 16} height={ch + 16} fill="url(#tm-court-dots)" />
          {/* Outer doubles lines */}
          <rect x={COURT.x0} y={COURT.y0} width={cw} height={ch} fill="none" stroke={lineW} strokeWidth="1.3" />
          {/* Singles sidelines */}
          <line x1={COURT.x0} y1={COURT.y0 + ch * 0.12} x2={COURT.x1} y2={COURT.y0 + ch * 0.12} stroke={lineW} strokeWidth="0.8" />
          <line x1={COURT.x0} y1={COURT.y1 - ch * 0.12} x2={COURT.x1} y2={COURT.y1 - ch * 0.12} stroke={lineW} strokeWidth="0.8" />
          {/* Service boxes */}
          <line x1={svcL} y1={COURT.y0 + ch * 0.12} x2={svcL} y2={COURT.y1 - ch * 0.12} stroke={lineW} strokeWidth="0.8" />
          <line x1={svcR} y1={COURT.y0 + ch * 0.12} x2={svcR} y2={COURT.y1 - ch * 0.12} stroke={lineW} strokeWidth="0.8" />
          <line x1={svcL} y1={midY} x2={svcR} y2={midY} stroke={lineW} strokeWidth="0.8" />
          {/* Centre marks */}
          <line x1={COURT.x0} y1={midY} x2={COURT.x0 + 5} y2={midY} stroke={lineW} strokeWidth="0.8" />
          <line x1={COURT.x1 - 5} y1={midY} x2={COURT.x1} y2={midY} stroke={lineW} strokeWidth="0.8" />

          {/* Half tints */}
          <rect x={COURT.x0 - 8} y={COURT.y0 - 8} width={(netX - (COURT.x0 - 8))} height={ch + 16}
            fill="#d6ef3c" opacity={flash === "p" ? 0.3 : 0} style={{ transition: "opacity 0.15s" }} />
          <rect x={netX} y={COURT.y0 - 8} width={(COURT.x1 + 8 - netX)} height={ch + 16}
            fill="#c4302b" opacity={flash === "o" ? 0.25 : 0} style={{ transition: "opacity 0.15s" }} />

          {/* Net */}
          <line x1={netX} y1={COURT.y0 - 5} x2={netX} y2={COURT.y1 + 5} stroke={INK} strokeWidth="2.6" />
          <line x1={netX} y1={COURT.y0 - 5} x2={netX} y2={COURT.y1 + 5} stroke="#ffffff" strokeWidth="0.8" strokeDasharray="1.6 1.6" />
          <rect x={netX - 1.8} y={COURT.y0 - 7} width="3.6" height="3" fill={INK} />
          <rect x={netX - 1.8} y={COURT.y1 + 4} width="3.6" height="3" fill={INK} />

          {/* Impact marks */}
          {marks.map((mk, i) => (
            <ImpactMark key={i} type={mk.type} x={mk.x} y={mk.y} latest={i === marks.length - 1} />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ width: "100%", maxWidth: 460, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        {[
          { type: "serve", label: "Service" },
          { type: "ground", label: "Fond de court" },
          { type: "volley", label: "Volée" },
          { type: "fault", label: "Faute" },
        ].map(it => (
          <div key={it.type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, color: "#141414", background: "#ffffff", border: "2px solid " + INK, padding: "1px 6px" }}>
            <svg width="13" height="13" viewBox="-6 -6 12 12" style={{ background: "#2a8a52" }}><ImpactMark type={it.type} x={0} y={0} /></svg>
            {it.label}
          </div>
        ))}
      </div>

      {/* Point status line */}
      <div style={{ marginTop: 14, minHeight: 28, display: "flex", alignItems: "center", gap: 8 }}>
        {phase === "resolve" ? (
          <span className="tm-display" style={{
            fontSize: 14, letterSpacing: 0.3,
            color: "#ffffff", background: lastWinner === "p" ? "#1f7a45" : "#c4302b",
            border: "2.5px solid " + INK, boxShadow: "3px 3px 0 " + INK, padding: "2px 10px",
            textTransform: "none",
          }}>
            {kindLabel} · point {lastWinner === "p" ? playerName : oppName}
          </span>
        ) : (
          <span className="tm-lettering" style={{ fontSize: 15, color: "#141414" }}>
            {cur.servingPlayer ? playerName : oppName} au service · échange en cours…
          </span>
        )}
      </div>

      {/* Point progress dots — only past + current. Showing the full count
          ahead would spoil whether the game is going to be tight or short. */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 12, flexWrap: "wrap", maxWidth: 300, minHeight: 10 }}>
        {points.slice(0, idx + 1).map((pt, i) => (
          <div key={i} style={{
            width: i === idx ? 18 : 10, height: 10, boxSizing: "border-box",
            border: "2px solid " + INK,
            background: i < idx ? (pt.winner === "p" ? "#1f7a45" : "#c4302b") : "#d6ef3c",
            transition: "all 0.25s",
          }} />
        ))}
      </div>
    </div>
  );
}

// Impact mark drawn on the 2D court. Shape + colour encode the shot type.
export function ImpactMark({ type, x, y, latest = false }) {
  const s = latest ? 1.35 : 1;
  const tr = "translate(" + x.toFixed(2) + "," + y.toFixed(2) + ") scale(" + s + ")";
  if (type === "serve") {
    return <g transform={tr}><circle r="2.6" fill="#d6ef3c" stroke="#141414" strokeWidth="0.7" /></g>;
  }
  if (type === "volley") {
    return <g transform={tr}><path d="M 0 -3 L 2.8 2.2 L -2.8 2.2 Z" fill="#e0a21b" stroke="#141414" strokeWidth="0.7" /></g>;
  }
  if (type === "fault") {
    return (
      <g transform={tr}>
        <line x1="-2.4" y1="-2.4" x2="2.4" y2="2.4" stroke="#141414" strokeWidth="2.6" strokeLinecap="square" />
        <line x1="-2.4" y1="2.4" x2="2.4" y2="-2.4" stroke="#141414" strokeWidth="2.6" strokeLinecap="square" />
        <line x1="-2.4" y1="-2.4" x2="2.4" y2="2.4" stroke="#ff4a3d" strokeWidth="1.3" strokeLinecap="square" />
        <line x1="-2.4" y1="2.4" x2="2.4" y2="-2.4" stroke="#ff4a3d" strokeWidth="1.3" strokeLinecap="square" />
      </g>
    );
  }
  // ground (fond de court)
  return <g transform={tr}><rect x="-2.2" y="-2.2" width="4.4" height="4.4" fill="#ffffff" stroke="#141414" strokeWidth="0.7" /></g>;
}

export function PlayerTag({ flag, name, active, side, highlight }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: side === "left" ? "flex-start" : "flex-end",
      gap: 3, flex: 1, minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: side === "left" ? "row" : "row-reverse" }}>
        <FlagFromEmoji emoji={flag} size={12} />
        <span className="tm-display" style={{
          color: "#141414", background: highlight ? "#d6ef3c" : "transparent", fontSize: 13.5, letterSpacing: 0.2,
          padding: "0 3px", border: "2px solid " + (highlight ? T.ink : "transparent"),
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110,
          transition: "background 0.2s",
        }}>{name}</span>
      </div>
      {active && (
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase",
          color: "#ffffff", background: "#1f7a45", border: "2px solid " + T.ink,
          padding: "0 5px", display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d6ef3c", border: "1.5px solid " + T.ink, display: "inline-block" }} /> Service
        </span>
      )}
    </div>
  );
}
