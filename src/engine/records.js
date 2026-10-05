// Records de carrière (stockés sur l'appareil).
import { computeCareerSummary, computeLegacyScore, getTitlesByTier } from "./legacy.js";
import { getPlayerRanking, totalAtpPoints } from "./player.js";

// ─── RECORDS (toutes carrières) ──────────────────────────────────────────
// Un résumé de chaque carrière est gardé à part (localStorage « tm-records »),
// indépendamment de la sauvegarde : effacer ou écraser une partie ne fait pas
// disparaître ses records. Mis à jour à chaque sauvegarde.
export const RECORDS_STORAGE_KEY = "tm-records";

export function loadCareerSummaries() {
  try { return JSON.parse(localStorage.getItem(RECORDS_STORAGE_KEY) || "{}"); } catch (e) { return {}; }
}

export function updateCareerRecords(player, atpDb) {
  if (!player || !player.careerId) return;
  // Les défis ont leurs propres records (score de défi) : ils ne comptent pas
  // dans les records de carrière (palmarès de départ imposé).
  if (player.challenge) return;
  try {
    const all = loadCareerSummaries();
    const prev = all[player.careerId] || {};
    const pts = totalAtpPoints(player.atpPointsLog || []);
    const rank = atpDb ? getPlayerRanking(pts, atpDb) : 9999;
    const hist = player.history || [];
    // Sans point ATP, le joueur n'est pas classé : ces semaines ne comptent pas.
    const ranked = hist.filter(h => (h.points || 0) > 0);
    const histBest = ranked.length ? Math.min(...ranked.map(h => h.ranking || 9999)) : 9999;
    // Un rang au-delà de la base (1 200 joueurs) = pas de classement.
    const prevBest = prev.bestRank && prev.bestRank <= 1200 ? prev.bestRank : 9999;
    const bestRank = Math.min(prevBest, histBest, pts > 0 ? rank : 9999);
    const bestRankImproved = bestRank < prevBest;
    const tt = getTitlesByTier(player);
    const summary = computeCareerSummary(player);
    const played = (player.careerWins || 0) + (player.careerLosses || 0);
    all[player.careerId] = {
      name: player.name,
      flag: player.nationalityFlag || "",
      startYear: prev.startYear || (player.year - (player.careerSeasons || []).length),
      lastYear: player.year, lastWeek: player.week,
      seasons: (player.careerSeasons || []).length + 1,
      bestRank,
      bestRankWhen: bestRankImproved ? { week: player.week, year: player.year } : (prev.bestRankWhen || null),
      maxPoints: Math.max(prev.maxPoints || 0, pts),
      titles: player.titlesWon || 0,
      gsTitles: tt.GrandSlam || 0,
      mastersTitles: tt.Masters1000 || 0,
      wins: player.careerWins || 0,
      matches: played,
      winRate: played >= 20 ? Math.round((player.careerWins || 0) / played * 100) : null,
      bigWins: player.careerBigWins || 0,
      earnings: player.totalEarnings || 0,
      weeksNo1: Math.max(prev.weeksNo1 || 0, summary.weeksNo1 || 0),
      weeksTop10: Math.max(prev.weeksTop10 || 0, summary.weeksTop10 || 0),
      bestStreak: Math.max(prev.bestStreak || 0, summary.bestStreak || 0),
      legacy: Math.max(prev.legacy || 0, computeLegacyScore(player, summary) || 0),
      updatedAt: Date.now(),
    };
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) { /* records non critiques */ }
}

// Définition des records affichés : meilleure carrière pour chaque indicateur.
export const RECORD_DEFS = [
  { key: "bestRank", label: "Meilleur classement", icon: "trending", lower: true, fmt: v => "#" + v, valid: v => v && v < 9999,
    when: c => c.bestRankWhen ? "S" + c.bestRankWhen.week + " · " + c.bestRankWhen.year : null },
  { key: "legacy", label: "Score de légende", icon: "award", fmt: v => v.toLocaleString() },
  { key: "titles", label: "Titres", icon: "trophy", fmt: v => v },
  { key: "gsTitles", label: "Titres du Grand Chelem", icon: "star", fmt: v => v },
  { key: "mastersTitles", label: "Titres Grand 1000", icon: "star", fmt: v => v },
  { key: "weeksNo1", label: "Semaines n°1 mondial", icon: "trophy", fmt: v => v },
  { key: "weeksTop10", label: "Semaines dans le top 10", icon: "chart", fmt: v => v },
  { key: "maxPoints", label: "Points ATP (maximum)", icon: "chart", fmt: v => v.toLocaleString() },
  { key: "wins", label: "Victoires", icon: "success", fmt: v => v },
  { key: "winRate", label: "Pourcentage de victoires (20 matchs min.)", icon: "activity", fmt: v => v + " %", valid: v => v !== null && v !== undefined },
  { key: "bestStreak", label: "Série de victoires", icon: "fire", fmt: v => v },
  { key: "bigWins", label: "Victoires contre le top 50", icon: "target", fmt: v => v },
  { key: "earnings", label: "Gains en tournoi", icon: "money",
    fmt: v => v >= 1e6 ? (Math.round(v / 1e5) / 10) + " M€" : v >= 1000 ? (Math.round(v / 100) / 10) + " k€" : v + " €" },
  { key: "seasons", label: "Saisons jouées", icon: "calendar", fmt: v => v },
];

export function computeRecords() {
  const careers = Object.values(loadCareerSummaries());
  return RECORD_DEFS.map(def => {
    let best = null;
    for (const c of careers) {
      const v = c[def.key];
      const ok = def.valid ? def.valid(v) : (typeof v === "number" && v > 0);
      if (!ok) continue;
      if (!best || (def.lower ? v < best.c[def.key] : v > best.c[def.key])) best = { c };
    }
    return { def, career: best ? best.c : null };
  });
}
