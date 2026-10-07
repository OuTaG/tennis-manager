// Joueur humain : création, vie (bonheur, popularité, image), blessures, âge.
import { CITIES } from "../data/geo.js";
import { PLAYER_STYLES } from "../data/staff.js";
import { challengeActive } from "./challenges.js";
import { staffSurfaceModifier, sumStaffEffect } from "./staff.js";
import { random } from "./rng.js";

// favourite surface is drawn (weighted) from this affinity, giving each career a
// bit of identity ("je suis un spécialiste terre"). It grants a small in-match
// bonus on that surface (see getEffectiveStats) — kept modest to stay fair.
export const STYLE_SURFACE_AFFINITY = {
  puncher:      { "Dur": 3, "Indoor": 3, "Gazon": 2, "Terre battue": 1 },
  baseliner:    { "Terre battue": 4, "Dur": 2, "Indoor": 1, "Gazon": 1 },
  counter:      { "Terre battue": 3, "Dur": 2, "Gazon": 1, "Indoor": 2 },
  serve_volley: { "Gazon": 4, "Indoor": 3, "Dur": 1, "Terre battue": 1 },
  allcourt:     { "Dur": 2, "Terre battue": 2, "Gazon": 2, "Indoor": 2 },
};
export const SURFACE_BONUS = 3; // flat bonus applied to all match stats on favourite surface

export function pickFavoriteSurface(styleId) {
  const weights = STYLE_SURFACE_AFFINITY[styleId] || STYLE_SURFACE_AFFINITY.allcourt;
  const pool = [];
  for (const surf of Object.keys(weights)) {
    for (let i = 0; i < weights[surf]; i++) pool.push(surf);
  }
  return pool[Math.floor(random() * pool.length)] || "Dur";
}

// Difficulty factors derived from the chosen start city (1=easy … 5=hard).
// Level 3 is the neutral reference (current balance). Lower levels ease the
// curves slightly, higher levels harden them. Kept playable but noticeable.
export function difficultyFactors(player) {
  const d = (player && player.startDifficulty) || 3;
  const step = d - 3; // -2 … +2
  return {
    level: d,
    // Training gains: harder levels learn slower.
    trainMul: 1 - step * 0.10,        // d1:1.20  d3:1.00  d5:0.80
    // Mood/popularity/image: harder levels decay faster, gain a bit less.
    moodDecayMul: 1 + step * 0.18,    // d1:0.64  d3:1.00  d5:1.36 (faster drop)
    moodGainMul: 1 - step * 0.08,     // d1:1.16  d3:1.00  d5:0.84
    // Sponsor objectives: harder levels demand more and pay relatively less.
    sponsorTargetMul: 1 + step * 0.12, // d1:0.76  d3:1.00  d5:1.24 (tougher targets)
    sponsorRewardMul: 1 - step * 0.06, // slightly lower rewards when hard
  };
}

// Bonus de départ appliqué aux stats du joueur (pas aux joueurs IA) : le
// joueur commence un peu au-dessus du niveau de son classement initial.
export const START_STAT_BONUS = 4;

// Villes de départ : chacune a son circuit secondaire proche (ITF et
// Challengers presque chaque semaine) et ses surfaces. L'argent de départ
// compense l'écart de coût des voyages d'une première saison, estimé en
// enchaînant chaque semaine le petit tournoi le plus proche.
export const START_CITIES = [
  { city: "Paris",        region: "Europe",           money: 9000, desc: "Terre battue et indoor, circuit très dense" },
  { city: "Miami",        region: "Amérique du Nord", money: 8500, desc: "Dur toute l'année, terre au printemps" },
  { city: "Tokyo",        region: "Asie",             money: 6500, desc: "Dur et indoor, tournois rapprochés" },
  { city: "Melbourne",    region: "Océanie",          money: 9000, desc: "Dur et gazon, voyages plus longs" },
  { city: "Buenos Aires", region: "Amérique du Sud",  money: 7500, desc: "Terre battue, voyages courts" },
];
export function startMoney(city, gameOptions) {
  const base = START_CITIES.find(c => c.city === city)?.money ?? 8000;
  return (gameOptions || []).includes("low_budget") ? Math.round(base / 2) : base;
}

