// Écran Circuit › Tournois.
import { useState, useEffect, useMemo, useRef } from "react";
import { CITIES, SURFACES } from "../../data/geo.js";
import { ALL_TOURNAMENTS, getEntryStatus, getTournamentFormat, playerHasBye, tierColor, tierLabel } from "../../engine/circuit.js";
import { distanceKm, travelCostBetween } from "../../engine/travel.js";
import { FlagFromEmoji, Icon, SurfaceIcon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

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
      .filter(t => !(playedThisWeek && t.week === player.week))
      .filter(t => {
        if (calFilters.region === "near") return distanceKm(player.location, t.city) < 1000;
        if (calFilters.region === "country") return CITIES[t.city]?.country === CITIES[player.location]?.country;
        return true;
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
        <div className="tm-fade-up" style={{
          background: T.greenSub, border: "1px solid " + T.greenBrd, borderLeft: "3px solid " + T.green,
          borderRadius: 0, padding: 14, marginBottom: 14,
        }}>
          <div className="tm-eyebrow" style={{ color: T.green, marginBottom: 4 }}>Inscrit</div>
          <div style={{ color: T.fg, fontSize: 14, fontWeight: 700 }}>{ALL_TOURNAMENTS.find(t => t.id === enrolled.tournamentId)?.name}</div>
          <div style={{ color: T.fg3, fontSize: 11, marginTop: 2 }}>Semaine {enrolled.week}</div>
        </div>
      )}

      {/* Filters - segmented control style */}
      <div style={{ marginBottom: 14 }}>
        <div className="tm-eyebrow" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Surface</span>
          {selSurfaces.length > 0 && (
            <button
              style={{ background: "none", border: "none", color: T.fg5, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "none", cursor: "pointer", padding: 0 }}
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
        <div className="tm-eyebrow" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Catégorie</span>
          {selTiers.length > 0 && (
            <button
              style={{ background: "none", border: "none", color: T.fg5, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "none", cursor: "pointer", padding: 0 }}
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
        <div className="tm-eyebrow" style={{ marginBottom: 8 }}>Région</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[
            { k: "all", label: "Mondial", iconName: null },
            { k: "country", label: "Pays", iconName: "home" },
            { k: "near", label: "Proximité", iconName: "location" },
          ].map(({ k, label, iconName }) => (
            <button key={k} style={{ ...styles.filterBtn, ...(calFilters.region === k ? styles.filterBtnActive : {}), display: "inline-flex", alignItems: "center", gap: 5 }} onClick={() => setCalFilters({ ...calFilters, region: k })}>
              {iconName && <Icon name={iconName} size={11} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 10, color: T.fg5, marginBottom: 12, fontWeight: 600, letterSpacing: 0.2, textTransform: "none" }}>
        <span className="tm-num">{filtered.length}</span> tournois · Vous êtes à <span style={{ color: T.green }}>{player.location}</span>
      </div>

      {weekKeys.slice(0, visibleWeeks).map((wkKey) => {
        const wk = Number(wkKey);
        const tournaments = groupedByWeek[wk];
        const weeksAway = wk - player.week;
        const isCurrent = weeksAway === 0;
        const weekLabel = isCurrent ? "Cette semaine" : weeksAway === 1 ? "Semaine prochaine" : weeksAway > 0 ? "Dans " + weeksAway + " sem" : "Semaine " + wk;

        return (
          <div key={wkKey} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 10 }}>
              <span className="tm-eyebrow" style={{ color: isCurrent ? T.ball : T.fg4, letterSpacing: 0.2 }}>{weekLabel}</span>
              <div style={{ flex: 1, height: 1, background: T.brd }} />
              <span className="tm-num" style={{ fontSize: 10, color: T.fg5, fontWeight: 700 }}>W{wk > 52 ? wk - 52 : wk}</span>
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
                  ...styles.tournCard,
                  opacity: !canE ? 0.55 : 1,
                  borderColor: isEnrolledTo ? T.green : T.brd,
                  borderLeft: "3px solid " + tierColor(t.tier),
                  paddingLeft: 14,
                }}>
                  <div style={styles.tournHeader}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="tm-eyebrow" style={{ color: tierColor(t.tier), marginBottom: 4 }}>{tierLabel(t.tier)}</div>
                      <div
                        style={{ color: T.fg, fontWeight: 700, fontSize: 15, cursor: "pointer", lineHeight: 1.2 }}
                        onClick={() => setTournamentDetail && setTournamentDetail(t.id)}
                      >{t.name}</div>
                      <div style={{ color: T.fg3, fontSize: 12, marginTop: 4 }}>
                        <SurfaceIcon name={t.surface} /> {t.surface}
                        {player.favoriteSurface === t.surface && (
                          <span style={{ color: T.green, fontWeight: 700, marginLeft: 5 }} title="Votre surface de prédilection">★</span>
                        )}
                        <span style={{ color: T.fg5, margin: "0 6px" }}>·</span>
                        <FlagFromEmoji emoji={cityInfo?.flag} /> {t.city}{cityInfo?.country ? ", " + cityInfo.country : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, marginBottom: 12, marginTop: 12, flexWrap: "wrap" }}>
                    <span style={styles.tournChip}>
                      <span className="tm-num">{t.prize.toLocaleString()}€</span>
                    </span>
                    <span style={styles.tournChip}>
                      <span className="tm-num">{t.points}</span> PTS
                    </span>
                    <span style={styles.tournChip}>
                      Draw <span className="tm-num">{fmt.drawSize}</span>
                    </span>
                    {!onSite && (
                      <span style={{ ...styles.tournChip, color: T.red }}>
                        <span className="tm-num">{Math.round(dist)}km</span> · {travelCost}€
                      </span>
                    )}
                    {onSite && (
                      <span style={{ ...styles.tournChip, color: T.green, borderColor: T.greenBrd }}>
                        <Icon name="location" size={11} /> Sur place
                      </span>
                    )}
                  </div>

                  {entry.status === "direct" && (
                    <div style={{ color: T.green, fontSize: 11, marginBottom: 10, fontWeight: 600, letterSpacing: 0.5 }}>
                      ✓ Tableau principal{seedBye ? " · tête de série (bye)" : ""}{entry.protected ? " · classement protégé" : ""}
                    </div>
                  )}
                  {entry.status === "qualifying" && (
                    <div style={{ color: T.amber, fontSize: 11, marginBottom: 10, fontWeight: 600, letterSpacing: 0.5 }}>
                      Qualifications ({fmt.qualiRounds} tours)
                    </div>
                  )}
                  {entry.status === "blocked" && (
                    <div style={{ color: T.red, fontSize: 11, marginBottom: 10, fontWeight: 600, letterSpacing: 0.5 }}>
                      <Icon name="x" size={11} /> Classement insuffisant
                    </div>
                  )}
                  {isCurrentWeek && !onSite && <div style={{ color: T.red, fontSize: 11, marginBottom: 10 }}><Icon name="x" size={11} /> Vous devez être à {t.city}</div>}
                  {blockedByOther && <div style={{ color: T.amber, fontSize: 11, marginBottom: 10 }}><Icon name="warning" size={11} /> Déjà inscrit ailleurs</div>}
                  {alreadyPlayed && <div style={{ color: T.fg5, fontSize: 11, marginBottom: 10 }}><Icon name="check" size={11} /> Disputé cette semaine</div>}

                  {t.tier === "Finals" ? (
                    <div style={{ ...styles.btnSmall, width: "100%", textAlign: "center", background: T.bg2, color: T.fg3, cursor: "default" }}>
                      Inscription automatique si top 8 de la Race
                    </div>
                  ) : isEnrolledTo ? (
                    <button style={{ ...styles.btnSmall, width: "100%" }} onClick={cancelEnrollment}>Annuler</button>
                  ) : (
                    <button
                      style={{
                        ...styles.btnSmall,
                        width: "100%",
                        background: (canE && !blockedByOther && !alreadyPlayed && !blockedByWeekLimit && !(isCurrentWeek && !onSite)) ? T.green : T.bg3,
                        color: (canE && !blockedByOther && !alreadyPlayed && !blockedByWeekLimit && !(isCurrentWeek && !onSite)) ? T.bg0 : T.fg4,
                        borderColor: "transparent",
                        opacity: (!canE || blockedByOther || alreadyPlayed || blockedByWeekLimit || (isCurrentWeek && !onSite)) ? 0.5 : 1,
                      }}
                      disabled={!canE || blockedByOther || alreadyPlayed || blockedByWeekLimit || (isCurrentWeek && !onSite)}
                      onClick={() => enrollTournament(t)}
                    >
                      {blockedByWeekLimit ? "Tournoi déjà joué cette sem."
                        : isCurrentWeek ? "Jouer maintenant"
                        : "S'inscrire"} {!blockedByWeekLimit && t.entryFee > 0 ? "· " + t.entryFee + "€" : ""}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {hasMore && (
        <button
          ref={sentinelRef}
          style={{ ...styles.btnSmall, width: "100%", marginBottom: 12 }}
          onClick={() => setVisibleWeeks(v => v + WEEKS_STEP)}
        >Afficher les semaines suivantes</button>
      )}
    </div>
  );
}
