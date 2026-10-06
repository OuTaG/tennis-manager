// Mini-jeux de choix (match et entraînement), en cases de BD.
import { useEffect, useRef, useState } from "react";
import { ZONES, TRAINING_CARDS, opponentRead, returnDuel, rollTraining, serveDuel, smashResult } from "../../engine/minigames.js";
import { Avatar } from "../avatar.jsx";
import { BoxShade } from "../scrollShade.jsx";
import { T } from "../theme.js";

const INK = "#141414";
const BALL = "#d6ef3c";
const PURPLE = "#5b2d8e";
const LILAC = "#c9b6ea";
const GRASS = "#1f7a45";

function Sfx({ children, color = BALL }) {
  return (
    <div className="tm-display" style={{
      fontSize: 30, color, WebkitTextStroke: "1.6px " + INK, textShadow: "3px 3px 0 " + INK,
      transform: "rotate(-6deg)", lineHeight: 1, whiteSpace: "nowrap", flexShrink: 0,
    }}>{children}</div>
  );
}

function Caption({ children }) {
  return (
    <div className="tm-lettering" style={{ alignSelf: "flex-start", background: BALL, color: INK, border: "2.5px solid " + INK, padding: "3px 9px", fontSize: 15 }}>{children}</div>
  );
}

// ─── EN MATCH ─────────────────────────────────────────────────────────────
// Étoile d'onomatopée qui « pop » à l'écran.
function Burst({ x, y, text, color = BALL }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, zIndex: 4, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: -62, top: -40, width: 124, height: 80, animation: "tm-mg-pop 0.35s ease-out both" }}>
        <svg viewBox="0 0 124 80" width="124" height="80" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
          <polygon points="62,2 74,20 98,8 92,30 122,34 98,46 112,70 84,60 72,78 58,62 34,76 36,54 4,52 28,38 12,14 42,22" fill={color} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        </svg>
        <div className="tm-display" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: text.length > 8 ? 13 : 17, color: INK, transform: "rotate(-6deg)", whiteSpace: "nowrap" }}>{text}</div>
      </div>
    </div>
  );
}

const MG_KEYFRAMES = `
@keyframes tm-mg-arc { 0% { transform: scale(0.7); } 50% { transform: scale(1.7); } 100% { transform: scale(1); } }
@keyframes tm-mg-pop { 0% { transform: scale(0) rotate(-20deg); } 70% { transform: scale(1.15) rotate(4deg); } 100% { transform: scale(1) rotate(0); } }
@keyframes tm-mg-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
`;

// ─── Géométrie du court (vue de dessus, relanceur en haut) ─────────────────
const VW = 360, VH = 420;
const NET_Y = 210;
const BOX = { x: 180, y: 112, w: 140, h: 98 }; // carré de service visé
const ORDER = [2, 1, 0]; // de la ligne médiane au couloir : Au T, Corps, Extérieur
const CELL = BOX.w / 3;
const zoneX = (zi) => BOX.x + ORDER.indexOf(zi) * CELL + CELL / 2;
const LAND_Y = 168;
const TOP_Y = 70;      // relanceur
const BOT_Y = 372;     // serveur
const SERVER_X = 130;
const pct = (v, total) => (v / total * 100) + "%";
const rnd = (a, b) => a + Math.random() * (b - a); // cosmétique : trajectoires des échanges

