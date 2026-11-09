// Classement mondial en ligne (Game Center) : score d'héritage, avec la
// configuration de départ de chaque joueur (résumée, détaillée au toucher)
// et des filtres pour se comparer à conditions égales.
import { useEffect, useState } from "react";
import { DIFFICULTY_LEVELS } from "../../engine/difficulty.js";
import { decodeConfig, describeConfig, careerConfigOf } from "../../engine/careerConfig.js";
import { gameCenterSupported, loadLeaderboard, onGameCenterAuth, signInGameCenter } from "../../engine/gamecenter.js";
import { Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";
import { fmtNum } from "../format.js";

const INK = T.ink;
const PAGE = 100;        // entrées par chargement (maximum de Game Center)
const TOP = 100;         // taille du classement affiché, filtré ou non
const MAX_LOADED = 2000; // au-delà, on arrête de chercher pour un filtre
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
  const [authTick, setAuthTick] = useState(0);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");
  // Connexion à Game Center depuis le jeu : on recharge le classement.
  useEffect(() => onGameCenterAuth(() => setAuthTick(t => t + 1)), []);

  useEffect(() => {
    if (!supported) return;
    let alive = true;
    setData(null); setError(null);
    loadLeaderboard({ scope, start: 1, length: PAGE })
      .then(r => { if (alive) setData(r); })
      .catch(e => { if (alive) setError(String((e && e.message) || e)); });
    return () => { alive = false; };
  }, [scope, supported, authTick]);

  const filtered = level !== "all" || circuit !== "all";
  const all = ((data && data.entries) || []).map(e => ({ ...e, cfg: decodeConfig(e.context) }));
  const matches = (e) => (level === "all" || (e.cfg && e.cfg.difficulty === level)) && (circuit === "all" || (e.cfg && e.cfg.circuit === circuit));
  const rows = all.filter(matches).slice(0, TOP);

  // Filtre actif : on charge les pages suivantes du classement (100 par
  // 100) jusqu'à trouver le top 100 du filtre, dans la limite de MAX_LOADED.
  const [loadingMore, setLoadingMore] = useState(false);
  const canLoadMore = !!(data && data.entries && !data.unavailable) && all.length < Math.min(data.total || 0, MAX_LOADED) && all.length % PAGE === 0;
  useEffect(() => {
    if (!filtered || loadingMore || !canLoadMore || rows.length >= TOP) return;
    let alive = true;
    setLoadingMore(true);
    loadLeaderboard({ scope, start: all.length + 1, length: PAGE })
      .then(r => { if (alive && r && r.entries) setData(d => (d ? { ...d, entries: [...d.entries, ...r.entries] } : d)); })
      .catch(() => { if (alive) setData(d => (d ? { ...d, total: d.entries.length } : d)); })
      .finally(() => { if (alive) setLoadingMore(false); });
    return () => { alive = false; };
  }, [filtered, canLoadMore, rows.length, all.length, scope]);

  const me = data && data.local;
  // Place dans le filtre (si votre ligne est parmi les entrées chargées).
  const myPos = filtered ? all.filter(matches).findIndex(e => e.local) + 1 : 0;
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
        : data.unavailable ? (
          <div style={{ ...panel, padding: 18, textAlign: "center" }}>
            <div className="tm-lettering" style={{ fontSize: 16, lineHeight: 1.35, marginBottom: 12 }}>Connectez-vous à Game Center pour voir le classement et y apparaître.</div>
            <button className="tm-bd-press" style={{ ...styles.btnPrimary, marginBottom: 8, background: "#1f7a45", opacity: signing ? 0.6 : 1 }} disabled={signing} onClick={async () => {
              setSigning(true);
              const r = await signInGameCenter();
              setSigning(false);
              if (r && r.error) setSignError(r.error);
              setAuthTick(t => t + 1);
            }}>{signing ? "Connexion…" : "Se connecter à Game Center"}</button>
            {(signError || data.error) && <div style={{ fontSize: 11.5, fontWeight: 700, color: "#c4302b", marginBottom: 6 }}>Game Center : {signError || data.error}</div>}
            <div style={{ fontSize: 11, fontWeight: 700 }}>Vérifiez que vous êtes connecté dans Réglages de l'iPhone › Game Center, puis réessayez.</div>
          </div>
        )
        : (
          <>
            {/* Votre place */}
            <div className="tm-halftone-yellow" style={{ border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, padding: "10px 12px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <span className="tm-display" style={{ background: INK, color: "#d6ef3c", fontSize: 22, padding: "2px 10px", transform: "rotate(-3deg)" }}>{!me ? "—" : filtered ? (myPos ? "#" + fmtNum(myPos) : "—") : "#" + fmtNum(me.rank)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>{filtered ? "Votre place avec ces filtres" + (me ? " · #" + fmtNum(me.rank) + " mondial" : "") : "Votre place" + (data.total ? " sur " + fmtNum(data.total) : "")}</div>
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

            {rows.length === 0 ? message(scope === "friends" ? "Aucun ami classé pour l'instant." : "Aucun joueur classé avec ces filtres pour l'instant.") : (
              <div style={{ ...panel, padding: "2px 12px" }}>
                {rows.map((e, i) => {
                  const desc = e.cfg ? describeConfig(e.cfg) : null;
                  const isOpen = open === e.rank + ":" + e.name;
                  return (
                    <div key={e.rank + ":" + e.name} style={{ borderBottom: i < rows.length - 1 ? "2px dashed " + INK : "none", background: e.local ? "rgba(214,239,60,0.35)" : "transparent", margin: "0 -12px", padding: "0 12px" }}>
                      <div onClick={() => desc && setOpen(isOpen ? null : e.rank + ":" + e.name)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", cursor: desc ? "pointer" : "default" }}>
                        <span className="tm-display" style={{ minWidth: 44, textAlign: "center", fontSize: 14, background: (filtered ? i + 1 : e.rank) <= 3 ? "#d6ef3c" : "#ffffff", border: "2px solid " + INK, padding: "1px 4px" }}>#{filtered ? i + 1 : e.rank}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="tm-display" style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}{e.local ? " (vous)" : ""}</div>
                          <div style={{ color: "#5b2d8e", fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{desc ? desc.short + (isOpen ? "" : " ›") : "Configuration inconnue"}</div>
                        </div>
                        <span style={{ flexShrink: 0, textAlign: "right" }}>
                          <span className="tm-display" style={{ display: "block", fontSize: 16 }}>{fmtNum(e.score)}</span>
                          {filtered && <span style={{ display: "block", fontSize: 10, fontWeight: 800 }}>#{fmtNum(e.rank)} mondial</span>}
                        </span>
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
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 16 }}>{loadingMore ? "Recherche d'autres joueurs…" : filtered ? "Top 100 des joueurs avec ces filtres, selon la meilleure carrière de chacun." : "Top 100 mondial."} Les carrières en mode Triche n'apparaissent pas.</div>
          </>
        )}
    </div>
  );
}
