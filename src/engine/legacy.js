// Bilan de carrière et score de légende.
import { difficultyLevel, formatMultiplier, scoreMultiplier } from "./difficulty.js";
import { fmtMoney } from "./text.js";

// ─── HALL OF FAME / TROPHIES ─────────────────────────────────────────────────
// Career summary + "legacy score" shown on the end-of-career screen. Gives a
// single comparable number to chase across runs, plus headline records.
export function computeCareerSummary(player) {
  const hist = player.history || [];
  const bestRank = hist.length ? Math.min(...hist.map(h => h.ranking || 9999)) : 9999;
  const weeksNo1 = hist.filter(h => (h.ranking || 9999) === 1).length;
  const weeksTop10 = hist.filter(h => (h.ranking || 9999) <= 10).length;
  // Longest win streak from the (recent) match history we keep.
  const mh = [...(player.matchHistory || [])].reverse(); // oldest → newest
  let streak = 0, bestStreak = 0;
  for (const m of mh) {
    if (m.isQualifying) continue;
    if (m.won) { streak++; bestStreak = Math.max(bestStreak, streak); }
    else streak = 0;
  }
  // Grand Slam titles, from kept match history (approx if career very long).
  const gsTitles = (player.matchHistory || []).filter(m => m.round === "Vainqueur" && m.tierWon === "GrandSlam").length;
  // Best rivalry: most-played opponent with a positive or notable record.
  let bestRivalry = null;
  for (const r of (player.rivalries || [])) {
    const games = (r.wins || 0) + (r.losses || 0);
    if (games < 2) continue;
    if (!bestRivalry || games > ((bestRivalry.wins || 0) + (bestRivalry.losses || 0))) bestRivalry = r;
  }
  const seasons = (player.careerSeasons || []).length;
  return { bestRank, weeksNo1, weeksTop10, bestStreak, gsTitles, bestRivalry, seasons };
}

// Legacy score: weighted blend of the achievements that define a career.
// Points attributed per title, by tier. A Grand Slam title is worth far more
// than an ATP250, which is itself worth more than a Challenger, etc.
export const LEGACY_TITLE_POINTS = {
  GrandSlam:      500,
  Finals:         300,
  Masters1000:    220,
  ATP500:         120,
  ATP250:         70,
  Challenger:     25,
  ITF:            8,
};
export const LEGACY_TITLE_TIER_LABEL = {
  GrandSlam:   "Titres Grand Chelem",
  Finals:      "Titres Masters",
  Masters1000: "Titres Masters 1000",
  ATP500:      "Titres ATP 500",
  ATP250:      "Titres ATP 250",
  Challenger:  "Titres Challenger",
  ITF:         "Titres ITF",
};

// Resolve a per-tier titles map for the player. Uses the live counter when
// available; falls back to matchHistory scanning for older saves (with the
// caveat that matchHistory is capped at 80 entries).
export function getTitlesByTier(player) {
  if (player.titlesByTier && Object.keys(player.titlesByTier).length > 0) {
    return { ...player.titlesByTier };
  }
  const fromHistory = {};
  for (const m of (player.matchHistory || [])) {
    if (m.round === "Vainqueur" && m.tierWon) {
      fromHistory[m.tierWon] = (fromHistory[m.tierWon] || 0) + 1;
    }
  }
  return fromHistory;
}

