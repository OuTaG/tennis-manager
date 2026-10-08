// Écran Circuit › Voyages.
import { useState, useEffect, useMemo, useRef } from "react";
import { CITIES } from "../../data/geo.js";
import { distanceKm, travelCostBetween } from "../../engine/travel.js";
import { FlagFromEmoji, Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";
import { fmtMoney } from "../format.js";

export function TravelScreen({ player, travelTo, initialSearch = "", onSearchUsed }) {
  const [search, setSearch] = useState(initialSearch);
  // Recherche pré-remplie (fenêtre de forfait) : consommée une seule fois.
  useEffect(() => { if (initialSearch && onSearchUsed) onSearchUsed(); }, []);
  const [continent, setContinent] = useState("all");

  // Continent grouping based on rough lat/lon
  const continentOf = (lat, lon) => {
    // Moyen-Orient d'abord : ses villes tombent sinon dans Afrique ou Asie.
    if (lon > 34 && lon < 62 && lat > 12 && lat < 38) return "Moyen-Orient";
    // Tunis et Hammamet sont au nord du 35e parallèle.
    if ((lat < 35 || (lat < 37.5 && lon > 0 && lon < 12)) && lon > -20 && lon < 55 && lat > -35) return "Afrique";
    if (lat < -10 && lon > 110) return "Océanie";
    // Europe avant Asie : Moscou et Saint-Pétersbourg sont à l'est du 30e méridien.
    if (lon > -25 && lon < 60 && lat > 35) return "Europe";
    if (lon > 30 && lon < 180 && lat > -10) return "Asie";
    // Le Brésil déborde à l'est du 50e méridien ouest.
    if (lon < -34 && lat < 13) return "Amérique du Sud";
    if (lon < -50) return "Amérique du Nord";
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

      {/* Position actuelle : case verte tramée */}
      <div className="tm-halftone-cyan" style={{ border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, padding: "12px 14px", marginBottom: 14, color: "#ffffff", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 46, height: 46, flexShrink: 0, borderRadius: "50%", background: "#d6ef3c", border: "2.5px solid " + T.ink, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-12deg)" }}>
          <Icon name="plane" size={22} color="#141414" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>Vous êtes à</div>
          <div className="tm-display" style={{ fontSize: 24, lineHeight: 1.05, textShadow: "2px 2px 0 " + T.ink, display: "flex", alignItems: "center", gap: 8 }}>
            <FlagFromEmoji emoji={CITIES[player.location]?.flag} size={18} />{player.location}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{CITIES[player.location]?.country}</div>
        </div>
        <span className="tm-lettering" style={{ background: "#ffffff", color: "#141414", border: "2px solid " + T.ink, padding: "2px 7px", fontSize: 12.5, textAlign: "center", lineHeight: 1.15 }}>30 € + 0,18 €/km</span>
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

      <div className="tm-lettering" style={{ marginBottom: 12, fontSize: 15 }}>
        {totalCities} ville{totalCities > 1 ? "s" : ""} à portée de billet
      </div>

      {visibleGroups.map(({ country, flag, cities }) => (
        <div key={country} style={{ marginBottom: 18 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 8, background: T.ink, color: "#ffffff", padding: "3px 9px" }}>
            <FlagFromEmoji emoji={flag} size={13} />
            <span className="tm-display" style={{ fontSize: 13 }}>{country}</span>
          </div>
          {cities.map(c => {
            const isHere = c.name === player.location;
            const canAfford = player.money >= c.cost;
            return (
              <div key={c.name} style={{
                background: isHere ? "#d6ef3c" : "#ffffff", color: "#141414", padding: "10px 12px",
                marginBottom: 7, border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink,
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div className="tm-display" style={{ fontSize: 15 }}>{c.name}</div>
                  <span className="tm-num" style={{ display: "inline-block", marginTop: 3, fontSize: 11, fontWeight: 800, border: "2px solid " + T.ink, padding: "0 5px", background: "#ffffff" }}>{c.distance.toLocaleString("fr-FR")} km</span>
                </div>
                {isHere ? (
                  <span className="tm-display" style={{ background: T.ink, color: "#d6ef3c", padding: "3px 9px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="location" size={12} color="#d6ef3c" /> Ici</span>
                ) : (
                  <button
                    style={{
                      ...styles.btnSmall,
                      background: canAfford ? "#1f7a45" : "#ffffff",
                      color: canAfford ? "#ffffff" : "#141414",
                      border: "2.5px solid " + T.ink, boxShadow: canAfford ? "2px 2px 0 " + T.ink : "none",
                      fontFamily: T.display, fontSize: 14,
                      opacity: canAfford ? 1 : 0.5,
                    }}
                    disabled={!canAfford}
                    onClick={() => travelTo(c.name)}
                  >{fmtMoney(c.cost)}</button>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {hasMore && (
        <button
          ref={sentinelRef}
          style={{ ...styles.btnSmall, width: "100%", marginBottom: 12, border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink }}
          onClick={() => setVisibleCities(v => v + CITIES_STEP)}
        >Afficher plus de villes</button>
      )}
    </div>
  );
}
