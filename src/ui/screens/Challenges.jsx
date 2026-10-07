// Écrans des défis.
import { useState, useMemo } from "react";
import { CITIES } from "../../data/geo.js";
import { CHALLENGES, MEDAL_INFO, challengeContext, computeChallengeScore, getChallengeDef, loadChallengeResults } from "../../engine/challenges.js";
import { randomFullName } from "../../engine/names.js";
import { FlagFromEmoji, Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

// ─── ÉCRANS DES DÉFIS ────────────────────────────────────────────────────────
const INK = T.ink;
const chip = (bg, fg) => ({ display: "inline-block", background: bg, color: fg, border: "2px solid " + INK, fontSize: 11, fontWeight: 800, padding: "0 6px", textTransform: "uppercase", letterSpacing: 0.3 });
const panel = { background: "#ffffff", color: "#141414", border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, marginBottom: 14 };
const bandStyle = { background: INK, color: "#ffffff", padding: "5px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 };
const backBtn = { ...styles.btnSmall, display: "flex", alignItems: "center", gap: 6, marginBottom: 14, background: "#ffffff", color: "#141414", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontWeight: 800 };

export function DifficultyDots({ n }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ width: 9, height: 9, boxSizing: "border-box", border: "2px solid " + INK, background: i <= n ? "#c4302b" : "#ffffff" }} />
      ))}
    </span>
  );
}

export function MedalBadge({ medal, weeks }) {
  const m = MEDAL_INFO[medal];
  if (!m) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "#141414", background: "#ffffff", border: "2px solid " + INK, padding: "0 6px" }}>
      <Icon name="award" size={13} color={m.color} /> {m.label}{weeks !== undefined ? " · " + weeks + " sem." : ""}
    </span>
  );
}

