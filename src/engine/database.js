// Base des 1 200 joueurs IA : génération, note, choix d'adversaire.
import { NAMES_REAL_TOP50, NAMES_REAL_WTA_TOP50, NATIONALITIES, NAT_BY_CODE } from "../data/names.js";
import { PLAYER_STYLES } from "../data/staff.js";
import { isWTA } from "./circuit.js";
import { generateName, pickNationality } from "./names.js";
import { random } from "./rng.js";

// ─── ATP DATABASE ─────────────────────────────────────────────────────────────
// Note de niveau initiale selon le rang (index 0 = n°1). Courbe logarithmique
// dans le top 100 pour que les écarts de note donnent des probabilités de
// victoire réalistes avec le moteur service/retour :
//   n°1 vs n°2 ≈ 55 % · n°1 vs n°10 ≈ 80 % · n°10 vs n°50 ≈ 75-80 % · n°50 vs n°100 ≈ 60-65 %
// Les deux premiers (Sinterm / Alcázar) restent un cran au-dessus du reste.
export function atpRatingForRank(i) {
  const rank = i + 1;
  const jitter = amp => (random() * 2 - 1) * amp;
  if (rank === 1) return 90 + jitter(0.5);
  if (rank === 2) return 89 + jitter(0.5);
  if (rank < 10) return 86 - (rank - 3) * (3 / 7) + jitter(0.7);            // n°3 86 → n°10 83
  if (rank <= 100) return 83 - 4.56 * Math.log(rank / 10) + jitter(1);        // n°10 83 → n°100 72.5
  if (rank <= 250) return 72.5 - (rank - 100) * (8.75 / 150) + jitter(1.5);  // raccord vers l'ancienne courbe
  return Math.max(40, 70 - i * 0.025 + jitter(2));                           // inchangé au-delà du n°250
}

// roster (facultatif) : base personnalisée (voir engine/roster.js) — mêmes
// noms, nationalités et portraits à chaque carrière ; sinon base standard.
export function generateAtpDatabase(roster = null) {
  const players = [];
  // The NAMES_REAL_TOP50 ages are accurate as of 2024 — game starts in 2026,
  // so we offset all real players by 2 years.
  // Circuit WTA : top 50 féminin, âges déjà à jour pour 2026.
  const wta = isWTA();
  const REAL_AGE_OFFSET = wta ? 0 : 2;
  const TOP50 = wta ? NAMES_REAL_WTA_TOP50 : NAMES_REAL_TOP50;
  for (let i = 0; i < 50; i++) {
    const realPlayer = roster ? roster[i] : TOP50[i];
    const nat = roster ? roster[i].nat : (NAT_BY_CODE[realPlayer.code] || NATIONALITIES[0]);
    // Realistic points distribution: top 2 (Sinner/Alcaraz) much stronger than rest
    let points;
    if (wta) {
      // Répartition WTA : n°1 loin devant, peloton plus resserré derrière.
      if (i === 0) points = 10500 + Math.floor(random() * 200);
      else if (i === 1) points = 8000 + Math.floor(random() * 200);
      else if (i === 2) points = 6900 + Math.floor(random() * 150);
      else if (i === 3) points = 6200 + Math.floor(random() * 150);
      else if (i === 4) points = 5800 + Math.floor(random() * 100);
      else if (i < 10) points = Math.round(5200 - (i - 5) * 330 + random() * 100);
      else if (i < 20) points = Math.round(3400 - (i - 10) * 140 + random() * 80);
      else if (i < 30) points = Math.round(2000 - (i - 20) * 60 + random() * 80);
      else points = Math.round(1400 - (i - 30) * 25 + random() * 60);
    }
    else if (i === 0) points = 11830 + Math.floor(random() * 200);          // ~12000
    else if (i === 1) points = 8580 + Math.floor(random() * 200);      // ~8700
    else if (i === 2) points = 5100 + Math.floor(random() * 200);      // ~5200
    else if (i < 10) points = Math.round(4400 - (i - 3) * 250 + random() * 150);
    else if (i < 20) points = Math.round(2800 - (i - 10) * 80 + random() * 100);
    else if (i < 30) points = Math.round(2000 - (i - 20) * 60 + random() * 80);
    else points = Math.round(1400 - (i - 30) * 25 + random() * 60);
    // Note de niveau calée sur le moteur de match (voir atpRatingForRank).
    const ratingBase = atpRatingForRank(i);
    const age = (TOP50[i] && TOP50[i].age) + REAL_AGE_OFFSET;
    players.push(makeAtpPlayer(realPlayer.name, nat, points, ratingBase, undefined, age));
    if (roster && roster[i].avatar) players[players.length - 1].avatar = roster[i].avatar;
  }
  for (let i = 50; i < 1200; i++) {
    const nat = roster ? roster[i].nat : pickNationality();
    const name = roster ? roster[i].name : generateName(nat);
    let points;
    if (i < 100) points = Math.round(1100 - (i - 50) * 12 + random() * 50);
    else if (i < 250) points = Math.round(500 - (i - 100) * 1.8 + random() * 30);
    else if (i < 500) points = Math.round(230 - (i - 250) * 0.55 + random() * 20);
    else if (i < 800) points = Math.round(95 - (i - 500) * 0.18 + random() * 10);
    else points = Math.max(5, Math.round(40 - (i - 800) * 0.045 + random() * 6));
    const ratingBase = atpRatingForRank(i);
    players.push(makeAtpPlayer(name, nat, points, ratingBase));
    if (roster && roster[i].avatar) players[players.length - 1].avatar = roster[i].avatar;
  }
  return players;
}

