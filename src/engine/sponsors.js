// Sponsors : objectifs, offres, catégories, wildcards.
import { difficultyFactors } from "./player.js";
import { random } from "./rng.js";
import { fmtMoney } from "./text.js";

// ─── SPONSOR OBJECTIVES ───────────────────────────────────────────────────────
// Each sponsor contract carries a performance objective evaluated over the
// whole contract. Meeting it pays a bonus; failing it costs a penalty.
// Objectives are scaled to the player's ranking at signing and to the contract
// length (explicit 26- and 52-week tables, calibrated on a "moderate" career
// in Pro difficulty).
// objective: { type, target, label, level, threshold? }
//   threshold (bigwins only): opponents must be ranked inside this top N.
//   Contracts signed before thresholds existed have none → top 50.
// On the contract: objectiveReward (money), objectivePenalty (money), and the
// evaluation deadline (objectiveYear/objectiveWeek = next negotiation phase).

// Ranking brackets: ≤10 / ≤30 / ≤75 / ≤150 / ≤350 / >350.
export const sponsorObjectiveBracket = (r) => r <= 10 ? 0 : r <= 30 ? 1 : r <= 75 ? 2 : r <= 150 ? 3 : r <= 350 ? 4 : 5;

// "Medium" target per bracket and contract length (weeks). null = no such
// objective for that bracket (titles over 26 weeks past #350 → wins instead).
export const SPONSOR_OBJECTIVE_TARGETS = {
  wins:    { 26: [40, 32, 24, 22, 20, 22], 52: [85, 70, 52, 50, 48, 65] },
  titles:  { 26: [6, 4, 2, 2, 1, null],    52: [12, 9, 5, 4, 3, 3] },
  bigwins: { 26: [8, 6, 3, 4, 3, 2],       52: [16, 12, 6, 9, 6, 5] },
};
// "Prestige wins" count victories against opponents inside this top N,
// depending on the player's own bracket.
export const SPONSOR_BIGWIN_THRESHOLDS = [50, 50, 50, 100, 200, 400];
// Ranking objective: target = current rank × factor (easy / medium / hard),
// with a gentler scale past #350. Bounded to 1–1200.
export const SPONSOR_RANK_FACTORS = {
  26: { base: [1.1, 0.85, 0.6], low: [1.0, 0.95, 0.8] },
  52: { base: [0.9, 0.6, 0.35], low: [0.6, 0.4, 0.25] },
};
// Per level: target multiplier (counts) and reward / penalty multipliers.
export const SPONSOR_OBJECTIVE_LEVELS = [
  { level: "easy",   targetMul: 0.6, rewardMul: 0.6, penaltyMul: 0.4 },
  { level: "medium", targetMul: 1.0, rewardMul: 1.0, penaltyMul: 0.8 },
  { level: "hard",   targetMul: 1.3, rewardMul: 2.0, penaltyMul: 1.2 },
];
export const SPONSOR_OBJECTIVE_TYPES = ["rank", "titles", "wins", "bigwins"];

export const sponsorBigWinThreshold = (ranking) => SPONSOR_BIGWIN_THRESHOLDS[sponsorObjectiveBracket(ranking)];

export function sponsorObjectiveLabel(type, target, threshold) {
  if (type === "rank") return "Finir dans le top " + target;
  if (type === "titles") return "Remporter " + target + " titre" + (target > 1 ? "s" : "");
  if (type === "wins") return "Gagner " + target + " matchs";
  return "Battre " + target + " joueur" + (target > 1 ? "s" : "") + " du top " + (threshold || 50);
}

// Lifetime counters used by objectives (baselines are snapshots of these).
// bw100/bw200/bw400 = wins against the top 100/200/400; bigwins = top 50.
export function sponsorObjectiveCounters(p) {
  return {
    titles: p?.titlesWon || 0, wins: p?.careerWins || 0, bigwins: p?.careerBigWins || 0,
    bw100: p?.careerWinsTop100 || 0, bw200: p?.careerWinsTop200 || 0, bw400: p?.careerWinsTop400 || 0,
  };
}
const bigWinsKey = (threshold) => (!threshold || threshold <= 50) ? "bigwins" : "bw" + threshold;

