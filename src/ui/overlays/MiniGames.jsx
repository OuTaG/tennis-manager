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
// kind : "serve_duel" | "return_duel" | "smash"
// onDone(win, text, zone) : appelé quand le joueur clique « Continuer ».
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

// kind : "serve_duel" | "return_duel" | "smash"
// onDone(win, text, zone) : appelé quand le joueur clique « Continuer ».
export function MatchMiniGame({ kind, oppName, oppStats, myStats, history, stake = "Balle de jeu", oppAvatar, myAvatar, onDone }) {
  const [res, setRes] = useState(null);
  const [phase, setPhase] = useState("pick"); // pick → flight → reveal
  const [ballAt, setBallAt] = useState(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const title = kind === "serve_duel" ? "Duel au service !" : kind === "return_duel" ? "Duel au retour !" : "Smash !";
  const caption = kind === "return_duel" ? stake + " · " + oppName + " va servir. Où va-t-il frapper ?"
    : kind === "smash" ? stake + " · une balle haute flotte au-dessus du filet…"
    : stake;

  // Demi-court adverse vu depuis le serveur : fond de court en haut, filet en
  // bas. Le carré de service visé (à droite de la ligne médiane) est découpé
  // en trois zones, du T (contre la ligne médiane) au large (contre le couloir).
  const VW = 360, VH = 250;
  const BOX = { x: 180, y: 116, w: 164, h: 116 };
  const ORDER = [2, 1, 0]; // Au T, Corps, Large (indices de ZONES)
  const cellW = BOX.w / 3;
  const pct = (v, total) => (v / total * 100) + "%";
  const zoneX = (zi) => BOX.x + ORDER.indexOf(zi) * cellW + cellW / 2;
  const zoneY = BOX.y + BOX.h / 2;
  // Départ de la balle : votre service part d'en bas, le sien d'en haut.
  const ballStart = kind === "serve_duel" ? { x: 110, y: 262 } : { x: 110, y: 46 };
  // Le relanceur : l'adversaire au fond (duel au service), vous près du filet (duel au retour).
  const rest = kind === "serve_duel" ? { x: 262, y: 58 } : { x: 262, y: 246 };
  const moverX = res ? zoneX(kind === "serve_duel" ? res.shown : res.picked) : rest.x;

  const pickZone = (i) => {
    if (res) return;
    let r;
    if (kind === "serve_duel") {
      const guess = opponentRead(history, oppStats);
      r = { ...serveDuel(i, guess, myStats?.serve), zone: i, shown: guess, landing: i };
    } else {
      const out = returnDuel(i, oppStats?.serve);
      r = { ...out, zone: null, shown: out.target, picked: i, landing: out.target };
    }
    setRes(r);
    setPhase("flight");
    setBallAt(ballStart);
    // La balle part à l'image suivante (pour que la transition joue).
    timers.current.push(setTimeout(() => setBallAt({ x: zoneX(r.landing), y: zoneY }), 40));
    timers.current.push(setTimeout(() => setPhase("reveal"), 760));
  };

  const revealed = phase === "reveal";
  const burstText = !res ? "" : kind === "serve_duel"
    ? (res.zone !== res.shown ? "ACE !" : res.win ? "PASSÉ !" : "RETOUR !")
    : (res.picked === res.shown ? "BIEN LU !" : res.win ? "SAUVÉ !" : "TROP TARD");

  const figure = (avatar, x, y, label) => (
    <div style={{ position: "absolute", left: pct(x, VW), top: pct(y, VH), width: 0, height: 0, zIndex: 3, transition: "left 0.45s cubic-bezier(.3,1.4,.6,1)" }}>
      <div style={{ position: "absolute", left: -22, top: -22, width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "2.5px solid " + INK, background: "#ffffff", animation: phase === "pick" ? "tm-mg-bob 0.9s ease-in-out infinite" : "none" }}>
        {avatar ? <Avatar config={avatar} size={44} bare /> : null}
      </div>
      <div style={{ position: "absolute", left: -40, width: 80, top: 24, textAlign: "center", fontSize: 9.5, fontWeight: 800, color: "#ffffff", textShadow: "1px 1px 0 " + INK, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 10 }}>
      <style>{MG_KEYFRAMES}</style>
      <div style={{ alignSelf: "center" }}><Sfx>{title}</Sfx></div>
      <Caption>{caption}</Caption>
      {kind === "smash"
        ? <SmashGauge done={!!res} onHit={(precision) => { setRes({ ...smashResult(precision), zone: null }); setPhase("reveal"); }} />
        : (
          <div style={{ position: "relative", width: "100%", aspectRatio: VW + " / " + VH, background: GRASS, border: "3px solid " + INK, boxShadow: "5px 5px 0 " + INK, overflow: "hidden" }}>
            <svg viewBox={"0 0 " + VW + " " + VH} width="100%" height="100%" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
              <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} fill="#2f9a5c" />
              <path d="M2 20 L358 20 M2 20 L2 232 M358 20 L358 232 M16 20 L16 232 M344 20 L344 232 M16 116 L344 116 M180 116 L180 232" fill="none" stroke="#ffffff" strokeWidth="4" />
              <path d="M4 236 L356 236" stroke={INK} strokeWidth="8" />
              <path d="M4 236 L356 236" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 5" />
            </svg>
            {ORDER.map((zi, k) => {
              const z = ZONES[zi];
              const chosen = res && (res.zone === zi || res.picked === zi);
              const shown = revealed && res.shown === zi;
              return (
                <button key={z} onClick={() => pickZone(zi)} disabled={!!res} style={{
                  position: "absolute", zIndex: 2,
                  left: pct(BOX.x + k * cellW + 2.5, VW), width: pct(cellW - 5, VW),
                  top: pct(BOX.y + 4, VH), height: pct(BOX.h - 8, VH),
                  border: "2.5px solid " + INK, cursor: res ? "default" : "pointer", padding: 0,
                  background: chosen ? BALL : shown ? LILAC : res ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.92)", color: INK,
                  boxShadow: chosen ? "2px 2px 0 " + INK : "none", transition: "background 0.2s",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                  fontFamily: T.display, fontSize: 11.5, letterSpacing: 0, lineHeight: 1, textTransform: "uppercase", overflow: "hidden",
                }}>
                  <span>{z}</span>
                  {shown && <span style={{ fontFamily: T.body, fontSize: 8.5, fontWeight: 800, lineHeight: 1.1 }}>{kind === "serve_duel" ? "IL ATTENDAIT" : "IL A SERVI"}</span>}
                </button>
              );
            })}
            {/* Les joueurs : l'adversaire en haut ; au retour, vous près du filet */}
            {kind === "serve_duel"
              ? figure(oppAvatar, moverX, rest.y, oppName)
              : <>
                  {figure(oppAvatar, 110, 46, oppName)}
                  {figure(myAvatar, moverX, rest.y - 18, "Vous")}
                </>}
            {/* La balle, en cloche */}
            {ballAt && (
              <div style={{ position: "absolute", left: pct(ballAt.x, VW), top: pct(ballAt.y, VH), width: 0, height: 0, zIndex: 5, transition: "left 0.62s linear, top 0.62s cubic-bezier(.2,.7,.4,1)" }}>
                <div style={{ position: "absolute", left: -8, top: -8, width: 16, height: 16, borderRadius: "50%", background: BALL, border: "2.5px solid " + INK, animation: "tm-mg-arc 0.64s ease-in-out both" }} />
              </div>
            )}
            {revealed && res && <Burst x={pct(Math.min(290, Math.max(70, zoneX(res.landing))), VW)} y={pct(BOX.y - 6, VH)} text={burstText} color={res.win ? BALL : LILAC} />}
          </div>
        )}
      {!res && kind !== "smash" && (
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.fg }}>
          {kind === "serve_duel" ? "Servez là où il ne vous attend pas." : "Devinez la zone : bonne lecture = retour gagnant."}
        </div>
      )}
      {res && revealed && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#ffffff", color: INK, border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, padding: "10px 12px", animation: "tm-mg-pop 0.3s ease-out both" }}>
          <Sfx color={res.win ? BALL : LILAC}>{res.win ? "JEU !" : "ÉGALITÉ"}</Sfx>
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
// Pourcentage exact, au dixième (ex. 71,4 %).
const fmtPct = (p) => (Math.round(p * 1000) / 10).toLocaleString("fr-FR") + " %";
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
    // L'aiguille balaie la jauge deux fois puis se pose sur le jet.
    const DUR = 1500;
    let start = null;
    const step = (now) => {
      if (start === null) start = now;
      const k = Math.min(1, (now - start) / DUR);
      const ease = 1 - Math.pow(1 - k, 3);
      const sweep = Math.abs(Math.sin(ease * Math.PI * 2.5));
      setNeedle(k < 1 ? sweep * (1 - ease) + chosen.outcome.roll * ease : chosen.outcome.roll);
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
              const pct = Math.round(p * 1000) / 10;
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
              <div style={{ position: "absolute", top: -3, bottom: -3, width: 8, marginLeft: -4, left: (needle * 100) + "%", background: INK }} />
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
