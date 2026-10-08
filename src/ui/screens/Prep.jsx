// Écran Joueur › Préparation (entraînement, staff).
import { useState } from "react";
import { TRAINING_MODULES } from "../../data/life.js";
import { STAFF_LIST } from "../../data/staff.js";
import { challengeActive } from "../../engine/challenges.js";
import { hasGameOption } from "../../engine/difficulty.js";
import { staffTrainEnergyExtra } from "../../engine/staff.js";
import { trainingBaseGain, trainingEfficiency } from "../../engine/training.js";
import { Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

const INK = T.ink;
const chip = (bg, fg) => ({ display: "inline-block", background: bg, color: fg, border: "2px solid " + INK, fontSize: 11, fontWeight: 800, padding: "0 6px", textTransform: "uppercase", letterSpacing: 0.3 });
const smallBox = { background: "#ffffff", color: "#141414", border: "2px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontSize: 12, fontWeight: 800, padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 2 };

export function TrainingScreen({ player, doTraining }) {
  const statLabels = { serve: "Service", forehand: "Coup droit", backhand: "Revers", stamina: "Endurance", mental: "Mental", net: "Jeu au filet" };
  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Entraînement</div>

      {/* Forme d'entraînement : énergie et efficacité des séances */}
      {(() => {
        const eff = trainingEfficiency(player);
        const effPct = Math.round(eff.shown * 100);
        const e = Math.round(player.energy);
        const fmt = (m) => (m >= 1 ? "+" : "−") + Math.abs(Math.round((m - 1) * 100)) + " %";
        return (
          <div style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ padding: "8px 10px", borderRight: "2.5px solid " + T.ink }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}><Icon name="energy" size={11} /> Énergie</div>
                <div className="tm-display" style={{ fontSize: 26, lineHeight: 1.05 }}>{e} %</div>
                <div style={{ height: 10, border: "2px solid " + T.ink, background: "#ffffff", marginTop: 3 }}>
                  <div style={{ height: "100%", width: e + "%", boxSizing: "border-box", borderRight: e > 0 && e < 100 ? "2px solid " + T.ink : "none", background: e > 60 ? "#1f7a45" : e > 30 ? "#e0a21b" : "#c4302b" }} />
                </div>
              </div>
              <div className={effPct >= 100 ? "tm-halftone-yellow" : undefined} style={{ padding: "8px 10px", color: "#141414", background: effPct >= 100 ? undefined : "#c9b6ea" }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" }}>Efficacité des séances</div>
                <div className="tm-display" style={{ fontSize: 26, lineHeight: 1.05 }}>{effPct} %</div>
                <div className="tm-lettering" style={{ fontSize: 13 }}>{effPct >= 110 ? "Au top !" : effPct >= 95 ? "Bonne forme" : effPct >= 75 ? "Correcte" : "Reposez-vous…"}</div>
              </div>
            </div>
            {/* Ce qui fait monter ou baisser l'efficacité */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "7px 10px", borderTop: "2.5px solid " + T.ink }}>
              {eff.parts.filter(pt => Math.abs(pt.mul - 1) >= 0.005).map(pt => (
                <span key={pt.key} style={{ fontSize: 11, fontWeight: 800, border: "2px solid " + T.ink, padding: "0 5px", background: pt.mul >= 1 ? "#1f7a45" : "#c4302b", color: "#ffffff" }}>{pt.label} {fmt(pt.mul)}</span>
              ))}
              {eff.parts.every(pt => Math.abs(pt.mul - 1) < 0.005) && <span className="tm-lettering" style={{ fontSize: 14 }}>Aucun bonus ni malus en ce moment.</span>}
            </div>
          </div>
        );
      })()}

      {TRAINING_MODULES.map(mod => {
        // Same energy cost as doTraining: stamina reduction, then staff surcharge.
        const baseEnergyCost = Math.round(mod.energyCost * Math.max(0.6, 1 - (player.stats.stamina - 50) / 100));
        const staffEnergyExtra = staffTrainEnergyExtra(player.staff);
        const canDo = player.money >= mod.cost && player.energy >= baseEnergyCost + staffEnergyExtra + 3;
        // Même calcul que la séance réelle (programme de routine).
        const expGain = trainingBaseGain(player, mod).toFixed(2);
        const ceilingReached = player.stats[mod.stat] >= 92;
        const statValue = Math.round(player.stats[mod.stat]);

        return (
          <div key={mod.id} className="tm-card" style={{ ...styles.trainingCard, background: "#ffffff", color: "#141414", border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 38, height: 38, flexShrink: 0,
                    background: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK,
                    display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-4deg)",
                  }}>
                    <Icon name={mod.iconName} size={22} color={INK} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="tm-display" style={{ color: "#141414", fontSize: 16, lineHeight: 1.1 }}>{mod.name}</div>
                    <span style={{ ...chip("#c9b6ea", "#141414"), marginTop: 3, fontSize: 10 }}>{statLabels[mod.stat] || mod.stat}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="tm-display" style={{ color: "#141414", fontSize: 26, lineHeight: 1 }}>{statValue}</div>
                <div className="tm-lettering" style={{ fontSize: 13 }}>Actuel</div>
              </div>
            </div>

            <div style={{ ...styles.statBarBg, marginBottom: 12 }}>
              <div style={{ ...styles.statBarFill, width: statValue + "%", background: "#1f7a45", boxSizing: "border-box", borderRight: statValue > 0 && statValue < 100 ? "2px solid " + INK : "none" }} />
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={smallBox}>−<span className="tm-num">{mod.cost}€</span></span>
              <span style={smallBox}>
                −<span className="tm-num">{baseEnergyCost}</span>
                {staffEnergyExtra > 0 && <span className="tm-num" style={{ color: "#c4302b", marginLeft: 3 }}>−{staffEnergyExtra}</span>}
                <Icon name="energy" size={10} />
              </span>
              <span style={{ ...smallBox, background: ceilingReached ? "#c4302b" : (expGain < 0.3 ? "#e0a21b" : "#d6ef3c"), color: ceilingReached ? "#ffffff" : "#141414" }}>
                +<span className="tm-num">{expGain}</span> pts{ceilingReached ? " · plafond" : ""}
              </span>
            </div>

            <button
              className="tm-display"
              style={{
                ...styles.btnSmall, width: "100%",
                background: canDo ? "#1f7a45" : "#ffffff",
                color: canDo ? "#ffffff" : "#141414",
                border: "2.5px solid " + INK,
                boxShadow: canDo ? "3px 3px 0 " + INK : "none",
                fontSize: 14, fontWeight: 400, fontFamily: T.display,
                opacity: canDo ? 1 : 0.5,
              }}
              disabled={!canDo}
              onClick={() => doTraining(mod)}
            >S'entraîner</button>
          </div>
        );
      })}
    </div>
  );
}

