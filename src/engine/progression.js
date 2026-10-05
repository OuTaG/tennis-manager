// Progression des statistiques après un tournoi.
import { PLAYER_STYLES } from "../data/staff.js";
import { ageTrainingMultiplier } from "./player.js";

// ─── POST-TOURNAMENT PROGRESSION ──────────────────────────────────────────────
// Progression scales inversely with current stat level (harder to improve high stats).
// Bad performances can REDUCE stats — more severely at higher levels.
//
// Smooth diminishing returns - continuous curve based on current stat level.
// Targets: 50→1.00 | 60→0.93 | 70→0.75 | 80→0.50 | 85→0.30 | 90→0.15 | 95→0.05
// ─── PROFIL DE PROGRESSION SELON LE STYLE ───────────────────────────────────
// Chaque style progresse plus vite (et plus haut) dans ses points forts et plus
// lentement dans ses points faibles, pour que le profil du joueur reste marqué
// au lieu de converger vers un joueur « neutre ». L'écart d'une stat à la
// moyenne du style (ex. coup droit du Puncher : +9) décale sa courbe de
// rendements décroissants et module la vitesse d'apprentissage.
export const STYLE_CURVE_SHIFT = 1.2;   // décalage de la courbe par point d'écart
export const STYLE_TALENT_RATE = 0.02;   // vitesse d'apprentissage par point d'écart
export function styleStatOffset(styleId, stat) {
  const base = PLAYER_STYLES[styleId]?.base;
  if (!base || base[stat] === undefined) return 0;
  const vals = Object.values(base);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return base[stat] - avg;
}
// Multiplicateur de progression d'une stat en tenant compte du style.
export function styledProgressionMultiplier(styleId, stat, statValue) {
  const off = styleStatOffset(styleId, stat);
  const talent = Math.max(0.6, Math.min(1.5, 1 + off * STYLE_TALENT_RATE));
  return progressionMultiplier(statValue - off * STYLE_CURVE_SHIFT) * talent;
}

export function progressionMultiplier(statValue) {
  // Courbe adoucie : on évite le "mur" trop dur entre 70-80.
  // Nouveaux paliers ciblés :
  //   40 → 1.30 (rapide jeune)
  //   50 → 1.10 (baseline)
  //   60 → 0.95
  //   70 → 0.70
  //   75 → 0.50
  //   80 → 0.30
  //   85 → 0.15
  //   90 → 0.07
  //   95+ → 0.03
  if (statValue <= 40) return 1.30;
  if (statValue >= 99) return 0.02;
  if (statValue < 50) {
    return 1.30 - ((statValue - 40) / 10) * 0.20;
  }
  if (statValue <= 60) {
    // 50→1.10, 60→0.95
    return 1.10 - ((statValue - 50) / 10) * 0.15;
  }
  if (statValue <= 70) {
    // 60→0.95, 70→0.70
    return 0.95 - ((statValue - 60) / 10) * 0.25;
  }
  if (statValue <= 80) {
    // 70→0.70, 80→0.35 (plafond du haut niveau légèrement adouci)
    return 0.70 - ((statValue - 70) / 10) * 0.35;
  }
  if (statValue <= 90) {
    // 80→0.35, 90→0.10
    return 0.35 - ((statValue - 80) / 10) * 0.25;
  }
  // 90→0.10, 99→0.03
  return Math.max(0.03, 0.10 - ((statValue - 90) / 10) * 0.07);
}

// Loss multiplier (how much you can LOSE in stats) - grows with stat level
export function lossMultiplier(statValue) {
  if (statValue < 55) return 0.0;   // no loss before 55
  if (statValue < 65) return 0.3;
  if (statValue < 75) return 0.6;
  return 1.0; // plus de pénalité alourdie au-delà de 85
}

// Tier vs player level mismatch: playing tournaments far below your level gives
// diminishing skill progression. A top-50 player grinding ITFs barely learns.
// "Expected tier" maps to a typical ranking range. We compute how many tiers
// the player is "above" the tournament and apply a penalty.
export const TIER_EXPECTED_RANK = {
  "ITF": 600,         // ITFs make sense for #300+ players
  "Challenger": 250,  // Challengers for #150-400
  "ATP250": 100,
  "ATP500": 60,
  "Masters1000": 30,
  "GrandSlam": 20,
  "Finals": 8,
};