// difficulty : niveau choisi (1 Loisir … 5 Légende), voir engine/difficulty.js.
// favoriteSurface : surface de prédilection choisie à la création (sinon tirée selon le style).
export function createInitialPlayer(name, styleId, startCity, startNationality, avatar, difficulty, gameOptions = [], favoriteSurface = null) {
  const style = PLAYER_STYLES[styleId];
  const stats = {};
  Object.keys(style.base).forEach(k => {
    stats[k] = Math.max(35, Math.min(74, style.base[k] + START_STAT_BONUS - 4 + random() * 6 + (random() * 4 - 2)));
  });
  const city = startCity || "Paris";
  const nationality = startNationality || CITIES[city]?.country || "France";
  // Flag of the chosen nationality (the start city is only a starting place).
  const nationalityFlag = (Object.values(CITIES).find(c => c.country === nationality) || CITIES[city])?.flag || "";
  return {
    careerId: "c" + Date.now().toString(36) + random().toString(36).slice(2, 6),
    name, age: 18, nationality, nationalityFlag, styleId, avatar: avatar || null,
    // startDifficulty règle le jeu (progression, moral, sponsors) ; difficulty
    // et gameOptions fixent le multiplicateur de score.
    startDifficulty: difficulty || 3,
    difficulty: difficulty || 3,
    gameOptions: [...gameOptions],
    favoriteSurface: favoriteSurface || pickFavoriteSurface(styleId),
    location: city, startCity: city, week: 1, year: 2026,
    money: startMoney(city, gameOptions), energy: 100,
    atpPointsLog: [], // carrière ATP démarrée de zéro : aucun point au départ
    stats, staff: [],
    matchHistory: [], careerWins: 0, careerLosses: 0, titlesWon: 0, titlesByTier: {},
    weeklyExpenses: 80, enrollment: null,
    playedThisWeek: [], // tournament IDs already played this week (reset on week advance)
    totalEarnings: 0,   // lifetime earnings (Finance tab)
    totalSpent: 0,      // lifetime spending (Finance tab)
    weeksAtAge: 0,      // weeks elapsed at current age, +1 year when hits 52
    weeklyAgeOffset: 0, // accumulated stat decline from age this week (compensated by train/tournaments)
    // Injury system: { severity, weeksRemaining, statPenalty, canPlay, label }
    injury: null,
    // Sponsors: active contracts + pending offers
    sponsors: [],        // [{ id, brand, weeklyPay, titleBonus, durationWeeks, weeksLeft, tier }]
    sponsorOffers: [],   // pending offers awaiting accept/decline
    sponsorRevenue: 0,   // lifetime sponsor income
    // Wildcards: pending offers from tournaments
    wildcardOffers: [],  // [{ tournamentId, expiresWeek, expiresYear }]
    wildcardsUsed: [],   // tournament IDs accepted via WC (for stats)
    // History snapshot for graphs (weekly)
    history: [],         // [{ week, year, points, ranking, money, stats }]
    // Season-end recap data
    seasonStats: { wins: 0, losses: 0, titles: 0, earnings: 0, year: 2026 },
    seasonBigWins: 0,    // wins vs top-50 this season (for sponsor objectives)
    careerBigWins: 0,    // lifetime wins vs top-50 (for sponsor objective baselines)
    careerObjectivesMet: 0, // lifetime sponsor objectives achieved (legacy score)
    careerSeasons: [],   // archived seasonStats at end of each season
    pendingSeasonRecap: null,
    trophies: [],        // unlocked trophy IDs (Hall of Fame)
    seenHelp: [],        // pages dont l'aide a déjà été montrée automatiquement
    claimedTrophies: [], // unlocked trophy IDs whose cash reward has been claimed
    unseenTrophies: 0,   // number of trophies unlocked but not yet seen in HoF
    viewedAtpPlayers: [], // IDs of ATP players whose detail card has been opened
    // Life stats (0-100). Affect gameplay: see applyLifeStatsModifier.
    happiness: 70,
    popularity: 20,
    image: 60,
    lastLifeActivityWeek: 0, // week of last leisure activity (for cooldown logic)
    activityCooldowns: {},   // { [activityId]: absoluteWeekWhenUsed } — absoluteWeek = year*52 + week
    lifeActivitiesThisWeek: 0, // count of activities done in current week (max 2)
    lifeActivitiesWeekKey: 0,  // absoluteWeek when counter was last reset
    // Rivalries: tracks repeated duels with the same opponent.
    // [{ name, wins, losses, lastYear }]
    rivalries: [],
    pendingPressConference: null, // set when a press conference should be shown
  };
}
// All three life stats (happiness, popularity, image) range 0-100.
export function clampLife(v) { return Math.max(0, Math.min(100, v)); }
// ─── PLAFOND DE NOTORIÉTÉ ────────────────────────────────────────────────────
// La popularité et l'image dépendent du niveau sportif : un 120e mondial ne
// peut pas être aussi connu qu'un top 10. Le plafond suit le classement
// (dernier relevé hebdomadaire). Les gains ralentissent à l'approche du
// plafond et s'arrêtent au-delà ; chaque semaine, une valeur au-dessus du
// plafond redescend progressivement.
export const FAME_CAP_TABLE = [[1, 100], [10, 92], [30, 84], [100, 70], [200, 58], [500, 42], [1201, 30]];
export function lifeCaps(player) {
  const last = (player.history || [])[(player.history || []).length - 1];
  const rank = last && (last.points || 0) > 0 ? (last.ranking || 1201) : 1201;
  let pop = 30;
  for (let i = 0; i < FAME_CAP_TABLE.length - 1; i++) {
    const [r1, c1] = FAME_CAP_TABLE[i], [r2, c2] = FAME_CAP_TABLE[i + 1];
    if (rank <= r2) {
      const t = (Math.log(Math.max(rank, r1)) - Math.log(r1)) / (Math.log(r2) - Math.log(r1));
      pop = c1 + (c2 - c1) * t;
      break;
    }
  }
  // Bonus de notoriété propre à certains défis (ancienne star, prodige…).
  const bonus = (player.challenge && player.challenge.capBonus) || 0;
  pop = Math.min(100, Math.round(pop + bonus));
  // L'image (réputation, comportement) se construit un peu plus librement.
  // Plancher de 65 : un joueur inconnu peut tout de même avoir bonne réputation.
  return { popularity: pop, image: Math.min(100, Math.max(65, pop + 15)), rank };
}