// Progress (count since signing) of a counting objective; null for "rank".
export function sponsorObjectiveProgress(objective, baseline, current) {
  if (!objective || objective.type === "rank") return null;
  const key = objective.type === "bigwins" ? bigWinsKey(objective.threshold) : objective.type;
  return ((current || {})[key] || 0) - ((baseline || {})[key] || 0);
}

// Build the THREE objective levels (easy / medium / hard) for an offer.
// The type is drawn among the four (deterministic per offer via seed);
// targetMul = difficulty factor (higher = tougher). Strict hierarchy:
// easy < medium < hard in demand. Returns
// [{ level, type, target, label, rewardMul, penaltyMul, threshold? }] ×3.
export function buildSponsorObjectiveLevels(ranking, durationWeeks, seed, targetMul = 1) {
  const b = sponsorObjectiveBracket(ranking);
  const D = durationWeeks >= 52 ? 52 : 26;
  let type = SPONSOR_OBJECTIVE_TYPES[Math.abs(seed) % SPONSOR_OBJECTIVE_TYPES.length];
  if (type !== "rank" && SPONSOR_OBJECTIVE_TARGETS[type][D][b] == null) type = "wins";
  const threshold = type === "bigwins" ? SPONSOR_BIGWIN_THRESHOLDS[b] : undefined;
  let t;
  if (type === "rank") {
    const f = SPONSOR_RANK_FACTORS[D][b === 5 ? "low" : "base"];
    t = f.map(x => Math.max(1, Math.min(1200, Math.round(ranking * x / targetMul))));
    if (t[1] >= t[0]) t[1] = Math.max(1, t[0] - 1);
    if (t[2] >= t[1]) t[2] = Math.max(1, t[1] - 1);
    // Near #1 the floor can collapse levels: relax the easier ones instead.
    if (t[1] <= t[2]) t[1] = t[2] + 1;
    if (t[0] <= t[1]) t[0] = t[1] + 1;
  } else {
    const med = SPONSOR_OBJECTIVE_TARGETS[type][D][b] * targetMul;
    t = SPONSOR_OBJECTIVE_LEVELS.map(l => Math.max(1, Math.round(med * l.targetMul)));
    if (t[1] <= t[0]) t[1] = t[0] + 1;
    if (t[2] <= t[1]) t[2] = t[1] + 1;
  }
  return SPONSOR_OBJECTIVE_LEVELS.map((l, i) => ({
    level: l.level, type, target: t[i], label: sponsorObjectiveLabel(type, t[i], threshold),
    rewardMul: l.rewardMul, penaltyMul: l.penaltyMul,
    ...(threshold ? { threshold } : {}),
  }));
}

// Evaluate a single objective given the lifetime counters snapshotted at
// signing (baseline) and now (current, see sponsorObjectiveCounters).
export function evaluateSponsorObjective(objective, baseline, current, ranking) {
  if (!objective) return true;
  if (objective.type === "rank") return ranking <= objective.target;
  if (["titles", "wins", "bigwins"].includes(objective.type)) return sponsorObjectiveProgress(objective, baseline, current) >= objective.target;
  return true;
}


// Sponsors offer weekly pay + bonus on titles. Tier is gated by player ranking and
// recent performance. Offers are generated periodically and the player negotiates
// (accept / decline) manually.
// Sponsor brands, each tagged with a category:
// - "equipment": equipment makers (racquets, shoes, apparel) — max 1 active at a time
// - "other": everything else (luxury, automotive, banks, drinks…) — max 2 active
export const SPONSOR_BRANDS = {
  premium: [
    { name: "Apex",      cat: "equipment" },
    { name: "Strider",   cat: "equipment" },
    { name: "Crocodile", cat: "equipment" },
    { name: "Chronos",   cat: "other" },
    { name: "Sterling Motors", cat: "other" },
  ],
  high: [
    { name: "Volt",        cat: "equipment" },
    { name: "Topspin",     cat: "equipment" },
    { name: "Vanguard",    cat: "equipment" },
    { name: "Méridien Banque", cat: "other" },
    { name: "Lion Auto",   cat: "other" },
  ],
  mid: [
    { name: "Kinetic",        cat: "equipment" },
    { name: "Hane",           cat: "equipment" },
    { name: "Fibrenet",       cat: "equipment" },
    { name: "Galo Sport",     cat: "equipment" },
    { name: "Losange Auto",   cat: "other" },
  ],
  low: [
    { name: "Bound",      cat: "equipment" },
    { name: "Royal",      cat: "equipment" },
    { name: "Pentathlon", cat: "equipment" },
    { name: "Sorteo",     cat: "equipment" },
    { name: "Jomar",      cat: "equipment" },
  ],
  entry: [
    { name: "Sponsor local",     cat: "other" },
    { name: "Magasin de sport",   cat: "equipment" },
    { name: "Club partenaire",    cat: "other" },
    { name: "Boulangerie du coin", cat: "other" },
    { name: "Garage municipal",   cat: "other" },
    { name: "Cordage Express",    cat: "equipment" },
    { name: "Assurance locale",   cat: "other" },
    { name: "Énergie Verte",      cat: "other" },
    { name: "Textile Pro",        cat: "equipment" },
  ],
};

