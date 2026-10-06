// Écran Records.
import { useState } from "react";
import { CHALLENGES, MEDAL_INFO, loadChallengeResults } from "../../engine/challenges.js";
import { computeRecords, loadCareerSummaries } from "../../engine/records.js";
import { FlagFromEmoji, Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

export function RecordsScreen({ onBack }) {
  const careers = Object.values(loadCareerSummaries());
  const records = computeRecords();
  const chResults = loadChallengeResults();
  const [openCh, setOpenCh] = useState(null);
  return (
    <div style={styles.root}>
      <div style={{ ...styles.menuBg, alignItems: "flex-start", padding: "24px 16px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <button style={{ background: "none", border: "none", color: T.fg3, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }} onClick={onBack}>
            <Icon name="arrowLeft" size={14} /> Retour
          </button>
          <div style={{ ...styles.sectionTitle, fontSize: 28, marginBottom: 4 }}>Records</div>
          <div style={{ color: T.fg4, fontSize: 13, marginBottom: 16 }}>
            Meilleures performances sur l'ensemble de vos carrières · {careers.length} carrière{careers.length > 1 ? "s" : ""}
          </div>
          {careers.length === 0 ? (
            <div style={{ ...styles.skillsCard, textAlign: "center", color: T.fg3, fontSize: 14, padding: 24 }}>
              Aucun record pour l'instant. Lancez une carrière : vos meilleures performances s'afficheront ici.
            </div>
          ) : (
            <div style={{ ...styles.skillsCard, padding: "6px 14px" }}>
              {records.map(({ def, career }, i) => {
                const when = career && def.when ? def.when(career) : null;
                return (
                  <div key={def.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < records.length - 1 ? "1px solid " + T.brd : "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 0, background: career ? T.amberSub : T.bg2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={def.icon} size={16} color={career ? T.amber : T.fg5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: T.fg4, fontSize: 12 }}>{def.label}</div>
                      {career ? (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, minWidth: 0 }}>
                            <FlagFromEmoji emoji={career.flag || "🎾"} size={12} />
                            <span style={{ color: T.fg, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{career.name}</span>
                          </div>
                          <div style={{ color: T.fg5, fontSize: 11, marginTop: 1 }}>
                            {when || (career.startYear === career.lastYear ? career.startYear : career.startYear + "–" + career.lastYear)}
                          </div>
                        </>
                      ) : (
                        <div style={{ color: T.fg5, fontSize: 12, marginTop: 2 }}>Pas encore réalisé</div>
                      )}
                    </div>
                    <div className="tm-num" style={{ color: career ? T.fg : T.fg5, fontSize: 16, fontWeight: 600, flexShrink: 0 }}>
                      {career ? def.fmt(career[def.key]) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Records des défis : meilleur score de chaque défi */}
          <div style={{ ...styles.sectionTitle, fontSize: 22, margin: "22px 0 4px" }}>Défis</div>
          <div style={{ color: T.fg4, fontSize: 13, marginBottom: 12 }}>Meilleur score réalisé dans chaque défi. Touchez un défi pour le détail.</div>
          <div style={{ ...styles.skillsCard, padding: "6px 14px" }}>
            {CHALLENGES.map((d, i) => {
              const r = chResults[d.id];
              const open = openCh === d.id && r && r.rows;
              return (
                <div key={d.id} style={{ borderBottom: i < CHALLENGES.length - 1 ? "1px solid " + T.brd : "none" }}>
                  <div onClick={() => r && setOpenCh(open ? null : d.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", cursor: r ? "pointer" : "default" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 0, background: r ? T.amberSub : T.bg2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={r && r.medal ? "award" : "target"} size={16} color={r && r.medal ? (MEDAL_INFO[r.medal] || {}).color : r ? T.clay : T.fg5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: T.fg4, fontSize: 12 }}>{d.name}</div>
                      {r ? (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, minWidth: 0 }}>
                            {r.flag && <FlagFromEmoji emoji={r.flag} size={12} />}
                            <span style={{ color: T.fg, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name || "—"}</span>
                          </div>
                          <div style={{ color: r.status === "success" ? T.green : T.fg5, fontSize: 11, marginTop: 1 }}>
                            {r.status === "success" ? "Réussi" + (r.medal ? " · " + (MEDAL_INFO[r.medal] || {}).label : "") + (r.weeks !== undefined ? " · " + r.weeks + " sem." : "") : "Échoué"}
                            {r.attempts ? " · " + r.attempts + " tentative" + (r.attempts > 1 ? "s" : "") : ""}
                          </div>
                        </>
                      ) : (
                        <div style={{ color: T.fg5, fontSize: 12, marginTop: 2 }}>Pas encore tenté</div>
                      )}
                    </div>
                    <div className="tm-num" style={{ color: r ? T.clay : T.fg5, fontSize: 16, fontWeight: 600, flexShrink: 0 }}>
                      {r ? (r.score || 0).toLocaleString("fr-FR") : "—"}
                    </div>
                  </div>
                  {open && (
                    <div style={{ background: T.bg2, borderRadius: 0, padding: "6px 10px", marginBottom: 10 }}>
                      {r.rows.map((row, k) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, padding: "3px 0", color: T.fg3 }}>
                          <span>{row.label} <span style={{ color: T.fg5 }}>· {row.detail}</span></span>
                          <span className="tm-num" style={{ color: T.fg }}>{row.pts.toLocaleString("fr-FR")}</span>
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