export function adjustLife(player, deltas) {
  const f = difficultyFactors(player);
  const caps = lifeCaps(player);
  // Positive deltas scaled by moodGainMul (less gain when hard), negative deltas
  // scaled by moodDecayMul (faster drop when hard).
  const scale = (v) => v == null ? 0 : Math.round(v >= 0 ? v * f.moodGainMul : v * f.moodDecayMul);
  // Gains de popularité / image freinés à l'approche du plafond.
  const capped = (cur, v, cap) => {
    if (!v || v < 0) return scale(v);
    const room = cap - cur;
    if (room <= 0) return 0;
    return Math.min(room, Math.round(v * f.moodGainMul * Math.min(1, room / 15)));
  };
  const pop = player.popularity || 20, img = player.image || 60;
  return {
    ...player,
    happiness: clampLife((player.happiness || 70) + scale(deltas.happiness)),
    popularity: clampLife(pop + capped(pop, deltas.popularity, caps.popularity)),
    image: clampLife(img + capped(img, deltas.image, caps.image)),
  };
}
// Returns small additive stat modifiers based on life stats.
// Light effect: every 20pts above/below 50 = ±1 on relevant stats.
// Severe effect: image < 20 or happiness < 15 triggers larger penalties.
export function getLifeStatsModifier(player, matchCtx) {
  const h = player.happiness ?? 70;
  const pop = player.popularity ?? 20;
  const i = player.image ?? 60;
  const mod = { mental: 0, serve: 0, forehand: 0, backhand: 0, stamina: 0, net: 0 };

  // Les stats de vie ne donnent PAS de bonus aux stats de match : les NPC
  // n'ont pas d'équivalent, ce serait un avantage gratuit du joueur humain.
  // On garde uniquement de légers malus aux extrêmes (état d'esprit
  // vraiment dégradé), pour qu'il y ait quand même un coût à négliger
  // sa vie hors-court — mais sans déséquilibrer les matchs.

  // HAPPINESS — malus uniquement si vraiment bas.
  if (h < 15) { mod.mental -= 3; }
  else if (h < 25) { mod.mental -= 2; }
  else if (h < 40) { mod.mental -= 1; }

  // IMAGE — malus uniquement si vraiment basse.
  if (i < 20) { mod.mental -= 2; }
  else if (i < 35) { mod.mental -= 1; }

  // POPULARITY — soutien du public à domicile. Petit boost contextuel
  // qui se justifie car les NPC eux-mêmes peuvent jouer "à domicile"
  // dans leur pays. C'est donc une mécanique symétrique appliquée
  // au joueur qui joue chez lui. On reste modeste.
  const tournCountry = matchCtx?.tournamentCity ? CITIES[matchCtx.tournamentCity]?.country : null;
  const isAtHome = tournCountry && tournCountry === player.nationality;
  if (isAtHome) {
    if (pop >= 70) { mod.mental += 1; }
    if (pop >= 90) { mod.serve += 1; }
  }

  return mod;
}

