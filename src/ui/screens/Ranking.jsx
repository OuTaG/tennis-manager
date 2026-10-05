// Écran Carrière › Classement (classique et Race).
import { useState, useMemo } from "react";
import { ALL_TOURNAMENTS } from "../../engine/circuit.js";
import { racePointsOf, raceStandings } from "../../engine/race.js";
import { rankingName } from "../format.js";
import { FlagFromEmoji, Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

// Onglet Classement : classement mondial (52 semaines) ou Race (année civile).
export function RankingScreen(props) {
  const [subTab, setSubTab] = useState("classic");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, padding: "14px 16px 0" }}>
        {[
          { id: "classic", label: "Classique", icon: "trophy" },
          { id: "race", label: "Race", icon: "trending" },
        ].map(t => {
          const active = subTab === t.id;
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)} style={{
              ...styles.filterBtn, ...(active ? styles.filterBtnActive : {}),
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <Icon name={t.icon} size={14} color={active ? T.onAccent : T.fg3} />
              {t.label}
            </button>
          );
        })}
      </div>
      {subTab === "classic" && <AtpScreen {...props} />}
      {subTab === "race" && <RaceScreen atpDb={props.atpDb} player={props.player} raceRank={props.raceRank} setAtpPlayerDetail={props.setAtpPlayerDetail} />}
    </div>
  );
}