// Construit la suite des positions de la balle (et des joueurs) pour un duel.
// r = résultat de resolveServeDuel (+ serveZone, readZone).
export function buildDuelSteps(r) {
  const steps = [];
  const lx = zoneX(r.serveZone);
  // 1. Le relanceur s'est placé là où il lit le service, le service part.
  steps.push({ ball: { x: SERVER_X, y: BOT_Y - 6 }, dur: 0, ret: zoneX(r.readZone), srv: SERVER_X, hideZones: true });
  // Le relanceur reste sur sa lecture pendant le service…
  steps.push({ ball: { x: lx, y: LAND_Y }, dur: 430, bounce: true });
  if (r.kind === "ace") {
    // …et ne se jette d'une case qu'au dernier moment : trop tard, ace.
    const k = (TOP_Y - 70 - LAND_Y) / (LAND_Y - BOT_Y);
    steps.push({ ball: { x: lx + (lx - SERVER_X) * k, y: -40 }, dur: 380, ret: zoneX(r.shift), burst: { text: "ACE !", at: { x: lx, y: 96 } } });
    return steps;
  }
  // …puis se décale au dernier moment (s'il n'était pas sur la bonne
  // zone) et touche la balle.
  steps.push({ ball: { x: lx, y: TOP_Y + 18 }, dur: 260, ret: zoneX(r.shift) });
  if (r.kind === "return_winner") {
    // Bien lu : retour gagnant à l'opposé du serveur. La balle rebondit
    // d'abord dans le terrain (côté serveur, loin de lui), puis file hors du cadre.
    steps.push({ ball: { x: 292, y: 352 }, dur: 430, srv: SERVER_X - 20, bounce: true });
    steps.push({ ball: { x: VW + 50, y: VH + 50 }, dur: 260, burst: { text: "RETOUR GAGNANT !", at: { x: 250, y: 290 } } });
    return steps;
  }
  // 2. Un point se joue : échanges, puis le dernier coup.
  const rally = r.rally;
  const finalByWinner = rally.end === "winner" || rally.end === "drop";
  // Frappeur du dernier coup : 0 = relanceur, 1 = serveur (alternance R, S, R…).
  const winnerIsServer = rally.serverWins;
  const finalHitter = finalByWinner ? (winnerIsServer ? 1 : 0) : (winnerIsServer ? 0 : 1);
  let shots = rally.rallies;
  if (shots % 2 !== finalHitter) shots++;
  let hitterTop = true; // le relanceur (en haut) frappe en premier
  for (let i = 0; i < shots; i++) {
    const x = rnd(70, 290);
    if (hitterTop) steps.push({ ball: { x, y: BOT_Y - 14 }, dur: 430, srv: x });
    else steps.push({ ball: { x, y: TOP_Y + 18 }, dur: 430, ret: x });
    hitterTop = !hitterTop;
  }
  // Dernier coup, frappé par hitterTop ? relanceur : serveur.
  const toBottom = hitterTop; // la balle part vers le bas si le relanceur frappe
  const labels = { winner: "GAGNANT !", net: "FILET !", out: "FAUTE !", drop: "AMORTIE !" };
  let end;
  if (rally.end === "winner") {
    // Coup gagnant : rebond dans le terrain adverse, loin du joueur, puis hors cadre.
    const side = rnd(0, 1) < 0.5 ? -1 : 1;
    steps.push({ ball: { x: 180 + side * 112, y: toBottom ? 352 : 68 }, dur: 430, bounce: true });
    end = { x: side < 0 ? -50 : VW + 50, y: toBottom ? VH + 50 : -50 };
  }
  else if (rally.end === "net") end = { x: rnd(90, 270), y: toBottom ? NET_Y - 8 : NET_Y + 8 };
  else if (rally.end === "out") end = { x: rnd(0, 1) < 0.5 ? 8 : VW - 8, y: toBottom ? 330 : 90 };
  else end = { x: rnd(110, 250), y: toBottom ? NET_Y + 22 : NET_Y - 22 };
  const burstAt = { x: Math.min(290, Math.max(70, end.x)), y: toBottom ? 300 : 110 };
  steps.push({ ball: end, dur: rally.end === "drop" ? 600 : rally.end === "winner" ? 260 : 460, bounce: rally.end !== "winner", burst: { text: labels[rally.end], at: burstAt } });
  return steps;
}

