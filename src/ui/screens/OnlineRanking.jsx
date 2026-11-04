// Classement mondial en ligne (Game Center) : score d'héritage, avec la
// configuration de départ de chaque joueur (résumée, détaillée au toucher)
// et des filtres pour se comparer à conditions égales.
import { useEffect, useState } from "react";
import { DIFFICULTY_LEVELS } from "../../engine/difficulty.js";
import { decodeConfig, describeConfig, careerConfigOf } from "../../engine/careerConfig.js";
import { gameCenterSupported, loadLeaderboard } from "../../engine/gamecenter.js";
import { Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";
import { fmtNum } from "../format.js";

const INK = T.ink;
const panel = { background: "#ffffff", color: "#141414", border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, marginBottom: 14 };
const chip = (on) => ({
  padding: "5px 10px", fontSize: 12, fontWeight: 800, textTransform: "uppercase", cursor: "pointer",
  background: on ? INK : "#ffffff", color: on ? "#d6ef3c" : "#141414", border: "2.5px solid " + INK, boxShadow: on ? "none" : "2px 2px 0 " + INK,
});

export function OnlineRankingScreen({ player, onBack }) {
  const [scope, setScope] = useState("global");
  const [level, setLevel] = useState("all");
  const [circuit, setCircuit] = useState("all");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);
  const supported = gameCenterSupported();

  useEffect(() => {
    if (!supported) return;
    let alive = true;
    setData(null); setError(null);
    loadLeaderboard({ scope, start: 1, length: 100 })
      .then(r => { if (alive) setData(r); })
      .catch(e => { if (alive) setError(String((e && e.message) || e)); });
    return () => { alive = false; };
  }, [scope, supported]);

  const rows = ((data && data.entries) || []).map(e => ({ ...e, cfg: decodeConfig(e.context) }))
    .filter(e => (level === "all" || (e.cfg && e.cfg.difficulty === level)) && (circuit === "all" || (e.cfg && e.cfg.circuit === circuit)));
  const me = data && data.local;
  const message = (text) => <div className="tm-lettering" style={{ ...panel, textAlign: "center", fontSize: 16, lineHeight: 1.35, padding: 22 }}>{text}</div>;

  return (
    <div style={onBack ? { ...styles.tabContent, paddingTop: 24 } : styles.tabContent}>
      {onBack && (
        <button style={{ ...styles.btnSmall, background: "#ffffff", color: "#141414", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontWeight: 800, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }} onClick={onBack}>
          <Icon name="arrowLeft" size={14} /> Retour
        </button>
      )}
      <div style={styles.sectionTitle}>Classement mondial</div>
      <div className="tm-lettering" style={{ fontSize: 15, lineHeight: 1.3, marginBottom: 12 }}>Le score d'héritage de tous les joueurs de Courtside.</div>

      {player && player.cheated && (
        <div style={{ ...panel, background: "#c4302b", color: "#ffffff", padding: "8px 12px", fontSize: 13, fontWeight: 800 }}>
          Carrière en mode Triche : elle n'est pas envoyée au classement.
        </div>
      )}

      {!supported ? message("Le classement mondial est disponible dans l'app iPhone, avec Game Center.")
        : error ? message("Classement indisponible pour le moment. Vérifiez votre connexion.")
        : !data ? message("Chargement du classement…")
        : data.unavailable ? message("Connectez-vous à Game Center (Réglages de l'iPhone › Game Center) pour voir le classement et y apparaître.")
        : (
          <>
            {/* Votre place */}
            <div className="tm-halftone-yellow" style={{ border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, padding: "10px 12px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <span className="tm-display" style={{ background: INK, color: "#d6ef3c", fontSize: 22, padding: "2px 10px", transform: "rotate(-3deg)" }}>{me ? "#" + fmtNum(me.rank) : "—"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>Votre place{data.total ? " sur " + fmtNum(data.total) : ""}</div>
                <div className="tm-display" style={{ fontSize: 17 }}>{me ? fmtNum(me.score) + " pts" : "Pas encore classé"}</div>
                {player && !player.cheated && !player.challenge && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>Carrière en cours : {describeConfig(careerConfigOf(player)).short}</div>}
              </div>
            </div>

            {/* Filtres */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {[["global", "Monde"], ["friends", "Amis"]].map(([v, l]) => <button key={v} style={chip(scope === v)} onClick={() => setScope(v)}>{l}</button>)}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              <button style={chip(level === "all")} onClick={() => setLevel("all")}>Tous niveaux</button>
              {DIFFICULTY_LEVELS.map(d => <button key={d.level} style={chip(level === d.level)} onClick={() => setLevel(d.level)}>{d.name}</button>)}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {[["all", "Tous circuits"], ["atp", "Masculin"], ["wta", "Féminin"]].map(([v, l]) => <button key={v} style={chip(circuit === v)} onClick={() => setCircuit(v)}>{l}</button>)}
            </div>

            {rows.length === 0 ? message(scope === "friends" ? "Aucun ami classé pour l'instant." : "Aucun joueur avec ces filtres dans le top 100.") : (
              <div style={{ ...panel, padding: "2px 12px" }}>
                {rows.map((e, i) => {
                  const desc = e.cfg ? describeConfig(e.cfg) : null;
                  const isOpen = open === e.rank + ":" + e.name;
                  return (
                    <div key={e.rank + ":" + e.name} style={{ borderBottom: i < rows.length - 1 ? "2px dashed " + INK : "none", background: e.local ? "rgba(214,239,60,0.35)" : "transparent", margin: "0 -12px", padding: "0 12px" }}>
                      <div onClick={() => desc && setOpen(isOpen ? null : e.rank + ":" + e.name)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", cursor: desc ? "pointer" : "default" }}>
                        <span className="tm-display" style={{ minWidth: 44, textAlign: "center", fontSize: 14, background: e.rank <= 3 ? "#d6ef3c" : "#ffffff", border: "2px solid " + INK, padding: "1px 4px" }}>#{e.rank}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="tm-display" style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}{e.local ? " (vous)" : ""}</div>
                          <div style={{ color: "#5b2d8e", fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{desc ? desc.short + (isOpen ? "" : " ›") : "Configuration inconnue"}</div>
                        </div>
                        <span className="tm-display" style={{ fontSize: 16, flexShrink: 0 }}>{fmtNum(e.score)}</span>
                      </div>
                      {isOpen && (
                        <div className="tm-halftone-yellow" style={{ border: "2px solid " + INK, boxShadow: "2px 2px 0 " + INK, padding: "6px 10px", marginBottom: 10 }}>
                          {desc.rows.map(([l, v], k) => (
                            <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, fontWeight: 700, padding: "3px 0", borderTop: k ? "1.5px dashed " + INK : 0 }}>
                              <span>{l}</span><span style={{ fontWeight: 800, textAlign: "right" }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 16 }}>Filtres appliqués au top 100. Les carrières en mode Triche n'apparaissent pas.</div>
          </>
        )}
    </div>
  );
}
