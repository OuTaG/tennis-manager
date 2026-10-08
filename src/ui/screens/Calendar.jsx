// Écran Circuit › Tournois.
import { useState, useEffect, useMemo, useRef } from "react";
import { CITIES, SURFACES } from "../../data/geo.js";
import { ALL_TOURNAMENTS, getEntryStatus, getTournamentFormat, playerHasBye, tierColor, tierLabel } from "../../engine/circuit.js";
import { distanceKm, travelCostBetween } from "../../engine/travel.js";
import { FlagFromEmoji, Icon, SurfaceIcon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";
import { fmtKm, fmtMoney } from "../format.js";

export function CalendarScreen({ player, ranking, calFilters, setCalFilters, enrollTournament, cancelEnrollment, setTournamentDetail }) {
  const tiers = ["GrandSlam", "Masters1000", "ATP500", "ATP250", "Challenger", "ITF"];
  const surfaces = [...SURFACES];
  const enrolled = player.enrollment;
  const selSurfaces = calFilters.surface || [];
  const selTiers = calFilters.tier || [];

  const toggleSurface = (s) => {
    setCalFilters({
      ...calFilters,
      surface: selSurfaces.includes(s) ? selSurfaces.filter(x => x !== s) : [...selSurfaces, s],
    });
  };
  const toggleTier = (t) => {
    setCalFilters({
      ...calFilters,
      tier: selTiers.includes(t) ? selTiers.filter(x => x !== t) : [...selTiers, t],
    });
  };

  const playedThisWeek = (player.playedThisWeek || []).length > 0;
  // Filter / sort / group is memoised on its inputs. Before, the 200+
  // tournaments were re-filtered and haversine-distanced on every re-render
  // (any parent state change), which made opening the tab feel sluggish.
  const filtered = useMemo(() => {
    return ALL_TOURNAMENTS
      .filter(t => selSurfaces.length === 0 || selSurfaces.includes(t.surface))
      .filter(t => selTiers.length === 0 || selTiers.includes(t.tier))
      // Les tournois de la semaine en cours ne sont plus proposés.
      .filter(t => t.week !== player.week)
      .filter(t => {
        // Filtre de distance depuis la ville actuelle (« all » = mondial).
        const maxKm = { r3000: 3000, r1000: 1000 }[calFilters.region];
        return !maxKm || distanceKm(player.location, t.city) < maxKm;
      })
      .map(t => ({ ...t, displayWeek: t.week >= player.week ? t.week : t.week + 52 }))
      .sort((a, b) => a.displayWeek - b.displayWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selSurfaces.join(","), selTiers.join(","), calFilters.region, player.location, player.week, playedThisWeek]);

  const groupedByWeek = useMemo(() => {
    const g = {};
    for (const t of filtered) {
      if (!g[t.displayWeek]) g[t.displayWeek] = [];
      g[t.displayWeek].push(t);
    }
    return g;
  }, [filtered]);

  const weekKeys = useMemo(
    () => Object.keys(groupedByWeek).sort((a, b) => Number(a) - Number(b)),
    [groupedByWeek]
  );

  // Progressive rendering: mounting all ~300 tournament cards at once took
  // 2-3 s on mobile. We render a few weeks first, then load more as the
  // user scrolls near the bottom (sentinel + IntersectionObserver).
  const WEEKS_STEP = 2;
  const [visibleWeeks, setVisibleWeeks] = useState(WEEKS_STEP);
  useEffect(() => { setVisibleWeeks(WEEKS_STEP); }, [groupedByWeek]);
  const hasMore = visibleWeeks < weekKeys.length;
  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) setVisibleWeeks(v => v + WEEKS_STEP);
    }, { rootMargin: "400px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, visibleWeeks]);

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Calendrier</div>

      {enrolled && (
        <div className="tm-fade-up tm-halftone-cyan" style={{ border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, padding: "10px 14px", marginBottom: 14, color: "#ffffff" }}>
          <span style={{ display: "inline-block", background: "#d6ef3c", color: "#141414", border: "2px solid " + T.ink, fontSize: 10.5, fontWeight: 800, letterSpacing: 1, padding: "0 6px", textTransform: "uppercase" }}>Inscrit</span>
          <div className="tm-display" style={{ fontSize: 19, marginTop: 4, textShadow: "2px 2px 0 " + T.ink }}>{ALL_TOURNAMENTS.find(t => t.id === enrolled.tournamentId)?.name}</div>
          <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>Semaine {enrolled.week}</div>
        </div>
      )}

      {/* Filters - segmented control style */}
      <div style={{ marginBottom: 14 }}>
        <div className="tm-display" style={{ fontSize: 13, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Surface</span>
          {selSurfaces.length > 0 && (
            <button
              style={{ background: "#ffffff", border: "2px solid " + T.ink, boxShadow: "1.5px 1.5px 0 " + T.ink, color: "#c4302b", fontFamily: T.body, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer", padding: "0 6px" }}
              onClick={() => setCalFilters({ ...calFilters, surface: [] })}
            >Tout effacer</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {surfaces.map(s => {
            const active = selSurfaces.includes(s);
            return (
              <button
                key={s}
                style={{ ...styles.filterBtn, ...(active ? styles.filterBtnActive : {}), display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => toggleSurface(s)}
              >
                <SurfaceIcon name={s} size={12} />
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div className="tm-display" style={{ fontSize: 13, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Catégorie</span>
          {selTiers.length > 0 && (
            <button
              style={{ background: "#ffffff", border: "2px solid " + T.ink, boxShadow: "1.5px 1.5px 0 " + T.ink, color: "#c4302b", fontFamily: T.body, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer", padding: "0 6px" }}
              onClick={() => setCalFilters({ ...calFilters, tier: [] })}
            >Tout effacer</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {tiers.map(t => {
            const active = selTiers.includes(t);
            return (
              <button key={t} style={{ ...styles.filterBtn, ...(active ? styles.filterBtnActive : {}) }} onClick={() => toggleTier(t)}>
                {tierLabel(t)}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div className="tm-display" style={{ fontSize: 13, marginBottom: 6 }}>Distance</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[
            { k: "all", label: "Mondial", iconName: null },
            { k: "r3000", label: "<\u00a03\u202f000\u00a0km", iconName: "location" },
            { k: "r1000", label: "<\u00a01\u202f000\u00a0km", iconName: "location" },
          ].map(({ k, label, iconName }) => (
            <button key={k} style={{ ...styles.filterBtn, ...(calFilters.region === k ? styles.filterBtnActive : {}), display: "inline-flex", alignItems: "center", gap: 5 }} onClick={() => setCalFilters({ ...calFilters, region: k })}>
              {iconName && <Icon name={iconName} size={11} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="tm-lettering" style={{ fontSize: 15, marginBottom: 12 }}>
        {filtered.length} tournois · vous êtes à {player.location}
      </div>

      {weekKeys.slice(0, visibleWeeks).map((wkKey) => {
        const wk = Number(wkKey);
        const tournaments = groupedByWeek[wk];
        const weeksAway = wk - player.week;
        const isCurrent = weeksAway === 0;
        const weekLabel = isCurrent ? "Cette semaine" : weeksAway === 1 ? "Semaine prochaine" : weeksAway > 0 ? "Dans " + weeksAway + " sem" : "Semaine " + wk;

        return (
          <div key={wkKey} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 8 }}>
              <span className="tm-display" style={{ background: isCurrent ? "#d6ef3c" : T.ink, color: isCurrent ? "#141414" : "#ffffff", border: "2px solid " + T.ink, padding: "2px 9px", fontSize: 13 }}>{weekLabel}</span>
              <div style={{ flex: 1, height: 0, borderTop: "2px dashed " + T.ink }} />
              <span className="tm-num" style={{ fontSize: 11, fontWeight: 800 }}>Sem. {wk > 52 ? wk - 52 : wk}</span>
            </div>

            {tournaments.map(t => {
              const entry = getEntryStatus(t, ranking);
              const fmt = getTournamentFormat(t);
              const canE = entry.status !== "blocked";
              const isCurrentWeek = t.week === player.week;
              const cityInfo = CITIES[t.city];
              const onSite = player.location === t.city;
              const dist = distanceKm(player.location, t.city);
              const travelCost = travelCostBetween(player.location, t.city);
              const isEnrolledTo = enrolled?.tournamentId === t.id;
              const blockedByOther = enrolled && !isEnrolledTo;
              const alreadyPlayed = isCurrentWeek && (player.playedThisWeek || []).includes(t.id);
              const anyPlayedThisWeek = isCurrentWeek && (player.playedThisWeek || []).length > 0;
              const blockedByWeekLimit = anyPlayedThisWeek && !alreadyPlayed;
              const seedBye = entry.status === "direct" && playerHasBye(fmt, ranking);

              return (
                <div key={t.id} className="tm-card" style={{
                  ...styles.tournCard, padding: 0, overflow: "hidden",
                  opacity: !canE ? 0.6 : 1,
                  border: "3px solid " + T.ink, boxShadow: (isEnrolledTo ? "5px 5px 0 #1f7a45" : "4px 4px 0 " + T.ink),
                  background: "#ffffff", color: "#141414",
                }}>
                  {/* Bandeau à la couleur de la catégorie */}
                  <div style={{ background: tierColor(t.tier), borderBottom: "2.5px solid " + T.ink, padding: "3px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="tm-display" style={{ color: "#ffffff", fontSize: 12.5, textShadow: "1px 1px 0 " + T.ink }}>{tierLabel(t.tier)}</span>
                    {isEnrolledTo && <span style={{ background: "#d6ef3c", color: "#141414", border: "2px solid " + T.ink, fontSize: 10, fontWeight: 800, padding: "0 5px", textTransform: "uppercase" }}>Inscrit</span>}
                  </div>
                  <div style={{ padding: "10px 12px 12px" }}>
                  <div style={styles.tournHeader}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="tm-display"
                        style={{ color: "#141414", fontSize: 17, cursor: "pointer", lineHeight: 1.1 }}
                        onClick={() => setTournamentDetail && setTournamentDetail(t.id)}
                      >{t.name}</div>
                      <div style={{ color: "#141414", fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                        <SurfaceIcon name={t.surface} /> {t.surface}
                        {player.favoriteSurface === t.surface && (
                          <span style={{ display: "inline-block", background: "#d6ef3c", color: "#141414", border: "2px solid " + T.ink, fontSize: 10, lineHeight: 1.3, fontWeight: 800, padding: "0 3px", marginLeft: 5 }} title="Votre surface de prédilection">★</span>
                        )}
                        <span style={{ color: "#141414", margin: "0 6px" }}>·</span>
                        <FlagFromEmoji emoji={cityInfo?.flag} /> {t.city}{cityInfo?.country ? ", " + cityInfo.country : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, marginBottom: 12, marginTop: 12, flexWrap: "wrap" }}>
                    <span style={styles.tournChip}>
                      <span className="tm-num">{fmtMoney(t.prize)}</span>
                    </span>
                    <span style={styles.tournChip}>
                      <span className="tm-num">{t.points}</span> PTS
                    </span>
                    <span style={styles.tournChip}>
                      Draw <span className="tm-num">{fmt.drawSize}</span>
                    </span>
                    {!onSite && (
                      <span style={{ ...styles.tournChip, background: "#ffffff", color: "#c4302b", fontWeight: 800 }}>
                        <span className="tm-num">{fmtKm(dist)}</span> · {fmtMoney(travelCost)}
                      </span>
                    )}
                    {onSite && (
                      <span style={{ ...styles.tournChip, background: "#1f7a45", color: "#ffffff", fontWeight: 800 }}>
                        <Icon name="location" size={11} /> Sur place
                      </span>
                    )}
                  </div>

                  {entry.status === "direct" && (
                    <div style={{ display: "inline-block", background: "#1f7a45", color: "#ffffff", border: "2px solid " + T.ink, fontSize: 11, marginBottom: 10, fontWeight: 800, padding: "1px 6px" }}>
                      ✓ Tableau principal{seedBye ? " · tête de série (bye)" : ""}{entry.protected ? " · classement protégé" : ""}
                    </div>
                  )}
                  {entry.status === "qualifying" && (
                    <div style={{ display: "inline-block", background: "#e0a21b", color: "#141414", border: "2px solid " + T.ink, fontSize: 11, marginBottom: 10, fontWeight: 800, padding: "1px 6px" }}>
                      Qualifications ({fmt.qualiRounds} tours)
                    </div>
                  )}
                  {entry.status === "blocked" && (
                    <div style={{ display: "inline-block", background: "#c4302b", color: "#ffffff", border: "2px solid " + T.ink, fontSize: 11, marginBottom: 10, fontWeight: 800, padding: "1px 6px" }}>
                      <Icon name="x" size={11} color="#ffffff" /> Classement insuffisant
                    </div>
                  )}
                  {isCurrentWeek && !onSite && <div style={{ display: "flex", alignItems: "center", gap: 4, width: "fit-content", background: "#c4302b", color: "#ffffff", border: "2px solid " + T.ink, fontSize: 11, fontWeight: 800, padding: "1px 6px", marginBottom: 10 }}><Icon name="x" size={11} color="#ffffff" /> Vous devez être à {t.city}</div>}
                  {blockedByOther && <div style={{ display: "flex", alignItems: "center", gap: 4, width: "fit-content", background: "#e0a21b", color: "#141414", border: "2px solid " + T.ink, fontSize: 11, fontWeight: 800, padding: "1px 6px", marginBottom: 10 }}><Icon name="warning" size={11} color="#141414" /> Déjà inscrit ailleurs</div>}
                  {alreadyPlayed && <div style={{ display: "flex", alignItems: "center", gap: 4, width: "fit-content", background: "#ffffff", color: "#141414", border: "2px solid " + T.ink, fontSize: 11, fontWeight: 800, padding: "1px 6px", marginBottom: 10 }}><Icon name="check" size={11} color="#1f7a45" /> Disputé cette semaine</div>}

                  {t.tier === "Finals" ? (
                    <div className="tm-lettering" style={{ ...styles.btnSmall, width: "100%", boxSizing: "border-box", textAlign: "center", background: "#c9b6ea", color: "#141414", border: "2.5px dashed " + T.ink, fontFamily: T.hand, fontSize: 14, textTransform: "none", cursor: "default" }}>
                      Inscription automatique si top 8 de la Race
                    </div>
                  ) : isEnrolledTo ? (
                    <button style={{ ...styles.btnSmall, width: "100%", color: "#c4302b", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, fontFamily: T.display, fontWeight: 400, fontSize: 14 }} onClick={cancelEnrollment}>Annuler</button>
                  ) : (
                    <button
                      style={{
                        ...styles.btnSmall,
                        width: "100%",
                        background: (canE && !blockedByOther && !alreadyPlayed && !blockedByWeekLimit && !(isCurrentWeek && !onSite)) ? "#1f7a45" : "#ffffff",
                        color: (canE && !blockedByOther && !alreadyPlayed && !blockedByWeekLimit && !(isCurrentWeek && !onSite)) ? "#ffffff" : "#141414",
                        border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, fontFamily: T.display, fontSize: 14,
                        opacity: (!canE || blockedByOther || alreadyPlayed || blockedByWeekLimit || (isCurrentWeek && !onSite)) ? 0.5 : 1,
                      }}
                      disabled={!canE || blockedByOther || alreadyPlayed || blockedByWeekLimit || (isCurrentWeek && !onSite)}
                      onClick={() => enrollTournament(t)}
                    >
                      {blockedByWeekLimit ? "Tournoi déjà joué cette sem."
                        : isCurrentWeek ? "Jouer maintenant"
                        : "S'inscrire"} {!blockedByWeekLimit && t.entryFee > 0 ? "· " + fmtMoney(t.entryFee) : ""}
                    </button>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {hasMore && (
        <button
          ref={sentinelRef}
          style={{ ...styles.btnSmall, width: "100%", marginBottom: 12, border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink }}
          onClick={() => setVisibleWeeks(v => v + WEEKS_STEP)}
        >Afficher les semaines suivantes</button>
      )}
    </div>
  );
}
