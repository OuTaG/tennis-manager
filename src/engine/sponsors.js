// Sponsors : objectifs, offres, catégories, wildcards.
import { difficultyFactors } from "./player.js";
import { random } from "./rng.js";
import { fmtMoney } from "./text.js";

// ─── SPONSOR OBJECTIVES ───────────────────────────────────────────────────────
// Each sponsor contract carries a performance objective evaluated over a season
// window. Meeting it pays a bonus; failing it costs a penalty and breaks the
// contract early. Objectives are scaled to the player's ranking at signing.
// objective: { type, target, label }
// On the contract: objectiveReward (money), objectivePenalty (money), and the
// evaluation deadline (objectiveYear/objectiveWeek = next negotiation phase).
export const SPONSOR_OBJECTIVE_TARGETS = (ranking) => {
  if (ranking <= 10)      return { rank: Math.max(1, ranking - 1), titles: 2, wins: 22, bigwins: 4 };
  if (ranking <= 30)      return { rank: 12,  titles: 1, wins: 20, bigwins: 3 };
  if (ranking <= 75)      return { rank: 32,  titles: 1, wins: 18, bigwins: 2 };
  if (ranking <= 150)     return { rank: 78,  titles: 1, wins: 15, bigwins: 1 };
  if (ranking <= 350)     return { rank: 155, titles: 1, wins: 12, bigwins: 1 };
  return { rank: 360, titles: 1, wins: 10, bigwins: 1 };
};

// Build the THREE objective levels (easy / medium / hard) for an offer. The
// objective type varies per offer; each level scales the target and the
// reward/penalty multipliers. Returns an array of 3 level objects:
// { level, type, target, label, rewardMul, penaltyMul }
export function buildSponsorObjectiveLevels(ranking, year, seed) {
  const t = SPONSOR_OBJECTIVE_TARGETS(ranking);
  // Choose the objective TYPE for this offer (deterministic per offer via seed).
  const types = ["rank", "titles", (year % 2 === 0) ? "wins" : "bigwins"];
  const type = types[Math.abs(seed) % types.length];

  const mk = (level, target, rewardMul, penaltyMul) => {
    let label;
    if (type === "rank") label = "Finir dans le top " + target;
    else if (type === "titles") label = "Remporter " + target + " titre" + (target > 1 ? "s" : "");
    else if (type === "wins") label = "Gagner " + target + " matchs";
    else label = "Battre " + target + " joueur" + (target > 1 ? "s" : "") + " du top 50";
    return { level, type, target, label, rewardMul, penaltyMul };
  };

  // Targets per level. "rank" gets harder as the number shrinks; others grow.
  if (type === "rank") {
    return [
      mk("easy",   Math.round(t.rank * 1.6),         0.6, 0.4),
      mk("medium", t.rank,                            1.0, 0.8),
      mk("hard",   Math.max(1, Math.round(t.rank * 0.55)), 1.8, 1.5),
    ];
  }
  const base = type === "titles" ? t.titles : type === "wins" ? t.wins : t.bigwins;
  return [
    mk("easy",   Math.max(1, Math.round(base * 0.6)),  0.6, 0.4),
    mk("medium", Math.max(1, base),                     1.0, 0.8),
    mk("hard",   Math.round(base * 1.6) || 2,           1.8, 1.5),
  ];
}

// Evaluate a single objective given the season counters captured for its window.
// We snapshot the player's season counters at signing and compare deltas at the
// deadline. progress = { titles, wins, bigwins } deltas; ranking = current rank.
export function evaluateSponsorObjective(objective, baseline, current, ranking) {
  if (!objective) return true;
  if (objective.type === "rank") return ranking <= objective.target;
  if (objective.type === "titles") return (current.titles - baseline.titles) >= objective.target;
  if (objective.type === "wins") return (current.wins - baseline.wins) >= objective.target;
  if (objective.type === "bigwins") return (current.bigwins - baseline.bigwins) >= objective.target;
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
  const seed = picked.name.length * 7 + Math.floor(weeklyPay);
  const df = difficultyFactors({ startDifficulty: difficulty || 3 });
  let objectiveLevels = buildSponsorObjectiveLevels(ranking, year || 2026, seed);
  // Difficulty makes sponsors more demanding: tougher targets, slightly lower reward.
  if (df.sponsorTargetMul !== 1) {
    objectiveLevels = objectiveLevels.map(l => {
      let target = l.target;
      if (l.type === "rank") target = Math.max(1, Math.round(l.target / df.sponsorTargetMul)); // lower rank = harder
      else target = Math.max(1, Math.round(l.target * df.sponsorTargetMul));                    // higher count = harder
      // Rebuild label with the new target.
      let label;
      if (l.type === "rank") label = "Finir dans le top " + target;
      else if (l.type === "titles") label = "Remporter " + target + " titre" + (target > 1 ? "s" : "");
      else if (l.type === "wins") label = "Gagner " + target + " matchs";
      else label = "Battre " + target + " joueur" + (target > 1 ? "s" : "") + " du top 50";
      return { ...l, target, label };
    });
  }
  // The objective covers the WHOLE contract. 52-week contracts get tougher
  // targets (a bit more than one 26-week window) and a bigger reward.
  const longContract = durationWeeks === 52;
  if (longContract) {
    objectiveLevels = objectiveLevels.map(l => {
      let target = l.target;
      if (l.type === "rank") target = Math.max(1, Math.round(l.target * 0.85));
      else if (l.type === "titles") target = Math.max(l.target + 1, Math.round(l.target * 1.6));
      else target = Math.max(l.target + 1, Math.round(l.target * 1.8));
      let label;
      if (l.type === "rank") label = "Finir dans le top " + target;
      else if (l.type === "titles") label = "Remporter " + target + " titre" + (target > 1 ? "s" : "");
      else if (l.type === "wins") label = "Gagner " + target + " matchs";
      else label = "Battre " + target + " joueur" + (target > 1 ? "s" : "") + " du top 50";
      return { ...l, target, label };
    });
  }
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
    const cur = { titles: player.titlesWon || 0, wins: player.careerWins || 0, bigwins: player.careerBigWins || 0 };
    const met = evaluateSponsorObjective(sponsor.objective, sponsor.objectiveBaseline || { titles: 0, wins: 0, bigwins: 0 }, cur, ranking ?? 9999);
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