export function makeAtpPlayer(name, nat, points, ratingBase, startYear, ageOverride) {
  const styleKeys = Object.keys(PLAYER_STYLES);
  const style = styleKeys[Math.floor(random() * styleKeys.length)];
  const styleBase = PLAYER_STYLES[style].base;
  const ratingShift = ratingBase - 50;
  const stats = {
    serve: Math.max(35, Math.min(99, styleBase.serve + ratingShift + (random() * 6 - 3))),
    forehand: Math.max(35, Math.min(99, styleBase.forehand + ratingShift + (random() * 6 - 3))),
    backhand: Math.max(35, Math.min(99, styleBase.backhand + ratingShift + (random() * 6 - 3))),
    stamina: Math.max(35, Math.min(99, styleBase.stamina + ratingShift + (random() * 6 - 3))),
    mental: Math.max(35, Math.min(99, styleBase.mental + ratingShift + (random() * 6 - 3))),
    net: Math.max(35, Math.min(99, styleBase.net + ratingShift + (random() * 6 - 3))),
  };
  // Age: if explicit override given (real players), use it. Otherwise distribute by rating.
  let age;
  if (ageOverride !== undefined) {
    age = ageOverride;
  } else if (ratingBase >= 80) {
    age = 23 + Math.floor(random() * 10); // 23-32
  } else if (ratingBase >= 70) {
    age = 21 + Math.floor(random() * 12); // 21-32
  } else {
    age = 18 + Math.floor(random() * 14); // 18-31
  }
  return {
    id: "atp_" + random().toString(36).slice(2, 9),
    name, nat, style, points, stats,
    age,
    weeksAtAge: Math.floor(random() * 52),
    seasonWins: 0, seasonLosses: 0,
    seasonEarnings: 0, seasonTitles: 0,
    recentResults: [],
    // _initial points represent results "earned" in the previous year.
    // They decay by 1/52 each week of the first year so the player slowly "drops" them
    // as if they were re-defending.
    // Stored as initialPoints (frozen original) so we can compute remaining = initial * (1 - weeksElapsed/52)
    initialPoints: points,
    pointsLog: [], // real tournament results accumulate here
  };
}

export function getRating(stats) {
  return Math.round(Object.values(stats).reduce((a, b) => a + b, 0) / Object.keys(stats).length);
}

// Identify weaknesses / strengths for opponent scouting
export function getPlayerProfile(stats) {
  const entries = Object.entries(stats);
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const labels = { serve: "Service", forehand: "Coup droit", backhand: "Revers", stamina: "Endurance", mental: "Mental", net: "Filet" };
  return {
    strength: { stat: sorted[0][0], label: labels[sorted[0][0]], value: sorted[0][1] },
    weakness: { stat: sorted[sorted.length - 1][0], label: labels[sorted[sorted.length - 1][0]], value: sorted[sorted.length - 1][1] },
  };
}

