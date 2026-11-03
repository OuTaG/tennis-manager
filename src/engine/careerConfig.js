// Configuration de départ d'une carrière, affichée dans les classements
// (records personnels et classement en ligne) pour se comparer à conditions
// égales : niveau, options, circuit, ville de départ, base de joueurs,
// relances après faillite, triche.
import { CITIES } from "../data/geo.js";
import { GAME_OPTIONS, difficultyLevel, formatMultiplier, scoreMultiplier } from "./difficulty.js";

export function careerConfigOf(player) {
  return {
    difficulty: player.difficulty ?? player.startDifficulty ?? 3,
    options: [...(player.gameOptions || [])],
    circuit: player.circuit === "wta" ? "wta" : "atp",
    startCity: player.startCity || null,
    customRoster: !!player.rosterName,
    continues: player.continues || 0,
    cheated: !!player.cheated,
  };
}

// Résumé d'une ligne et détail ligne à ligne.
export function describeConfig(cfg) {
  if (!cfg) return { short: "Configuration inconnue", rows: [] };
  const lvl = difficultyLevel(cfg.difficulty);
  const opts = (cfg.options || []).map(id => (GAME_OPTIONS.find(o => o.id === id) || {}).name).filter(Boolean);
  const circuit = cfg.circuit === "wta" ? "Circuit féminin" : "Circuit masculin";
  const short = [lvl.name, ...opts, cfg.circuit === "wta" ? "Féminin" : "Masculin", cfg.startCity, cfg.cheated ? "Triche" : null].filter(Boolean).join(" · ");
  const city = cfg.startCity && CITIES[cfg.startCity];
  const rows = [
    ["Niveau", lvl.name],
    ["Options", opts.length ? opts.join(", ") : "Aucune"],
    ["Multiplicateur de score", formatMultiplier(scoreMultiplier(cfg.difficulty, cfg.options || []))],
    ["Circuit", circuit],
    ["Ville de départ", cfg.startCity ? cfg.startCity + (city && city.country ? " (" + city.country + ")" : "") : "—"],
    ["Base de joueurs", cfg.customRoster ? "Personnalisée" : "Standard"],
  ];
  if (cfg.continues) rows.push(["Relances après faillite", String(cfg.continues)]);
  if (cfg.cheated) rows.push(["Mode", "Triche"]);
  return { short, rows };
}