// Compute life-stat deltas from a match result.
// Wins boost happiness/pop/image; big wins boost more. Losses cost some, but losing
// to a much weaker opponent costs image (people noticed). Titles give big boost.
export function computeMatchLifeDeltas(won, opponentRank, isTitleWin, playerRank) {
  const d = { happiness: 0, popularity: 0, image: 0 };
  const oppR = opponentRank || 500;
  const myR = playerRank || 500;
  if (won) {
    d.happiness = 2;
    // Popularity & image hard to build: most wins give nothing,
    // only notable wins move the needle.
    if (oppR < myR - 50) { d.popularity += 1; d.image += 1; d.happiness += 2; }
    if (oppR <= 10) { d.popularity += 2; d.image += 1; d.happiness += 3; }
    else if (oppR <= 30) { d.popularity += 1; }
    if (isTitleWin) { d.happiness += 8; d.popularity += 2; d.image += 2; }
  } else {
    d.happiness = -2;
    // Lost to much weaker opponent: image takes a real hit (specific event)
    if (oppR > myR + 100) { d.image -= 2; d.popularity -= 1; d.happiness -= 2; }
    if (oppR <= 10) { d.happiness += 1; }
    // Défi « Sous pression » : chaque défaite pèse double.
    if (challengeActive("pression")) d.happiness *= 2;
  }
  return d;
}

export function totalAtpPoints(log) { return log.reduce((a, e) => a + e.points, 0); }

// ─── INJURY SYSTEM ────────────────────────────────────────────────────────────
// Severities: minor (1-3 weeks, light penalty) / moderate (4-8 weeks, real penalty) /
// severe (8-16 weeks, cannot play). Triggered with low probability when player picks
// a risky dilemma option that has riskInjury set.
export const INJURY_TYPES = [
  // icon : nom d'un émoji BD (src/ui/bdEmoji.jsx).
  { part: "mollet", icon: "leg" },
  { part: "épaule", icon: "muscle" },
  { part: "poignet", icon: "hand" },
  { part: "genou", icon: "knee" },
  { part: "dos", icon: "back" },
  { part: "cheville", icon: "foot" },
];

export function rollInjury() {
  // Severity roll (when injury is confirmed by riskInjury check)
  // 60% minor, 30% moderate, 10% severe
  const r = random();
  const part = INJURY_TYPES[Math.floor(random() * INJURY_TYPES.length)];
  if (r < 0.60) {
    return {
      severity: "minor",
      label: "Légère gêne au " + part.part,
      icon: part.icon,
      weeksRemaining: 1 + Math.floor(random() * 3), // 1-3
      statPenalty: 0.05,
      canPlay: true,
    };
  }
  if (r < 0.90) {
    return {
      severity: "moderate",
      label: "Blessure au " + part.part,
      icon: part.icon,
      weeksRemaining: 4 + Math.floor(random() * 5), // 4-8
      statPenalty: 0.15,
      canPlay: true,
    };
  }
  return {
    severity: "severe",
    label: "Blessure sévère au " + part.part,
    icon: part.icon,
    weeksRemaining: 8 + Math.floor(random() * 9), // 8-16
    statPenalty: 0.30,
    canPlay: false,
  };
}

