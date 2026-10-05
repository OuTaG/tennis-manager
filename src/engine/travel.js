// Distances et coût des voyages.
import { CITIES, TRAVEL_COST_PER_KM, TRAVEL_FIXED_COST } from "../data/geo.js";
import { challengeActive } from "./challenges.js";

// ─── DISTANCE & TRAVEL ─────────────────────────────────────────────────────────
export function distanceKm(from, to) {
  if (!from || !to) return 0;
  const a = CITIES[from], b = CITIES[to];
  if (!a || !b) return 0;
  if (from === to) return 0;
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export function travelCostBetween(from, to) {
  const km = distanceKm(from, to);
  if (km === 0) return 0;
  // Défi « Seul au monde » : billets low-cost réservés soi-même.
  const mul = challengeActive("seul") ? 0.75 : 1;
  return Math.round((TRAVEL_FIXED_COST + km * TRAVEL_COST_PER_KM) * mul);
}
