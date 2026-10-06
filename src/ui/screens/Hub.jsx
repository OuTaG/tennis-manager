// Écran Accueil : la une du journal.
import { PLAYER_STYLES } from "../../data/staff.js";
import { ALL_TOURNAMENTS, tierLabel } from "../../engine/circuit.js";
import { difficultyLevel, formatMultiplier, scoreMultiplier } from "../../engine/difficulty.js";
import { buildFrontPage, pickDispatches } from "../../engine/frontpage.js";
import { Avatar } from "../avatar.jsx";
import { Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

// Couleur de la case de la une selon l'actualité.
const PANEL = { clay: "tm-halftone-magenta", red: "tm-halftone-magenta", green: "tm-halftone-yellow", blue: "tm-halftone-cyan" };

function Rubric({ title, aside, color }) {
  return (
    <div className="tm-rubric">
      <span>{title}</span>
      {aside && <span className="tm-eyebrow" style={{ color: color || T.fg }}>{aside}</span>}
    </div>
  );
}

// Étiquette noire et jaune des dépêches.
function Tag({ children }) {
  return <span style={{ background: T.ink, color: T.gold, fontSize: 10, fontWeight: 800, padding: "1px 5px", letterSpacing: 0.6, textTransform: "uppercase", marginRight: 6 }}>{children}</span>;
}

// ─── SUB SCREENS ───────────────────────────────────────────────────────────────
export function HubScreen({ player, news, advanceWeek, rating, ranking, totalPts, cancelEnrollment, isAdvancingWeek, acceptWildcard, declineWildcard, retire, setTournamentDetail }) {
  const staffWeeklyCost = player.staff.reduce((a, s) => a + s.cost, 0);
  const enrolled = player.enrollment ? ALL_TOURNAMENTS.find(t => t.id === player.enrollment.tournamentId) : null;
  const injury = player.injury;
  const wildcardOffers = player.wildcardOffers || [];
  const canRetire = (player.age || 0) >= 28;
  const story = buildFrontPage({ player, ranking, enrolled });
  const dispatches = pickDispatches(news, 3);
  const level = difficultyLevel(player.difficulty ?? 3);
  const mul = scoreMultiplier(player);
  const ss = (player.seasonStats && player.seasonStats.year === player.year) ? player.seasonStats : { wins: 0, losses: 0, titles: 0 };

  return (
    <div style={styles.tabContent}>
      {/* LA UNE : une case de BD */}
      <article aria-label="La une" className={"tm-fade-up " + (PANEL[story.tone] || "tm-halftone-cyan")} style={{ position: "relative", height: 270, border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ position: "absolute", right: -10, bottom: 40 }}>
          {player.avatar
            ? <Avatar config={player.avatar} size={210} bare />
            : <Icon name="racquet" size={120} color={T.ink} strokeWidth={1.4} />}
        </div>
        <div className="tm-lettering" style={{ position: "absolute", left: 10, top: 10, maxWidth: 220, background: T.gold, color: "#161616", border: "2.5px solid " + T.ink, padding: "3px 8px", fontSize: 15 }}>{story.caption}</div>
        <div className="tm-lettering" style={{ position: "absolute", left: 10, top: 54, width: 168, background: "#ffffff", color: "#161616", border: "2.5px solid " + T.ink, borderRadius: "50% / 46%", padding: "14px 14px", fontSize: 16, textAlign: "center" }}>« {story.quote} »</div>
        <svg width="40" height="30" viewBox="0 0 40 30" aria-hidden="true" style={{ position: "absolute", left: 146, top: 112 }}>
          <path d="M2 2 L38 28 L22 2" fill="#ffffff" stroke="#161616" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M3 0 L21 0" stroke="#ffffff" strokeWidth="5" />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "#161616", color: "#ffffff", padding: "7px 10px 8px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "#d6ef3c", textTransform: "uppercase" }}>{story.kicker}</div>
          <h1 className="tm-display" style={{ margin: 0, fontSize: 23, lineHeight: 1, overflowWrap: "anywhere" }}>{story.title}</h1>
        </div>
      </article>
      <p style={{ margin: "0 2px 14px", fontSize: 13.5, lineHeight: 1.35, color: T.fg, fontWeight: 500 }}>{story.deck}</p>

      {/* LE JOUEUR */}
      <section aria-label="Votre joueur" className="tm-fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", background: T.bg1, border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, marginBottom: 14 }}>
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 10px", borderBottom: "2.5px solid " + T.ink }}>
          <span className="tm-display" style={{ fontSize: 17, lineHeight: 1.1, minWidth: 0, overflowWrap: "anywhere" }}>{player.name}</span>
          <span style={{ background: T.magenta, color: "#ffffff", fontSize: 11, fontWeight: 800, padding: "2px 6px", transform: "rotate(-3deg)", whiteSpace: "nowrap", textTransform: "uppercase" }}>{level.name} {formatMultiplier(mul)}</span>
        </div>
        {[
          { label: "Rang", value: ranking > 1000 ? "—" : ranking },
          { label: "Points", value: totalPts.toLocaleString("fr-FR") },
          { label: "Saison", value: (ss.wins || 0) + "-" + (ss.losses || 0) },
          { label: "Énergie", value: Math.round(player.energy), yellow: true },
        ].map((c, i) => (
          <div key={c.label} className={c.yellow ? "tm-halftone-yellow" : undefined} style={{ padding: "6px 8px", borderRight: i < 3 ? "2px solid " + T.ink : "none", color: c.yellow ? "#161616" : T.fg }}>
            <div className="tm-display tm-num" style={{ fontSize: 23, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, flexWrap: "wrap", padding: "6px 10px", borderTop: "2px solid " + T.ink, fontSize: 11, fontWeight: 700 }}>
          <span>{player.nationality || "France"} · {player.age} ans · {PLAYER_STYLES[player.styleId]?.name}</span>
          <span>Côte {rating}</span>
          <span>Bonheur {Math.round(player.happiness ?? 70)}</span>
          <span>Popularité {Math.round(player.popularity ?? 20)}</span>
          <span>Image {Math.round(player.image ?? 60)}</span>
          {(ss.titles || 0) > 0 && <span style={{ color: T.magenta }}>{ss.titles} titre{ss.titles > 1 ? "s" : ""}</span>}
        </div>
      </section>

      {/* INJURY */}
      {injury && (
        <div className="tm-fade-up" style={{
          background: T.bg1,
          padding: 16, marginBottom: 14,
          border: "2.5px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink,
          borderLeft: "8px solid " + (injury.severity === "severe" ? T.red : injury.severity === "moderate" ? "var(--tm-clay)" : T.amber),
        }}>
          <div className="tm-eyebrow" style={{ color: injury.severity === "severe" ? T.red : T.amber, marginBottom: 6 }}>
            {injury.severity === "severe" ? "Blessure sévère" : injury.severity === "moderate" ? "Blessure" : "Gêne"}
          </div>
          <div style={{ color: T.fg, fontSize: 14, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="bandage" size={16} color={T.amber} />
            {injury.label}
          </div>
          <div style={{ color: T.fg3, fontSize: 12, lineHeight: 1.5 }}>
            {injury.canPlay
              ? "Stats réduites de " + Math.round(injury.statPenalty * 100) + "% en match."
              : "Impossible de disputer un tournoi."}
            <span style={{ color: T.fg5 }}> · </span>
            Rétablissement dans <strong style={{ color: T.fg2, fontFamily: T.mono }}>{injury.weeksRemaining} sem</strong>.
          </div>
          <div style={{ marginTop: 10, padding: "8px 10px", background: T.amberSub, border: "1px solid " + T.amber, color: T.amber, fontSize: 11, lineHeight: 1.4, fontWeight: 600 }}>
            <Icon name="warning" size={12} /> Vous pouvez continuer à vous entraîner, mais chaque séance risque fortement d'aggraver la blessure et de rallonger l'indisponibilité.
          </div>
        </div>
      )}

      {/* WILDCARDS */}
      {wildcardOffers.length > 0 && (
        <div className="tm-fade-up" style={{
          background: T.bg1,
          padding: 16, marginBottom: 14,
          border: "2.5px solid " + T.ink, borderLeft: "8px solid " + T.gold, boxShadow: "4px 4px 0 " + T.ink,
        }}>
          <div className="tm-eyebrow" style={{ color: T.ball, marginBottom: 10 }}><Icon name="ticket" size={11} /> Wildcards proposées</div>
          {wildcardOffers.map((o, i) => {
            const t = ALL_TOURNAMENTS.find(x => x.id === o.tournamentId);
            return (
              <div key={i} style={{ background: T.bg2, padding: 12, marginBottom: i < wildcardOffers.length - 1 ? 8 : 0, border: "2px solid " + T.ink }}>
                <div style={{ color: T.fg, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{o.tournamentName}</div>
                <div className="tm-eyebrow" style={{ marginBottom: 10 }}>
                  {t ? tierLabel(t.tier) : ""} · {t?.city || ""} · S{o.tournamentWeek}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...styles.btnSmall, background: T.green, color: T.bg0, borderColor: T.green, flex: 1 }} onClick={() => acceptWildcard(o)}>Accepter</button>
                  <button style={{ ...styles.btnSmall, flex: 1 }} onClick={() => declineWildcard(o)}>Refuser</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CETTE SEMAINE */}
      <section aria-label="Cette semaine" style={{ marginBottom: 14 }}>
        <Rubric title="Cette semaine" aside={enrolled ? tierLabel(enrolled.tier) + " · " + enrolled.surface : "Calendrier libre"} color={T.blue} />
      {enrolled && (
        <div className="tm-fade-up" style={{
          background: T.bg1, border: "2.5px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink,
          padding: 14, marginBottom: 12,
        }}>
          <div className="tm-eyebrow" style={{ color: T.green, marginBottom: 6 }}>Engagé</div>
          <div
            onClick={() => setTournamentDetail && setTournamentDetail(enrolled.id)}
            style={{ color: T.fg, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {enrolled.name}
            <Icon name="chevron-right" size={13} color={T.green} />
          </div>
          <div style={{ color: T.fg3, fontSize: 12, marginTop: 2 }}>
            Semaine {enrolled.week}
            {player.enrollment?.entryStatus === "qualifying" && <span style={{ color: T.amber }}> · qualifs</span>}
            {player.enrollment?.entryStatus === "wildcard" && <span style={{ color: T.ball }}> · wildcard</span>}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button style={styles.btnSmall} onClick={() => setTournamentDetail && setTournamentDetail(enrolled.id)}>Voir le tournoi</button>
            {enrolled.week !== player.week && (
              <button style={styles.btnSmall} onClick={cancelEnrollment}>Annuler</button>
            )}
          </div>
        </div>
      )}

      {/* Travel reminder */}
      {enrolled && enrolled.week === (player.week === 52 ? 1 : player.week + 1) && player.location !== enrolled.city && (
        <div style={styles.alertBox}>
          <strong><Icon name="plane" size={11} /> Rappel voyage</strong><br />
          <span style={{ fontSize: 12 }}>Tournoi à <strong>{enrolled.city}</strong> dès la semaine prochaine. Actuellement à {player.location}.</span>
        </div>
      )}

      {player.money < 1000 && (
        <div style={{ ...styles.alertBox, borderLeftColor: T.red, borderColor: T.red, color: T.fg2 }}>
          <strong style={{ color: T.red }}>Budget critique</strong> — Inscrivez-vous à des tournois du Circuit Open locaux.
        </div>
      )}

        {!enrolled && (
          <div style={{ fontSize: 13, color: T.fg3, marginBottom: 10 }}>Aucun tournoi au programme. Inscrivez-vous depuis l'onglet Circuit.</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", rowGap: 4, fontSize: 13, color: T.fg2 }}>
          <span>Staff</span><span className="tm-num" style={{ color: T.red, fontWeight: 700 }}>−{staffWeeklyCost} €/sem.</span>
          <span>Charges</span><span className="tm-num" style={{ color: T.red, fontWeight: 700 }}>−{player.weeklyExpenses} €/sem.</span>
        </div>
      </section>

      {(player.sponsors || []).some(s => s.objective) && (
        <div style={{ background: T.bg1, border: "2.5px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, padding: 14, marginBottom: 16 }}>
          <div className="tm-eyebrow" style={{ color: T.ball, marginBottom: 10 }}>
            <Icon name="target" size={11} /> Objectifs sponsors
          </div>
          {(player.sponsors || []).filter(s => s.objective).map((s, i, arr) => {
            const o = s.objective;
            const base = s.objectiveBaseline || { titles: 0, wins: 0, bigwins: 0 };
            let cur = 0, met = false, curLabel = "";
            if (o.type === "rank") { cur = ranking; met = ranking <= o.target; curLabel = "#" + ranking + " / top " + o.target; }
            else if (o.type === "titles") { cur = (player.titlesWon || 0) - base.titles; met = cur >= o.target; curLabel = cur + "/" + o.target; }
            else if (o.type === "wins") { cur = (player.careerWins || 0) - base.wins; met = cur >= o.target; curLabel = cur + "/" + o.target; }
            else if (o.type === "bigwins") { cur = (player.careerBigWins || 0) - base.bigwins; met = cur >= o.target; curLabel = cur + "/" + o.target; }
            const progress = o.type === "rank" ? (met ? 1 : Math.max(0, Math.min(1, o.target / Math.max(1, ranking)))) : Math.max(0, Math.min(1, cur / o.target));
            // Weeks left until this objective is evaluated (next negotiation phase).
            let weeksLeft = null;
            if (typeof s.weeksLeft === "number") {
              weeksLeft = s.weeksLeft; // objective = whole contract
            } else if (s.objectiveYear !== undefined && s.objectiveWeek !== undefined) {
              weeksLeft = (s.objectiveYear - player.year) * 52 + (s.objectiveWeek - player.week);
              if (weeksLeft < 0) weeksLeft = 0;
            }
            return (
              <div key={i} style={{ marginBottom: i < arr.length - 1 ? 12 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ color: T.fg2, fontSize: 12, fontWeight: 700 }}>{s.brand}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                    {weeksLeft !== null && (
                      <span style={{ color: weeksLeft <= 4 ? T.amber : T.fg5, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {weeksLeft} sem restantes
                      </span>
                    )}
                    <span className="tm-num" style={{ color: met ? T.green : T.fg4, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{curLabel}</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: met ? T.green : T.fg4, fontSize: 11 }}>{met ? "✓ " : ""}{o.label}</span>
                  <span style={{ color: T.green, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", marginLeft: 8 }}>+{(s.objectiveReward || 0).toLocaleString()}€ / −{(s.objectivePenalty || 0).toLocaleString()}€</span>
                </div>
                <div style={{ height: 4, background: T.bg3, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: (progress * 100).toFixed(0) + "%", height: "100%", background: met ? T.green : T.ball, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DÉPÊCHES */}
      {dispatches.length > 0 && (
        <section aria-label="Dépêches" style={{ marginBottom: 14 }}>
          <Rubric title="Dépêches" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dispatches.map((d, i) => (
              <div key={i} style={{ fontSize: 13, lineHeight: 1.35, color: T.fg }}>
                <Tag>{d.rubric}</Tag>{d.text}
              </div>
            ))}
          </div>
        </section>
      )}

      <button style={{ ...styles.btnPrimary, opacity: isAdvancingWeek ? 0.5 : 1 }} disabled={isAdvancingWeek} onClick={advanceWeek}>
        {isAdvancingWeek ? "Simulation en cours…" : "Semaine suivante →"}
      </button>

      {canRetire && (
        <button style={{ ...styles.btnSecondary, marginTop: 10 }} onClick={retire}>
          Prendre sa retraite
        </button>
      )}
    </div>
  );
}
