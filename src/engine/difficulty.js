// Difficulté, options de partie et multiplicateur de score (façon Polytopia).
// La difficulté est choisie à la création, indépendamment de la ville de
// départ. Elle pèse lourd dans le score : une carrière parfaite en Élite
// reste derrière une très bonne carrière en Légende. Les options de partie
// compliquent la vie en échange d'un bonus de score.

export const DIFFICULTY_LEVELS = [
  { level: 1, id: "loisir",  name: "Loisir",  scoreMul: 0.3, desc: "Progression rapide, moral solide, sponsors indulgents." },
  { level: 2, id: "espoir",  name: "Espoir",  scoreMul: 0.6, desc: "Un peu d'aide pour apprendre le circuit." },
  { level: 3, id: "pro",     name: "Pro",     scoreMul: 1.0, desc: "L'expérience de référence." },
  { level: 4, id: "elite",   name: "Élite",   scoreMul: 1.5, desc: "Progression plus lente, moral fragile, sponsors exigeants." },
  { level: 5, id: "legende", name: "Légende", scoreMul: 2.5, desc: "Tout est plus dur. Le seul niveau pour viser le sommet du classement." },
];

export const GAME_OPTIONS = [
  { id: "no_staff",   name: "Sans staff",    bonus: 0.25, desc: "Aucun membre de staff de toute la carrière." },
  { id: "fragile",    name: "Corps fragile", bonus: 0.15, desc: "Risque de blessure doublé." },
  { id: "low_budget", name: "Budget serré",  bonus: 0.10, desc: "Moitié moins d'argent au départ." },
];

export function difficultyLevel(level) {
  return DIFFICULTY_LEVELS.find(d => d.level === level) || DIFFICULTY_LEVELS[2];
}

// Multiplicateur de score : niveau × (1 + bonus des options).
// Les anciennes carrières (sans niveau choisi) comptent comme « Pro ».
export function scoreMultiplier(levelOrPlayer, options) {
  const isPlayer = levelOrPlayer && typeof levelOrPlayer === "object";
  const level = isPlayer ? (levelOrPlayer.difficulty ?? 3) : levelOrPlayer;
  const opts = isPlayer ? (levelOrPlayer.gameOptions || []) : (options || []);
  const bonus = GAME_OPTIONS.filter(o => opts.includes(o.id)).reduce((a, o) => a + o.bonus, 0);
  return Math.round(difficultyLevel(level).scoreMul * (1 + bonus) * 100) / 100;
}

export function hasGameOption(player, id) {
  return !!(player && (player.gameOptions || []).includes(id));
}

// Risque de blessure multiplié par l'option « Corps fragile ».
export function injuryRiskMul(player) {
  return hasGameOption(player, "fragile") ? 2 : 1;
}

export function formatMultiplier(m) {
  return "×" + m.toFixed(2).replace(/0$/, "").replace(".", ",");
}