export function ChallengesScreen({ onBack, onStart, onResume, onAbandon, current, owned, goShop }) {
  const [selected, setSelectedRaw] = useState(null);
  const [nat, setNat] = useState("France");
  const [name, setName] = useState("");
  const results = loadChallengeResults();
  const countries = useMemo(() => [...new Set(Object.values(CITIES).map(c => c.country))].sort((a, b) => a.localeCompare(b, "fr")), []);
  const def = selected ? getChallengeDef(selected) : null;
  // Chaque défi se joue sur un circuit imposé (4 ATP, 4 WTA).
  const circuit = def ? def.circuit : "atp";
  const setSelected = (id) => {
    setSelectedRaw(id);
    const d = id ? getChallengeDef(id) : null;
    if (d) setName(randomFullName(nat, d.circuit === "wta"));
  };
  const CircuitBadge = ({ c }) => (
    <span data-nofem="" style={{ ...chip(c === "wta" ? "#5b2d8e" : "#1f7a45", "#ffffff"), fontSize: 10, textTransform: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
      {c === "wta" ? "Circuit féminin" : "Circuit masculin"}
    </span>
  );

  if (def) {
    return (
      <div style={styles.root}>
        <div style={{ padding: "16px 16px 110px" }}>
          <button style={backBtn} onClick={() => setSelected(null)}>
            <Icon name="arrowLeft" size={14} /> Tous les défis
          </button>
          <div style={panel}>
            <div style={bandStyle}>
              <span className="tm-display" style={{ fontSize: 14 }}>Défi</span>
              <span style={{ background: "#ffffff", padding: "2px 4px", border: "2px solid #ffffff", display: "inline-flex" }}><DifficultyDots n={def.difficulty} /></span>
            </div>
            <div className="tm-halftone-yellow" style={{ padding: "12px 16px", borderBottom: "3px solid " + INK }}>
              <div className="tm-display" style={{ color: "#141414", fontSize: 24, lineHeight: 1.05, marginBottom: 4 }}>{def.name}</div>
              <div className="tm-lettering" style={{ color: "#141414", fontSize: 15 }}>{def.tagline}</div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ color: "#141414", fontSize: 13.5, fontWeight: 600, lineHeight: 1.6, marginBottom: 14 }}>{def.context}</div>
              <div style={{ background: "#ffffff", border: "2.5px solid " + INK, boxShadow: "3px 3px 0 " + INK, borderLeft: "8px solid #1f7a45", padding: 12, marginBottom: 14 }}>
                <div className="tm-display" style={{ display: "flex", alignItems: "center", gap: 8, color: "#141414", fontSize: 15 }}>
                  <Icon name="target" size={16} color="#1f7a45" /> {def.objectiveLabel}
                </div>
                <div style={{ color: "#141414", fontSize: 12, fontWeight: 700, marginTop: 4, marginLeft: 24 }}>{def.deadlineLabel}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span className="tm-display" style={{ ...chip(INK, "#ffffff"), fontWeight: 400, fontSize: 12, padding: "1px 8px" }}>Règles du défi</span>
                <div style={{ flex: 1, borderTop: "2px dashed " + INK }} />
              </div>
              {def.perks.map((pk, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "#141414", fontSize: 13, fontWeight: 600, lineHeight: 1.45, marginBottom: 6 }}>
                  <Icon name="chevronRight" size={14} color="#c4302b" style={{ marginTop: 2 }} /> <span>{pk}</span>
                </div>
              ))}
              {results[def.id] && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "2px dashed " + INK, color: "#141414", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  Record : <strong className="tm-display" style={{ ...chip("#d6ef3c", "#141414"), fontWeight: 400, fontSize: 13 }}>{(results[def.id].score || 0).toLocaleString("fr-FR")} pts</strong>
                  {results[def.id].medal && <MedalBadge medal={results[def.id].medal} weeks={results[def.id].weeks} />}
                </div>
              )}
            </div>
          </div>

          <div style={{ ...panel, padding: 16 }}>
            <div style={{ marginBottom: 12 }}><CircuitBadge c={circuit} /></div>
            <label style={styles.label}>Nom</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input style={{ ...styles.input, flex: 1, minWidth: 0 }} value={name} onChange={e => setName(e.target.value)} />
              <button type="button" title="Nom au hasard" onClick={() => setName(randomFullName(nat, circuit === "wta"))}
                style={{ flexShrink: 0, width: 46, cursor: "pointer", background: "#d6ef3c", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="dice" size={20} color="#141414" />
              </button>
            </div>
            <label style={styles.label}>Nationalité</label>
            <select value={nat} onChange={e => { setNat(e.target.value); }} style={{ ...styles.input, appearance: "auto", marginBottom: 14 }}>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {current && (
              <div role="alert" style={{ display: "flex", alignItems: "stretch", background: "#ffffff", color: "#141414", border: "2.5px solid " + INK, boxShadow: "3px 3px 0 " + INK, fontSize: 12.5, fontWeight: 700, marginBottom: 14, lineHeight: 1.45 }}>
                <span style={{ flexShrink: 0, width: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "#e0a21b", borderRight: "2.5px solid " + INK }}><Icon name="warning" size={16} color="#141414" /></span>
                <span style={{ padding: "6px 9px" }}>Lancer ce défi remplacera le défi en cours ({(getChallengeDef(current.challenge) || {}).name || "défi"}).</span>
              </div>
            )}
            {owned ? (
              <button style={styles.btnPrimary} disabled={name.trim().length < 2}
                onClick={() => onStart(def, { name: name.trim(), nationality: nat, circuit })}>
                Lancer le défi
              </button>
            ) : (
              <button style={{ ...styles.btnPrimary, background: "#e0a21b", color: "#141414" }} onClick={goShop}>
                Débloquer les défis · Boutique
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <div style={{ padding: "16px 16px 110px" }}>
        <button style={backBtn} onClick={onBack}>
          <Icon name="arrowLeft" size={14} /> Menu principal
        </button>
        <div style={styles.sectionTitle}>Défis</div>
        {!owned && (
          <div className="tm-halftone-yellow" style={{ border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, padding: 12, marginBottom: 14, color: "#141414", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 30, height: 30, flexShrink: 0, background: INK, border: "2px solid " + INK, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="lock" size={16} color="#d6ef3c" /></span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>Les défis scénarisés se débloquent dans la boutique.</span>
            <button className="tm-display" style={{ ...styles.btnSmall, fontFamily: T.display, background: "#1f7a45", color: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontWeight: 400, fontSize: 13 }} onClick={goShop}>Boutique</button>
          </div>
        )}
        {current && (
          <div className="tm-halftone-lilac" style={{ ...panel, background: undefined, padding: 14 }}>
            <span style={chip(INK, "#ffffff")}>Défi en cours</span>
            <div className="tm-display" style={{ color: "#141414", fontSize: 18, marginTop: 4 }}>{(getChallengeDef(current.challenge) || {}).name}</div>
            <div style={{ color: "#141414", fontSize: 12, fontWeight: 700, marginTop: 2 }}>{current.flag && <FlagFromEmoji emoji={current.flag} size={12} style={{ marginRight: 5, verticalAlign: "-1px" }} />}{current.name} · Sem. {current.week} · {current.year}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={{ ...styles.btnPrimary, flex: 1, marginBottom: 3 }} onClick={onResume}>Reprendre</button>
              <button style={{ ...styles.btnSecondary, flex: 1, width: "auto" }} onClick={onAbandon}>Abandonner</button>
            </div>
          </div>
        )}
        {CHALLENGES.map(c => (
          <button key={c.id} onClick={() => setSelected(c.id)} style={{
            ...panel, width: "100%", textAlign: "left", cursor: "pointer", padding: 14, marginBottom: 12, display: "block", fontFamily: T.body,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
                <span className="tm-display" style={{ color: "#141414", fontSize: 17, lineHeight: 1.1 }}>{c.name}</span>
                <CircuitBadge c={c.circuit} />
              </span>
              <DifficultyDots n={c.difficulty} />
            </div>
            <div className="tm-lettering" style={{ color: "#141414", fontSize: 14.5, marginTop: 4, lineHeight: 1.3 }}>{c.tagline}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "2px dashed " + INK, gap: 8 }}>
              <span style={{ color: "#141414", fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon name="target" size={13} color="#1f7a45" /> {c.objectiveLabel}
              </span>
              {results[c.id] && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {results[c.id].medal && <MedalBadge medal={results[c.id].medal} />}
                  <span className="tm-display" style={{ ...chip("#d6ef3c", "#141414"), fontWeight: 400, fontSize: 12 }}>{(results[c.id].score || 0).toLocaleString("fr-FR")} pts</span>
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Bandeau du défi sur l'accueil : objectif, avancement, temps restant et
// mécaniques propres (dette, classement protégé, Race, bonheur).
export function ChallengePanel({ player, atpDb, repayDebt }) {
  const c = player.challenge;
  const def = c ? getChallengeDef(c.id) : null;
  if (!def) return null;
  const ctx = challengeContext(player, atpDb);
  const obj = def.objective(player, ctx);
  const weeksLeft = c.deadlineAbs - ctx.abs;
  const finished = c.status !== "active";
  return (
    <div style={{ margin: "16px 16px 0" }}>
      <div style={{ ...panel, padding: 0, marginBottom: 0 }}>
        <div style={bandStyle}>
          <span className="tm-display" style={{ fontSize: 14, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Défi · {def.name}</span>
          {!finished && <span className="tm-num" style={{ ...chip(weeksLeft <= 4 ? "#c4302b" : "#ffffff", weeksLeft <= 4 ? "#ffffff" : "#141414"), border: "2px solid #ffffff", textTransform: "none", flexShrink: 0 }}>{weeksLeft >= 0 ? weeksLeft + " sem. restantes" : "terminé"}</span>}
          {finished && (c.status === "success"
            ? <MedalBadge medal={c.result?.medal} weeks={c.result?.weeks} />
            : <span style={{ ...chip("#c4302b", "#ffffff"), border: "2px solid #ffffff", flexShrink: 0 }}>Échoué</span>)}
        </div>
        <div style={{ padding: 14 }}>
        <div className="tm-display" style={{ color: "#141414", fontSize: 16, lineHeight: 1.15 }}>{def.objectiveLabel}</div>
        <div style={{ color: "#141414", fontSize: 12.5, fontWeight: 700, marginTop: 3 }}>{obj.progress}</div>
        <div className="tm-lettering" style={{ color: "#141414", fontSize: 13.5, marginTop: 4 }}>
          {finished
            ? "Score du défi : " + (c.result?.score || 0).toLocaleString("fr-FR") + " pts"
            : "Score provisoire : " + computeChallengeScore(player, atpDb, null).score.toLocaleString("fr-FR") + " pts (hors objectif)"}
        </div>

        {!finished && c.id === "fauche" && (c.debt || 0) > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: "#141414", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>
              Prochaine échéance obligatoire : 2 500 € dans {Math.max(0, (c.nextDueAbs || 0) - ctx.abs)} sem.
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1000, 5000].map(a => (
                <button key={a} style={{ ...styles.btnSmall, flex: 1, background: "#ffffff", color: "#141414", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK }} disabled={player.money < 1} onClick={() => repayDebt(a)}>
                  −{a.toLocaleString("fr-FR")} €
                </button>
              ))}
              <button className="tm-display" style={{ ...styles.btnSmall, fontFamily: T.display, flex: 1, background: "#1f7a45", color: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontWeight: 400 }} disabled={player.money < 1} onClick={() => repayDebt(Infinity)}>
                Max
              </button>
            </div>
          </div>
        )}
        {!finished && c.id === "retour" && (
          <div style={{ color: "#141414", fontSize: 12, fontWeight: 700, marginTop: 8 }}>
            Classement protégé n°{c.protectedRank} : {c.protectedUses || 0} entrée{(c.protectedUses || 0) > 1 ? "s" : ""} restante{(c.protectedUses || 0) > 1 ? "s" : ""}
          </div>
        )}
        {!finished && c.id === "pression" && (
          <div style={{ marginTop: 8 }}>
            <div style={{ position: "relative", height: 12, background: "#ffffff", border: "2px solid " + INK, boxSizing: "border-box" }}>
              <div style={{ width: Math.max(0, Math.min(100, player.happiness ?? 0)) + "%", height: "100%", boxSizing: "border-box", borderRight: (player.happiness ?? 0) > 0 && (player.happiness ?? 0) < 100 ? "2px solid " + INK : "none", background: (player.happiness ?? 0) < 40 ? "#c4302b" : "#e0a21b" }} />
              <div style={{ position: "absolute", left: "30%", top: -5, width: 3, height: 18, background: INK }} />
            </div>
          </div>
        )}
        {!finished && c.id === "seul" && (
          <div style={{ color: "#141414", fontSize: 12, fontWeight: 700, marginTop: 8 }}>Aucun staff · billets −25 % · chaque victoire fait progresser</div>
        )}
        {!finished && c.id === "prodige" && (
          <div style={{ color: "#141414", fontSize: 12, fontWeight: 700, marginTop: 8 }}>Âge d'or : entraînement ×1,3</div>
        )}
        </div>
      </div>
    </div>
  );
}