// kind : "serve_duel" | "return_duel" | "smash"
// onDone(win, text, zone) : appelé quand le joueur clique « Continuer ».
export function MatchMiniGame({ kind, oppName, oppStats, history, stake = "Balle de jeu", oppAvatar, myAvatar, myMental, onDone }) {
  const [res, setRes] = useState(null);
  const [phase, setPhase] = useState("pick"); // pick → play → reveal
  const [ball, setBall] = useState(null);     // { x, y, dur }
  const [retX, setRetX] = useState(zoneX(1));
  const [srvX, setSrvX] = useState(SERVER_X);
  const [hideZones, setHideZones] = useState(false);
  const [bounces, setBounces] = useState([]);
  const [burst, setBurst] = useState(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const title = kind === "serve_duel" ? "Duel au service !" : kind === "return_duel" ? "Duel au retour !" : kind === "mental" ? "Sang-froid !" : "Smash !";
  const caption = kind === "return_duel" ? stake + " · " + oppName + " va servir. Où va-t-il frapper ?"
    : kind === "smash" ? stake + " · une balle haute flotte au-dessus du filet…"
    : kind === "mental" ? stake + " · le public retient son souffle…"
    : stake;
  // Serveur en bas, relanceur en haut.
  const server = kind === "serve_duel" ? { avatar: myAvatar, label: "Vous" } : { avatar: oppAvatar, label: oppName };
  const returner = kind === "serve_duel" ? { avatar: oppAvatar, label: oppName } : { avatar: myAvatar, label: "Vous" };

  const pickZone = (i) => {
    if (res) return;
    let r;
    if (kind === "serve_duel") {
      const guess = opponentRead(history, oppStats);
      r = { ...serveDuel(i, guess), zone: i, serveZone: i, readZone: guess };
    } else {
      const out = returnDuel(i);
      r = { ...out, zone: null, serveZone: out.target, readZone: i };
    }
    setRes(r);
    setPhase("play");
    // Les propositions disparaissent, puis l'échange se joue étape par étape.
    const steps = buildDuelSteps(r);
    let t = 220;
    steps.forEach((st, k) => {
      timers.current.push(setTimeout(() => {
        if (st.hideZones) setHideZones(true);
        if (st.ret !== undefined) setRetX(st.ret);
        if (st.srv !== undefined) setSrvX(st.srv);
        setBall({ x: st.ball.x, y: st.ball.y, dur: st.dur });
      }, t));
      t += st.dur + (k === 0 ? 260 : 0);
      if (st.bounce) timers.current.push(setTimeout(() => setBounces(b => [...b, { x: st.ball.x, y: st.ball.y, id: k }]), t));
      if (st.burst) timers.current.push(setTimeout(() => setBurst(st.burst), t - 60));
    });
    timers.current.push(setTimeout(() => setPhase("reveal"), t + 450));
  };

  const revealed = phase === "reveal";
  const figure = (who, x, y) => (
    <div style={{ position: "absolute", left: pct(x, VW), top: pct(y, VH), width: 0, height: 0, zIndex: 3, transition: "left 0.24s cubic-bezier(.3,1.3,.6,1)" }}>
      <div style={{ position: "absolute", left: -21, top: -21, width: 42, height: 42, borderRadius: "50%", overflow: "hidden", border: "2.5px solid " + INK, background: "#ffffff", animation: phase === "pick" ? "tm-mg-bob 0.9s ease-in-out infinite" : "none" }}>
        {who.avatar ? <Avatar config={who.avatar} size={42} bare /> : null}
      </div>
      <div style={{ position: "absolute", left: -45, width: 90, top: y < NET_Y ? -38 : 23, textAlign: "center", fontSize: 9.5, fontWeight: 800, color: "#ffffff", textShadow: "1px 1px 0 " + INK, whiteSpace: "nowrap" }}>{who.label}</div>
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 10 }}>
      <style>{MG_KEYFRAMES}</style>
      <div style={{ alignSelf: "center" }}><Sfx>{title}</Sfx></div>
      <Caption>{caption}</Caption>
      {kind === "mental"
        ? <MentalGame mental={myMental} done={!!res} onEnd={(win, n) => { setRes({ win, zone: null, text: win ? n + " respirations sur 3 : vous restez de glace, point gagné." : n + " respiration" + (n > 1 ? "s" : "") + " sur 3 : crispé, le point vous échappe." }); setPhase("reveal"); }} />
        : kind === "smash"
        ? <SmashGauge done={!!res} onHit={(precision) => { setRes({ ...smashResult(precision), zone: null }); setPhase("reveal"); }} />
        : (
          <div style={{ position: "relative", width: "100%", aspectRatio: VW + " / " + VH, maxHeight: "56vh", alignSelf: "center", background: GRASS, border: "3px solid " + INK, boxShadow: "5px 5px 0 " + INK, overflow: "hidden" }}>
            <svg viewBox={"0 0 " + VW + " " + VH} width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
              <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} fill="#2f9a5c" />
              <path d="M16 16 L344 16 L344 404 L16 404 Z M40 16 L40 404 M320 16 L320 404 M40 112 L320 112 M40 308 L320 308 M180 112 L180 308" fill="none" stroke="#ffffff" strokeWidth="4" />
              <path d={"M4 " + NET_Y + " L356 " + NET_Y} stroke={INK} strokeWidth="7" />
              <path d={"M4 " + NET_Y + " L356 " + NET_Y} stroke="#ffffff" strokeWidth="2" strokeDasharray="6 5" />
            </svg>
            {/* Les trois zones du carré visé, cliquables, qui s'effacent dès le choix */}
            {ORDER.map((zi, k) => {
              const chosen = res && (res.zone === zi || (kind === "return_duel" && res.readZone === zi));
              return (
                <button key={ZONES[zi]} onClick={() => pickZone(zi)} disabled={!!res} style={{
                  position: "absolute", zIndex: 2,
                  left: pct(BOX.x + k * CELL + 2.5, VW), width: pct(CELL - 5, VW),
                  top: pct(BOX.y + 4, VH), height: pct(BOX.h - 8, VH),
                  border: "2.5px solid " + INK, cursor: res ? "default" : "pointer", padding: 0,
                  background: chosen ? BALL : "rgba(255,255,255,0.92)", color: INK,
                  opacity: hideZones ? 0 : 1, pointerEvents: hideZones ? "none" : "auto",
                  transition: "opacity 0.18s, background 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: T.display, fontSize: 10.5, letterSpacing: 0, lineHeight: 1.05, textTransform: "uppercase", overflow: "hidden", textAlign: "center",
                }}>{zi === 0 ? <span>Exté-<br />rieur</span> : ZONES[zi]}</button>
              );
            })}
            {figure(returner, retX, TOP_Y)}
            {figure(server, srvX, BOT_Y)}
            {/* Traces de rebond */}
            {bounces.map(b => (
              <div key={b.id} style={{ position: "absolute", left: pct(b.x, VW), top: pct(b.y, VH), width: 14, height: 8, marginLeft: -7, marginTop: -4, borderRadius: "50%", border: "2px solid " + INK, background: "rgba(214,239,60,0.6)", zIndex: 1 }} />
            ))}
            {/* La balle */}
            {ball && (
              <div style={{ position: "absolute", left: pct(ball.x, VW), top: pct(ball.y, VH), width: 0, height: 0, zIndex: 5, transition: ball.dur ? "left " + ball.dur + "ms linear, top " + ball.dur + "ms linear" : "none" }}>
                <div key={ball.x + ":" + ball.y} style={{ position: "absolute", left: -7, top: -7, width: 14, height: 14, borderRadius: "50%", background: BALL, border: "2.5px solid " + INK, animation: ball.dur ? "tm-mg-arc " + ball.dur + "ms ease-in-out both" : "none" }} />
              </div>
            )}
            {burst && <Burst x={pct(burst.at.x, VW)} y={pct(burst.at.y, VH)} text={burst.text} color={res && res.win ? BALL : LILAC} />}
          </div>
        )}
      {!res && kind !== "smash" && (
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.fg }}>
          {kind === "serve_duel" ? "Servez là où il ne vous attend pas." : "Placez-vous là où il va servir."}
        </div>
      )}
      {res && revealed && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#ffffff", color: INK, border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, padding: "10px 12px", animation: "tm-mg-pop 0.3s ease-out both" }}>
          <Sfx color={res.win ? BALL : LILAC}>{kind === "mental" ? (res.win ? "SANG-FROID !" : "CRISPÉ…") : res.win ? "JEU !" : "ÉGALITÉ"}</Sfx>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{res.text}</div>
        </div>
      )}
      {res && revealed && (
        <button onClick={() => onDone(res.win, res.text, res.zone)} style={{
          minHeight: 52, border: "3px solid " + INK, background: PURPLE, color: "#ffffff", cursor: "pointer",
          fontFamily: T.display, fontSize: 19, textTransform: "uppercase", boxShadow: "4px 4px 0 " + INK,
        }}>Continuer ▶</button>
      )}
    </div>
  );
}