// Apply injury penalty to stats (used in matches and for display)
export function getEffectiveStats(player, matchCtx) {
  // Start from base stats (or injury-penalized stats)
  let base;
  if (!player.injury || player.injury.statPenalty <= 0) {
    base = { ...player.stats };
  } else {
    const pen = 1 - player.injury.statPenalty;
    base = {};
    for (const k of Object.keys(player.stats)) {
      base[k] = Math.max(20, player.stats[k] * pen);
    }
  }
  // Home-nation bonus: +3 on mental & serve when playing a tournament in the
  // player's country against an opponent of a different nationality.
  if (matchCtx && matchCtx.tournamentCity && matchCtx.opponentCountry) {
    const tournCountry = CITIES[matchCtx.tournamentCity]?.country;
    if (tournCountry && tournCountry === player.nationality && matchCtx.opponentCountry !== player.nationality) {
      if (base.mental !== undefined) base.mental = Math.min(99, base.mental + 3);
      if (base.serve !== undefined) base.serve = Math.min(99, base.serve + 3);
    }
  }
  // Life stats modifier (happiness, popularity, image)
  const lifeMod = getLifeStatsModifier(player, matchCtx);
  for (const k of Object.keys(lifeMod)) {
    if (base[k] !== undefined && lifeMod[k] !== 0) {
      base[k] = Math.max(20, Math.min(99, base[k] + lifeMod[k]));
    }
  }
  // Staff bonuses applied in match (mental, stamina, surface specialists)
  if (player.staff && player.staff.length > 0) {
    const mentalBonus = sumStaffEffect(player.staff, "matchMental");
    const staminaBonus = sumStaffEffect(player.staff, "matchStamina");
    if (base.mental !== undefined && mentalBonus !== 0) {
      base.mental = Math.max(20, Math.min(99, base.mental + mentalBonus));
    }
    if (base.stamina !== undefined && staminaBonus !== 0) {
      base.stamina = Math.max(20, Math.min(99, base.stamina + staminaBonus));
    }
    if (matchCtx && matchCtx.surface) {
      const surfMod = staffSurfaceModifier(player.staff, matchCtx.surface);
      if (surfMod !== 0) {
        for (const k of ["serve", "forehand", "backhand", "stamina", "mental", "net"]) {
          if (base[k] !== undefined) base[k] = Math.max(20, Math.min(99, base[k] + surfMod));
        }
      }
    }
  }
  // Favourite surface bonus: small flat boost to all match stats when playing on
  // the player's preferred surface. Gives each career a recognisable identity.
  if (matchCtx && matchCtx.surface && player.favoriteSurface && matchCtx.surface === player.favoriteSurface) {
    for (const k of ["serve", "forehand", "backhand", "stamina", "mental", "net"]) {
      if (base[k] !== undefined) base[k] = Math.max(20, Math.min(99, base[k] + SURFACE_BONUS));
    }
  }
  return base;
}


// ── AGE MECHANICS ─────────────────────────────────────────────────────────
// <=28 : full progression
// 29-31 : slowed progression (training gains x0.5)
// 32-39 : decline (-0.05 to -0.15 per week per stat, compensable by training/tournaments)
// 40+ : forced retirement
export const RETIREMENT_AGE = 40;
// Énergie récupérée entre deux matchs d'un même tournoi : 10 (endurance
// 50 ou moins) à 20 (endurance 90 et plus).
export function betweenMatchRecovery(stamina) {
  return Math.round(Math.max(10, Math.min(20, 10 + ((stamina ?? 50) - 50) / 4)));
}

export function ageTrainingMultiplier(age) {
  if (age <= 28) return 1.0;
  if (age <= 31) return 0.5;
  return 0.25; // still some gain possible to compensate decline
}
export function weeklyAgeDecline(age) {
  if (age < 32) return 0;
  // Linear from 0.05 at 32 to 0.15 at 39
  const t = Math.min(1, (age - 32) / 7);
  return 0.05 + t * 0.10;
}
export function applyWeeklyAgeDecline(stats, age) {
  const decline = weeklyAgeDecline(age);
  if (decline === 0) return stats;
  const next = { ...stats };
  for (const k of Object.keys(next)) {
    next[k] = Math.max(20, next[k] - decline);
  }
  return next;
}

export function getPlayerRanking(playerPoints, atpDb) {
  // Binary search: atpDb is sorted DESC by points
  let lo = 0, hi = atpDb.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (atpDb[mid].points > playerPoints) lo = mid + 1;
    else hi = mid;
  }
  return lo + 1;
}