// Caps per category
export const SPONSOR_CAPS = { equipment: 1, other: 2 };

export function getSponsorTierForRanking(ranking, recentTitlePerf, image) {
  // recentTitlePerf: bonus from recent good results (0-3)
  // image: 0-100. Above 75 = decal tier favorablement ; below 35 = tier baissé.
  let imageShift = 0;
  if (image !== undefined) {
    if (image >= 90) imageShift = -60;       // crossover deux paliers vers le haut
    else if (image >= 80) imageShift = -30;  // un palier vers le haut
    else if (image >= 70) imageShift = -10;
    else if (image < 35) imageShift = 40;    // un palier vers le bas
    else if (image < 20) imageShift = 100;   // forte chute
  }
  const effective = ranking - recentTitlePerf * 30 + imageShift;
  if (effective <= 10) return "premium";
  if (effective <= 40) return "high";
  if (effective <= 100) return "mid";
  if (effective <= 250) return "low";
  return "entry";
}

export function generateSponsorOffer(ranking, recentTitlePerf, existingBrands, image, engagedCats, year, difficulty, forceCat, tierBoost) {
  let tier = getSponsorTierForRanking(ranking, recentTitlePerf, image);
  // Agent "sponsorTierBoost": chance that the offer comes from the tier above.
  const TIER_ORDER = ["entry", "low", "mid", "high", "premium"];
  if (tierBoost > 0 && random() < tierBoost) {
    const i = TIER_ORDER.indexOf(tier);
    if (i >= 0 && i < TIER_ORDER.length - 1) tier = TIER_ORDER[i + 1];
  }
  const brands = SPONSOR_BRANDS[tier] || SPONSOR_BRANDS.entry;
  // Pick a brand not already engaged. If a category is forced, restrict the
  // pool to that category (used to guarantee equipment/other diversity).
  let available = brands.filter(b => !existingBrands.includes(b.name));
  if (forceCat) {
    const filtered = available.filter(b => b.cat === forceCat);
    if (filtered.length > 0) available = filtered;
  }
  if (available.length === 0) return null;

  // Weighted pick: favour the category that still has free slots under its cap,
  // so the player doesn't get flooded with equipment offers (there are more
  // equipment brands in each tier). engagedCats = { equipment: n, other: n }.
  const counts = engagedCats || {};
  const freeSlots = (cat) => Math.max(0, (SPONSOR_CAPS[cat] || 1) - (counts[cat] || 0));
  const catWeight = (cat) => {
    const free = freeSlots(cat);
    if (free <= 0) return 0.15;        // category full → rare (still possible as upgrade)
    return cat === "equipment" ? 1.0 : 1.8; // bias toward "other" to balance the pools
  };
  const weighted = [];
  for (const b of available) {
    const w = Math.max(1, Math.round(catWeight(b.cat) * 10));
    for (let i = 0; i < w; i++) weighted.push(b);
  }
  const picked = weighted.length > 0
    ? weighted[Math.floor(random() * weighted.length)]
    : available[Math.floor(random() * available.length)];

  // Pay scaling by tier
  const payByTier = {
    premium: { weekly: [800, 2500], title: [15000, 40000] },
    high:    { weekly: [300, 800],  title: [5000, 12000] },
    mid:     { weekly: [100, 350],  title: [1500, 4000] },
    low:     { weekly: [40, 150],   title: [400, 1200] },
    entry:   { weekly: [15, 60],    title: [80, 300] },
  };
  const r = payByTier[tier];
  // Image directly multiplies the offered amounts:
  // image ≥90 : ×1.4 ; 75-90 : ×1.15 ; 35-75 : ×1.0 ; 20-35 : ×0.7 ; <20 : ×0.5
  let imgMul = 1.0;
  if (image !== undefined) {
    if (image >= 90) imgMul = 1.4;
    else if (image >= 75) imgMul = 1.15;
    else if (image < 20) imgMul = 0.5;
    else if (image < 35) imgMul = 0.7;
  }
  const weeklyPay = Math.round((r.weekly[0] + random() * (r.weekly[1] - r.weekly[0])) * imgMul);
  const titleBonus = Math.round((r.title[0] + random() * (r.title[1] - r.title[0])) * imgMul);
  const durationWeeks = random() < 0.5 ? 26 : 52; // objective covers the whole contract

  // Three objective levels (easy/medium/hard) the player can choose during the
  // negotiation. The base reward/penalty scale by the chosen level's multipliers.
  // Targets come from the 26- or 52-week table (the objective covers the WHOLE
  // contract); difficulty makes sponsors more demanding (sponsorTargetMul).
  const seed = picked.name.length * 7 + Math.floor(weeklyPay);
  const df = difficultyFactors({ startDifficulty: difficulty || 3 });
  const objectiveLevels = buildSponsorObjectiveLevels(ranking, durationWeeks, seed, df.sponsorTargetMul);
  const longContract = durationWeeks === 52;
  const durMul = longContract ? 1.8 : 1;
  const baseReward = Math.round(weeklyPay * (10 + random() * 8) * df.sponsorRewardMul * durMul);   // ~10-18 weeks of pay (×1.8 over 52 weeks)
  const basePenalty = Math.round(weeklyPay * (5 + random() * 5) * (longContract ? 1.5 : 1));   // ~5-10 weeks of pay

  // Bargaining bounds. The better the player's ranking, the more the brand is
  // willing to push its offer up (you're worth more). Margin ranges from ~+20%
  // for an unranked player to ~+60% for a top player. The step is sized so the
  // player can realistically secure several raises within that margin.
  const rankMargin = ranking <= 10 ? 0.60 : ranking <= 30 ? 0.50 : ranking <= 100 ? 0.40 : ranking <= 300 ? 0.30 : 0.22;
  const maxWeeklyPay = Math.round(weeklyPay * (1 + rankMargin));
  const maxTitleBonus = Math.round(titleBonus * (1 + rankMargin + 0.05));
  // ~4 steps to reach the cap, so each "ask" makes visible progress.
  const negStepPay = Math.max(1, Math.round((maxWeeklyPay - weeklyPay) / 4));
  const negStepBonus = Math.max(1, Math.round((maxTitleBonus - titleBonus) / 4));
  const patience = 2 + (random() < 0.5 ? 1 : 0); // 2-3 over-the-limit pushes tolerated
  // ~15% of offers are flat "à prendre ou à laisser" — no negotiation room at
  // all. The player either signs as-is or walks. Adds variety and forces
  // tougher decisions on otherwise tempting tier deals.
  const nonNegotiable = random() < 0.15;

  return {
    id: "spon_" + random().toString(36).slice(2, 8),
    brand: picked.name, cat: picked.cat, tier,
    weeklyPay, titleBonus, durationWeeks, weeksLeft: durationWeeks,
    baseReward, basePenalty,
    objectiveLevels,
    // Negotiation params:
    openingWeeklyPay: weeklyPay, openingTitleBonus: titleBonus,
    maxWeeklyPay, maxTitleBonus, negStepPay, negStepBonus, patience,
    nonNegotiable,
  };
}

