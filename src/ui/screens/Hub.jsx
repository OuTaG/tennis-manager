// Écran Accueil.
import { CITIES } from "../../data/geo.js";
import { PLAYER_STYLES } from "../../data/staff.js";
import { ALL_TOURNAMENTS, tierLabel } from "../../engine/circuit.js";
import { Avatar } from "../avatar.jsx";
import { FlagFromEmoji, Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

// ─── SUB SCREENS ───────────────────────────────────────────────────────────────
export function HubScreen({ player, advanceWeek, rating, ranking, totalPts, cancelEnrollment, isAdvancingWeek, acceptWildcard, declineWildcard, retire, setTournamentDetail }) {
  const staffWeeklyCost = player.staff.reduce((a, s) => a + s.cost, 0);
  const enrolled = player.enrollment ? ALL_TOURNAMENTS.find(t => t.id === player.enrollment.tournamentId) : null;
  const injury = player.injury;
  const wildcardOffers = player.wildcardOffers || [];
  const canRetire = (player.age || 0) >= 28;
  const energyColor = player.energy > 60 ? T.green : player.energy > 30 ? T.amber : T.red;

  return (
    <div style={styles.tabContent}>
      {/* HERO: editorial player card */}
      <div className="tm-fade-up" style={{
        background: T.bg1,
        borderRadius: 14, padding: 0, marginBottom: 16,
        border: "1px solid " + T.brd, position: "relative", overflow: "hidden",
      }}>
        {/* Decorative gradient stripe */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 90,
          background: "none",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", padding: 20, display: "flex", gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 19,
            background: player.avatar ? "transparent" : T.bg3, border: player.avatar ? "none" : "1px solid " + T.brd2,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, overflow: "hidden",
          }}>
            {player.avatar ? (
              <Avatar config={player.avatar} size={72} />
            ) : (
              <Icon name={PLAYER_STYLES[player.styleId]?.iconName || "racquet"} size={36} color={T.green} strokeWidth={1.5} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="tm-eyebrow" style={{ marginBottom: 4 }}><FlagFromEmoji emoji={player.nationalityFlag} size={10} /> {player.nationality || "France"} · {player.age} ans · {PLAYER_STYLES[player.styleId]?.name}</div>
            <div className="tm-display" style={{ color: T.fg, fontSize: 28, lineHeight: 1, marginBottom: 8, letterSpacing: 0.2 }}>{player.name}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <div style={styles.badge}>Côte {rating}</div>
              {player.titlesWon > 0 && <div style={{ ...styles.badge, color: T.ball, borderColor: "var(--tm-brd2)" }}><Icon name="trophy" size={11} /> {player.titlesWon}</div>}
            </div>
          </div>
        </div>

        {/* Hero rank display */}
        <div style={{ position: "relative", padding: "0 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="tm-eyebrow">Classement mondial</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span className="tm-display" style={{ fontSize: 56, color: T.green, lineHeight: 0.9, letterSpacing: -1 }}>#{ranking}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="tm-eyebrow">Points</div>
            <div className="tm-num" style={{ fontSize: 24, color: T.fg, fontWeight: 700 }}>{totalPts.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* LIFE STATS */}
      <div className="tm-fade-up" style={{
        background: T.bg1, borderRadius: 12, padding: 12, marginBottom: 14,
        border: "1px solid " + T.brd,
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
      }}>
        {[
          { key: "happiness", label: "Bonheur", color: "var(--tm-amber)", icon: "heart", value: Math.round(player.happiness ?? 70) },
          { key: "popularity", label: "Popularité", color: T.green, icon: "sparkles", value: Math.round(player.popularity ?? 20) },
          { key: "image", label: "Image", color: "var(--tm-blue)", icon: "users", value: Math.round(player.image ?? 60) },
        ].map(s => (
          <div key={s.key}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <Icon name={s.icon} size={11} color={s.color} />
              <span style={{ color: T.fg3, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "none" }}>{s.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span className="tm-num" style={{ color: s.color, fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{s.value}</span>
            </div>
            <div style={{ height: 4, background: T.bg4, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: s.value + "%", height: "100%", background: s.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* INJURY */}
      {injury && (
        <div className="tm-fade-up" style={{
          background: T.bg1,
          borderRadius: 12, padding: 16, marginBottom: 14,
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
          <div style={{ marginTop: 10, padding: "8px 10px", background: T.amberSub, border: "1px solid " + T.amber, borderRadius: 8, color: T.amber, fontSize: 11, lineHeight: 1.4, fontWeight: 600 }}>
            <Icon name="warning" size={12} /> Vous pouvez continuer à vous entraîner, mais chaque séance risque fortement d'aggraver la blessure et de rallonger l'indisponibilité.
          </div>
        </div>
      )}

      {/* WILDCARDS */}
      {wildcardOffers.length > 0 && (
        <div className="tm-fade-up" style={{
          background: T.bg1,
          borderRadius: 12, padding: 16, marginBottom: 14,
          border: "1px solid " + T.brd, borderLeft: "3px solid " + T.ball,
        }}>
          <div className="tm-eyebrow" style={{ color: T.ball, marginBottom: 10 }}><Icon name="ticket" size={11} /> Wildcards proposées</div>
          {wildcardOffers.map((o, i) => {
            const t = ALL_TOURNAMENTS.find(x => x.id === o.tournamentId);
            return (
              <div key={i} style={{ background: T.bg2, borderRadius: 8, padding: 12, marginBottom: i < wildcardOffers.length - 1 ? 8 : 0, border: "1px solid " + T.brd }}>
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

      {/* KPI GRID — saison en cours */}
      {(() => {
        const ss = (player.seasonStats && player.seasonStats.year === player.year) ? player.seasonStats : { wins: 0, losses: 0, titles: 0 };
        const sw = ss.wins || 0, sl = ss.losses || 0;
        return (
          <>
            <div style={{ color: T.fg3, fontSize: 12, fontWeight: 600, margin: "2px 2px 6px" }}>Saison {player.year}</div>
            <div style={styles.quickGrid}>
              <div style={styles.quickCard}>
                <div style={styles.quickVal}>{sw}</div>
                <div style={styles.quickLbl}>Victoires</div>
              </div>
              <div style={styles.quickCard}>
                <div style={styles.quickVal}>{sl}</div>
                <div style={styles.quickLbl}>Défaites</div>
              </div>
              <div style={styles.quickCard}>
                <div style={{ ...styles.quickVal, color: T.ball }}>{ss.titles || 0}</div>
                <div style={styles.quickLbl}>Titres</div>
              </div>
              <div style={styles.quickCard}>
                <div style={{ ...styles.quickVal, color: T.green }}>{sw + sl > 0 ? Math.round(sw / (sw + sl) * 100) : 0}%</div>
                <div style={styles.quickLbl}>Win rate</div>
              </div>
            </div>
          </>
        );
      })()}

      {/* ENROLLED */}
      {enrolled && (
        <div className="tm-fade-up" style={{
          background: T.greenSub, border: "1px solid " + T.greenBrd,
          borderRadius: 10, padding: 14, marginBottom: 12,
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

      {/* STATUS */}
      <div style={styles.statusRow}>
        <div style={styles.statusItem}>
          <span className="tm-eyebrow">Localisation</span>
          <strong style={{ color: T.fg, fontSize: 13 }}><FlagFromEmoji emoji={CITIES[player.location]?.flag} /> {player.location}</strong>
        </div>
        <div style={styles.statusItem}>
          <span className="tm-eyebrow">Staff / sem</span>
          <strong className="tm-num" style={{ color: T.red, fontSize: 13 }}>−{staffWeeklyCost}€</strong>
        </div>
        <div style={{ ...styles.statusItem, borderBottom: "none" }}>
          <span className="tm-eyebrow">Charges / sem</span>
          <strong className="tm-num" style={{ color: T.red, fontSize: 13 }}>−{player.weeklyExpenses}€</strong>
        </div>
      </div>

      {(player.sponsors || []).some(s => s.objective) && (
        <div style={{ background: T.bg1, border: "1px solid " + T.brd, borderRadius: 12, padding: 14, marginBottom: 14 }}>
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