export function tierProgressionMultiplier(tier, playerRanking) {
  const expected = TIER_EXPECTED_RANK[tier];
  if (!expected || !playerRanking) return 1.0;
  // If player is at or below expected ranking number (i.e. weaker or equal), full gains
  if (playerRanking >= expected) return 1.0;
  // Player is stronger than the field. Compute how much stronger (log scale).
  // ratio < 1 means player is overqualified; the smaller, the worse the mismatch.
  const ratio = playerRanking / expected;
  // Floor at 0.1: never zero out completely, but a top-20 in an ITF gets ~10% gains.
  // Examples (ITF, expected 600):
  //   rank 300 -> 0.5 ratio -> ~0.55x gains
  //   rank 100 -> 0.17 ratio -> ~0.22x gains
  //   rank 30  -> 0.05 ratio -> ~0.10x gains (floored)
  return Math.max(0.1, Math.pow(ratio, 0.85));
}

// Part des gains de stats venant des tournois (l'entraînement doit peser autant).
export const TOURNAMENT_GAIN_MUL = 0.4;

export function computeTournamentProgression(player, matchesPlayed, isTitle, fmt, tourn, playerRanking) {
  const gains = {};
  let basePoints = 0;
  let wonMatches = 0;
  let lostMatches = 0;
  let totalOppRankBonus = 0;

  matchesPlayed.forEach(m => {
    if (m.won) {
      wonMatches++;
      let mp = 1.2;
      if (m.opponentRank < 30) mp += 2.0;
      else if (m.opponentRank < 100) mp += 1.2;
      else if (m.opponentRank < 300) mp += 0.5;
      mp += m.roundIdx * 0.3;
      basePoints += mp;
      totalOppRankBonus += (m.opponentRank < 100 ? 1 : 0);
    } else {
      lostMatches++;
      // Losing still gives experience (small) - more if opponent was strong
      basePoints += m.opponentRank < 100 ? 0.7 : 0.4;
    }
  });

  if (isTitle) basePoints += 5;

  // Performance quality: did we exceed expectations?
  // Define "expected" round = roughly half of mainRounds for someone in the field
  const expectedRound = fmt ? Math.floor(fmt.mainRounds.length / 2) : 2;
  const reachedRound = matchesPlayed.length > 0 ? matchesPlayed[matchesPlayed.length - 1].roundIdx : 0;
  const performance = reachedRound - expectedRound;

  // Bad performance penalty: lost in first round of qualifs or first main round
  const badPerformance = matchesPlayed.length <= 1 && matchesPlayed.every(m => !m.won);
  let lossPoints = 0;
  if (badPerformance) {
    lossPoints = 1.5 + Math.max(0, -performance * 0.5);
  } else if (performance < -1) {
    lossPoints = 0.5;
  }
  // Perdre contre mieux classé que soi n'est pas une contre-performance :
  // pas de régression de stats dans ce cas.
  const lastMatch = matchesPlayed[matchesPlayed.length - 1];
  if (lastMatch && !lastMatch.won && playerRanking && lastMatch.opponentRank < playerRanking) lossPoints = 0;

  // Distribute across stats with random emphasis, applying diminishing returns per stat
  const statKeys = ["serve", "forehand", "backhand", "stamina", "mental", "net"];
  // Les gains de match profitent davantage aux points forts du style.
  const distributions = statKeys.map(k => Math.random() * Math.max(0.4, 1 + styleStatOffset(player.styleId, k) * 0.04));
  const sum = distributions.reduce((a, b) => a + b, 0);

  // Age multiplier: gains reduced after 28, but losses unaffected (so older players still progress, just slower)
  const ageMul = ageTrainingMultiplier(player.age || 18);

  // Tier mismatch: playing well below your level → severely reduced skill gains
  const tierMul = tourn ? tierProgressionMultiplier(tourn.tier, playerRanking) : 1.0;

  statKeys.forEach((k, i) => {
    const portion = distributions[i] / sum;
    const currentStat = player.stats[k];
    const gainMul = styledProgressionMultiplier(player.styleId, k, currentStat);
    const lossMul = lossMultiplier(currentStat);

    const rawGain = basePoints * portion * gainMul * ageMul * tierMul * TOURNAMENT_GAIN_MUL;
    const rawLoss = lossPoints * portion * lossMul * TOURNAMENT_GAIN_MUL;
    const netChange = parseFloat((rawGain - rawLoss).toFixed(2));

    if (Math.abs(netChange) >= 0.05) gains[k] = netChange;
  });

  return gains;
}