// Recent performance score 0-3 based on last few months results
// Wildcards : un « exploit » = victoire contre un joueur mieux noté que soi
// d'au moins WC_UPSET_GAP points (note moyenne au moment du match).
export const WC_UPSET_GAP = 3;
export function getWildcardPerfBonus(matchHistory) {
  const recent = (matchHistory || []).slice(0, 20);
  let titles = 0, upsets = 0;
  for (const m of recent) {
    if (m.won && m.round === "Vainqueur") titles++;
    if (m.won && m.oppRating != null && m.myRating != null && m.oppRating - m.myRating >= WC_UPSET_GAP) upsets++;
  }
  return Math.min(3, titles + Math.floor(upsets / 2));
}

// Critères de wildcard par catégorie : image minimale et exigence de résultats.
// Plus le tournoi est petit, plus c'est accessible (l'image démarre à 60).
//   minImage   : image publique minimale
//   maxRank    : classement à partir duquel on est éligible sans résultats récents
//                (au-delà, il faut au moins 1 point de bonus de performance)
export const WC_CRITERIA = {
  ITF:         { minImage: 45, maxRank: 900 },
  Challenger:  { minImage: 55, maxRank: 350 },
  ATP250:      { minImage: 62, maxRank: 150 },
  ATP500:      { minImage: 68, maxRank: 100 },
  Masters1000: { minImage: 72, maxRank: 110 },
  GrandSlam:   { minImage: 75, maxRank: 130 },
};

