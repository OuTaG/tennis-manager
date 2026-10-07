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
  const INK = T.ink;
  const chip = (bg, fg) => ({ display: "inline-block", background: bg, color: fg, border: "2px solid " + INK, fontSize: 11, fontWeight: 800, padding: "0 6px", textTransform: "uppercase", letterSpacing: 0.3 });
  const rule = (txt) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span className="tm-display" style={{ ...chip(INK, "#ffffff"), fontWeight: 400, fontSize: 12, padding: "1px 8px" }}>{txt}</span>
      <div style={{ flex: 1, borderTop: "2px dashed " + INK }} />
    </div>
  );
  const band = (txt, mb = 14) => (
    <div className="tm-display" style={{ background: INK, color: "#ffffff", fontSize: 15, margin: "-16px -16px " + mb + "px", padding: "5px 12px" }}>{txt}</div>
  );

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Performance</div>

      {/* Hero stats card */}
      <div className="tm-halftone-yellow" style={{ ...styles.atpCard, background: undefined }}>
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 0 }}>
          <div>
            <span style={chip(INK, "#ffffff")}>Classement</span>
            <div className="tm-display" style={{ fontSize: 48, color: "#141414", lineHeight: 1, letterSpacing: -1, textShadow: "3px 3px 0 #ffffff" }}>#{ranking}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ ...chip("#ffffff", "#141414"), marginBottom: 4 }}>Cote</span>
            <div className="tm-display" style={{ fontSize: 30, color: "#141414", lineHeight: 1, background: "#ffffff", border: "2.5px solid " + T.ink, padding: "2px 8px" }}>{rating}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ ...chip("#ffffff", "#141414"), marginBottom: 4 }}>Points</span>
            <div className="tm-display" style={{ fontSize: 24, color: "#141414", lineHeight: 1 }}>{totalPts.toLocaleString("fr-FR")}</div>
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
          { icon: "trophy", v: player.titlesWon, l: "Titres", color: "#e0a21b" },
          { icon: "star", v: player.careerBigWins || 0, l: "Vict. top 50", color: "#c4572b" },
          { icon: "trending", v: summary.bestRank < 9999 ? "#" + summary.bestRank : "—", l: "Meilleur rang", color: "#1f7a45" },
          { icon: "money", v: fmtMoney, l: "Gains", color: "#2c6fd1" },
          { icon: "activity", v: played, l: "Matchs", color: "#5b2d8e" },
          { icon: "calendar", v: seasons, l: seasons > 1 ? "Saisons" : "Saison", color: "#141414" },
        ];
        return (
          <div style={{ ...styles.skillsCard }}>
            {band("Carrière", 12)}
            {/* Bilan victoires / défaites */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <span className="tm-display" style={{ fontSize: 34, color: T.green, lineHeight: 1 }}>{player.careerWins}</span>
              <span style={{ color: "#141414", fontSize: 13, fontWeight: 700 }}>victoires</span>
              <span style={{ color: "#141414", fontSize: 20, fontWeight: 800 }}>·</span>
              <span className="tm-display" style={{ fontSize: 34, color: "#c4302b", lineHeight: 1 }}>{player.careerLosses}</span>
              <span style={{ color: "#141414", fontSize: 13, fontWeight: 700 }}>défaites</span>
              <span className="tm-display" style={{ marginLeft: "auto", background: "#1f7a45", color: "#ffffff", border: "2px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontSize: 14, padding: "1px 7px" }}>{winRate}%</span>
            </div>
            <div style={{ height: 12, background: played > 0 ? "#c4302b" : "#ffffff", border: "2px solid " + T.ink, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ width: winRate + "%", height: "100%", background: "#1f7a45", borderRight: winRate > 0 && winRate < 100 ? "2px solid " + T.ink : "none" }} />
            </div>
            {/* Chiffres clés */}
            <div style={{ display: "flex", flexWrap: "wrap", rowGap: 14 }}>
              {items.map((it, i) => (
                <div key={i} style={{ width: "50%", display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ width: 34, height: 34, background: "#ffffff", border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={it.icon} size={20} color={T.ink} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="tm-display" style={{ color: "#141414", fontSize: 17, lineHeight: 1.1 }}>{it.v}</div>
                    <div style={{ color: "#141414", fontSize: 12, fontWeight: 700 }}>{it.l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Favourite surface */}
      {player.favoriteSurface && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#ffffff", color: "#141414", border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, padding: "12px 14px", marginBottom: 14 }}>
          <SurfaceIcon name={player.favoriteSurface} size={48} />
          <div style={{ minWidth: 0 }}>
            <span style={chip(INK, "#ffffff")}>Surface de prédilection</span>
            <div className="tm-display" style={{ color: "#141414", fontSize: 16, marginTop: 4 }}>{player.favoriteSurface} <span style={{ ...chip("#1f7a45", "#ffffff"), fontFamily: T.body, textTransform: "none", marginLeft: 4, verticalAlign: 2 }}>+{SURFACE_BONUS} en match</span></div>
          </div>
        </div>
      )}

      {/* Progression graphs */}
      <div style={{ marginBottom: 4 }}>
        {rule("Progression")}
        <MiniLineChart data={pointsSeries} label="Points" color={T.green}
          info="Total de vos points ATP sur les 52 dernières semaines. Chaque tournoi rapporte des points selon le tour atteint ; ils expirent un an plus tard." />
        <MiniLineChart data={rankingSeries} label="Classement" color={T.ball} invertY
          info="Votre rang mondial parmi les 1 200 joueurs du circuit, établi d'après vos points ATP. Plus le chiffre est bas, meilleur vous êtes. Il décide de votre accès aux tournois et de la valeur de vos sponsors." />
        <MiniLineChart data={moneySeries} label="Trésorerie" color={T.green} suffix="€"
          info="L'argent dont vous disposez : gains en tournoi, sponsors et primes, moins les dépenses (staff, voyages, entraînements, frais fixes). Sous zéro, c'est la faillite." />
        <MiniLineChart data={ratingSeries} label="Cote moyenne" color={T.green}
          info="La moyenne de vos six statistiques (service, coup droit, revers, endurance, mental, filet). Elle résume votre niveau de jeu global." />
      </div>

      {/* Per-stat mini charts */}
      <div style={{ marginBottom: 18 }}>
        {rule("Évolution des stats")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {statKeys.map(k => {
            const s = history.map(h => ({ x: h.week, year: h.year, value: Math.round((h.stats[k] || 0) * 10) / 10 }));
            return <MiniLineChart key={k} data={s} label={statLabels[k] || k} color={T.green} height={50} />;
          })}
        </div>
      </div>

      {/* Current skills */}
      <div style={styles.skillsCard}>
        {band("Compétences actuelles")}
        {Object.entries(player.stats).map(([k, v]) => {
          const color = v >= 75 ? "#1f7a45" : v >= 55 ? "#e0a21b" : "#c9b6ea";
          return (
            <div key={k} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#141414", fontSize: 13, fontWeight: 700 }}>{statLabels[k] || k}</span>
                <span className="tm-display" style={{ color: "#141414", fontSize: 14 }}>{Math.round(v)}</span>
              </div>
              <div style={styles.statBarBg}>
                <div style={{ ...styles.statBarFill, width: v + "%", background: color, borderRight: v > 0 && v < 100 ? "2px solid " + INK : "none", boxSizing: "border-box" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Past seasons */}
      {(player.careerSeasons || []).length > 0 && (
        <div style={styles.skillsCard}>
          {band("Saisons passées")}
          {(player.careerSeasons || []).slice().reverse().map((s, i) => (
            <div key={s.year} style={{ background: "#ffffff", color: "#141414", padding: 12, marginBottom: i < (player.careerSeasons.length - 1) ? 8 : 0, border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div className="tm-display" style={{ color: "#141414", fontSize: 18, letterSpacing: 0.5 }}>SAISON {s.year}</div>
                <div className="tm-display" style={{ ...chip("#d6ef3c", "#141414"), fontWeight: 400, fontSize: 13 }}>#{s.endOfYearRanking}</div>
              </div>
              <div style={{ display: "flex", gap: 12, color: "#141414", fontSize: 11.5, fontWeight: 700 }}>
                <span><span className="tm-num" style={{ color: "#1f7a45", fontWeight: 800 }}>{s.wins}</span>V</span>
                <span><span className="tm-num" style={{ color: "#c4302b", fontWeight: 800 }}>{s.losses}</span>D</span>
                <span><span className="tm-num" style={{ color: "#5b2d8e", fontWeight: 800 }}>{s.titles}</span> titre{s.titles > 1 ? "s" : ""}</span>
                <span style={{ marginLeft: "auto", fontWeight: 800 }} className="tm-num">{s.earnings.toLocaleString()}€</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match history */}
      <div style={styles.skillsCard}>
        {band("Historique récent")}
        {player.matchHistory.length === 0 && <div className="tm-lettering" style={{ color: "#141414", fontSize: 15, textAlign: "center", padding: 16 }}>Aucun match disputé</div>}
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
              <div key={gi} style={{ marginBottom: 14, paddingTop: gi ? 12 : 0, borderTop: gi ? "2px dashed " + INK : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {(() => {
                      const tid = tournamentIdByName(g.tournament);
                      return (
                        <div
                          onClick={tid && setTournamentDetail ? () => setTournamentDetail(tid) : undefined}
                          className="tm-display" style={{ color: "#141414", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: tid ? "pointer" : "default", textDecoration: tid ? "underline" : "none", textDecorationColor: INK, textUnderlineOffset: 3 }}
                        >{g.tournament}{tid ? " ›" : ""}</div>
                      );
                    })()}
                    <span style={{ ...chip(title ? "#d6ef3c" : "#ffffff", "#141414"), marginTop: 4, fontSize: 10 }}>S{g.week} · {g.year} · {outcome}</span>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="tm-display" style={{ color: "#1f7a45", fontSize: 13 }}>+{prize.toLocaleString()}€</div>
                    <div className="tm-num" style={{ color: "#5b2d8e", fontSize: 11, marginTop: 2, fontWeight: 800 }}>+{pts} pts</div>
                  </div>
                </div>
                {g.matches.map((m, i) => (
                  <div key={i} style={{
                    ...styles.historyCard,
                    background: "#ffffff", color: "#141414",
                    border: "2px solid " + INK, boxShadow: "2px 2px 0 " + INK,
                    borderLeft: "6px solid " + (m.won ? "#1f7a45" : "#c4302b"),
                    marginBottom: 6, padding: "7px 10px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3 }}>{historyRoundLabel(m)} · vs {m.opponent} <span className="tm-num">#{m.opponentRank}</span></div>
                    <div className="tm-num" style={{ color: m.won ? "#1f7a45" : "#c4302b", fontSize: 12.5, marginTop: 3, fontWeight: 800 }}>{m.won ? "V " : "D "} {m.score}</div>
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
          {band("Rivalités")}
          {(player.rivalries || [])
            .filter(r => r.wins + r.losses >= 2)
            .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
            .map(r => {
              const total = r.wins + r.losses;
              const winPct = Math.round((r.wins / total) * 100);
              return (
                <div key={r.name} style={{
                  marginBottom: 12, padding: 12,
                  background: "#ffffff", color: "#141414",
                  border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div className="tm-display" style={{ color: "#141414", fontSize: 14 }}>{r.name}</div>
                    <div className="tm-num" style={{
                      fontSize: 12, fontWeight: 800,
                      color: r.wins > r.losses ? "#1f7a45" : r.wins < r.losses ? "#c4302b" : "#141414",
                    }}>
                      {r.wins}V · {r.losses}D
                    </div>
                  </div>
                  <div style={{ display: "flex", height: 10, border: "2px solid " + INK, background: "#ffffff", overflow: "hidden" }}>
                    <div style={{ flex: winPct, background: "#1f7a45", borderRight: winPct > 0 && winPct < 100 ? "2px solid " + INK : "none", minWidth: winPct > 0 ? 4 : 0 }} />
                    <div style={{ flex: 100 - winPct, background: "#c4302b", minWidth: 100 - winPct > 0 ? 4 : 0 }} />
                  </div>
                  <div className="tm-lettering" style={{ color: "#141414", fontSize: 13, marginTop: 4 }}>{total} confrontations · {winPct}% de victoires</div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
