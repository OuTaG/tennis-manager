// Gain d'une séance d'entraînement : un seul calcul pour l'écran
// Préparation, les fiches de programme et la séance elle-même, afin que la
// valeur affichée soit exactement celle obtenue.
import { ageTrainingMultiplier, difficultyFactors } from "./player.js";
import { styledProgressionMultiplier } from "./progression.js";
import { sumStaffEffect } from "./staff.js";

// Gain (points de stat) d'une séance réussie de base (programme ×1).
export function trainingBaseGain(player, mod) {
  const staffBonus = 1 + Math.max(-0.3, sumStaffEffect(player.staff || [], "trainGain"));
  // Bonheur : très bas = motivation en berne, haut = concentration.
  const happ = player.happiness ?? 70;
  const happinessMul = happ < 20 ? 0.5 : happ < 40 ? 0.85 : happ > 85 ? 1.10 : 1.0;
  const energyMul = 0.6 + (player.energy / 250);
  const ageMul = ageTrainingMultiplier(player.age);
  const diminishMul = styledProgressionMultiplier(player.styleId, mod.stat, player.stats[mod.stat]);
  const diffMul = difficultyFactors(player).trainMul;
  const absWeek = (player.year || 0) * 52 + (player.week || 0);
  const techBoostMul = (player.trainBoost && absWeek < player.trainBoost.untilAbsWeek) ? player.trainBoost.mul : 1;
  const challengeMul = (player.challenge && player.challenge.status === "active" && player.challenge.trainMul) || 1;
  return mod.baseGain * staffBonus * energyMul * diminishMul * ageMul * happinessMul * diffMul * techBoostMul * challengeMul;
}

// Gain d'un programme réussi, arrondi au centième (la valeur affichée).
export function programmeGain(player, mod, card) {
  return parseFloat((trainingBaseGain(player, mod) * card.successMul).toFixed(2));
}
