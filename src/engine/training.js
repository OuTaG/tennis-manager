// Gain d'une séance d'entraînement : un seul calcul pour l'écran
// Préparation, les fiches de programme et la séance elle-même, afin que la
// valeur affichée soit exactement celle obtenue.
import { ageTrainingMultiplier, difficultyFactors } from "./player.js";
import { styledProgressionMultiplier } from "./progression.js";
import { sumStaffEffect } from "./staff.js";

// Facteurs d'efficacité communs à tous les entraînements (hors niveau de la
// stat travaillée). total = produit ; 1 = efficacité normale.
export function trainingEfficiency(player) {
  const staff = 1 + Math.max(-0.3, sumStaffEffect(player.staff || [], "trainGain"));
  const happ = player.happiness ?? 70;
  const happiness = happ < 20 ? 0.5 : happ < 40 ? 0.85 : happ > 85 ? 1.10 : 1.0;
  const energy = 0.6 + (player.energy / 250);
  const age = ageTrainingMultiplier(player.age);
  const difficulty = difficultyFactors(player).trainMul;
  const absWeek = (player.year || 0) * 52 + (player.week || 0);
  const boost = (player.trainBoost && absWeek < player.trainBoost.untilAbsWeek) ? player.trainBoost.mul : 1;
  const challenge = (player.challenge && player.challenge.status === "active" && player.challenge.trainMul) || 1;
  const parts = [
    { key: "energy", label: "Énergie", mul: energy },
    { key: "happiness", label: "Bonheur", mul: happiness },
    { key: "age", label: "Âge", mul: age },
    { key: "staff", label: "Staff", mul: staff },
    { key: "difficulty", label: "Difficulté", mul: difficulty },
    { key: "boost", label: "Bonus", mul: boost },
    { key: "challenge", label: "Défi", mul: challenge },
  ];
  // La difficulté compte dans le gain réel mais n'est pas affichée : à 100 %
  // d'énergie, l'efficacité affichée reste 100 % ; la difficulté ne se voit
  // que dans les valeurs de gain.
  const shownParts = parts.filter(p => p.key !== "difficulty");
  return { total: parts.reduce((a, p) => a * p.mul, 1), shown: shownParts.reduce((a, p) => a * p.mul, 1), parts: shownParts };
}

// Gain (points de stat) d'une séance réussie de base (programme ×1).
export function trainingBaseGain(player, mod) {
  const diminishMul = styledProgressionMultiplier(player.styleId, mod.stat, player.stats[mod.stat]);
  return mod.baseGain * diminishMul * trainingEfficiency(player).total;
}

// Gain d'un programme réussi, arrondi au centième (la valeur affichée).
export function programmeGain(player, mod, card) {
  return parseFloat((trainingBaseGain(player, mod) * card.successMul).toFixed(2));
}