// Race : points gagnés depuis le 1er janvier. Les 8 premiers en fin de
// saison disputent le Masters de fin d'année.
export function RaceScreen({ atpDb, player, raceRank, setAtpPlayerDetail }) {
  const [showAll, setShowAll] = useState(false);
  const year = player.year;
  const myPts = racePointsOf(player.atpPointsLog, year);
  const standings = useMemo(() => raceStandings(atpDb, year), [atpDb, year]);
  const finals = ALL_TOURNAMENTS.find(t => t.tier === "Finals");
  const limit = showAll ? 100 : 20;
  // Liste fusionnée avec le joueur à sa place.
  const rows = [];
  let inserted = false;
  for (let i = 0; i < standings.length && rows.length < limit; i++) {
    if (!inserted && rows.length + 1 === raceRank) { rows.push({ me: true }); inserted = true; if (rows.length >= limit) break; }
    rows.push({ p: standings[i].p, pts: standings[i].pts });
  }
  const eighth = raceRank <= 8 ? (standings[8] ? standings[8].pts : 0) : (standings[7] ? standings[7].pts : 0);
  const gap = raceRank <= 8 ? myPts - eighth : eighth - myPts;
  const weeksLeft = finals ? Math.max(0, finals.week - player.week) : 0;

  const row = (r, rank) => {
    const isMe = !!r.me;
    const qualified = rank <= 8;
    return (
      <div key={isMe ? "me" : r.p.id}>
        <div
          className={isMe ? "tm-fade-up" : "tm-card"}
          onClick={() => !isMe && rank <= 100 && setAtpPlayerDetail && setAtpPlayerDetail(r.p.id)}
          style={{
            ...styles.atpRow,
            ...(isMe ? { background: T.greenSub, border: "1px solid " + T.greenBrd, borderLeft: "3px solid " + T.green } : {}),
            ...(!isMe && qualified ? { background: T.bg2, borderLeft: "3px solid " + T.ball } : {}),
            cursor: isMe ? "default" : "pointer",
          }}
        >
          <span className="tm-num" style={{ color: isMe ? T.green : qualified ? T.ball : T.fg3, fontWeight: 800, width: 40, fontSize: 14 }}>#{rank}</span>
          <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <FlagFromEmoji emoji={isMe ? player.nationalityFlag : r.p.nat.flag} size={13} />
            <span style={{ color: T.fg, fontSize: 13, fontWeight: isMe ? 700 : 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isMe ? rankingName(player.name) : r.p.name}
            </span>
            {isMe && <span className="tm-eyebrow" style={{ color: T.green, fontSize: 9 }}>VOUS</span>}
          </span>
          <span className="tm-num" style={{ color: isMe ? T.green : T.fg2, fontWeight: 700, fontSize: 13, width: 70, textAlign: "right" }}>
            {(isMe ? myPts : r.pts).toLocaleString()}
          </span>
        </div>
        {rank === 8 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0 8px", color: T.ball, fontSize: 11, fontWeight: 600 }}>
            <div style={{ flex: 1, borderTop: "1px dashed " + T.ball }} />
            Qualification pour le {finals ? finals.name : "Masters"}
            <div style={{ flex: 1, borderTop: "1px dashed " + T.ball }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Race {year}</div>
      <div style={{ ...styles.skillsCard, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
          <div>
            <div className="tm-eyebrow">Votre place</div>
            <div className="tm-num" style={{ color: raceRank <= 8 ? T.green : T.fg, fontSize: 28, fontWeight: 800 }}>#{raceRank}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="tm-eyebrow">Points {year}</div>
            <div className="tm-num" style={{ color: T.fg, fontSize: 20, fontWeight: 700 }}>{myPts.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ color: T.fg3, fontSize: 12.5, lineHeight: 1.5, marginTop: 10 }}>
          {raceRank <= 8
            ? "Dans le top 8 : " + gap.toLocaleString() + " pts d'avance sur la 9e place."
            : "À " + Math.max(0, gap).toLocaleString() + " pts de la 8e place."}
          {finals && (player.week <= finals.week
            ? " " + finals.name + " en semaine " + finals.week + (weeksLeft > 0 ? " (dans " + weeksLeft + " sem.)" : " (cette semaine)") + "."
            : " La Race repart de zéro le 1er janvier.")}
        </div>
      </div>
      {standings.length > 0 && standings[0].pts === 0 && (
        <div style={{ color: T.fg4, fontSize: 12, lineHeight: 1.5, margin: "0 2px 10px" }}>
          Aucun point marqué pour l'instant : l'ordre suit le classement de la semaine 52 jusqu'aux premiers résultats.
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", marginBottom: 4, color: T.fg5, fontSize: 9, fontWeight: 700 }}>
        <span style={{ width: 40 }}>Rang</span>
        <span style={{ flex: 1 }}>Joueur</span>
        <span style={{ width: 70, textAlign: "right" }}>Points</span>
      </div>
      {rows.map((r, i) => row(r, i + 1))}
      {!inserted && raceRank > limit && (
        <>
          <div style={{ textAlign: "center", color: T.fg5, margin: "4px 0" }}>…</div>
          {row({ me: true }, raceRank)}
        </>
      )}
      <button style={{ ...styles.btnSecondary, marginTop: 10 }} onClick={() => setShowAll(v => !v)}>
        {showAll ? "Afficher le top 20" : "Afficher le top 100"}
      </button>
    </div>
  );
}

export function AtpScreen({ atpDb, player, ranking, totalPts, atpPage, setAtpPage, setAtpPlayerDetail }) {
  const totalPages = 12;
  const perPage = 100;
  const start = (atpPage - 1) * perPage;
  const rows = [];
  for (let r = start + 1; r <= start + perPage; r++) {
    if (r === ranking) {
      rows.push({ isPlayer: true, rank: r });
    } else {
      const dbIdx = r < ranking ? r - 1 : r - 2;
      if (dbIdx >= 0 && dbIdx < atpDb.length) {
        rows.push({ isPlayer: false, rank: r, p: atpDb[dbIdx] });
      }
    }
  }

  // Page shortcuts: pages 1, 2, 3, 5, player's page, last
  const playerPage = Math.ceil(ranking / 100);
  const quickPages = [1, 2, 3, 5, playerPage, 12].filter((v, i, a) => a.indexOf(v) === i && v >= 1 && v <= 12).sort((a, b) => a - b);

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Classement mondial</div>

      {/* Page navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
        <button
          style={{ ...styles.btnSmall, opacity: atpPage > 1 ? 1 : 0.3, padding: "8px 12px" }}
          disabled={atpPage === 1}
          onClick={() => setAtpPage(atpPage - 1)}
        >←</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div className="tm-eyebrow">Page</div>
          <div className="tm-num" style={{ color: T.fg, fontSize: 16, fontWeight: 700 }}>{atpPage} / {totalPages}</div>
        </div>
        <button
          style={{ ...styles.btnSmall, opacity: atpPage < totalPages ? 1 : 0.3, padding: "8px 12px" }}
          disabled={atpPage === totalPages}
          onClick={() => setAtpPage(atpPage + 1)}
        >→</button>
      </div>

      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {quickPages.map(p => (
          <button
            key={p}
            style={{ ...styles.filterBtn, ...(atpPage === p ? styles.filterBtnActive : {}), display: "inline-flex", alignItems: "center", gap: 4 }}
            onClick={() => setAtpPage(p)}
          >
            {p === playerPage && <Icon name="location" size={10} color={T.green} />}
            P{p}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div style={{
        display: "flex", alignItems: "center", padding: "8px 12px",
        marginBottom: 4, color: T.fg5, fontSize: 9, fontWeight: 700,
        letterSpacing: 0.2, textTransform: "none",
      }}>
        <span style={{ width: 40 }}>Rang</span>
        <span style={{ flex: 1 }}>Joueur</span>
        <span style={{ width: 70, textAlign: "right" }}>Points</span>
      </div>

      {rows.map((row, idx) => {
        if (row.isPlayer) {
          return (
            <div key={"me-" + row.rank} className="tm-fade-up" style={{
              background: T.greenSub,
              borderRadius: 3, padding: "12px 14px", marginBottom: 4,
              border: "1px solid " + T.greenBrd,
              borderLeft: "3px solid " + T.green,
              display: "flex", alignItems: "center",
            }}>
              <span className="tm-num" style={{ color: T.green, fontWeight: 800, width: 40, fontSize: 14 }}>
                #{row.rank}
              </span>
              <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <FlagFromEmoji emoji={player.nationalityFlag} size={13} />
                <span style={{ color: T.fg, fontWeight: 700, fontSize: 13, letterSpacing: 0.2 }}>{rankingName(player.name)}</span>
                <span className="tm-eyebrow" style={{ color: T.green, fontSize: 9 }}>VOUS</span>
              </span>
              <span className="tm-num" style={{ color: T.green, fontWeight: 700, fontSize: 13, width: 70, textAlign: "right" }}>
                {totalPts.toLocaleString()}
              </span>
            </div>
          );
        }
        const p = row.p;
        const clickable = row.rank <= 100 && setAtpPlayerDetail;
        const isTop10 = row.rank <= 10;
        const isTop50 = row.rank <= 50;

        return (
          <div
            key={p.id}
            className="tm-card"
            style={{
              ...styles.atpRow,
              ...(isTop10 ? { background: T.bg2 } : {}),
              borderLeft: isTop10 ? "3px solid " + T.ball : "1px solid " + T.brd,
              borderColor: T.brd,
              cursor: clickable ? "pointer" : "default",
            }}
            onClick={() => clickable && setAtpPlayerDetail(p.id)}
          >
            <span className="tm-num" style={{
              color: isTop10 ? T.ball : isTop50 ? T.green : T.fg3,
              fontWeight: 800, width: 40, fontSize: 14,
            }}>#{row.rank}</span>
            <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 16 }}><FlagFromEmoji emoji={p.nat.flag} /></span>
              <span style={{
                color: clickable ? T.fg : T.fg2,
                fontSize: 13, fontWeight: 600,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                letterSpacing: 0.2,
              }}>{p.name}</span>
            </span>
            <span className="tm-num" style={{
              color: isTop10 ? T.ball : T.fg2,
              fontWeight: 700, fontSize: 13, width: 70, textAlign: "right",
            }}>{p.points.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}
