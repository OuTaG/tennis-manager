// Écran Records.
import { useState } from "react";
import { CHALLENGES, MEDAL_INFO, loadChallengeResults } from "../../engine/challenges.js";
import { computeRecords, loadCareerSummaries } from "../../engine/records.js";
import { FlagFromEmoji, Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

const INK = T.ink;
const panel = { background: "#ffffff", color: "#141414", border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, marginBottom: 14 };
const iconBox = (bg) => ({ width: 34, height: 34, background: bg, border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxSizing: "border-box" });
const label = { color: "#141414", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3 };

export function RecordsScreen({ onBack }) {
  const careers = Object.values(loadCareerSummaries());
  const records = computeRecords();
  const chResults = loadChallengeResults();
  const [openCh, setOpenCh] = useState(null);
  return (
    <div style={styles.root}>
      <div style={{ ...styles.menuBg, alignItems: "flex-start", padding: "24px 16px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <button style={{ ...styles.btnSmall, background: "#ffffff", color: "#141414", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontWeight: 800, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }} onClick={onBack}>
            <Icon name="arrowLeft" size={14} /> Retour
          </button>
          <div style={{ ...styles.sectionTitle, fontSize: 28, marginBottom: 4 }}>Records</div>
          <div className="tm-lettering" style={{ color: "#141414", fontSize: 15, lineHeight: 1.3, marginBottom: 16 }}>
            Meilleures performances sur l'ensemble de vos carrières · {careers.length} carrière{careers.length > 1 ? "s" : ""}
          </div>
          {careers.length === 0 ? (
            <div className="tm-lettering" style={{ ...panel, textAlign: "center", fontSize: 16, lineHeight: 1.35, padding: 24 }}>
              Aucun record pour l'instant. Lancez une carrière : vos meilleures performances s'afficheront ici.
            </div>
          ) : (
            <div style={{ ...panel, padding: "4px 14px" }}>
              {records.map(({ def, career }, i) => {
                const when = career && def.when ? def.when(career) : null;
                return (
                  <div key={def.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < records.length - 1 ? "2px dashed " + INK : "none" }}>
                    <div style={iconBox(career ? "#d6ef3c" : "#ffffff")}>
                      <Icon name={def.icon} size={16} color="#141414" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={label}>{def.label}</div>
                      {career ? (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, minWidth: 0 }}>
                            <FlagFromEmoji emoji={career.flag || "🎾"} size={12} />
                            <span className="tm-display" style={{ color: "#141414", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{career.name}</span>
                          </div>
                          <div style={{ color: "#141414", fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                            {when || (career.startYear === career.lastYear ? career.startYear : career.startYear + "–" + career.lastYear)}
                          </div>
                        </>
                      ) : (
                        <div className="tm-lettering" style={{ color: "#141414", fontSize: 13.5, marginTop: 2, opacity: 0.7 }}>Pas encore réalisé</div>
                      )}
                    </div>
                    <div className="tm-display" style={{ color: "#141414", fontSize: 17, flexShrink: 0 }}>
                      {career ? def.fmt(career[def.key]) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Records des défis : meilleur score de chaque défi */}
          <div style={{ ...styles.sectionTitle, fontSize: 22, margin: "22px 0 4px" }}>Défis</div>
          <div className="tm-lettering" style={{ color: "#141414", fontSize: 15, lineHeight: 1.3, marginBottom: 12 }}>Meilleur score réalisé dans chaque défi. Touchez un défi pour le détail.</div>
          <div style={{ ...panel, padding: "4px 14px" }}>
            {CHALLENGES.map((d, i) => {
              const r = chResults[d.id];
              const open = openCh === d.id && r && r.rows;
              return (
                <div key={d.id} style={{ borderBottom: i < CHALLENGES.length - 1 ? "2px dashed " + INK : "none" }}>
                  <div onClick={() => r && setOpenCh(open ? null : d.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", cursor: r ? "pointer" : "default" }}>
                    <div style={iconBox(r && r.medal ? INK : r ? "#c9b6ea" : "#ffffff")}>
                      <Icon name={r && r.medal ? "award" : "target"} size={16} color={r && r.medal ? (MEDAL_INFO[r.medal] || {}).color : "#141414"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={label}>{d.name}</div>
                      {r ? (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, minWidth: 0 }}>
                            {r.flag && <FlagFromEmoji emoji={r.flag} size={12} />}
                            <span className="tm-display" style={{ color: "#141414", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name || "—"}</span>
                          </div>
                          <div style={{ color: r.status === "success" ? "#1f7a45" : "#c4302b", fontSize: 11, fontWeight: 800, marginTop: 1 }}>
                            {r.status === "success" ? "Réussi" + (r.medal ? " · " + (MEDAL_INFO[r.medal] || {}).label : "") + (r.weeks !== undefined ? " · " + r.weeks + " sem." : "") : "Échoué"}
                            {r.attempts ? " · " + r.attempts + " tentative" + (r.attempts > 1 ? "s" : "") : ""}
                          </div>
                        </>
                      ) : (
                        <div className="tm-lettering" style={{ color: "#141414", fontSize: 13.5, marginTop: 2, opacity: 0.7 }}>Pas encore tenté</div>
                      )}
                    </div>
                    <div className="tm-display" style={{ color: r ? "#5b2d8e" : "#141414", fontSize: 17, flexShrink: 0 }}>
                      {r ? (r.score || 0).toLocaleString("fr-FR") : "—"}
                    </div>
                  </div>
                  {open && (
                    <div className="tm-halftone-yellow" style={{ border: "2px solid " + INK, boxShadow: "2px 2px 0 " + INK, padding: "6px 10px", marginBottom: 12 }}>
                      {r.rows.map((row, k) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, fontWeight: 700, padding: "3px 0", color: "#141414", borderTop: k ? "1.5px dashed " + INK : 0 }}>
                          <span>{row.label} <span style={{ fontWeight: 500 }}>· {row.detail}</span></span>
                          <span className="tm-num" style={{ color: "#141414", fontWeight: 800 }}>{row.pts.toLocaleString("fr-FR")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