export function computeLegacyScore(player, summary) {
  const s = summary || computeCareerSummary(player);
  // Multiplicateur de difficulté et d'options (engine/difficulty.js).
  const diffMul = scoreMultiplier(player);
  const tt = getTitlesByTier(player);
  const titlesPts = Object.entries(tt).reduce((a, [tier, n]) => a + (LEGACY_TITLE_POINTS[tier] || 0) * n, 0);
  const base = {
    rank: s.bestRank <= 1 ? 3000 : s.bestRank <= 5 ? 2000 : s.bestRank <= 10 ? 1200 : s.bestRank <= 30 ? 600 : s.bestRank <= 100 ? 250 : s.bestRank <= 300 ? 80 : 0,
    weeksNo1: s.weeksNo1 * 40,
    weeksTop10: s.weeksTop10 * 8,
    titles: titlesPts,
    wins: (player.careerWins || 0) * 4,
    streak: s.bestStreak * 20,
    objectives: (player.careerObjectivesMet || 0) * 60,
    earnings: Math.floor((player.totalEarnings || 0) / 20000),
  };
  const subtotal = Object.values(base).reduce((a, b) => a + b, 0);
  const difficultyBonus = Math.round(subtotal * (diffMul - 1));
  const total = Math.round(subtotal + difficultyBonus);
  return total;
}

// Detailed breakdown of the legacy score (for the end-of-career reveal and
// end-of-season recap). One line per title tier so the player sees how much
// each kind of trophy contributes.
export function computeLegacyBreakdown(player, summary) {
  const s = summary || computeCareerSummary(player);
  const diff = player.difficulty ?? 3;
  const diffMul = scoreMultiplier(player);
  const tt = getTitlesByTier(player);
  // Order tiers from prestigious → modest so the most valuable rows come first.
  const tierOrder = ["GrandSlam", "Finals", "Masters1000", "ATP500", "ATP250", "Challenger", "ITF"];
  const titleRows = tierOrder
    .filter(t => (tt[t] || 0) > 0)
    .map(t => ({
      label: LEGACY_TITLE_TIER_LABEL[t] || ("Titres " + t),
      detail: tt[t] + " × " + LEGACY_TITLE_POINTS[t],
      pts: tt[t] * LEGACY_TITLE_POINTS[t],
    }));
  const rows = [
    { label: "Meilleur classement", detail: s.bestRank === 9999 ? "—" : "#" + s.bestRank, pts: s.bestRank <= 1 ? 3000 : s.bestRank <= 5 ? 2000 : s.bestRank <= 10 ? 1200 : s.bestRank <= 30 ? 600 : s.bestRank <= 100 ? 250 : s.bestRank <= 300 ? 80 : 0 },
    { label: "Semaines n°1", detail: s.weeksNo1 + " × 40", pts: s.weeksNo1 * 40 },
    { label: "Semaines top 10", detail: s.weeksTop10 + " × 8", pts: s.weeksTop10 * 8 },
    ...titleRows,
    { label: "Victoires en carrière", detail: (player.careerWins || 0) + " × 4", pts: (player.careerWins || 0) * 4 },
    { label: "Meilleure série", detail: s.bestStreak + " × 20", pts: s.bestStreak * 20 },
    { label: "Objectifs sponsors", detail: (player.careerObjectivesMet || 0) + " × 60", pts: (player.careerObjectivesMet || 0) * 60 },
    { label: "Gains", detail: fmtMoney(player.totalEarnings || 0), pts: Math.floor((player.totalEarnings || 0) / 20000) },
  ].filter(r => r.pts > 0);
  const subtotal = rows.reduce((a, r) => a + r.pts, 0);
  const difficultyBonus = Math.round(subtotal * (diffMul - 1));
  return {
    rows, subtotal, diff, diffPct: Math.round((diffMul - 1) * 100), difficultyBonus, total: subtotal + difficultyBonus,
    mulLabel: difficultyLevel(diff).name + " " + formatMultiplier(diffMul),
  };
}

// Legacy tier label from score.
export function legacyTier(score) {
  if (score >= 6000) return { label: "Légende", color: "#b8891f" };
  if (score >= 3500) return { label: "Grand champion", color: "#8a6a9e" };
  if (score >= 2000) return { label: "Star du circuit", color: "#5b8a45" };
  if (score >= 900)  return { label: "Joueur confirmé", color: "#4a7896" };
  if (score >= 300)  return { label: "Espoir", color: "#c07a2a" };
  return { label: "Journeyman", color: "#8a7f70" };
}