export function getRecentPerfBonus(matchHistory) {
  const recent = (matchHistory || []).slice(0, 20);
  let titleCount = 0;
  let bigWins = 0; // wins vs top 50
  for (const m of recent) {
    if (m.won && m.round === "Vainqueur") titleCount++;
    if (m.won && (m.opponentRank || 999) <= 50) bigWins++;
  }
  return Math.min(3, titleCount + Math.floor(bigWins / 3));
}

// ─── SPONSOR NEGOTIATION SCENE ──────────────────────────────────────────────
// Two-stage scene shown at the end of weeks 26 and 52:
//   1) A table of 4-9 offers.
//   2) Pick one → a sequential negotiation room where the player chooses the
//      objective difficulty (easy/medium/hard) and bargains the weekly pay /
//      title bonus. If demands exceed the brand's limits too many times, the
//      brand walks away and the offer is removed from the table.
// Si la catégorie de l'offre est déjà pleine, signer oblige à résilier un
// contrat actuel (indemnité de rupture + pénalité d'objectif s'il n'est pas atteint).
// Coût de résiliation d'un contrat : indemnité de rupture (26 semaines de
// salaire, plafonnée au restant dû) + pénalité d'objectif s'il n'est pas atteint.
export function sponsorCancelBreakdownFor(player, sponsor, ranking) {
  const rupture = Math.min(sponsor.weeklyPay * 26, sponsor.weeklyPay * (sponsor.weeksLeft || 0));
  let objective = 0;
  if (sponsor.objective && player) {
    const met = evaluateSponsorObjective(sponsor.objective, sponsor.objectiveBaseline || {}, sponsorObjectiveCounters(player), ranking ?? 9999);
    if (!met) objective = sponsor.objectivePenalty || 0;
  }
  return { rupture, objective, total: rupture + objective };
}

export function sponsorSlotWarning(player, offer, ranking) {
  const cat = offer.cat || "other";
  const same = (player.sponsors || []).filter(s => (s.cat || "other") === cat);
  const cap = SPONSOR_CAPS[cat] || 1;
  if (same.length < cap) return null;
  const costs = same.map(s => sponsorCancelBreakdownFor(player, s, ranking).total);
  const minCost = Math.min(...costs), maxCost = Math.max(...costs);
  const range = minCost === maxCost ? fmtMoney(minCost) : fmtMoney(minCost) + " à " + fmtMoney(maxCost);
  const catName = cat === "equipment" ? "équipementier" : "partenaires";
  return {
    short: "Emplacements " + catName + " pleins (" + same.length + "/" + cap + ") : signer impose de résilier un contrat (pénalité " + range + ").",
    long: "Vos emplacements " + catName + " sont déjà pleins (" + same.length + "/" + cap + "). Pour signer avec cette marque, vous devrez résilier " + (same.length > 1 ? "l'un de vos contrats actuels (" + same.map(x => x.brand).join(", ") + ")" : "votre contrat avec " + same[0].brand) + " et payer une pénalité de " + range + ".",
  };
}