// Mini-jeu mental (balle de set au tie-break) : le cœur bat, il faut
// toucher trois fois quand il est au plus calme (cercle au plus petit,
// dans l'anneau vert). Le mental du joueur élargit la marge. 2 sur 3 = gagné.
function MentalGame({ mental = 60, done, onEnd }) {
  const [t, setT] = useState(0);
  const [taps, setTaps] = useState([]);
  const tRef = useRef(0);
  const rafRef = useRef(null);
  const speed = useRef(1);
  const tol = Math.max(0.1, Math.min(0.3, 0.18 + ((mental ?? 60) - 60) / 400));
  useEffect(() => {
    if (done) return undefined;
    let last = null;
    const step = (now) => {
      if (last === null) last = now;
      tRef.current += ((now - last) / 1000) * speed.current;
      last = now;
      setT(tRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [done]);
  // Phase 0 → 1 : 0 = cœur au plus calme (petit), 0,5 = au plus fort.
  const phase = (x) => (x / 1.05) % 1;
  const ph = phase(t);
  const size = 0.35 + 0.65 * (0.5 - 0.5 * Math.cos(ph * 2 * Math.PI)); // 0,35 → 1
  const tap = () => {
    if (done || taps.length >= 3) return;
    const d = Math.min(ph, 1 - ph); // distance au moment le plus calme
    const good = d <= tol;
    const next = [...taps, good];
    setTaps(next);
    speed.current *= 1.18; // le cœur s'emballe
    if (next.length === 3) {
      cancelAnimationFrame(rafRef.current);
      const n = next.filter(Boolean).length;
      onEnd(n >= 2, n);
    }
  };
  const R = 70;
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>Touchez « Respirer » quand le cœur est au plus calme (dans l'anneau vert). Trois fois.</div>
      <div onPointerDown={tap} style={{ position: "relative", height: 210, border: "3px solid " + INK, boxShadow: "5px 5px 0 " + INK, background: LILAC, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", touchAction: "manipulation", userSelect: "none", overflow: "hidden" }}>
        <svg viewBox="-100 -100 200 200" width="200" height="200" aria-hidden="true">
          <circle r={R * (0.35 + 0.65 * tol * 1.2)} fill="none" stroke={GRASS} strokeWidth={R * 0.65 * tol * 2.4} opacity="0.55" />
          <circle r={R * size} fill="#c4302b" stroke={INK} strokeWidth="4" />
          <path d="M-14 -4 C-14 -16 2 -16 0 -6 C-2 -16 14 -16 14 -4 C14 6 0 14 0 18 C0 14 -14 6 -14 -4 Z" fill="#ffffff" opacity="0.85" transform={"scale(" + (0.6 + size * 0.8) + ")"} />
        </svg>
        <div style={{ position: "absolute", top: 8, right: 10, display: "flex", gap: 6 }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid " + INK, background: i < taps.length ? (taps[i] ? BALL : "#ffffff") : "transparent" }} />
          ))}
        </div>
      </div>
      {!done && (
        <button onClick={tap} style={{
          minHeight: 56, border: "3px solid " + INK, background: BALL, color: INK, cursor: "pointer",
          fontFamily: T.display, fontSize: 22, textTransform: "uppercase", boxShadow: "4px 4px 0 " + INK,
        }}>Respirer</button>
      )}
    </>
  );
}

// Jauge de timing : l'aiguille fait des allers-retours, il faut frapper
// quand elle traverse la zone verte.
const GREEN_CENTER = 0.5, GREEN_HALF = 0.08, NEAR_HALF = 0.18;
function SmashGauge({ done, onHit }) {
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (done) return undefined;
    let start = null;
    const step = (now) => {
      if (start === null) start = now;
      const t = ((now - start) / 720) % 2; // aller en 0,72 s, retour en 0,72 s
      const p = t < 1 ? t : 2 - t;
      posRef.current = p;
      setPos(p);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [done]);
  const hit = () => {
    if (done) return;
    cancelAnimationFrame(rafRef.current);
    const d = Math.abs(posRef.current - GREEN_CENTER);
    const precision = d <= GREEN_HALF ? 0.6 + 0.4 * (1 - d / GREEN_HALF) : d <= NEAR_HALF ? 0.25 + 0.35 * (1 - (d - GREEN_HALF) / (NEAR_HALF - GREEN_HALF)) : 0;
    onHit(precision);
  };
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>Touchez « Frapper » quand l'aiguille passe dans la zone verte.</div>
      <div style={{ position: "relative", height: 52, border: "3px solid " + INK, background: LILAC, boxShadow: "4px 4px 0 " + INK, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: ((GREEN_CENTER - NEAR_HALF) * 100) + "%", width: (NEAR_HALF * 200) + "%", background: "#ffffff" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: ((GREEN_CENTER - GREEN_HALF) * 100) + "%", width: (GREEN_HALF * 200) + "%", background: GRASS, borderLeft: "2.5px solid " + INK, borderRight: "2.5px solid " + INK }} />
        <div style={{ position: "absolute", top: -2, bottom: -2, width: 7, marginLeft: -3, left: (pos * 100) + "%", background: INK }} />
      </div>
      {!done && (
        <button onClick={hit} style={{
          minHeight: 56, border: "3px solid " + INK, background: BALL, color: INK, cursor: "pointer",
          fontFamily: T.display, fontSize: 22, textTransform: "uppercase", boxShadow: "4px 4px 0 " + INK,
        }}>Frapper !</button>
      )}
    </>
  );
}

// ─── À L'ENTRAÎNEMENT ─────────────────────────────────────────────────────
// Trois programmes avec leur probabilité de réussite (façon essais libres).
// Au choix, le jet est tiré puis animé sur une jauge : à gauche du seuil,
// réussi ; à droite, raté. onPick(id, outcome) lance la séance.
// Pourcentage arrondi à l'entier (ex. 71 %).
const fmtPct = (p) => Math.round(p * 100) + " %";
const fmtGain = (g) => "+" + g.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function TrainingCards({ mod, energyCost, gains, statLabel, odds, oddsCtx, noStaff = false, onPick, onClose }) {
  const colors = { commune: "#ffffff", rare: LILAC, mystere: BALL };
  const [chosen, setChosen] = useState(null); // { card, outcome }
  const [needle, setNeedle] = useState(0);
  const [settled, setSettled] = useState(false);
  const rafRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!chosen) return undefined;
    // L'aiguille fait des allers-retours d'un bord à l'autre de la jauge
    // (elle rebondit pile sur les bords), ralentit, puis se pose sur le jet.
    // Trajet : 0 → 1 → 0 → 1 → 0 → jet ; s = distance parcourue (0 à 4 + jet).
    const DUR = 1900;
    const roll = chosen.outcome.roll;
    const total = 4 + roll;
    const at = (d) => {
      if (d >= 4) return d - 4;
      const leg = Math.floor(d), f = d - leg;
      return leg % 2 === 0 ? f : 1 - f;
    };
    let start = null;
    const step = (now) => {
      if (start === null) start = now;
      const k = Math.min(1, (now - start) / DUR);
      const ease = 1 - Math.pow(1 - k, 2.4);
      setNeedle(k < 1 ? at(ease * total) : roll);
      if (k < 1) rafRef.current = requestAnimationFrame(step);
      else setSettled(true);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [chosen]);

  // Sans staff, pas de coach : le pari est le vôtre.
  const cardName = (c) => (noStaff && c.id === "mystere" ? "Pari audacieux" : c.name);
  const pick = (card) => {
    if (chosen) return;
    setChosen({ card, outcome: rollTraining(card, oddsCtx) });
  };

  return (
    <div ref={boxRef} className="tm-paper" onClick={() => !chosen && onClose()} style={{ position: "fixed", inset: 0, zIndex: 300, padding: 16, overflowY: "auto" }}>
      <BoxShade boxRef={boxRef} side="top" />
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, minHeight: "calc(100% - 0px)", margin: "0 auto", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "3px solid " + INK, paddingBottom: 4 }}>
          <span className="tm-display" style={{ fontSize: 22, color: T.fg }}>{mod.name}</span>
          <span className="tm-eyebrow" style={{ color: T.fg }}>Programme du jour</span>
        </div>
        {chosen && <Caption>{cardName(chosen.card) + (noStaff ? "… c'est parti." : "… le coach lance le chrono.")}</Caption>}

        {!chosen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TRAINING_CARDS.map(c => {
              const p = odds[c.id] ?? c.baseP;
              const pct = Math.round(p * 100);
              return (
                <button key={c.id} onClick={() => pick(c)} style={{
                  padding: 0, border: "3px solid " + INK, background: colors[c.id], color: INK,
                  boxShadow: "4px 4px 0 " + INK, cursor: "pointer",
                  display: "grid", gridTemplateColumns: "minmax(0, 1fr) 92px", textAlign: "left", fontFamily: T.body,
                }}>
                  <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ background: INK, color: c.id === "commune" ? "#ffffff" : BALL, fontSize: 9.5, fontWeight: 800, letterSpacing: 1, padding: "2px 6px", textTransform: "uppercase" }}>{c.rarity}</span>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{cardName(c)}</span>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 800 }}>
                      {fmtGain(gains[c.id] ?? 0)} en {statLabel}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#3c3c34" }}>{c.desc}</div>
                    <div style={{ height: 10, border: "2px solid " + INK, background: "#ffffff", marginTop: 2 }}>
                      <div style={{ width: pct + "%", height: "100%", background: GRASS }} />
                    </div>
                  </div>
                  <div style={{ borderLeft: "3px solid " + INK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
                    <div className="tm-display" style={{ fontSize: 24, lineHeight: 1 }}>{fmtPct(p)}</div>
                    <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6 }}>RÉUSSITE</div>
                  </div>
                </button>
              );
            })}
            <div style={{ fontSize: 11.5, fontWeight: 600, color: T.fg3, lineHeight: 1.45 }}>
              Énergie −{energyCost} quel que soit le programme.
              Les chances montent avec {noStaff ? "votre énergie et votre bonheur" : "votre énergie, votre bonheur et un bon coach"}.
            </div>
            <button onClick={onClose} style={{ minHeight: 46, border: "2.5px solid " + INK, background: T.bg1, color: T.fg, fontFamily: T.body, fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}>Annuler</button>
          </div>
        )}

        {chosen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Jauge : zone verte = réussite (jusqu'au seuil), lilas = échec */}
            <div style={{ position: "relative", height: 64, border: "3px solid " + INK, boxShadow: "5px 5px 0 " + INK, background: LILAC, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (chosen.outcome.p * 100) + "%", background: GRASS, borderRight: "3px solid " + INK }} />
              <div style={{ position: "absolute", left: 8, top: 6, color: "#ffffff", fontFamily: T.display, fontSize: 14 }}>RÉUSSITE {fmtPct(chosen.outcome.p)}</div>
              <div style={{ position: "absolute", right: 8, bottom: 6, color: INK, fontFamily: T.display, fontSize: 14 }}>ÉCHEC</div>
              <div style={{ position: "absolute", top: -3, bottom: -3, width: 8, left: "calc(" + (needle * 100) + "% - " + (needle * 8) + "px)", background: INK }} />
            </div>
            {settled && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#ffffff", color: INK, border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, padding: "10px 12px" }}>
                <Sfx color={chosen.outcome.success ? BALL : LILAC}>{chosen.outcome.success ? "RÉUSSI !" : "RATÉ…"}</Sfx>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
                  {chosen.outcome.success
                    ? "Programme bouclé : " + fmtGain(gains[chosen.card.id] ?? 0) + " en " + statLabel + "."
                    : "Programme raté : pas de progrès cette fois."}
                </div>
              </div>
            )}
            {settled && (
              <button onClick={() => onPick(chosen.card.id, chosen.outcome)} style={{
                minHeight: 52, border: "3px solid " + INK, background: PURPLE, color: "#ffffff", cursor: "pointer",
                fontFamily: T.display, fontSize: 19, textTransform: "uppercase", boxShadow: "4px 4px 0 " + INK,
              }}>Continuer ▶</button>
            )}
          </div>
        )}
      </div>
      <BoxShade boxRef={boxRef} side="bottom" />
    </div>
  );
}
