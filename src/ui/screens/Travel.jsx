// Écran Circuit › Voyages.
import { useState, useEffect, useMemo, useRef } from "react";
import { CITIES } from "../../data/geo.js";
import { distanceKm, travelCostBetween } from "../../engine/travel.js";
import { FlagFromEmoji, Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

export function TravelScreen({ player, travelTo }) {
  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState("all");

  // Continent grouping based on rough lat/lon
  const continentOf = (lat, lon) => {
    if (lat < 35 && lon > -20 && lon < 55 && lat > -35) return "Afrique";
    if (lat < -10 && lon > 110) return "Océanie";
    if (lon > 30 && lon < 180 && lat > -10) return "Asie";
    if (lon > -25 && lon < 50 && lat > 35) return "Europe";
    if (lon > 35 && lon < 75 && lat > 12 && lat < 40) return "Moyen-Orient";
    if (lon < -50 && lat < 20) return "Amérique du Sud";
    if (lon < -50 && lat > 15) return "Amérique du Nord";
    return "Autre";
  };

  // ── Distances table, memoised on the player's current location ────────────
  // Computing 150+ haversine distances for every render (including every
  // keystroke in the search box or any parent state change) was making the
  // Travel tab noticeably laggy. We compute it once per city set + current
  // location, then only re-filter the cheap way when search/continent change.
  const cityDb = useMemo(() => {
    const from = player.location;
    return Object.keys(CITIES).map(name => {
      const info = CITIES[name];
      const distance = Math.round(distanceKm(from, name));
      return {
        name,
        country: info.country,
        flag: info.flag,
        lat: info.lat,
        lon: info.lon,
        continent: continentOf(info.lat, info.lon),
        distance,
        cost: travelCostBetween(from, name),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.location]);

  const searchLower = search.trim().toLowerCase();

  const sorted = useMemo(() => {
    const filtered = cityDb.filter(c => {
      if (continent !== "all" && c.continent !== continent) return false;
      if (searchLower && !c.name.toLowerCase().includes(searchLower) && !c.country.toLowerCase().includes(searchLower)) return false;
      return true;
    });
    const byCountry = {};
    for (const c of filtered) {
      if (!byCountry[c.country]) byCountry[c.country] = { country: c.country, flag: c.flag, cities: [] };
      byCountry[c.country].cities.push(c);
    }
    const groups = Object.values(byCountry);
    for (const g of groups) g.cities.sort((a, b) => a.distance - b.distance);
    groups.sort((a, b) => a.cities[0].distance - b.cities[0].distance);
    return groups;
  }, [cityDb, continent, searchLower]);

  const continents = ["all", "Europe", "Amérique du Nord", "Amérique du Sud", "Asie", "Moyen-Orient", "Afrique", "Océanie"];

  const totalCities = useMemo(() => sorted.reduce((n, g) => n + g.cities.length, 0), [sorted]);

  // Progressive rendering: render the closest cities first, load more on scroll.
  const CITIES_STEP = 25;
  const [visibleCities, setVisibleCities] = useState(CITIES_STEP);
  useEffect(() => { setVisibleCities(CITIES_STEP); }, [sorted]);
  const visibleGroups = useMemo(() => {
    const out = [];
    let left = visibleCities;
    for (const g of sorted) {
      if (left <= 0) break;
      const cities = g.cities.slice(0, left);
      out.push({ ...g, cities });
      left -= cities.length;
    }
    return out;
  }, [sorted, visibleCities]);
  const hasMore = visibleCities < totalCities;
  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) setVisibleCities(v => v + CITIES_STEP);
    }, { rootMargin: "400px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, visibleCities]);

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Voyager</div>

      <div style={{
        background: T.bg1, borderRadius: 12, padding: 16, marginBottom: 14,
        border: "1px solid " + T.brd, borderLeft: "3px solid " + T.green,
      }}>
        <div className="tm-eyebrow" style={{ marginBottom: 4 }}>Position actuelle</div>
        <div style={{ color: T.fg, fontWeight: 700, fontSize: 18 }}>
          <FlagFromEmoji emoji={CITIES[player.location]?.flag} /> {player.location}
        </div>
        <div style={{ color: T.fg3, fontSize: 12, marginTop: 2 }}>{CITIES[player.location]?.country}</div>
        <div className="tm-eyebrow" style={{ color: T.fg5, marginTop: 10 }}>
          Tarif · 30€ fixe + 0,18€/km
        </div>
      </div>

      <input
        type="text"
        placeholder="Rechercher une ville ou un pays..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...styles.input, marginBottom: 12 }}
      />

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
        {continents.map(c => (
          <button key={c} style={{ ...styles.filterBtn, ...(continent === c ? styles.filterBtnActive : {}) }} onClick={() => setContinent(c)}>
            {c === "all" ? "Tous" : c}
          </button>
        ))}
      </div>

      <div className="tm-eyebrow" style={{ marginBottom: 12, color: T.fg5 }}>
        <span className="tm-num">{totalCities}</span> ville{totalCities > 1 ? "s" : ""}
      </div>

      {visibleGroups.map(({ country, flag, cities }) => (
        <div key={country} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <FlagFromEmoji emoji={flag} size={13} />
            <div className="tm-eyebrow" style={{ color: T.fg2 }}>{country}</div>
          </div>
          {cities.map(c => {
            const isHere = c.name === player.location;
            const canAfford = player.money >= c.cost;
            return (
              <div key={c.name} style={{
                background: T.bg1, borderRadius: 8, padding: "12px 14px",
                marginBottom: 6, border: "1px solid " + T.brd,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                opacity: isHere ? 0.5 : 1,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: T.fg, fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div className="tm-num" style={{ color: T.fg4, fontSize: 11, marginTop: 2 }}>{c.distance.toLocaleString()} km</div>
                </div>
                {isHere ? (
                  <div className="tm-eyebrow" style={{ color: T.green }}><Icon name="location" size={11} /> ICI</div>
                ) : (
                  <button
                    style={{
                      ...styles.btnSmall,
                      background: canAfford ? T.green : T.bg3,
                      color: canAfford ? T.bg0 : T.fg4,
                      borderColor: "transparent",
                      opacity: canAfford ? 1 : 0.5,
                    }}
                    disabled={!canAfford}
                    onClick={() => travelTo(c.name)}
                  >{c.cost}€</button>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {hasMore && (
        <button
          ref={sentinelRef}
          style={{ ...styles.btnSmall, width: "100%", marginBottom: 12 }}
          onClick={() => setVisibleCities(v => v + CITIES_STEP)}
        >Afficher plus de villes</button>
      )}
    </div>
  );
}
