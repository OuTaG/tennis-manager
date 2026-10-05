// Styles de jeu et catalogue du staff.

export const PLAYER_STYLES = {
  puncher: { id: "puncher", name: "Puncher", iconName: "glove", desc: "Frappe puissante, beaucoup d'aces et de winners", base: { serve: 56, forehand: 58, backhand: 46, stamina: 44, mental: 46, net: 42 } },
  baseliner: { id: "baseliner", name: "Baseliner", iconName: "target", desc: "Régulier en fond de court, échanges longs", base: { serve: 46, forehand: 54, backhand: 54, stamina: 56, mental: 50, net: 38 } },
  counter: { id: "counter", name: "Counter-puncher", iconName: "shield", desc: "Défensif, vit des erreurs adverses", base: { serve: 42, forehand: 48, backhand: 52, stamina: 60, mental: 56, net: 40 } },
  serve_volley: { id: "serve_volley", name: "Serveur-volleyeur", iconName: "rocket", desc: "Service-volée, jeu vers l'avant", base: { serve: 60, forehand: 48, backhand: 44, stamina: 48, mental: 48, net: 58 } },
  allcourt: { id: "allcourt", name: "Polyvalent", iconName: "brain", desc: "Profil équilibré, s'adapte à tout", base: { serve: 50, forehand: 50, backhand: 50, stamina: 50, mental: 50, net: 48 } },
};

// Each staff member has:
// - role: one of Coach / Kiné / Préparateur mental / Préparateur physique / Nutritionniste / Agent
// - level: 1-3 (cost & impact scale)
// - cost: weekly salary
// - surface (optional): "Terre battue" | "Dur" | "Gazon" | "Indoor" — gives a bonus on this surface, malus on others
// - bonus: dict of effects (positive)
//   - trainGain (% multiplier on training gains, e.g. 0.08 = +8%)
//   - recovery (flat extra energy per week)
//   - matchMental (flat extra mental in match)
//   - matchStamina (flat extra stamina in match)
//   - energyDrainCut (% reduction of in-match energy drain, 0.10 = -10%)
//   - injuryProtect (% chance to avoid an injury proc, 0.20 = 20%)
//   - sponsorPay (% extra weekly sponsor income)
//   - sponsorTierBoost (% chance offers come at a higher tier)
//   - surfaceBoost (flat bonus to all match stats on the spec surface)
// - malus: dict of effects (negative or cost)
//   - happinessDrain (flat happiness lost per week, joueur "étouffé")
//   - matchMental / matchStamina (negative values, applied in match)
//   - surfaceMalus (flat malus to all match stats on non-spec surfaces)
export const STAFF_LIST = [
  // ─── COACHES (5: 1 generalist par level + 4 specialists surface) ─────
  { id: "coach_basic",   role: "Coach", name: "Marc Dupont",   level: 1, cost: 300,
    bonus: { trainGain: 0.04 },
    malus: {} },
  { id: "coach_mid",     role: "Coach", name: "Pierre Vasseur", level: 2, cost: 900,
    bonus: { trainGain: 0.08 },
    malus: { happinessDrain: 1 } },
  { id: "coach_elite",   role: "Coach", name: "Carlos Vives",  level: 3, cost: 2200,
    bonus: { trainGain: 0.14 },
    malus: { happinessDrain: 2 } },
  { id: "coach_clay",    role: "Coach", name: "Toni Hernandez (spé. Terre)", level: 2, cost: 1200,
    surface: "Terre battue",
    bonus: { trainGain: 0.05, surfaceBoost: 5 },
    malus: { surfaceMalus: 3 } },
  { id: "coach_grass",   role: "Coach", name: "Mike Carlton (spé. Gazon)",   level: 2, cost: 1200,
    surface: "Gazon",
    bonus: { trainGain: 0.05, surfaceBoost: 6 },
    malus: { surfaceMalus: 3 } },
  { id: "coach_hard",    role: "Coach", name: "Igor Petrov (spé. Dur)",      level: 2, cost: 1200,
    surface: "Dur",
    bonus: { trainGain: 0.05, surfaceBoost: 4 },
    malus: { surfaceMalus: 2 } },
  { id: "coach_indoor",  role: "Coach", name: "Jürgen Bauer (spé. Indoor)",  level: 2, cost: 1100,
    surface: "Indoor",
    bonus: { trainGain: 0.05, surfaceBoost: 5 },
    malus: { surfaceMalus: 2 } },

  // ─── KINÉS (3 niveaux) ──────────────────────────────────────────────
  { id: "kine_basic",    role: "Kiné", name: "Sophie Laurent", level: 1, cost: 250,
    bonus: { recovery: 3 },
    malus: {} },
  { id: "kine_mid",      role: "Kiné", name: "Thomas Berger",  level: 2, cost: 700,
    bonus: { recovery: 6 },
    malus: { happinessDrain: 1 } },
  { id: "kine_elite",    role: "Kiné", name: "Dr. Moreno",     level: 3, cost: 1800,
    bonus: { recovery: 10, injuryProtect: 0.10 },
    malus: { happinessDrain: 2 } },

  // ─── PRÉPARATEURS MENTAUX (2 niveaux) ───────────────────────────────
  { id: "mental_basic",  role: "Préparateur mental", name: "Julien Remy",  level: 1, cost: 250,
    bonus: { matchMental: 3 },
    malus: {} },
  { id: "mental_elite",  role: "Préparateur mental", name: "Dr. Fischer",  level: 3, cost: 1400,
    bonus: { matchMental: 7 },
    malus: { happinessDrain: 2 } },

  // ─── PRÉPARATEURS PHYSIQUES (3 niveaux) ─────────────────────────────
  { id: "fitness_basic", role: "Préparateur physique", name: "Alex Tomas",  level: 1, cost: 300,
    bonus: { matchStamina: 2 },
    malus: {} },
  { id: "fitness_mid",   role: "Préparateur physique", name: "Lars Olsen",  level: 2, cost: 800,
    bonus: { matchStamina: 4, energyDrainCut: 0.08 },
    malus: { happinessDrain: 1 } },
  { id: "fitness_elite", role: "Préparateur physique", name: "Coach Iván",  level: 3, cost: 1800,
    bonus: { matchStamina: 7, energyDrainCut: 0.15 },
    malus: { happinessDrain: 2 } },

  // ─── NUTRITIONNISTES (2 niveaux) ────────────────────────────────────
  { id: "nutri_basic",   role: "Nutritionniste", name: "Lise Mercier",   level: 1, cost: 200,
    bonus: { recovery: 1, injuryProtect: 0.05 },
    malus: { happinessDrain: 1 } },
  { id: "nutri_elite",   role: "Nutritionniste", name: "Dr. Yamamoto",   level: 3, cost: 1200,
    bonus: { recovery: 3, injuryProtect: 0.15, matchStamina: 2 },
    malus: { happinessDrain: 2 } },

  // ─── AGENTS (2 niveaux) ─────────────────────────────────────────────
  { id: "agent_basic",   role: "Agent", name: "Sandra Klein",  level: 1, cost: 400,
    bonus: { sponsorPay: 0.08 },
    malus: {} },
  { id: "agent_elite",   role: "Agent", name: "Robert Sullivan", level: 3, cost: 1500,
    bonus: { sponsorPay: 0.18, sponsorTierBoost: 0.15 },
    malus: { happinessDrain: 1 } },
];
