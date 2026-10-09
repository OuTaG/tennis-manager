// Écran Accueil : la une du journal.
import { useState } from "react";
import { PLAYER_STYLES } from "../../data/staff.js";
import { ALL_TOURNAMENTS, tierColor, tierLabel } from "../../engine/circuit.js";
import { GAME_OPTIONS, difficultyLevel, formatMultiplier, scoreMultiplier } from "../../engine/difficulty.js";
import { CITIES } from "../../data/geo.js";
import { buildFrontPage } from "../../engine/frontpage.js";
import { sponsorObjectiveCounters, sponsorObjectiveProgress } from "../../engine/sponsors.js";
import { Avatar } from "../avatar.jsx";
import { FlagFromEmoji, Icon, StatIcon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";
import { fmtMoney, fmtNum } from "../format.js";

// Couleur de la case de la une selon l'actualité.
const PANEL = { clay: "tm-halftone-magenta", red: "tm-halftone-magenta", green: "tm-halftone-yellow", blue: "tm-halftone-cyan" };

function Rubric({ title, aside, color }) {
  return (
    <div className="tm-rubric">
      <span>{title}</span>
      {aside && <span style={{ alignSelf: "center", background: color || "#ffffff", color: color ? "#ffffff" : "#141414", border: "2px solid " + T.ink, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, padding: "0 6px", textTransform: "uppercase", whiteSpace: "nowrap", maxWidth: "62%", overflow: "hidden", textOverflow: "ellipsis" }}>{aside}</span>}
    </div>
  );
}

// Jauge BD (0–100) : case encrée, remplissage tramé, mot d'humeur.
function MoodGauge({ icon, label, value, color, words }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const word = v >= 75 ? words[3] : v >= 50 ? words[2] : v >= 25 ? words[1] : words[0];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr) 40px", alignItems: "center", gap: 8 }}>
      <span style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, transform: "rotate(-4deg)" }}>
        <StatIcon name={icon} size={20} />
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
  const [showSetup, setShowSetup] = useState(false);
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
          <button onClick={() => setShowSetup(true)} title="Voir les réglages de la partie" style={{ background: T.magenta, color: "#ffffff", fontSize: 11, fontWeight: 800, padding: "2px 6px", transform: "rotate(-3deg)", whiteSpace: "nowrap", textTransform: "uppercase", border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, cursor: "pointer", fontFamily: T.body }}>{level.name} {formatMultiplier(mul)}</button>
        </div>
        {[
          { label: "Rang", value: ranking > 1000 ? "—" : ranking },
          { label: "Points", value: fmtNum(totalPts) },
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
              <div className="tm-lettering" style={{ marginTop: 9, background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, fontSize: 14.5, lineHeight: 1.25, display: "flex", alignItems: "stretch" }}>
                <span style={{ flexShrink: 0, width: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "#e0a21b", borderRight: "2.5px solid " + T.ink }}><Icon name="warning" size={15} color="#141414" /></span>
                <span style={{ padding: "6px 9px" }}>Vous pouvez vous entraîner, mais chaque séance risque fort d'aggraver la blessure et de rallonger l'indisponibilité.</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* WILDCARDS : cartes BD, une par invitation */}
      {wildcardOffers.length > 0 && (
        <div className="tm-fade-up" style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, marginBottom: 14 }}>
          <div className="tm-halftone-yellow" style={{ borderBottom: "3px solid " + T.ink, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 30, height: 30, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2.5px solid " + T.ink, transform: "rotate(-4deg)" }}>
              <Icon name="ticket" size={17} color="#141414" />
            </span>
            <span className="tm-display" style={{ fontSize: 17 }}>Wildcard{wildcardOffers.length > 1 ? "s" : ""} proposée{wildcardOffers.length > 1 ? "s" : ""}</span>
          </div>
          {wildcardOffers.map((o, i) => {
            const t = ALL_TOURNAMENTS.find(x => x.id === o.tournamentId);
            return (
              <div key={i} style={{ padding: 12, borderTop: i ? "2px dashed " + T.ink : 0 }}>
                {t && <span style={{ display: "inline-block", background: tierColor(t.tier), color: "#ffffff", border: "2px solid " + T.ink, fontSize: 10.5, fontWeight: 800, padding: "0 6px", textTransform: "uppercase", textShadow: "1px 1px 0 " + T.ink }}>{tierLabel(t.tier)}</span>}
                <div className="tm-display" style={{ fontSize: 17, lineHeight: 1.1, marginTop: 5 }}>{o.tournamentName}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {t?.city && <span style={{ background: "#ffffff", border: "2px solid " + T.ink, fontSize: 11, fontWeight: 800, padding: "1px 6px" }}>{t.city}</span>}
                  <span style={{ background: "#ffffff", border: "2px solid " + T.ink, fontSize: 11, fontWeight: 800, padding: "1px 6px" }}>Semaine {o.tournamentWeek}</span>
                  {t?.surface && <span style={{ background: "#ffffff", border: "2px solid " + T.ink, fontSize: 11, fontWeight: 800, padding: "1px 6px" }}>{t.surface}</span>}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="tm-display" style={{ flex: 1, background: "#1f7a45", color: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "7px 8px", fontSize: 13, cursor: "pointer" }} onClick={() => acceptWildcard(o)}>Accepter</button>
                  <button style={{ ...styles.btnSmall, flex: 1, background: "#ffffff", color: "#141414", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, fontWeight: 800 }} onClick={() => declineWildcard(o)}>Refuser</button>
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

      {player.money < 1000 && (
        <div role="alert" style={{ display: "flex", alignItems: "stretch", background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, marginBottom: 12 }}>
          <span style={{ flexShrink: 0, width: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "#c4302b", borderRight: "3px solid " + T.ink }}>
            <span style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2px solid " + T.ink, transform: "rotate(-4deg)" }}><Icon name="money" size={15} color="#c4302b" /></span>
          </span>
          <div style={{ padding: "7px 10px", fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>
            <strong className="tm-display" style={{ color: "#c4302b", fontWeight: 400, fontSize: 14 }}>Budget critique</strong> — Inscrivez-vous à des tournois du Circuit Open locaux.
          </div>
        </div>
      )}

        {!enrolled && (
          <div className="tm-lettering" style={{ fontSize: 15, lineHeight: 1.25, background: "#ffffff", color: "#141414", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: "7px 10px", marginBottom: 12, transform: "rotate(-0.5deg)" }}>Aucun tournoi au programme. Inscrivez-vous depuis l'onglet Circuit.</div>
        )}
        {/* Dépenses fixes de la semaine */}
        <div style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink }}>
          <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 14, padding: "5px 10px" }}>Dépenses de la semaine</div>
          <div style={{ padding: "2px 12px 10px" }}>
            {[["Staff", staffWeeklyCost], ["Charges", player.weeklyExpenses]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "2px dashed " + T.ink, fontSize: 13.5, fontWeight: 700 }}>
                <span>{l}</span>
                <span className="tm-num" style={{ color: "#c4302b", fontWeight: 800 }}>{fmtMoney(-v, { sign: true })}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 9 }}>
              <span className="tm-display" style={{ fontSize: 14 }}>Total</span>
              <span className="tm-display" style={{ fontSize: 15, background: "#c4302b", color: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "1px 8px" }}>{fmtMoney(-(staffWeeklyCost + player.weeklyExpenses), { sign: true })}/sem.</span>
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
            let cur = 0, met = false, curLabel = "";
            if (o.type === "rank") { cur = ranking; met = ranking <= o.target; curLabel = "#" + ranking + " / top " + o.target; }
            else { cur = sponsorObjectiveProgress(o, s.objectiveBaseline || {}, sponsorObjectiveCounters(player)) ?? 0; met = cur >= o.target; curLabel = cur + "/" + o.target; }
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
                      <span style={{ background: weeksLeft <= 4 ? "#e0a21b" : "#ffffff", color: "#141414", border: "2px solid " + T.ink, fontSize: 10.5, fontWeight: 800, padding: "0 5px", whiteSpace: "nowrap" }}>
                        {weeksLeft} sem restantes
                      </span>
                    )}
                    <span className="tm-num" style={{ background: met ? "#1f7a45" : "#ffffff", color: met ? "#ffffff" : "#141414", border: "2px solid " + T.ink, fontSize: 11, fontWeight: 800, padding: "0 5px", whiteSpace: "nowrap" }}>{curLabel}</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: met ? "#1f7a45" : "#141414", fontSize: 12, fontWeight: 700 }}>{met && <Icon name="check" size={11} strokeWidth={3} style={{ marginRight: 3, verticalAlign: -1 }} />}{o.label}</span>
                  <span className="tm-num" style={{ color: "#1f7a45", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", marginLeft: 8 }}>{fmtMoney(s.objectiveReward || 0, { sign: true })} / {fmtMoney(-(s.objectivePenalty || 0), { sign: true })}</span>
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
          <MoodGauge icon="happiness" label="Bonheur" value={player.happiness ?? 70} color="#1f7a45" words={["Au fond du trou", "Morose", "Serein", "Aux anges"]} />
          <MoodGauge icon="popularity" label="Popularité" value={player.popularity ?? 20} color="#5b2d8e" words={["Inconnu", "Remarqué", "Apprécié", "Star"]} />
          <MoodGauge icon="image" label="Image" value={player.image ?? 60} color="#c4572b" words={["Sulfureuse", "Fragile", "Correcte", "Exemplaire"]} />
        </div>
      </section>

      <button style={{ ...styles.btnPrimary, opacity: isAdvancingWeek ? 0.5 : 1 }} disabled={isAdvancingWeek} onClick={advanceWeek}>
        {isAdvancingWeek ? "Simulation en cours…" : "Semaine suivante →"}
      </button>

      {/* Réglages de la partie (lecture seule) : difficulté, options, ville de départ */}
      {showSetup && (() => {
        const opts = GAME_OPTIONS.filter(o => (player.gameOptions || []).includes(o.id));
        const city = player.startCity;
        // Étiquette encrée + trait pointillé, comme les rubriques du journal.
        const label = (txt, icon) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <span className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 12, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <Icon name={icon} size={12} color="#d6ef3c" />{txt}
            </span>
            <span aria-hidden="true" style={{ flex: 1, borderTop: "2px dashed " + T.ink }} />
          </div>
        );
        return (
          <div onClick={() => setShowSetup(false)} style={{ position: "fixed", inset: 0, background: "var(--tm-overlay)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, maxWidth: 380, width: "100%", maxHeight: "86vh", overflowY: "auto" }}>
              {/* Bandeau violet tramé : roue crantée dans une case penchée, multiplicateur en tampon */}
              <div className="tm-halftone-magenta" style={{ color: "#ffffff", padding: "10px 12px", borderBottom: "3px solid " + T.ink, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 34, height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#d6ef3c", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, transform: "rotate(-4deg)" }}>
                  <Icon name="cog" size={20} color="#141414" strokeWidth={2} />
                </span>
                <span className="tm-display" style={{ flex: 1, minWidth: 0, fontSize: 18, lineHeight: 1.05, textShadow: "2px 2px 0 " + T.ink }}>Réglages de la partie</span>
                <span className="tm-display" style={{ flexShrink: 0, background: "#d6ef3c", color: "#141414", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, fontSize: 16, padding: "1px 7px", transform: "rotate(4deg)" }}>{formatMultiplier(mul)}</span>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  {label("Difficulté", "target")}
                  <div className="tm-halftone-yellow" style={{ border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: "8px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span className="tm-display" style={{ fontSize: 20, lineHeight: 1 }}>{level.name}</span>
                      <span className="tm-display" style={{ background: "#5b2d8e", color: "#ffffff", border: "2px solid " + T.ink, fontSize: 13, padding: "0 6px", flexShrink: 0 }}>{formatMultiplier(level.scoreMul)}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 5, lineHeight: 1.35, background: "#ffffff", border: "2px solid " + T.ink, padding: "4px 7px" }}>{level.desc}</div>
                  </div>
                </div>
                <div>
                  {label("Options de partie", "flag")}
                  {opts.length === 0 ? (
                    <div className="tm-lettering" style={{ fontSize: 16, border: "2.5px solid " + T.ink, background: "#ffffff", padding: "6px 10px", transform: "rotate(-0.6deg)" }}>Aucune option.</div>
                  ) : (
                    <div style={{ border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink }}>
                      {opts.map((o, i) => (
                        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "7px 9px", borderTop: i ? "2px dashed " + T.ink : "none" }}>
                          <span style={{ minWidth: 0 }}>
                            <span className="tm-display" style={{ display: "block", fontSize: 13.5, lineHeight: 1.1 }}>{o.name}</span>
                            <span style={{ display: "block", fontSize: 12, fontWeight: 600, marginTop: 2, lineHeight: 1.35 }}>{o.desc}</span>
                          </span>
                          <span className="tm-display tm-num" style={{ fontSize: 13, background: "#1f7a45", color: "#ffffff", border: "2px solid " + T.ink, padding: "0 6px", flexShrink: 0, whiteSpace: "nowrap" }}>+{Math.round(o.bonus * 100)} %</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  {label("Ville de départ", "plane")}
                  {city ? (
                    <div className="tm-display" style={{ display: "inline-flex", alignItems: "center", gap: 7, flexWrap: "wrap", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, background: "#ffffff", padding: "5px 10px", fontSize: 16 }}>
                      <FlagFromEmoji emoji={CITIES[city]?.flag} size={16} />{city}{CITIES[city]?.country ? <span style={{ fontFamily: T.body, fontSize: 12, fontWeight: 800, textTransform: "none" }}>· {CITIES[city].country}</span> : null}
                    </div>
                  ) : (
                    <div className="tm-lettering" style={{ fontSize: 16, border: "2.5px solid " + T.ink, background: "#ffffff", padding: "6px 10px", transform: "rotate(-0.6deg)" }}>Non enregistrée pour cette carrière.</div>
                  )}
                </div>
                <button className="tm-display" style={{ ...styles.btnSecondary, fontFamily: T.display, fontWeight: 400, fontSize: 15, background: "#ffffff", color: "#141414", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink }} onClick={() => setShowSetup(false)}>Fermer</button>
              </div>
            </div>
          </div>
        );
      })()}

      {canRetire && (
        <button style={{ ...styles.btnSecondary, marginTop: 10 }} onClick={retire}>
          Prendre sa retraite
        </button>
      )}
    </div>
  );
}
