// Configuration de départ d'une carrière, affichée dans les classements
// (records personnels et classement en ligne) pour se comparer à conditions
// égales : niveau, options, circuit, ville de départ, base de joueurs,
// relances après faillite, triche.
import { CITIES } from "../data/geo.js";
import { GAME_OPTIONS, difficultyLevel, formatMultiplier, scoreMultiplier } from "./difficulty.js";
import { START_CITIES } from "./player.js";

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

// ─── CODE DE CONFIGURATION (classement en ligne) ────────────────────────
// Game Center attache à chaque score un entier (« context ») : on y range
// la configuration de départ, décodée à l'affichage du classement.
// Bits : version (2) | niveau - 1 (3) | options (3) | circuit (1) |
// ville de départ + 1 (4, 0 = inconnue) | base personnalisée (1).
const CONFIG_VERSION = 1;
const OPTION_BITS = ["no_staff", "fragile", "low_budget"];
export function encodeConfig(cfg) {
  const opts = OPTION_BITS.reduce((m, id, i) => m | ((cfg.options || []).includes(id) ? 1 << i : 0), 0);
  const city = Math.max(0, START_CITIES.findIndex(c => c.city === cfg.startCity) + 1);
  return CONFIG_VERSION
    | ((Math.min(5, Math.max(1, cfg.difficulty || 3)) - 1) << 2)
    | (opts << 5)
    | ((cfg.circuit === "wta" ? 1 : 0) << 8)
    | (city << 9)
    | ((cfg.customRoster ? 1 : 0) << 13);
}
export function decodeConfig(code) {
  if (!code || (code & 3) !== CONFIG_VERSION) return null;
  const opts = (code >> 5) & 7;
  const city = (code >> 9) & 15;
  return {
    difficulty: ((code >> 2) & 7) + 1,
    options: OPTION_BITS.filter((_, i) => opts & (1 << i)),
    circuit: (code >> 8) & 1 ? "wta" : "atp",
    startCity: city ? (START_CITIES[city - 1] || {}).city || null : null,
    customRoster: !!((code >> 13) & 1),
    continues: 0,
    cheated: false,
  };
}
