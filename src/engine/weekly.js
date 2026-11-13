// Défi de la semaine : gratuit, le même pour tous les joueurs.
// Chaque lundi (0 h UTC), une nouvelle configuration est tirée d'une graine
// commune : circuit, ville et style de départ, niveau, options de partie,
// durée (une ou deux saisons). Le monde du jeu part de la même graine.
// Objectif : le meilleur score avant la fin de la dernière saison.
// 3 essais par semaine ; le meilleur score part au classement Game Center
// hebdomadaire (classement récurrent remis à zéro chaque lundi).
import { PLAYER_STYLES } from "../data/staff.js";
import { GAME_OPTIONS, difficultyLevel, formatMultiplier, scoreMultiplier } from "./difficulty.js";
import { START_CITIES } from "./player.js";

export const WEEKLY_ID = "weekly";
export const WEEKLY_MAX_ATTEMPTS = 3;
export const WEEKLY_LEADERBOARD_ID = "courtside.weekly";
const WEEK_MS = 7 * 24 * 3600 * 1000;
const EPOCH = Date.UTC(2026, 0, 5); // un lundi, 0 h UTC

// Numéro de la semaine réelle (change chaque lundi à 0 h UTC).
export function weeklyKey(now = Date.now()) { return Math.floor((now - EPOCH) / WEEK_MS); }
export function weeklyResetIn(now = Date.now()) { return EPOCH + (weeklyKey(now) + 1) * WEEK_MS - now; }
export function formatResetIn(ms) {
  const h = Math.max(1, Math.round(ms / 3600000));
  if (h < 48) return h + " h";
  return Math.round(h / 24) + " jours";
}

// Petit générateur indépendant du hasard du jeu (mulberry32).
function rngFrom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Configuration de la semaine `key` (identique sur tous les appareils).
export function weeklyConfig(key = weeklyKey()) {
  const r = rngFrom(0x9e3779b9 ^ (key * 2654435761));
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const styles = Object.keys(PLAYER_STYLES);
  const opts = GAME_OPTIONS.map(o => o.id).filter(() => r() < 0.35).slice(0, 2);
  return {
    key,
    seed: Math.floor(r() * 4294967296) >>> 0,
    circuit: r() < 0.5 ? "atp" : "wta",
    city: pick(START_CITIES).city,
    style: pick(styles),
    difficulty: 2 + Math.floor(r() * 3), // Espoir, Pro ou Élite
    options: opts,
    seasons: r() < 0.5 ? 1 : 2,
  };
}

// Définition affichée et jouée comme un défi scénarisé.
export function weeklyDef(cfg = weeklyConfig()) {
  const lvl = difficultyLevel(cfg.difficulty);
  const optNames = cfg.options.map(id => (GAME_OPTIONS.find(o => o.id === id) || {}).name).filter(Boolean);
  const style = PLAYER_STYLES[cfg.style] || {};
  const lastYear = 2026 + cfg.seasons - 1;
  const span = cfg.seasons === 1 ? "une saison" : "deux saisons";
  return {
    id: WEEKLY_ID, weekly: true, scoreOnly: true, circuit: cfg.circuit, config: cfg,
    name: "Défi de la semaine", difficulty: Math.min(5, cfg.difficulty + optNames.length),
    tagline: (cfg.circuit === "wta" ? "Circuit féminin" : "Circuit masculin") + " · " + cfg.city + " · " + span,
    context: "Une nouvelle configuration chaque lundi, la même pour tous les joueurs. Partez de zéro et faites le meilleur score possible en " + span + ". Vous avez " + WEEKLY_MAX_ATTEMPTS + " essais cette semaine : votre meilleur score part au classement de la semaine.",
    objectiveLabel: "Meilleur score en " + span,
    deadlineLabel: "Fin de la saison " + lastYear,
    objectiveText: "Le défi s'arrête à la fin de la saison " + lastYear + ". Le score compte vos victoires, vos titres, les victoires contre le top 10 et votre meilleur classement, multipliés par la difficulté (" + formatMultiplier(scoreMultiplier(cfg.difficulty, cfg.options)) + ").",
    perks: [
      "Niveau " + lvl.name,
      "Départ de " + cfg.city + ", style " + (style.name || cfg.style),
      ...optNames.map(n => "Option : " + n),
      "Gratuit · " + WEEKLY_MAX_ATTEMPTS + " essais par semaine",
    ],
    startWeek: 1, deadline: { year: lastYear, week: 52 },
    style: cfg.style, city: cfg.city,
    setup(p) { p.challenge.weekly = cfg; },
    objective() { return { done: false, progress: "Fin du défi : saison " + lastYear + ", semaine 52" }; },
  };
}

// ─── ESSAIS ET MEILLEUR SCORE (par appareil) ──────────────────────────────
const KEY = "tm-weekly";
export function weeklyState(key = weeklyKey()) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && s.key === key) return s;
  } catch (e) { /* illisible */ }
  return { key, attempts: 0, best: null };
}
function saveState(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* stockage plein */ } }
export function weeklyAttemptsLeft(key = weeklyKey()) { return Math.max(0, WEEKLY_MAX_ATTEMPTS - weeklyState(key).attempts); }
export function consumeWeeklyAttempt(key = weeklyKey()) {
  const s = weeklyState(key);
  if (s.attempts >= WEEKLY_MAX_ATTEMPTS) return false;
  saveState({ ...s, attempts: s.attempts + 1 });
  return true;
}
// Score d'un essai terminé : gardé s'il bat le meilleur de la semaine.
export function recordWeeklyScore(key, score) {
  const s = weeklyState(key);
  if (s.key !== key) return;
  if (!s.best || score > s.best) saveState({ ...s, best: score });
}