// Pick opponent based on tournament format + position in tournament
// roundCtx: { isQualifying: bool, roundIdx: number (0-based within phase), format }
export function pickOpponentForMatch(atpDb, tournament, roundCtx, playerRanking, excludeIds) {
  const fmt = roundCtx.format;
  let rankBand;

  if (roundCtx.isQualifying) {
    const baseMin = fmt.directCut + 1;
    const baseMax = fmt.qualiCut;
    if (roundCtx.roundIdx === 0) rankBand = [baseMin + 30, baseMax];
    else if (roundCtx.roundIdx === 1) rankBand = [baseMin + 10, baseMax - 30];
    else rankBand = [baseMin, baseMax - 60];
  } else {
    const totalMain = fmt.mainRounds.length;
    const remaining = totalMain - roundCtx.roundIdx; // rounds left including current
    const tier = roundCtx.tier || "ITF";

    // Tier-specific bands: [min, max] rank of expected opponents per round
    const tierBands = {
      Finals:      [[1, 10],   [1, 6],    [1, 4]],
      GrandSlam:   [[50, 130], [30, 90],  [15, 60],  [8, 30],   [1, 15],  [1, 8],  [1, 4]],
      Masters1000: [[40, 100], [20, 70],  [10, 40],  [4, 20],   [1, 10],  [1, 5],  [1, 3]],
      ATP500:      [[30, 80],  [15, 50],  [6, 25],   [1, 12],   [1, 6],   [1, 3]],
      ATP250:      [[50, 150], [25, 80],  [10, 40],  [3, 18],   [1, 8],   [1, 4]],
      Challenger:  [[80, 250], [50, 150], [25, 90],  [10, 50],  [3, 20],  [1, 8]],
      ITF:         [[300, 900],[200, 600],[100, 400], [40, 200], [10, 80], [1, 30]],
    };

    const bands = tierBands[tier] || tierBands.ITF;
    // roundIdx 0 = first round, map to bands from the end (final = last band entry)
    // remaining=1 means final, remaining=2 means semi, etc.
    const bandIdx = Math.max(0, bands.length - remaining);
    rankBand = bands[bandIdx] || bands[bands.length - 1];
  }

  const minIdx = Math.max(0, rankBand[0] - 1);
  const maxIdx = Math.min(rankBand[1] - 1, atpDb.length - 1);

  // excludeIds can be Array or Set - normalize to Set for fast lookup
  const excluded = excludeIds instanceof Set ? excludeIds : new Set(excludeIds || []);

  // Try multiple times to find an opponent not already played in this tournament
  for (let attempt = 0; attempt < 30; attempt++) {
    const idx = Math.floor(random() * Math.max(1, maxIdx - minIdx + 1)) + minIdx;
    const candidate = atpDb[idx];
    if (candidate && !excluded.has(candidate.id)) {
      return { player: candidate, rank: idx + 1 };
    }
  }
  // Fallback 1: extend toward weaker players (higher rank numbers).
  for (let i = minIdx; i <= Math.min(maxIdx + 100, atpDb.length - 1); i++) {
    const candidate = atpDb[i];
    if (candidate && !excluded.has(candidate.id)) {
      return { player: candidate, rank: i + 1 };
    }
  }
  // Fallback 2: extend toward stronger players, BUT respect the qualifying
  // floor (a top-50 should never appear in ATP250 qualifying).
  const hardFloor = roundCtx.isQualifying ? fmt.directCut : 0;
  const fallbackMin = Math.max(hardFloor, minIdx - 100);
  for (let i = fallbackMin; i < minIdx; i++) {
    const candidate = atpDb[i];
    if (candidate && !excluded.has(candidate.id)) {
      return { player: candidate, rank: i + 1 };
    }
  }
  const idx = Math.floor(random() * Math.max(1, maxIdx - minIdx + 1)) + minIdx;
  return { player: atpDb[idx], rank: idx + 1 };
}
