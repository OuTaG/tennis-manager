// Écran Carrière › Classement (classique et Race).
import { useState, useMemo } from "react";
import { ALL_TOURNAMENTS } from "../../engine/circuit.js";
import { racePointsOf, raceStandings } from "../../engine/race.js";
import { rankingName } from "../format.js";
import { FlagFromEmoji, Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

const INK = T.ink;
const chip = (bg, fg) => ({ display: "inline-block", background: bg, color: fg, border: "2px solid " + INK, fontSize: 11, fontWeight: 800, padding: "0 6px", textTransform: "uppercase", letterSpacing: 0.3 });
// Ligne « vous » : bandeau jaune tramé encré.
const meRow = { background: undefined, color: "#141414", border: "3px solid " + INK, boxShadow: "3px 3px 0 " + INK, margin: "6px 0 8px" };
// En-tête de tableau en bandeau noir.
const tableHead = { display: "flex", alignItems: "center", padding: "5px 12px", marginBottom: 6, background: INK, color: "#ffffff", fontSize: 11, fontWeight: 400, letterSpacing: 0.3, textTransform: "uppercase" };
// Pastille de rang.
const rankBadge = (bg, fg) => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 40, background: bg, color: fg, border: "2px solid " + INK, fontSize: 13, padding: "1px 4px", boxSizing: "border-box" });

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
              <Icon name={t.icon} size={14} color="#141414" />
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
          className={isMe ? "tm-fade-up tm-halftone-yellow" : "tm-card"}
          onClick={() => !isMe && rank <= 100 && setAtpPlayerDetail && setAtpPlayerDetail(r.p.id)}
          style={{
            ...styles.atpRow,
            background: "#ffffff", color: "#141414",
            ...(isMe ? meRow : {}),
            ...(!isMe && qualified ? { borderLeft: "6px solid #5b2d8e" } : {}),
            cursor: isMe ? "default" : "pointer",
          }}
        >
          <span style={isMe ? { minWidth: 54, flexShrink: 0, marginRight: 8 } : { width: 54, flexShrink: 0 }}><span className="tm-display" style={isMe ? rankBadge(INK, "#ffffff") : qualified ? rankBadge("#c9b6ea", "#141414") : { color: "#141414", fontSize: 14 }}>#{rank}</span></span>
          <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <FlagFromEmoji emoji={isMe ? player.nationalityFlag : r.p.nat.flag} size={13} />
            <span className={isMe ? "tm-display" : undefined} style={{ color: "#141414", fontSize: isMe ? 14 : 13, fontWeight: isMe ? 400 : 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isMe ? rankingName(player.name) : r.p.name}
            </span>
            {isMe && <span style={{ ...chip(INK, "#ffffff"), fontSize: 10, flexShrink: 0 }}>VOUS</span>}
          </span>
          <span className="tm-display" style={{ color: "#141414", fontSize: 13.5, width: 70, textAlign: "right" }}>
            {(isMe ? myPts : r.pts).toLocaleString()}
          </span>
        </div>
        {rank === 8 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 10px" }}>
            <div style={{ flex: 1, borderTop: "2.5px dashed " + INK }} />
            <span style={{ ...chip("#5b2d8e", "#ffffff"), fontSize: 10, textAlign: "center" }}>Qualification pour le {finals ? finals.name : "Masters"}</span>
            <div style={{ flex: 1, borderTop: "2.5px dashed " + INK }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Race {year}</div>
      <div className={raceRank <= 8 ? "tm-halftone-lilac" : "tm-halftone-yellow"} style={{ border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, padding: 14, marginBottom: 14, color: "#141414" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
          <div>
            <span style={chip(INK, "#ffffff")}>Votre place</span>
            <div className="tm-display" style={{ color: "#141414", fontSize: 34, lineHeight: 1.05, marginTop: 4, textShadow: "2px 2px 0 #ffffff" }}>#{raceRank}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={chip("#ffffff", "#141414")}>Points {year}</span>
            <div className="tm-display" style={{ color: "#141414", fontSize: 22, lineHeight: 1.1, marginTop: 4 }}>{myPts.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "2px solid " + INK, padding: "6px 9px", color: "#141414", fontSize: 12.5, fontWeight: 700, lineHeight: 1.5, marginTop: 10 }}>
          {raceRank <= 8
            ? "Dans le top 8 : " + gap.toLocaleString() + " pts d'avance sur la 9e place."
            : "À " + Math.max(0, gap).toLocaleString() + " pts de la 8e place."}
          {finals && (player.week <= finals.week
            ? " " + finals.name + " en semaine " + finals.week + (weeksLeft > 0 ? " (dans " + weeksLeft + " sem.)" : " (cette semaine)") + "."
            : " La Race repart de zéro le 1er janvier.")}
        </div>
      </div>
      {standings.length > 0 && standings[0].pts === 0 && (
        <div className="tm-lettering" style={{ color: "#141414", fontSize: 14, lineHeight: 1.35, margin: "0 2px 10px" }}>
          Aucun point marqué pour l'instant : l'ordre suit le classement de la semaine 52 jusqu'aux premiers résultats.
        </div>
      )}
      <div className="tm-display" style={tableHead}>
        <span style={{ width: 54, flexShrink: 0 }}>Rang</span>
        <span style={{ flex: 1 }}>Joueur</span>
        <span style={{ width: 70, textAlign: "right" }}>Points</span>
      </div>
      {rows.map((r, i) => row(r, i + 1))}
      {!inserted && raceRank > limit && (
        <>
          <div className="tm-display" style={{ textAlign: "center", color: "#141414", margin: "4px 0" }}>…</div>
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
          className="tm-display"
          style={{ ...styles.btnSmall, fontFamily: T.display, background: "#ffffff", color: "#141414", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, opacity: atpPage > 1 ? 1 : 0.3, padding: "8px 14px", fontSize: 16 }}
          disabled={atpPage === 1}
          onClick={() => setAtpPage(atpPage - 1)}
        >←</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={chip(INK, "#ffffff")}>Page</span>
          <div className="tm-display" style={{ color: "#141414", fontSize: 18, marginTop: 2 }}>{atpPage} / {totalPages}</div>
        </div>
        <button
          className="tm-display"
          style={{ ...styles.btnSmall, fontFamily: T.display, background: "#ffffff", color: "#141414", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, opacity: atpPage < totalPages ? 1 : 0.3, padding: "8px 14px", fontSize: 16 }}
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
            {p === playerPage && <Icon name="location" size={11} color="#1f7a45" />}
            P{p}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div className="tm-display" style={tableHead}>
        <span style={{ width: 54, flexShrink: 0 }}>Rang</span>
        <span style={{ flex: 1 }}>Joueur</span>
        <span style={{ width: 70, textAlign: "right" }}>Points</span>
      </div>

      {rows.map((row, idx) => {
        if (row.isPlayer) {
          return (
            <div key={"me-" + row.rank} className="tm-fade-up tm-halftone-yellow" style={{
              ...meRow,
              padding: "11px 12px",
              display: "flex", alignItems: "center",
            }}>
              <span style={{ minWidth: 54, flexShrink: 0, marginRight: 8 }}>
                <span className="tm-display" style={rankBadge(INK, "#ffffff")}>#{row.rank}</span>
              </span>
              <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <FlagFromEmoji emoji={player.nationalityFlag} size={13} />
                <span className="tm-display" style={{ color: "#141414", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rankingName(player.name)}</span>
                <span style={{ ...chip(INK, "#ffffff"), fontSize: 10, flexShrink: 0 }}>VOUS</span>
              </span>
              <span className="tm-display" style={{ color: "#141414", fontSize: 13.5, width: 70, textAlign: "right" }}>
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
              background: isTop10 ? "rgba(214,239,60,0.3)" : "#ffffff", color: "#141414",
              ...(isTop10 ? { borderLeft: "6px solid " + INK } : {}),
              cursor: clickable ? "pointer" : "default",
            }}
            onClick={() => clickable && setAtpPlayerDetail(p.id)}
          >
            <span style={{ width: 54, flexShrink: 0 }}>
              <span className="tm-display" style={isTop10 ? rankBadge("#d6ef3c", "#141414") : { color: isTop50 ? "#1f7a45" : "#141414", fontSize: 14 }}>#{row.rank}</span>
            </span>
            <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 16 }}><FlagFromEmoji emoji={p.nat.flag} /></span>
              <span style={{
                color: "#141414",
                fontSize: 13, fontWeight: clickable ? 800 : 700,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                letterSpacing: 0.2,
              }}>{p.name}</span>
            </span>
            <span className="tm-display" style={{
              color: "#141414",
              fontSize: 13.5, width: 70, textAlign: "right",
            }}>{p.points.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}
