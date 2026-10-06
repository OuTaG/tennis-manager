// Écran Accueil : la une du journal.
import { PLAYER_STYLES } from "../../data/staff.js";
import { ALL_TOURNAMENTS, tierColor, tierLabel } from "../../engine/circuit.js";
import { difficultyLevel, formatMultiplier, scoreMultiplier } from "../../engine/difficulty.js";
import { buildFrontPage } from "../../engine/frontpage.js";
import { Avatar } from "../avatar.jsx";
import { FlagFromEmoji, Icon } from "../icons.jsx";
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

// Jauge BD (0–100) : case encrée, remplissage tramé, mot d'humeur.
function MoodGauge({ icon, label, value, color, words }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const word = v >= 75 ? words[3] : v >= 50 ? words[2] : v >= 25 ? words[1] : words[0];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "26px minmax(0, 1fr) 40px", alignItems: "center", gap: 8 }}>
      <span style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: color, border: "2px solid " + T.ink }}>
        <Icon name={icon} size={14} color="#ffffff" />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</span>
          <span className="tm-lettering" style={{ fontSize: 13, color }}>{word}</span>
        </div>
        <div style={{ height: 12, border: "2px solid " + T.ink, background: "#ffffff" }}>
          <div style={{ height: "100%", width: v + "%", background: color, backgroundImage: "radial-gradient(rgba(255,255,255,0.35) 1.2px, transparent 1.4px)", backgroundSize: "5px 5px", borderRight: v > 0 && v < 100 ? "2px solid " + T.ink : "none" }} />
        </div>
      </div>
      <span className="tm-display tm-num" style={{ fontSize: 20, textAlign: "right" }}>{v}</span>
    </div>
  );
}

