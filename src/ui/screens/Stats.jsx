// Écran Carrière › Stats.
import { tournamentIdByName } from "../../engine/history.js";
import { computeCareerSummary } from "../../engine/legacy.js";
import { SURFACE_BONUS } from "../../engine/player.js";
import { MiniLineChart } from "../charts.jsx";
import { historyRoundLabel } from "../format.js";
import { Icon, SurfaceIcon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

export function StatsScreen({ player, rating, ranking, totalPts, setTournamentDetail }) {
  const winRate = player.careerWins + player.careerLosses > 0 ? Math.round(player.careerWins / (player.careerWins + player.careerLosses) * 100) : 0;
  const statLabels = { serve: "Service", forehand: "Coup droit", backhand: "Revers", stamina: "Endurance", mental: "Mental", net: "Jeu au filet" };
  const history = player.history || [];
  const pointsSeries = history.map(h => ({ x: h.week, year: h.year, value: h.points }));
  const rankingSeries = history.map(h => ({ x: h.week, year: h.year, value: h.ranking }));
  const moneySeries = history.map(h => ({ x: h.week, year: h.year, value: h.money }));
  const ratingSeries = history.map(h => ({ x: h.week, year: h.year, value: Math.round(Object.values(h.stats).reduce((a, b) => a + b, 0) / Object.keys(h.stats).length) }));
  const statKeys = Object.keys(player.stats);

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Performance</div>

      {/* Hero stats card */}
      <div style={{ ...styles.atpCard }} className="tm-court">
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 0 }}>
          <div>
            <div className="tm-eyebrow">Classement</div>
            <div className="tm-display" style={{ fontSize: 48, color: T.green, lineHeight: 1, letterSpacing: -1 }}>#{ranking}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="tm-eyebrow">Côte</div>
            <div className="tm-num" style={{ fontSize: 32, color: T.fg, fontWeight: 800, lineHeight: 1 }}>{rating}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="tm-eyebrow">Points</div>
            <div className="tm-num" style={{ fontSize: 24, color: T.fg, fontWeight: 700, lineHeight: 1 }}>{totalPts.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Stats de carrière */}
      {(() => {
        const summary = computeCareerSummary(player);
        const played = player.careerWins + player.careerLosses;
        const money = player.totalEarnings || 0;
        const fmtMoney = money >= 1e6 ? (Math.round(money / 1e5) / 10) + " M€" : money >= 1000 ? (Math.round(money / 100) / 10) + " k€" : money + " €";
        const seasons = (player.careerSeasons || []).length + 1;
        const items = [
          { icon: "trophy", v: player.titlesWon, l: "Titres", color: T.ball },
          { icon: "star", v: player.careerBigWins || 0, l: "Vict. top 50", color: T.clay },
          { icon: "trending", v: summary.bestRank < 9999 ? "#" + summary.bestRank : "—", l: "Meilleur rang", color: T.green },
          { icon: "money", v: fmtMoney, l: "Gains", color: T.green },
          { icon: "activity", v: played, l: "Matchs", color: T.blue },
          { icon: "calendar", v: seasons, l: seasons > 1 ? "Saisons" : "Saison", color: T.fg3 },
        ];
        return (
          <div style={{ ...styles.skillsCard }}>
            <div style={{ color: T.fg, fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Carrière</div>
            {/* Bilan victoires / défaites */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <span className="tm-display" style={{ fontSize: 34, color: T.green, lineHeight: 1 }}>{player.careerWins}</span>
              <span style={{ color: T.fg4, fontSize: 13 }}>victoires</span>
              <span style={{ color: T.fg5, fontSize: 20 }}>·</span>
              <span className="tm-display" style={{ fontSize: 34, color: T.fg2, lineHeight: 1 }}>{player.careerLosses}</span>
              <span style={{ color: T.fg4, fontSize: 13 }}>défaites</span>
              <span className="tm-num" style={{ marginLeft: "auto", color: T.green, fontSize: 15, fontWeight: 600 }}>{winRate}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: T.bg3, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ width: winRate + "%", height: "100%", background: T.green, borderRadius: 4 }} />
            </div>
            {/* Chiffres clés */}
            <div style={{ display: "flex", flexWrap: "wrap", rowGap: 14 }}>
              {items.map((it, i) => (
                <div key={i} style={{ width: "50%", display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 11, background: T.bg2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={it.icon} size={17} color={it.color} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="tm-num" style={{ color: T.fg, fontSize: 17, fontWeight: 600, lineHeight: 1.1 }}>{it.v}</div>
                    <div style={{ color: T.fg4, fontSize: 12 }}>{it.l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Favourite surface */}
      {player.favoriteSurface && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.bg1, border: "1px solid " + T.brd, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: T.greenSub, border: "1px solid " + T.greenBrd, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <SurfaceIcon name={player.favoriteSurface} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="tm-eyebrow">Surface de prédilection</div>
            <div style={{ color: T.fg, fontWeight: 700, fontSize: 14, marginTop: 2 }}>{player.favoriteSurface} <span style={{ color: T.green, fontSize: 11, fontWeight: 600 }}>+{SURFACE_BONUS} en match</span></div>
          </div>
        </div>
      )}

      {/* Progression graphs */}
      <div style={{ marginBottom: 4 }}>
        <div className="tm-eyebrow" style={{ marginBottom: 10 }}>Progression</div>
        <MiniLineChart data={pointsSeries} label="Points" color={T.green}
          info="Total de vos points ATP sur les 52 dernières semaines. Chaque tournoi rapporte des points selon le tour atteint ; ils expirent un an plus tard." />
        <MiniLineChart data={rankingSeries} label="Classement" color={T.ball} invertY
          info="Votre rang mondial parmi les 1 200 joueurs du circuit, établi d'après vos points ATP. Plus le chiffre est bas, meilleur vous êtes. Il décide de votre accès aux tournois et de la valeur de vos sponsors." />
        <MiniLineChart data={moneySeries} label="Trésorerie" color={T.green} suffix="€"
          info="L'argent dont vous disposez : gains en tournoi, sponsors et primes, moins les dépenses (staff, voyages, entraînements, frais fixes). Sous zéro, c'est la faillite." />
        <MiniLineChart data={ratingSeries} label="Côte moyenne" color={T.green}
          info="La moyenne de vos six statistiques (service, coup droit, revers, endurance, mental, filet). Elle résume votre niveau de jeu global." />
      </div>

      {/* Per-stat mini charts */}
      <div style={{ marginBottom: 18 }}>
        <div className="tm-eyebrow" style={{ marginBottom: 10 }}>Évolution des stats</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {statKeys.map(k => {
            const s = history.map(h => ({ x: h.week, year: h.year, value: Math.round((h.stats[k] || 0) * 10) / 10 }));
            return <MiniLineChart key={k} data={s} label={statLabels[k] || k} color={T.green} height={50} />;
          })}
        </div>
      </div>

      {/* Current skills */}
      <div style={styles.skillsCard}>
        <div className="tm-eyebrow" style={{ marginBottom: 14 }}>Compétences actuelles</div>
        {Object.entries(player.stats).map(([k, v]) => {
          const color = v >= 75 ? T.green : v >= 55 ? T.amber : T.fg3;
          return (
            <div key={k} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: T.fg2, fontSize: 13, fontWeight: 500 }}>{statLabels[k] || k}</span>
                <span className="tm-num" style={{ color, fontWeight: 700, fontSize: 13 }}>{Math.round(v)}</span>
              </div>
              <div style={styles.statBarBg}>
                <div style={{ ...styles.statBarFill, width: v + "%", background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Past seasons */}
      {(player.careerSeasons || []).length > 0 && (
        <div style={styles.skillsCard}>
          <div className="tm-eyebrow" style={{ marginBottom: 12 }}>Saisons passées</div>
          {(player.careerSeasons || []).slice().reverse().map((s, i) => (
            <div key={s.year} style={{ background: T.bg2, borderRadius: 8, padding: 12, marginBottom: i < (player.careerSeasons.length - 1) ? 8 : 0, border: "1px solid " + T.brd }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div className="tm-display" style={{ color: T.fg, fontSize: 18, letterSpacing: 0.5 }}>SAISON {s.year}</div>
                <div className="tm-num" style={{ color: T.green, fontSize: 13, fontWeight: 700 }}>#{s.endOfYearRanking}</div>
              </div>
              <div style={{ display: "flex", gap: 12, color: T.fg3, fontSize: 11 }}>
                <span><span className="tm-num" style={{ color: T.green }}>{s.wins}</span>V</span>
                <span><span className="tm-num" style={{ color: T.red }}>{s.losses}</span>D</span>
                <span><span className="tm-num" style={{ color: T.ball }}>{s.titles}</span> titre{s.titles > 1 ? "s" : ""}</span>
                <span style={{ marginLeft: "auto" }} className="tm-num">{s.earnings.toLocaleString()}€</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match history */}
      <div style={styles.skillsCard}>
        <div className="tm-eyebrow" style={{ marginBottom: 12 }}>Historique récent</div>
        {player.matchHistory.length === 0 && <div style={{ color: T.fg5, fontSize: 12, textAlign: "center", padding: 16 }}>Aucun match disputé</div>}
        {(() => {
          // Group consecutive matches of the same tournament (same week/year).
          const groups = [];
          for (const m of player.matchHistory.slice(0, 40)) {
            const g = groups[groups.length - 1];
            if (g && g.tournament === m.tournament && g.week === m.week && g.year === m.year) g.matches.push(m);
            else groups.push({ tournament: m.tournament, week: m.week, year: m.year, matches: [m] });
          }
          return groups.slice(0, 6).map((g, gi) => {
            const prize = g.matches.reduce((a, m) => a + (m.prize || 0), 0);
            const pts = g.matches.reduce((a, m) => a + (m.pts || 0), 0);
            const last = g.matches[0]; // most recent match of the tournament
            const title = last.won && last.round === "Vainqueur";
            const outcome = title ? "Vainqueur" : (last.won ? "En cours" : "Éliminé · " + historyRoundLabel(last));
            return (
              <div key={gi} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {(() => {
                      const tid = tournamentIdByName(g.tournament);
                      return (
                        <div
                          onClick={tid && setTournamentDetail ? () => setTournamentDetail(tid) : undefined}
                          style={{ color: T.fg, fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: tid ? "pointer" : "default", textDecoration: tid ? "underline" : "none", textDecorationColor: T.fg5, textUnderlineOffset: 3 }}
                        >{g.tournament}{tid ? " ›" : ""}</div>
                      );
                    })()}
                    <div className="tm-eyebrow" style={{ marginTop: 2, color: title ? T.ball : T.fg5 }}>S{g.week} · {g.year} · {outcome}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="tm-num" style={{ color: T.green, fontSize: 12, fontWeight: 700 }}>+{prize.toLocaleString()}€</div>
                    <div className="tm-num" style={{ color: T.ball, fontSize: 11, marginTop: 2 }}>+{pts} pts</div>
                  </div>
                </div>
                {g.matches.map((m, i) => (
                  <div key={i} style={{
                    ...styles.historyCard,
                    borderLeft: "3px solid " + (m.won ? T.green : T.red),
                    marginBottom: 4, padding: "8px 10px",
                  }}>
                    <div className="tm-eyebrow">{historyRoundLabel(m)} · vs {m.opponent} <span className="tm-num">#{m.opponentRank}</span></div>
                    <div className="tm-num" style={{ color: m.won ? T.green : T.red, fontSize: 12, marginTop: 3, fontWeight: 700 }}>{m.won ? "V " : "D "} {m.score}</div>
                  </div>
                ))}
              </div>
            );
          });
        })()}
      </div>

      {/* Rivalités */}
      {(player.rivalries || []).filter(r => r.wins + r.losses >= 2).length > 0 && (
        <div style={styles.skillsCard}>
          <div className="tm-eyebrow" style={{ marginBottom: 12 }}>Rivalités</div>
          {(player.rivalries || [])
            .filter(r => r.wins + r.losses >= 2)
            .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
            .map(r => {
              const total = r.wins + r.losses;
              const winPct = Math.round((r.wins / total) * 100);
              return (
                <div key={r.name} style={{
                  marginBottom: 12, padding: 12,
                  background: T.bg2, borderRadius: 10,
                  border: "1px solid " + T.brd,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ color: T.fg, fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                    <div className="tm-num" style={{
                      fontSize: 12, fontWeight: 800,
                      color: r.wins > r.losses ? T.green : r.wins < r.losses ? T.red : T.fg4,
                    }}>
                      {r.wins}V · {r.losses}D
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ flex: winPct, height: 5, background: T.green, borderRadius: "3px 0 0 3px", minWidth: winPct > 0 ? 4 : 0 }} />
                    <div style={{ flex: 100 - winPct, height: 5, background: T.red, borderRadius: "0 3px 3px 0", minWidth: 100 - winPct > 0 ? 4 : 0 }} />
                  </div>
                  <div style={{ color: T.fg4, fontSize: 10, marginTop: 4 }}>{total} confrontations · {winPct}% de victoires</div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