export function StaffScreen({ player, hireStaff, fireStaff }) {
  const roles = [...new Set(STAFF_LIST.map(s => s.role))];
  const totalCost = player.staff.reduce((a, s) => a + s.cost, 0);
  // Option de partie « Sans staff » ou défi « Seul au monde » : la page reste
  // consultable, mais personne ne peut être engagé.
  const noStaff = hasGameOption(player, "no_staff") || challengeActive("seul");

  // Human-readable labels for each effect key
  const BONUS_LABELS = {
    trainGain: { label: "gains entraînement", suffix: "%", scale: 100, color: "#1f7a45" },
    recovery: { label: "récup. énergie/sem", suffix: "", color: "#1f7a45" },
    matchMental: { label: "mental en match", suffix: "", color: "#1f7a45" },
    matchStamina: { label: "endurance en match", suffix: "", color: "#1f7a45" },
    energyDrainCut: { label: "d'énergie perdue en match", suffix: "%", scale: 100, color: T.green, sign: "−" },
    injuryProtect: { label: "anti-blessure", suffix: "%", scale: 100, color: "#1f7a45" },
    sponsorPay: { label: "revenu sponsors", suffix: "%", scale: 100, color: "#1f7a45" },
    sponsorTierBoost: { label: "chance sponsor premium", suffix: "%", scale: 100, color: "#1f7a45" },
    surfaceBoost: { label: "stats en match (surface)", suffix: "", color: "#1f7a45" },
    scouting: { label: "★ de conseil tactique en match", suffix: "", color: "#1f7a45" },
  };
  const MALUS_LABELS = {
    happinessDrain: { label: "bonheur/sem", suffix: "", color: "#c4302b" },
    surfaceMalus: { label: "stats hors surface", suffix: "", color: "#c4302b" },
  };

  const renderEffects = (s) => {
    const items = [];
    for (const [k, v] of Object.entries(s.bonus || {})) {
      const def = BONUS_LABELS[k];
      if (!def) continue;
      const val = (def.scale ? v * def.scale : v);
      items.push({ text: (def.sign || "+") + (Math.round(val * 10) / 10) + def.suffix + " " + def.label, color: def.color });
    }
    if (s.bonus && s.bonus.scouting) {
      items.push({ text: "Les 6 stats de l'adversaire avant chaque match" + (s.bonus.scouting >= 2 ? ", et sa forme du jour" : ""), color: "#1f7a45" });
    }
    for (const [k, v] of Object.entries(s.malus || {})) {
      const def = MALUS_LABELS[k];
      if (!def) continue;
      items.push({ text: (def.sign || "−") + v + def.suffix + " " + def.label, color: def.color });
    }
    return items;
  };

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Staff</div>

      {noStaff && (
        <div aria-label="Mode sans staff" style={{
          position: "fixed", left: 0, right: 0, top: "50%", zIndex: 5, pointerEvents: "none",
          display: "flex", justifyContent: "center",
        }}>
          <div style={{
            transform: "translateY(-50%) rotate(-16deg)", background: "#fffdf6",
            border: "4px solid #c4302b", outline: "2px solid #c4302b", outlineOffset: 4,
            boxShadow: "6px 6px 0 " + T.ink, padding: "10px 18px", textAlign: "center", color: "#c4302b",
          }}>
            <div style={{ color: "#c4302b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 3 }}>
              {hasGameOption(player, "no_staff") ? "Option de partie" : "Défi Seul au monde"}
            </div>
            <div className="tm-display" style={{ fontSize: 40, lineHeight: 0.95, whiteSpace: "nowrap" }}>Mode<br />sans staff</div>
            <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4, color: T.ink }}>Aucune embauche possible</div>
          </div>
        </div>
      )}

      <div className="tm-halftone-yellow" style={{
        padding: 14, marginBottom: 16, color: "#141414",
        border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <span style={chip(INK, "#ffffff")}>Coût hebdomadaire</span>
          <div className="tm-display" style={{ color: "#c4302b", fontSize: 22, marginTop: 4, textShadow: "1.5px 1.5px 0 #ffffff" }}>−{totalCost}€</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={chip("#ffffff", "#141414")}>Personnel</span>
          <div className="tm-display" style={{ color: "#141414", fontSize: 22, marginTop: 4 }}>{player.staff.length}<span style={{ fontSize: 14 }}>/{roles.length}</span></div>
        </div>
      </div>

      <div style={noStaff ? { opacity: 0.45, filter: "grayscale(1)" } : undefined}>
      {roles.map(role => {
        const hired = player.staff.find(s => s.role === role);
        const options = STAFF_LIST.filter(s => s.role === role);
        return (
          <div key={role} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span className="tm-display" style={{ ...chip(INK, "#ffffff"), fontWeight: 400, fontSize: 12, padding: "1px 8px" }}>{role}</span>
              <div style={{ flex: 1, borderTop: "2px dashed " + INK }} />
            </div>
            {hired ? (
              <div className="tm-halftone-cyan" style={{
                padding: 14, color: "#141414",
                border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tm-display" style={{ color: "#141414", fontSize: 16, lineHeight: 1.15 }}>
                      {hired.name} <span style={{ ...chip("#d6ef3c", "#141414"), fontFamily: T.body, verticalAlign: 2 }}>★{hired.level}</span>
                    </div>
                    {hired.surface && (
                      <div style={{ ...chip("#2c6fd1", "#ffffff"), marginTop: 4, fontSize: 10, textTransform: "none" }}>
                        Spé. {hired.surface}
                      </div>
                    )}
                    <div style={{ marginTop: 4 }}><span className="tm-num" style={{ ...chip("#ffffff", "#141414"), textTransform: "none" }}>{hired.cost}€/sem</span></div>
                  </div>
                  <button style={{ ...styles.btnSmall, background: "#ffffff", color: "#c4302b", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontWeight: 800, flexShrink: 0 }} onClick={() => fireStaff(hired)}>Licencier</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {renderEffects(hired).map((it, i) => (
                    <div key={i} style={{ color: it.color, fontSize: 11.5, fontWeight: 800, background: "#ffffff", border: "2px solid " + INK, padding: "1px 6px", alignSelf: "flex-start" }}>{it.text}</div>
                  ))}
                </div>
              </div>
            ) : (
              options.map(s => {
                const canAfford = !noStaff && player.money >= s.cost * 4;
                return (
                  <div key={s.id} style={{
                    background: "#ffffff", color: "#141414", padding: 14, marginBottom: 10,
                    border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="tm-display" style={{ color: "#141414", fontSize: 16, lineHeight: 1.15 }}>
                          {s.name} <span style={{ ...chip("#d6ef3c", "#141414"), fontFamily: T.body, verticalAlign: 2 }}>★{s.level}</span>
                        </div>
                        {s.surface && (
                          <div style={{ ...chip("#2c6fd1", "#ffffff"), marginTop: 4, fontSize: 10, textTransform: "none" }}>
                            Spé. {s.surface}
                          </div>
                        )}
                        <div className="tm-num" style={{ color: "#141414", fontSize: 11.5, fontWeight: 700, marginTop: 4 }}>
                          {s.cost}€/sem · {(s.cost * 4).toLocaleString()}€ à l'embauche
                        </div>
                      </div>
                      <button
                        className="tm-display"
                        style={{ ...styles.btnSmall, fontFamily: T.display, background: canAfford ? "#1f7a45" : "#ffffff", color: canAfford ? "#ffffff" : "#141414", border: "2.5px solid " + INK, boxShadow: canAfford ? "2px 2px 0 " + INK : "none", fontWeight: 400, fontSize: 13, opacity: canAfford ? 1 : 0.45, flexShrink: 0 }}
                        disabled={!canAfford}
                        onClick={() => hireStaff(s)}
                      >{noStaff ? "Interdit" : "Engager"}</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {renderEffects(s).map((it, i) => (
                        <div key={i} style={{ color: it.color, fontSize: 11.5, fontWeight: 800, background: "#ffffff", border: "2px solid " + INK, padding: "1px 6px", alignSelf: "flex-start" }}>{it.text}</div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}

// Combined Training + Staff screen
export function PrepScreen({ player, doTraining, hireStaff, fireStaff }) {
  const [subTab, setSubTab] = useState("training");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, padding: "14px 16px 0" }}>
        {[
          { id: "training", label: "Entraînement", icon: "dumbbell" },
          { id: "staff", label: "Staff", icon: "users" },
        ].map(t => {
          const active = subTab === t.id;
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)} style={{
              ...styles.filterBtn, ...(active ? styles.filterBtnActive : {}),
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <Icon name={t.icon} size={14} color="#141414" />
              {t.label}
            </button>
          );
        })}
      </div>
      {subTab === "training" && <TrainingScreen player={player} doTraining={doTraining} />}
      {subTab === "staff" && <StaffScreen player={player} hireStaff={hireStaff} fireStaff={fireStaff} />}
    </div>
  );
}
