// Écrans des défis.
import { useState, useMemo } from "react";
import { CITIES } from "../../data/geo.js";
import { CHALLENGES, MEDAL_INFO, challengeContext, computeChallengeScore, getChallengeDef, loadChallengeResults } from "../../engine/challenges.js";
import { randomFullName } from "../../engine/names.js";
import { FlagFromEmoji, Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

// ─── ÉCRANS DES DÉFIS ────────────────────────────────────────────────────────
export function DifficultyDots({ n }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: 0, background: i <= n ? T.clay : T.bg4 }} />
      ))}
    </span>
  );
}

export function MedalBadge({ medal, weeks }) {
  const m = MEDAL_INFO[medal];
  if (!m) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: m.color }}>
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
    <span data-nofem="" style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 0, color: c === "wta" ? "#b23f73" : "#4d7a3a", border: "1px solid " + (c === "wta" ? "#b23f73" : "#4d7a3a") }}>
      {c === "wta" ? "Circuit féminin" : "Circuit masculin"}
    </span>
  );

  if (def) {
    return (
      <div style={styles.root}>
        <div style={{ padding: "16px 16px 110px" }}>
          <button style={{ ...styles.btnSmall, display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={() => setSelected(null)}>
            <Icon name="arrowLeft" size={14} /> Tous les défis
          </button>
          <div style={{ ...styles.skillsCard, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div className="tm-eyebrow" style={{ color: T.clay }}>Défi</div>
              <DifficultyDots n={def.difficulty} />
            </div>
            <div style={{ color: T.fg, fontSize: 22, fontWeight: 700, fontFamily: T.display, marginBottom: 4 }}>{def.name}</div>
            <div style={{ color: T.fg3, fontSize: 13, marginBottom: 14 }}>{def.tagline}</div>
            <div style={{ color: T.fg2, fontSize: 13.5, lineHeight: 1.6, marginBottom: 14 }}>{def.context}</div>
            <div style={{ background: T.bg2, border: "2px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, borderRadius: 0, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.fg, fontWeight: 700, fontSize: 14 }}>
                <Icon name="target" size={16} color={T.green} /> {def.objectiveLabel}
              </div>
              <div style={{ color: T.fg4, fontSize: 12, marginTop: 4, marginLeft: 24 }}>{def.deadlineLabel}</div>
            </div>
            <div className="tm-eyebrow" style={{ marginBottom: 6 }}>Règles du défi</div>
            {def.perks.map((pk, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", color: T.fg2, fontSize: 13, lineHeight: 1.45, marginBottom: 6 }}>
                <Icon name="chevronRight" size={14} color={T.clay} style={{ marginTop: 2 }} /> <span>{pk}</span>
              </div>
            ))}
            {results[def.id] && (
              <div style={{ marginTop: 8, color: T.fg3, fontSize: 13, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                Record : <strong className="tm-num" style={{ color: T.clay }}>{(results[def.id].score || 0).toLocaleString("fr-FR")} pts</strong>
                {results[def.id].medal && <MedalBadge medal={results[def.id].medal} weeks={results[def.id].weeks} />}
              </div>
            )}
          </div>

          <div style={{ ...styles.skillsCard, padding: 16 }}>
            <div style={{ marginBottom: 12 }}><CircuitBadge c={circuit} /></div>
            <label style={styles.label}>Nom</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input style={{ ...styles.input, flex: 1, minWidth: 0 }} value={name} onChange={e => setName(e.target.value)} />
              <button type="button" title="Nom au hasard" onClick={() => setName(randomFullName(nat, circuit === "wta"))}
                style={{ flexShrink: 0, width: 46, borderRadius: 0, cursor: "pointer", background: T.bg2, border: "1px solid " + T.greenBrd, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="dice" size={20} color={T.green} />
              </button>
            </div>
            <label style={styles.label}>Nationalité</label>
            <select value={nat} onChange={e => { setNat(e.target.value); }} style={{ ...styles.input, appearance: "auto", marginBottom: 14 }}>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {current && (
              <div style={{ color: T.amber, fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
                Lancer ce défi remplacera le défi en cours ({(getChallengeDef(current.challenge) || {}).name || "défi"}).
              </div>
            )}
            {owned ? (
              <button style={styles.btnPrimary} disabled={name.trim().length < 2}
                onClick={() => onStart(def, { name: name.trim(), nationality: nat, circuit })}>
                Lancer le défi
              </button>
            ) : (
              <button style={{ ...styles.btnPrimary, background: T.amber, boxShadow: "0 3px 0 " + T.clay }} onClick={goShop}>
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
        <button style={{ ...styles.btnSmall, display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={onBack}>
          <Icon name="arrowLeft" size={14} /> Menu principal
        </button>
        <div style={styles.sectionTitle}>Défis</div>
        {!owned && (
          <div style={{ ...styles.alertBox, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="lock" size={16} color={T.amber} />
            <span style={{ flex: 1 }}>Les défis scénarisés se débloquent dans la boutique.</span>
            <button style={styles.btnSmall} onClick={goShop}>Boutique</button>
          </div>
        )}
        {current && (
          <div style={{ ...styles.skillsCard, padding: 14, borderLeft: "3px solid " + T.clay }}>
            <div className="tm-eyebrow" style={{ color: T.clay }}>Défi en cours</div>
            <div style={{ color: T.fg, fontSize: 16, fontWeight: 700, marginTop: 2 }}>{(getChallengeDef(current.challenge) || {}).name}</div>
            <div style={{ color: T.fg4, fontSize: 12, marginTop: 2 }}>{current.flag && <FlagFromEmoji emoji={current.flag} size={12} style={{ marginRight: 5, verticalAlign: "-1px" }} />}{current.name} · Sem. {current.week} · {current.year}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={{ ...styles.btnPrimary, flex: 1, marginBottom: 3 }} onClick={onResume}>Reprendre</button>
              <button style={{ ...styles.btnSecondary, flex: 1, width: "auto" }} onClick={onAbandon}>Abandonner</button>
            </div>
          </div>
        )}
        {CHALLENGES.map(c => (
          <button key={c.id} onClick={() => setSelected(c.id)} style={{
            ...styles.skillsCard, width: "100%", textAlign: "left", cursor: "pointer", padding: 14, marginBottom: 10, display: "block", fontFamily: T.body,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ color: T.fg, fontSize: 16, fontWeight: 700 }}>{c.name}</span>
                <CircuitBadge c={c.circuit} />
              </span>
              <DifficultyDots n={c.difficulty} />
            </div>
            <div style={{ color: T.fg3, fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>{c.tagline}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 8 }}>
              <span style={{ color: T.fg4, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon name="target" size={12} color={T.fg4} /> {c.objectiveLabel}
              </span>
              {results[c.id] && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {results[c.id].medal && <MedalBadge medal={results[c.id].medal} />}
                  <span className="tm-num" style={{ color: T.clay, fontSize: 12, fontWeight: 700 }}>{(results[c.id].score || 0).toLocaleString("fr-FR")} pts</span>
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
      <div style={{ ...styles.skillsCard, padding: 14, marginBottom: 0, borderLeft: "3px solid " + T.clay }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div className="tm-eyebrow" style={{ color: T.clay }}>Défi · {def.name}</div>
          {!finished && <span className="tm-num" style={{ color: weeksLeft <= 4 ? T.red : T.fg4, fontSize: 11 }}>{weeksLeft >= 0 ? weeksLeft + " sem. restantes" : "terminé"}</span>}
          {finished && (c.status === "success"
            ? <MedalBadge medal={c.result?.medal} weeks={c.result?.weeks} />
            : <span style={{ color: T.red, fontSize: 11, fontWeight: 700 }}>Échoué</span>)}
        </div>
        <div style={{ color: T.fg, fontSize: 14, fontWeight: 700, marginTop: 4 }}>{def.objectiveLabel}</div>
        <div style={{ color: T.fg3, fontSize: 12.5, marginTop: 2 }}>{obj.progress}</div>
        <div className="tm-num" style={{ color: T.fg4, fontSize: 11.5, marginTop: 4 }}>
          {finished
            ? "Score du défi : " + (c.result?.score || 0).toLocaleString("fr-FR") + " pts"
            : "Score provisoire : " + computeChallengeScore(player, atpDb, null).score.toLocaleString("fr-FR") + " pts (hors objectif)"}
        </div>

        {!finished && c.id === "fauche" && (c.debt || 0) > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: T.fg4, fontSize: 11.5, marginBottom: 6 }}>
              Prochaine échéance obligatoire : 2 500 € dans {Math.max(0, (c.nextDueAbs || 0) - ctx.abs)} sem.
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1000, 5000].map(a => (
                <button key={a} style={{ ...styles.btnSmall, flex: 1 }} disabled={player.money < 1} onClick={() => repayDebt(a)}>
                  −{a.toLocaleString("fr-FR")} €
                </button>
              ))}
              <button style={{ ...styles.btnSmall, flex: 1, background: T.green, color: T.onAccent, borderColor: T.green }} disabled={player.money < 1} onClick={() => repayDebt(Infinity)}>
                Max
              </button>
            </div>
          </div>
        )}
        {!finished && c.id === "retour" && (
          <div style={{ color: T.fg4, fontSize: 12, marginTop: 8 }}>
            Classement protégé n°{c.protectedRank} : {c.protectedUses || 0} entrée{(c.protectedUses || 0) > 1 ? "s" : ""} restante{(c.protectedUses || 0) > 1 ? "s" : ""}
          </div>
        )}
        {!finished && c.id === "pression" && (
          <div style={{ marginTop: 8 }}>
            <div style={{ position: "relative", height: 6, background: T.bg3, borderRadius: 0 }}>
              <div style={{ width: Math.max(0, Math.min(100, player.happiness ?? 0)) + "%", height: "100%", borderRadius: 0, background: (player.happiness ?? 0) < 40 ? T.red : T.amber }} />
              <div style={{ position: "absolute", left: "30%", top: -3, width: 2, height: 12, background: T.red }} />
            </div>
          </div>
        )}
        {!finished && c.id === "seul" && (
          <div style={{ color: T.fg4, fontSize: 12, marginTop: 8 }}>Aucun staff · billets −25 % · chaque victoire fait progresser</div>
        )}
        {!finished && c.id === "prodige" && (
          <div style={{ color: T.fg4, fontSize: 12, marginTop: 8 }}>Âge d'or : entraînement ×1,3</div>
        )}
      </div>
    </div>
  );
}
