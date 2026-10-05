// Mini-jeux de choix (match et entraînement), en cases de BD.
import { useEffect, useRef, useState } from "react";
import { ZONES, TRAINING_CARDS, opponentRead, returnDuel, serveDuel, smashResult } from "../../engine/minigames.js";
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
      transform: "rotate(-6deg)", lineHeight: 1,
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
export function MatchMiniGame({ kind, oppName, oppStats, myStats, history, onDone }) {
  const [res, setRes] = useState(null);
  const title = kind === "serve_duel" ? "Duel au service !" : kind === "return_duel" ? "Duel au retour !" : "Smash !";
  const caption = kind === "serve_duel" ? "Vous servez. " + oppName + " lit votre service…"
    : kind === "return_duel" ? oppName + " va servir. Où va-t-il frapper ?"
    : "Une balle haute flotte au-dessus du filet…";

  const pickZone = (i) => {
    if (res) return;
    if (kind === "serve_duel") {
      const guess = opponentRead(history, oppStats);
      const r = serveDuel(i, guess, myStats?.serve);
      setRes({ ...r, zone: i, shown: guess });
    } else {
      const r = returnDuel(i, oppStats?.serve);
      setRes({ ...r, zone: null, shown: r.target, picked: i });
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ alignSelf: "center" }}><Sfx>{title}</Sfx></div>
      <Caption>{caption}</Caption>
      {kind === "smash"
        ? <SmashGauge done={!!res} onHit={(precision) => setRes({ ...smashResult(precision), zone: null })} />
        : (
          <div style={{ position: "relative", height: 230, background: GRASS, border: "3px solid " + INK, boxShadow: "5px 5px 0 " + INK }}>
            <svg viewBox="0 0 360 230" width="100%" height="100%" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
              <path d="M30 26 L330 26 L330 210 L30 210 Z M180 26 L180 210 M30 118 L330 118" fill="none" stroke="#ffffff" strokeWidth="4" />
              <path d="M14 10 L346 10" stroke={INK} strokeWidth="6" />
            </svg>
            <div style={{ position: "absolute", left: 34, right: 34, top: 124, bottom: 30, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
              {ZONES.map((z, i) => {
                const chosen = res && (res.zone === i || res.picked === i);
                const shown = res && res.shown === i;
                return (
                  <button key={z} onClick={() => pickZone(i)} disabled={!!res} style={{
                    border: "3px solid " + INK, cursor: res ? "default" : "pointer",
                    background: chosen ? BALL : shown ? LILAC : "#ffffff", color: INK,
                    boxShadow: chosen ? "3px 3px 0 " + INK : "none",
                    fontFamily: T.display, fontSize: 15, textTransform: "uppercase", position: "relative",
                  }}>
                    {z}
                    {shown && <span style={{ position: "absolute", left: 0, right: 0, bottom: 3, fontFamily: T.body, fontSize: 9.5, fontWeight: 800 }}>{kind === "serve_duel" ? "IL ATTENDAIT" : "IL A SERVI"}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: INK, color: "#ffffff", padding: "4px 10px", fontSize: 11.5, fontWeight: 700 }}>
              {kind === "serve_duel" ? "Servez là où il ne vous attend pas. Variez : il repère vos habitudes." : "Devinez la zone : bonne lecture = retour gagnant."}
            </div>
          </div>
        )}
      {res && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#ffffff", color: INK, border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, padding: "10px 12px" }}>
          <Sfx color={res.win ? BALL : LILAC}>{res.win ? "GAGNÉ !" : "RATÉ…"}</Sfx>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{res.text} <span style={{ color: res.win ? GRASS : PURPLE }}>{res.win ? "Élan +2" : "Élan −1"}</span></div>
        </div>
      )}
      {res && (
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
      const t = ((now - start) / 900) % 2; // aller en 0,9 s, retour en 0,9 s
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
// Trois fiches posées par le coach. costs[id] = énergie de la fiche ;
// affordable[id] = assez d'énergie ? onPick(id) lance la séance.
export function TrainingCards({ mod, costs, affordable, onPick, onClose }) {
  const colors = { commune: "#ffffff", rare: LILAC, mystere: BALL };
  return (
    <div className="tm-paper" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "3px solid " + INK, paddingBottom: 4 }}>
          <span className="tm-display" style={{ fontSize: 22, color: T.fg }}>{mod.name}</span>
          <span className="tm-eyebrow" style={{ color: T.fg }}>Choisissez une fiche</span>
        </div>
        <Caption>Le coach étale trois fiches. Une seule sera jouée.</Caption>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {TRAINING_CARDS.map(c => {
            const ok = affordable[c.id];
            const big = c.gainMul === null ? "?" : "×" + c.gainMul;
            return (
              <button key={c.id} onClick={() => ok && onPick(c.id)} disabled={!ok} style={{
                height: 200, padding: 0, border: "3px solid " + INK, background: colors[c.id], color: INK,
                boxShadow: "4px 4px 0 " + INK, cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : 0.45,
                display: "flex", flexDirection: "column", alignItems: "stretch", textAlign: "left", fontFamily: T.body,
              }}>
                <div style={{ background: INK, color: c.id === "commune" ? "#ffffff" : BALL, fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: "3px 6px", textTransform: "uppercase" }}>{c.rarity}</div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 2 }}>
                  <div className="tm-display" style={{ fontSize: 32, lineHeight: 1 }}>{big}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", textAlign: "center" }}>{c.gainMul === null ? "Surprise" : "Gain " + mod.name}</div>
                </div>
                <div style={{ borderTop: "2.5px solid " + INK, background: "#ffffff", padding: "5px 6px", fontSize: 10.5, fontWeight: 700, lineHeight: 1.25, minHeight: 46 }}>
                  Énergie −{costs[c.id]}. {c.desc}{c.happinessDelta ? " Bonheur " + c.happinessDelta + "." : ""}
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={onClose} style={{ minHeight: 46, border: "2.5px solid " + INK, background: T.bg1, color: T.fg, fontFamily: T.body, fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}>Annuler</button>
      </div>
    </div>
  );
}
