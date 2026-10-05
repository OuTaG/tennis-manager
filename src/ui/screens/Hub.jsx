// Écran Accueil : la une du journal.
import { CITIES } from "../../data/geo.js";
import { PLAYER_STYLES } from "../../data/staff.js";
import { ALL_TOURNAMENTS, tierLabel } from "../../engine/circuit.js";
import { difficultyLevel, formatMultiplier, scoreMultiplier } from "../../engine/difficulty.js";
import { buildFrontPage, pickDispatches } from "../../engine/frontpage.js";
import { Avatar } from "../avatar.jsx";
import { FlagFromEmoji, Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

const TONE = { clay: T.clay, green: T.green, blue: T.blue, red: T.red };

// Portrait imprimé en deux couleurs : l'avatar en encre sur un aplat,
// une seconde passe décalée et une trame de points (risographie).
export function PrintPortrait({ avatar, tone = "clay", width = 128, height = 168 }) {
  const accent = TONE[tone] || T.clay;
  const size = Math.round(width * 0.95);
  return (
    <div aria-hidden="true" style={{ position: "relative", width, height, flexShrink: 0, overflow: "hidden", background: accent }}>
      <div style={{ position: "absolute", inset: 0, background: T.paper, opacity: 0.72 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(" + accent + " 1.3px, transparent 1.5px)", backgroundSize: "5px 5px", opacity: 0.55 }} />
      {avatar ? (
        <>
          <div style={{ position: "absolute", left: (width - size) / 2 + 3, bottom: -2, opacity: 0.55, filter: "grayscale(1) brightness(1.4)", mixBlendMode: "multiply" }}>
            <Avatar config={avatar} size={size} bare />
          </div>
          <div style={{ position: "absolute", left: (width - size) / 2, bottom: 0, filter: "grayscale(1) contrast(1.35)", mixBlendMode: "multiply" }}>
            <Avatar config={avatar} size={size} bare />
          </div>
        </>
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="racquet" size={56} color={T.ink} strokeWidth={1.4} />
        </div>
      )}
    </div>
  );
}

function Rubric({ title, aside, color }) {
  return (
    <div className="tm-rubric">
      <span>{title}</span>
      {aside && <span className="tm-eyebrow" style={{ color: color || T.fg4 }}>{aside}</span>}
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
  const energyColor = player.energy > 60 ? T.paper : player.energy > 30 ? T.gold : "#ffb3a0";
  const story = buildFrontPage({ player, ranking, enrolled });
  const dispatches = pickDispatches(news, 3);
  const level = difficultyLevel(player.difficulty ?? 3);
  const mul = scoreMultiplier(player);
  const ss = (player.seasonStats && player.seasonStats.year === player.year) ? player.seasonStats : { wins: 0, losses: 0, titles: 0 };
  const cell = { borderRight: "1px solid rgba(243,238,226,0.35)", paddingLeft: 10 };
  const big = { fontFamily: T.display, fontWeight: 800, fontSize: 30, lineHeight: 1, fontVariantNumeric: "tabular-nums" };
  const small = { fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 3 };

  return (
    <div style={styles.tabContent}>
      {/* MANCHETTE */}
      <header style={{ marginBottom: 12 }}>
        <div className="tm-eyebrow" style={{ display: "flex", justifyContent: "space-between", color: T.fg3 }}>
          <span>Semaine {player.week} · {player.year}</span>
          <span><FlagFromEmoji emoji={CITIES[player.location]?.flag} size={9} /> {player.location}</span>
          <span className="tm-num">{Math.round(player.money).toLocaleString("fr-FR")} €</span>
        </div>
        <div style={{ borderTop: "3px solid " + T.ink, borderBottom: "1px solid " + T.ink, marginTop: 6, padding: "4px 0 2px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: T.display, fontWeight: 900, fontSize: 32, lineHeight: 1, textTransform: "uppercase", letterSpacing: 0.5, color: T.fg }}>Courtside</span>
          <span className="tm-serif" style={{ fontStyle: "italic", fontSize: 13, color: T.fg3 }}>l'hebdo du circuit</span>
        </div>
      </header>

      {/* LA UNE */}
      <article className="tm-fade-up" style={{ display: "grid", gridTemplateColumns: "128px minmax(0, 1fr)", gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid " + T.ink }}>
        <PrintPortrait avatar={player.avatar} tone={story.tone} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <div className="tm-eyebrow" style={{ color: TONE[story.tone] || T.clay }}>{story.kicker}</div>
          <h1 style={{ margin: 0, fontFamily: T.display, fontWeight: 900, fontSize: 32, lineHeight: 0.92, textTransform: "uppercase", color: T.fg, overflowWrap: "anywhere" }}>{story.title}</h1>
          <p className="tm-serif" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.3, color: T.fg2 }}>{story.deck}</p>
        </div>
      </article>

      {/* TABLEAU D'AFFICHAGE DU JOUEUR */}
      <section aria-label="Votre joueur" className="tm-fade-up" style={{ background: T.green, color: T.paper, padding: "10px 12px 12px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, borderBottom: "1px solid rgba(243,238,226,0.45)", paddingBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: T.display, fontWeight: 800, fontSize: 22, textTransform: "uppercase", letterSpacing: 0.4 }}>{player.name}</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>
            {player.nationality || "France"} · {player.age} ans · {PLAYER_STYLES[player.styleId]?.name} · <span style={{ color: T.gold, fontWeight: 800 }}>{level.name} {formatMultiplier(mul)}</span>
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", marginTop: 8 }}>
          <div style={{ borderRight: cell.borderRight }}><div style={big}>{ranking > 1000 ? "—" : ranking}</div><div style={small}>Rang</div></div>
          <div style={cell}><div style={big}>{totalPts.toLocaleString("fr-FR")}</div><div style={small}>Points</div></div>
          <div style={cell}><div style={big}>{(ss.wins || 0) + "-" + (ss.losses || 0)}</div><div style={small}>Saison</div></div>
          <div style={{ paddingLeft: 10 }}><div style={{ ...big, color: energyColor }}>{Math.round(player.energy)}</div><div style={small}>Énergie</div></div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, fontWeight: 700, flexWrap: "wrap" }}>
          <span>Côte {rating}</span>
          <span>Bonheur {Math.round(player.happiness ?? 70)}</span>
          <span>Popularité {Math.round(player.popularity ?? 20)}</span>
          <span>Image {Math.round(player.image ?? 60)}</span>
          {(ss.titles || 0) > 0 && <span style={{ color: T.gold }}>{ss.titles} titre{ss.titles > 1 ? "s" : ""}</span>}
        </div>
      </section>

      {/* INJURY */}
      {injury && (
        <div className="tm-fade-up" style={{
          background: T.bg1,
          borderRadius: 3, padding: 16, marginBottom: 14,
          border: "1px solid " + T.brd,
          borderLeft: "3px solid " + (injury.severity === "severe" ? T.red : injury.severity === "moderate" ? "var(--tm-clay)" : T.amber),
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
          <div style={{ marginTop: 10, padding: "8px 10px", background: T.amberSub, border: "1px solid " + T.amber, borderRadius: 3, color: T.amber, fontSize: 11, lineHeight: 1.4, fontWeight: 600 }}>
            <Icon name="warning" size={12} /> Vous pouvez continuer à vous entraîner, mais chaque séance risque fortement d'aggraver la blessure et de rallonger l'indisponibilité.
          </div>
        </div>
      )}

      {/* WILDCARDS */}
      {wildcardOffers.length > 0 && (
        <div className="tm-fade-up" style={{
          background: T.bg1,
          borderRadius: 3, padding: 16, marginBottom: 14,
          border: "1px solid " + T.brd, borderLeft: "3px solid " + T.ball,
        }}>
          <div className="tm-eyebrow" style={{ color: T.ball, marginBottom: 10 }}><Icon name="ticket" size={11} /> Wildcards proposées</div>
          {wildcardOffers.map((o, i) => {
            const t = ALL_TOURNAMENTS.find(x => x.id === o.tournamentId);
            return (
              <div key={i} style={{ background: T.bg2, borderRadius: 3, padding: 12, marginBottom: i < wildcardOffers.length - 1 ? 8 : 0, border: "1px solid " + T.brd }}>
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
          background: T.greenSub, border: "1px solid " + T.greenBrd,
          borderRadius: 3, padding: 14, marginBottom: 12,
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
        <div style={{ background: T.bg1, border: "1px solid " + T.brd, borderRadius: 3, padding: 14, marginBottom: 14 }}>
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
              <div key={i} className="tm-serif" style={{ fontSize: 13.5, lineHeight: 1.3, color: T.fg2, paddingBottom: 6, borderBottom: i < dispatches.length - 1 ? "1px solid " + T.brd : "none" }}>
                <strong style={{ fontFamily: T.body, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: d.rubric === "Retraite" ? T.clay : d.rubric === "Résultats" ? T.green : T.blue }}>{d.rubric}</strong> — {d.text}
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