// ─── SUB SCREENS ───────────────────────────────────────────────────────────────
export function HubScreen({ player, news, advanceWeek, rating, ranking, totalPts, cancelEnrollment, isAdvancingWeek, acceptWildcard, declineWildcard, retire, setTournamentDetail }) {
  const staffWeeklyCost = player.staff.reduce((a, s) => a + s.cost, 0);
  const enrolled = player.enrollment ? ALL_TOURNAMENTS.find(t => t.id === player.enrollment.tournamentId) : null;
  const injury = player.injury;
  const wildcardOffers = player.wildcardOffers || [];
  const canRetire = (player.age || 0) >= 28;
  const story = buildFrontPage({ player, ranking, enrolled });
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
        {/* Bulle : la pointe est attachée à la bulle et vise la bouche du
            joueur ; une deuxième pointe blanche, sans trait, efface le
            contour de la bulle à la jonction pour que le tout soit d'un seul tenant. */}
        <div style={{ position: "absolute", left: 12, top: 52, width: 172 }}>
          <svg width="48" height="40" viewBox="0 0 48 40" aria-hidden="true" style={{ position: "absolute", right: -40, top: "48%", zIndex: 0, overflow: "visible" }}>
            <path d="M0 4 C14 14 26 30 38 56 C24 40 14 30 2 22" fill="#ffffff" stroke="#161616" strokeWidth="3" strokeLinejoin="round" />
          </svg>
          <div className="tm-lettering" style={{ position: "relative", zIndex: 1, background: "#ffffff", color: "#161616", border: "3px solid " + T.ink, borderRadius: "50% / 46%", padding: "16px 16px", fontSize: 16, lineHeight: 1.15, textAlign: "center" }}>« {story.quote} »</div>
          <svg width="48" height="40" viewBox="0 0 48 40" aria-hidden="true" style={{ position: "absolute", right: -40, top: "48%", zIndex: 2, overflow: "visible" }}>
            <path d="M-6 6.5 C9 15 19 27 28 42 C17 32 8 28 -6 19.5 Z" fill="#ffffff" />
          </svg>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "#161616", color: "#ffffff", padding: "7px 10px 8px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "#d6ef3c", textTransform: "uppercase" }}>{story.kicker}</div>
          <h1 className="tm-display" style={{ margin: 0, fontSize: 23, lineHeight: 1, overflowWrap: "anywhere" }}>{story.title}</h1>
        </div>
      </article>
      <p style={{ margin: "0 2px 14px", fontSize: 13.5, lineHeight: 1.35, color: T.fg, fontWeight: 500 }}>{story.deck}</p>

      {/* LE JOUEUR */}
      <section aria-label="Votre joueur" className="tm-fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", background: T.bg1, border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, marginBottom: 14 }}>
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 10px", borderBottom: "2.5px solid " + T.ink }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
            <span className="tm-display" style={{ fontSize: 17, lineHeight: 1.1, minWidth: 0, overflowWrap: "anywhere" }}>{player.name}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>
              {player.nationalityFlag && <FlagFromEmoji emoji={player.nationalityFlag} size={13} />}{player.age} ans
            </span>
          </span>
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
        {/* Style de jeu et cote : deux étiquettes encrées « libellé | valeur » */}
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "7px 10px", borderTop: "2px solid " + T.ink }}>
          {[
            PLAYER_STYLES[player.styleId]?.name && ["Style", PLAYER_STYLES[player.styleId].name, "#ffffff", "#141414"],
            ["Cote", rating, "#d6ef3c", "#141414"],
            (ss.titles || 0) > 0 && ["Titres", ss.titles, "#c4302b", "#ffffff"],
          ].filter(Boolean).map(([l, v, bg, fg]) => (
            <span key={l} style={{ display: "inline-flex", alignItems: "stretch", border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, whiteSpace: "nowrap" }}>
              <span style={{ background: T.ink, color: "#ffffff", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", padding: "3px 6px", display: "flex", alignItems: "center" }}>{l}</span>
              <span className="tm-display" style={{ background: bg, color: fg, fontSize: 13, padding: "2px 8px", display: "flex", alignItems: "center" }}>{v}</span>
            </span>
          ))}
        </div>
      </section>

      {/* BLESSURE : case BD rouge, onomatopée, état et durée en tampons */}
      {injury && (() => {
        const sev = injury.severity === "severe" ? "Blessure sévère" : injury.severity === "moderate" ? "Blessure" : "Gêne";
        return (
          <div className="tm-fade-up" style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, marginBottom: 14, overflow: "hidden" }}>
            <div style={{ background: "#c4302b", backgroundImage: "radial-gradient(rgba(20,20,20,0.22) 1.3px, transparent 1.5px)", backgroundSize: "6px 6px", position: "relative", borderBottom: "3px solid " + T.ink, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 38, height: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2.5px solid " + T.ink, transform: "rotate(-4deg)" }}>
                <Icon name="bandage" size={22} color="#c4302b" />
              </span>
              <div style={{ minWidth: 0, paddingRight: 64 }}>
                <span style={{ display: "inline-block", background: T.ink, color: "#ffffff", fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: "1px 6px", textTransform: "uppercase" }}>{sev}</span>
                <div className="tm-display" style={{ color: "#ffffff", fontSize: 19, lineHeight: 1.1, marginTop: 3, textShadow: "2px 2px 0 " + T.ink }}>{injury.label}</div>
              </div>
              <span className="tm-display" style={{ position: "absolute", right: 10, top: 6, fontSize: 22, color: "#d6ef3c", WebkitTextStroke: "1.5px " + T.ink, textShadow: "2px 2px 0 " + T.ink, transform: "rotate(8deg)" }}>AÏE !</span>
            </div>
            <div style={{ padding: "10px 12px 12px" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ background: injury.canPlay ? "#e0a21b" : "#c4302b", color: injury.canPlay ? "#141414" : "#ffffff", border: "2px solid " + T.ink, fontSize: 11.5, fontWeight: 800, padding: "1px 7px" }}>
                  {injury.canPlay ? "Stats −" + Math.round(injury.statPenalty * 100) + " % en match" : "Tournois impossibles"}
                </span>
                <span style={{ background: "#ffffff", border: "2px solid " + T.ink, fontSize: 11.5, fontWeight: 800, padding: "1px 7px" }}>
                  Retour dans {injury.weeksRemaining} sem.
                </span>
              </div>
              <div className="tm-lettering" style={{ marginTop: 9, background: "#fff6c9", border: "2px solid " + T.ink, padding: "6px 9px", fontSize: 14, lineHeight: 1.3, display: "flex", gap: 7, alignItems: "flex-start" }}>
                <Icon name="warning" size={15} color="#c4302b" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>Vous pouvez vous entraîner, mais chaque séance risque fort d'aggraver la blessure et de rallonger l'indisponibilité.</span>
              </div>
            </div>
          </div>
        );
      })()}

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
        <div className="tm-fade-up" style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ background: tierColor(enrolled.tier), borderBottom: "2.5px solid " + T.ink, padding: "3px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span className="tm-display" style={{ color: "#ffffff", fontSize: 12.5, textShadow: "1px 1px 0 " + T.ink }}>{tierLabel(enrolled.tier)}</span>
            <span style={{ background: "#d6ef3c", color: "#141414", border: "2px solid " + T.ink, fontSize: 10, fontWeight: 800, padding: "0 5px", textTransform: "uppercase" }}>Engagé</span>
          </div>
          <div style={{ padding: "10px 12px 12px" }}>
            <div
              className="tm-display"
              onClick={() => setTournamentDetail && setTournamentDetail(enrolled.id)}
              style={{ fontSize: 18, lineHeight: 1.1, cursor: "pointer" }}
            >{enrolled.name} ›</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
              {[
                ["Semaine " + enrolled.week, "#ffffff", "#141414"],
                [enrolled.city, "#ffffff", "#141414"],
                player.enrollment?.entryStatus === "qualifying" && ["Qualifications", "#e0a21b", "#141414"],
                player.enrollment?.entryStatus === "wildcard" && ["Wildcard", "#d6ef3c", "#141414"],
              ].filter(Boolean).map(([txt, bg, fg]) => (
                <span key={txt} style={{ background: bg, color: fg, border: "2px solid " + T.ink, fontSize: 11, fontWeight: 800, padding: "1px 6px" }}>{txt}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="tm-display" style={{ flex: 1, background: "#1f7a45", color: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "7px 8px", fontSize: 13, cursor: "pointer" }} onClick={() => setTournamentDetail && setTournamentDetail(enrolled.id)}>Voir le tournoi</button>
              {enrolled.week !== player.week && (
                <button style={{ ...styles.btnSmall, background: "#ffffff", color: "#c4302b", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, fontWeight: 800 }} onClick={cancelEnrollment}>Annuler</button>
              )}
            </div>
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
        {/* Dépenses fixes de la semaine */}
        <div style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink }}>
          <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 14, padding: "5px 10px" }}>Dépenses de la semaine</div>
          <div style={{ padding: "2px 12px 10px" }}>
            {[["Staff", staffWeeklyCost], ["Charges", player.weeklyExpenses]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "2px dashed " + T.ink, fontSize: 13.5, fontWeight: 700 }}>
                <span>{l}</span>
                <span className="tm-num" style={{ color: "#c4302b", fontWeight: 800 }}>−{v} €</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 9 }}>
              <span className="tm-display" style={{ fontSize: 14 }}>Total</span>
              <span className="tm-display" style={{ fontSize: 15, background: "#c4302b", color: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "1px 8px" }}>−{staffWeeklyCost + player.weeklyExpenses} €/sem.</span>
            </div>
          </div>
        </div>
      </section>

      {(player.sponsors || []).some(s => s.objective) && (
        <div style={{ background: T.bg1, border: "2.5px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, padding: 14, marginBottom: 16 }}>
          <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 15, margin: "-14px -14px 12px", padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="target" size={14} color={T.gold} /> Objectifs sponsors
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
                  <span className="tm-display" style={{ fontSize: 14 }}>{s.brand}</span>
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
                <div style={{ height: 12, background: "#ffffff", border: "2px solid " + T.ink, overflow: "hidden" }}>
                  <div style={{ width: (progress * 100).toFixed(0) + "%", height: "100%", background: met ? "#1f7a45" : "#d6ef3c", backgroundImage: "radial-gradient(rgba(20,20,20,0.18) 1.2px, transparent 1.4px)", backgroundSize: "5px 5px", borderRight: progress > 0 && progress < 1 ? "2px solid " + T.ink : "none", transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MORAL ET RÉPUTATION : bonheur, popularité, image */}
      <section aria-label="Moral et réputation" className="tm-fade-up" style={{ background: T.bg1, border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, marginBottom: 14 }}>
        <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 15, padding: "5px 10px", letterSpacing: 0.5 }}>Moral et réputation</div>
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          <MoodGauge icon="heart" label="Bonheur" value={player.happiness ?? 70} color="#1f7a45" words={["Au fond du trou", "Morose", "Serein", "Aux anges"]} />
          <MoodGauge icon="megaphone" label="Popularité" value={player.popularity ?? 20} color="#5b2d8e" words={["Inconnu", "Remarqué", "Apprécié", "Star"]} />
          <MoodGauge icon="star" label="Image" value={player.image ?? 60} color="#c4572b" words={["Sulfureuse", "Fragile", "Correcte", "Exemplaire"]} />
        </div>
      </section>

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
