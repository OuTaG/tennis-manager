// Simulation hebdomadaire du circuit IA, Masters, évolution des notes.
import { PRIZE_SPLITS_V2 } from "../data/formats.js";
import { NAME_PARTS } from "../data/names.js";
import { ALL_TOURNAMENTS, PLAYER_RACE_RANK, getPointSplits, getTournamentFormat, isWTA, tierLabel } from "./circuit.js";
import { getRating, makeAtpPlayer } from "./database.js";
import { aiWinProb } from "./match.js";
import { generateName, namesForCountry, pickNationality } from "./names.js";
import { RETIREMENT_AGE } from "./player.js";
import { pointsWeekAfter, raceStandings } from "./race.js";

// Taux de participation hebdomadaire au circuit hors calendrier (voir
// simulateAtpWeek). Valeurs calibrées par simulation sur plusieurs saisons.
export const VIRTUAL_CIRCUIT = { challengerFrom: 175, challengerProb: 0.34, m25Prob: 0.55, m15Prob: 0.8 };
// Circuit WTA : moins de WTA 250 et de WTA 125 que de tournois équivalents
// côté ATP (le vrai circuit féminin compte beaucoup de W75/W100 non listés).
// Participation renforcée pour garder des points stables à chaque rang.
export const WTA_SIM = { p250Mid: 0.7, p250Low: 0.8, pChHigh: 0.8, pChMid: 0.75, challengerFrom: 120, challengerProb: 0.45 };

// ─── ATP WEEKLY SIMULATION ────────────────────────────────────────────────────
// Finalize a tournament that the human player participated in.
// The human's bracket is pre-simulated locally (bracketOpponents) but never
// persisted to the ATP DB. As a result, opponents' recentResults, pointsLog,
// seasonWins/Losses/Earnings/Titles are not updated for that tournament.
// This function simulates the rest of the bracket after the player's exit
// (or up to the title if the player won) and writes everything back to the DB.
//
// Args:
//   atpDb: current ATP DB (will return a new copy with updates)
//   tourn: the tournament object
//   fmt: tournament format
//   bracketParticipants: array of fmt.drawSize - 1 ATP players (player at slot 0 is implicit)
//   playerEliminatedAtRound: round index where the player lost; null if player won the title
//   isQualifying: true if the bracket was the qualifying draw (don't run for qualifying losses to keep scope tight)
//   currentWeek, currentYear: for stamping pointsLog / recentResults

// ─── MASTERS DE FIN D'ANNÉE (format réel) ───────────────────────────────────
// 8 qualifiés de la Race, deux poules de 4 (le 1 et le 2 séparés, les têtes de
// série 3-4, 5-6 et 7-8 réparties au tirage). Chacun joue ses 3 matchs de
// poule ; les deux premiers de chaque poule vont en demi-finale (1er A contre
// 2e B, 1er B contre 2e A), puis finale.
// Points : 200 par victoire en poule, 400 pour la demie gagnée, 500 pour la
// finale gagnée (1 500 pour un titre sans défaite).
// Prime : 7 % de participation, 8 % par victoire en poule, 22 % pour la demie
// gagnée, 47 % pour la finale gagnée (100 % pour un titre invaincu).
export const FINALS_PTS = { rr: 200, sf: 400, f: 500 };
export const FINALS_PRIZE = { base: 0.07, rr: 0.08, sf: 0.22, f: 0.47 };
// Ordre des rencontres d'une poule [0,1,2,3] (0 = le joueur humain s'il y est).
export const RR_SCHEDULE = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];

export function finalsMakeGroups(seeds) {
  const A = [seeds[0]], B = [seeds[1]];
  for (const [x, y] of [[seeds[2], seeds[3]], [seeds[4], seeds[5]], [seeds[6], seeds[7]]]) {
    if (Math.random() < 0.5) { A.push(x); B.push(y); } else { A.push(y); B.push(x); }
  }
  return { A, B };
}
export function finalsAiMatch(a, b) {
  const pA = aiWinProb(getRating(a.stats) - getRating(b.stats));
  const loserSets = Math.random() < 0.4 ? 1 : 0;
  return Math.random() < pA ? { w: a, l: b, ws: 2, ls: loserSets } : { w: b, l: a, ws: 2, ls: loserSets };
}
export function finalsRecord(table, wId, lId, ws, ls) {
  table[wId].w++; table[lId].l++;
  table[wId].sw += ws; table[wId].sl += ls;
  table[lId].sw += ls; table[lId].sl += ws;
}
// Classement d'une poule : victoires, puis différence de sets, puis niveau.
export function finalsRankGroup(ids, table, ratingOf) {
  return [...ids].sort((x, y) =>
    (table[y].w - table[x].w)
    || ((table[y].sw - table[y].sl) - (table[x].sw - table[x].sl))
    || (ratingOf(y) - ratingOf(x)));
}
export function finalsResultFor(rrWins, inSF, sfWin, champion) {
  return {
    rrWins, inSF, sfWin, champion,
    pts: rrWins * FINALS_PTS.rr + (sfWin ? FINALS_PTS.sf : 0) + (champion ? FINALS_PTS.f : 0),
    share: FINALS_PRIZE.base + rrWins * FINALS_PRIZE.rr + (sfWin ? FINALS_PRIZE.sf : 0) + (champion ? FINALS_PRIZE.f : 0),
    label: champion ? "Vainqueur" : sfWin ? "Finale" : inSF ? "Demi-finale" : "Poules",
    wins: rrWins + (sfWin ? 1 : 0) + (champion ? 1 : 0),
    losses: (3 - rrWins) + (inSF && !sfWin ? 1 : 0) + (sfWin && !champion ? 1 : 0),
  };
}
// Masters entièrement simulé (8 joueurs IA, dans l'ordre de la Race).
export function simulateFinalsRR(players) {
  const seeds = players.slice(0, 8);
  const { A, B } = finalsMakeGroups(seeds);
  const byId = Object.fromEntries(seeds.map(p => [p.id, p]));
  const table = Object.fromEntries(seeds.map(p => [p.id, { w: 0, l: 0, sw: 0, sl: 0 }]));
  for (const md of RR_SCHEDULE) {
    for (const G of [A, B]) {
      for (const [i, j] of md) {
        if (!G[i] || !G[j]) continue;
        const r = finalsAiMatch(G[i], G[j]);
        finalsRecord(table, r.w.id, r.l.id, r.ws, r.ls);
      }
    }
  }
  const ratingOf = id => getRating(byId[id].stats);
  const ra = finalsRankGroup(A.map(p => p.id), table, ratingOf);
  const rb = finalsRankGroup(B.map(p => p.id), table, ratingOf);
  const sf1 = finalsAiMatch(byId[ra[0]], byId[rb[1]]);
  const sf2 = finalsAiMatch(byId[rb[0]], byId[ra[1]]);
  const fin = finalsAiMatch(sf1.w, sf2.w);
  const inSF = new Set([ra[0], ra[1], rb[0], rb[1]]);
  const sfWinners = new Set([sf1.w.id, sf2.w.id]);
  const results = seeds.map(p => ({ p, ...finalsResultFor(table[p.id].w, inSF.has(p.id), sfWinners.has(p.id), fin.w.id === p.id) }));
  return { results, winner: fin.w, runnerUp: fin.l, semifinalists: [sf1.l, sf2.l] };
}

// Tirage du Masters pour le joueur humain : il est placé selon son rang à la
// Race, puis ses trois adversaires de poule sont fixés.
export function buildFinalsDraw(db, player) {
  const others = raceStandings(db, player.year).map(r => r.p).slice(0, 7);
  const me = { id: "__me", name: player.name, stats: player.stats };
  const seeds = [...others];
  seeds.splice(Math.max(0, Math.min(7, PLAYER_RACE_RANK - 1)), 0, me);
  const { A, B } = finalsMakeGroups(seeds);
  const mineIsA = A.some(x => x.id === "__me");
  const G = [me, ...(mineIsA ? A : B).filter(x => x.id !== "__me")];
  const H = mineIsA ? B : A;
  const table = Object.fromEntries([...G, ...H].map(p => [p.id, { w: 0, l: 0, sw: 0, sl: 0 }]));
  const rr = {
    G: G.map(p => p.id), H: H.map(p => p.id),
    gLabel: mineIsA ? "A" : "B", hLabel: mineIsA ? "B" : "A",
    players: Object.fromEntries(others.map(p => [p.id, p])),
    table, md: 0, sf: null, otherSF: null,
  };
  return { rr, bracketParticipants: others, bracketOpponents: [G[1], G[2], G[3]] };
}
// Après chaque match de poule du joueur : on joue les autres matchs de la
// même journée (dans sa poule et dans l'autre).
export function finalsPlayMatchday(rr, md, playerWon, pSets, oSets) {
  const table = JSON.parse(JSON.stringify(rr.table));
  const oppId = rr.G[RR_SCHEDULE[md][0][1]];
  if (playerWon) finalsRecord(table, "__me", oppId, pSets, oSets);
  else finalsRecord(table, oppId, "__me", oSets, pSets);
  const pl = (id) => rr.players[id];
  const [gi, gj] = RR_SCHEDULE[md][1];
  const r1 = finalsAiMatch(pl(rr.G[gi]), pl(rr.G[gj]));
  finalsRecord(table, r1.w.id, r1.l.id, r1.ws, r1.ls);
  for (const [i, j] of RR_SCHEDULE[md]) {
    const r = finalsAiMatch(pl(rr.H[i]), pl(rr.H[j]));
    finalsRecord(table, r.w.id, r.l.id, r.ws, r.ls);
  }
  return { ...rr, table, md: md + 1 };
}
export function finalsRanked(rr, player) {
  const ratingOf = id => id === "__me" ? getRating(player.stats) : getRating(rr.players[id].stats);
  return { g: finalsRankGroup(rr.G, rr.table, ratingOf), h: finalsRankGroup(rr.H, rr.table, ratingOf) };
}
// Résultats finaux des 7 joueurs IA quand le tournoi du joueur se termine.
// outcome : { groupOut, sfLostTo, finalLostTo, champion } (ids d'adversaires).
export function finalsAiResults(rr, player, outcome) {
  const { g, h } = finalsRanked(rr, player);
  const pl = (id) => rr.players[id];
  const inSF = new Set([g[0], g[1], h[0], h[1]]);
  let sfWinners = new Set();
  let championId = null;
  if (outcome.groupOut) {
    const sf1 = finalsAiMatch(pl(g[0]), pl(h[1]));
    const sf2 = finalsAiMatch(pl(h[0]), pl(g[1]));
    const fin = finalsAiMatch(sf1.w, sf2.w);
    sfWinners = new Set([sf1.w.id, sf2.w.id]);
    championId = fin.w.id;
  } else {
    // Autre demi-finale (déjà jouée si le joueur a atteint la finale).
    const other = rr.otherSF;
    if (other) sfWinners.add(other.w);
    if (outcome.sfLostTo) {
      sfWinners.add(outcome.sfLostTo);
      const a = pl(outcome.sfLostTo), b = other ? pl(other.w) : null;
      championId = b ? finalsAiMatch(a, b).w.id : a.id;
    } else if (outcome.finalLostTo) {
      championId = outcome.finalLostTo;
    }
  }
  return Object.keys(rr.players).map(id => ({
    p: pl(id),
    ...finalsResultFor(rr.table[id].w, inSF.has(id), sfWinners.has(id), championId === id),
  }));
}

export function finalizeHumanTournamentBracket(atpDb, tourn, fmt, bracketParticipants, playerEliminatedAtRound, isQualifying, currentWeek, currentYear, finalsResults) {
  // Only finalize main draws (qualifying losses don't affect main-draw stats here).
  if (isQualifying) return atpDb;
  if (!bracketParticipants || bracketParticipants.length === 0) return atpDb;

  const fmtKey = fmt._key;
  const pointSplits = getPointSplits(fmtKey, tourn);
  const prizeSplits = PRIZE_SPLITS_V2[fmtKey] || PRIZE_SPLITS_V2.ITF;

  // Lightweight clone of the DB (same shape as simulateAtpWeek)
  const dbCopy = new Array(atpDb.length);
  const idxById = new Map();
  for (let i = 0; i < atpDb.length; i++) {
    const src = atpDb[i];
    dbCopy[i] = {
      id: src.id, name: src.name, nat: src.nat, style: src.style,
      stats: { ...src.stats },
      points: src.points,
      initialPoints: src.initialPoints !== undefined ? src.initialPoints : src.points,
      age: src.age !== undefined ? src.age : 25,
      weeksAtAge: src.weeksAtAge !== undefined ? src.weeksAtAge : 0,
      pot: src.pot,
      seasonWins: src.seasonWins || 0,
      seasonLosses: src.seasonLosses || 0,
      seasonEarnings: src.seasonEarnings || 0,
      seasonTitles: src.seasonTitles || 0,
      recentResults: src.recentResults || [],
      pointsLog: src.pointsLog || [],
    };
    idxById.set(src.id, i);
  }

  // Tournoi joué avec « Jouer maintenant » : la semaine avait déjà été simulée
  // sans le joueur, ce tournoi compris. On retire ces résultats fantômes avant
  // d'écrire le vrai tableau, sinon les adversaires touchaient les points du
  // tournoi deux fois (et le classement autour du joueur gonflait).
  const ghostIds = new Set();
  for (const t of dbCopy) {
    const hadGhost = t.pointsLog.some(e => e.source === tourn.id && e.week === currentWeek && e.year === currentYear)
      || t.recentResults.some(r => r.tournament === tourn.name && r.week === currentWeek && r.year === currentYear);
    if (!hadGhost) continue;
    ghostIds.add(t.id);
    t.pointsLog = t.pointsLog.filter(e => !(e.source === tourn.id && e.week === currentWeek && e.year === currentYear));
    const ghosts = t.recentResults.filter(r => r.tournament === tourn.name && r.week === currentWeek && r.year === currentYear);
    for (const g of ghosts) {
      t.seasonEarnings = Math.max(0, t.seasonEarnings - (g.prize || 0));
      if (g.isWinner) t.seasonTitles = Math.max(0, t.seasonTitles - 1);
    }
    t.recentResults = t.recentResults.filter(r => !(r.tournament === tourn.name && r.week === currentWeek && r.year === currentYear));
  }

  // Masters : résultats des poules et du tableau déjà connus.
  if (finalsResults) {
    for (const r of finalsResults) {
      const idx = idxById.get(r.p.id);
      if (idx === undefined) continue;
      const target = dbCopy[idx];
      const prize = Math.round(tourn.prize * r.share);
      if (r.pts > 0) {
        const pw = pointsWeekAfter(currentWeek, currentYear);
        target.pointsLog.push({ year: pw.year, week: pw.week, pts: r.pts, source: tourn.id });
      }
      target.seasonWins += r.wins;
      target.seasonLosses += r.losses;
      target.seasonEarnings += prize;
      if (r.champion) target.seasonTitles += 1;
      target.recentResults = [{
        tournament: tourn.name, tier: tourn.tier, year: currentYear, week: currentWeek,
        roundReached: r.label, prize, pts: r.pts, isWinner: r.champion,
      }, ...(target.recentResults || [])].slice(0, 6);
    }
  }
  if (!finalsResults) {
  // Build the full bracket including the player at slot 0 (as a virtual marker)
  // We replay the bracket round by round. Slot 0 represents the human player.
  // At round `playerEliminatedAtRound`, the player loses to the opponent in their pair.
  // For all other pairs in each round, we sample the winner by rating.
  const PLAYER_MARKER = "__HUMAN__";
  let current = [PLAYER_MARKER, ...bracketParticipants];

  // Track per-round losers and final winner so we can credit pts/prize at exit.
  // byRound[i] = array of players who LOST in round i (i.e., their final round was i)
  // The final winner ends up alone in `current` after all rounds.
  const byRound = [];
  let roundIdx = 0;

  while (current.length > 1) {
    const nextRound = [];
    const losersThisRound = [];
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i];
      const b = current[i + 1];
      if (b === undefined) { nextRound.push(a); continue; }

      // Determine winner
      let winner, loser;
      if (a === PLAYER_MARKER) {
        if (playerEliminatedAtRound !== null && roundIdx === playerEliminatedAtRound) {
          winner = b; loser = a;
        } else {
          winner = a; loser = b;
        }
      } else if (b === PLAYER_MARKER) {
        if (playerEliminatedAtRound !== null && roundIdx === playerEliminatedAtRound) {
          winner = a; loser = b;
        } else {
          winner = b; loser = a;
        }
      } else {
        const rA = getRating(a.stats), rB = getRating(b.stats);
        const diff = rA - rB;
        const pA = aiWinProb(diff);
        if (Math.random() < pA) { winner = a; loser = b; }
        else { winner = b; loser = a; }
      }
      nextRound.push(winner);
      // Only track ATP players as losers (not the human marker)
      if (loser !== PLAYER_MARKER) losersThisRound.push(loser);
    }
    byRound.push(losersThisRound);
    current = nextRound;
    roundIdx++;
  }
  // current[0] is now the tournament winner (could be PLAYER_MARKER if player won)
  const finalWinner = current[0];
  const totalRounds = byRound.length + 1; // each "loser round" + the final winner round
  // Effective number of mainRounds entries
  const mainRoundsCount = fmt.mainRounds.length;

  // Award points/prize for each ATP player by the round they reached
  // A player who lost in round i reached round i (their max round). Points/prize index = i.
  // The final winner reached round (totalRounds - 1) = mainRoundsCount - 1.
  const creditPlayer = (atpPlayer, roundReached, isWinner) => {
    const idx = idxById.get(atpPlayer.id);
    if (idx === undefined) return;
    const target = dbCopy[idx];
    const pts = pointSplits.main[roundReached] || 0;
    const prize = Math.round(tourn.prize * (prizeSplits.main[roundReached] || 0));
    if (pts > 0) {
      const pw = pointsWeekAfter(currentWeek, currentYear);
      target.pointsLog.push({ year: pw.year, week: pw.week, pts, source: tourn.id });
    }
    target.seasonWins += roundReached; // they won `roundReached` matches before losing (or all if winner)
    if (!isWinner) target.seasonLosses += 1;
    target.seasonEarnings += prize;
    if (isWinner) target.seasonTitles += 1;
    const roundLabel = isWinner ? "Vainqueur" : (fmt.mainRounds[roundReached] || "T" + (roundReached + 1));
    target.recentResults = [{
      tournament: tourn.name, tier: tourn.tier, year: currentYear, week: currentWeek,
      roundReached: roundLabel,
      prize, pts, isWinner,
    }, ...(target.recentResults || [])].slice(0, 6);
  };

  byRound.forEach((losers, rIdx) => {
    losers.forEach(pl => creditPlayer(pl, rIdx, false));
  });
  // Le vainqueur a gagné tous les tours : il touche la dernière case du barème
  // (main[mainRoundsCount]), pas celle du finaliste.
  if (finalWinner !== PLAYER_MARKER) {
    creditPlayer(finalWinner, mainRoundsCount, true);
  }

  }
  // Recompute points for all participants (rolling 52w + initialPoints decay)
  const participantIds = new Set(bracketParticipants.map(p => p.id));
  // Compute decay fraction the same way simulateAtpWeek does
  const startYear = 2026, startWeek = 1;
  const weeksElapsedSinceStart = (currentYear - startYear) * 52 + (currentWeek - startWeek);
  const decayFraction = Math.min(1, Math.max(0, weeksElapsedSinceStart / 52));
  for (let i = 0; i < dbCopy.length; i++) {
    if (!participantIds.has(dbCopy[i].id) && !ghostIds.has(dbCopy[i].id)) continue;
    const target = dbCopy[i];
    // First filter the pointsLog to 52-week window (matches simulateAtpWeek behavior)
    target.pointsLog = (target.pointsLog || []).filter(e => {
      const ageWeeks = (currentYear - e.year) * 52 + (currentWeek - e.week);
      return ageWeeks < 52;
    });
    const initialRem = Math.round((target.initialPoints || 0) * (1 - decayFraction));
    const tpts = target.pointsLog.reduce((a, e) => a + e.pts, 0);
    target.points = Math.max(0, initialRem + tpts);
  }

  // Keep the DB sorted DESC by points so getPlayerRanking (binary search) and
  // the ranking screen stay consistent.
  dbCopy.sort((a, b) => b.points - a.points);

  return dbCopy;
}

// Simulates all tournaments happening this week with the ATP database.
// Returns: updated ATP DB + news articles for the Actu tab.

// Potentiel caché d'un joueur IA (multiplie sa progression de jeunesse).
export function rollPotential() {
  if (Math.random() < 0.06) return 1.8 + Math.random() * 0.5; // pépite
  return 0.5 + Math.random() * 1.1;
}
// Évolution annuelle moyenne de la note selon l'âge (points de stat / an).
export function ageCurve(age, pot) {
  if (age <= 19) return 3.2 * pot;
  if (age <= 21) return 2.4 * pot;
  if (age <= 23) return 1.5 * pot;
  if (age <= 25) return 0.7 * pot;
  if (age <= 28) return 0.1;
  if (age <= 30) return -0.6;
  if (age <= 32) return -1.4;
  if (age <= 34) return -2.2;
  return -3.2;
}

export function simulateAtpWeek(atpDb, currentWeek, currentYear, skipTournamentIds) {
  const skipSet = new Set(skipTournamentIds || []);
  const tournamentsThisWeek = ALL_TOURNAMENTS.filter(t => t.week === currentWeek && !skipSet.has(t.id));

  // Build the new DB (lightweight clone - keep stats/nat refs)
  const dbCopy = new Array(atpDb.length);
  const idxById = new Map();
  for (let i = 0; i < atpDb.length; i++) {
    const src = atpDb[i];
    dbCopy[i] = {
      id: src.id, name: src.name, nat: src.nat, style: src.style,
      stats: { ...src.stats },
      points: src.points,
      initialPoints: src.initialPoints !== undefined ? src.initialPoints : src.points,
      age: src.age !== undefined ? src.age : 25,
      weeksAtAge: src.weeksAtAge !== undefined ? src.weeksAtAge : 0,
      pot: src.pot,
      seasonWins: src.seasonWins || 0,
      seasonLosses: src.seasonLosses || 0,
      seasonEarnings: src.seasonEarnings || 0,
      seasonTitles: src.seasonTitles || 0,
      recentResults: src.recentResults || [],
      pointsLog: src.pointsLog || [],
    };
    idxById.set(src.id, i);
  }

  // Reset season stats at week 1 (new season)
  if (currentWeek === 1) {
    for (let i = 0; i < dbCopy.length; i++) {
      dbCopy[i].seasonWins = 0;
      dbCopy[i].seasonLosses = 0;
      dbCopy[i].seasonEarnings = 0;
      dbCopy[i].seasonTitles = 0;
    }
  }

  // Game start reference: year 2026 week 1. Players "earned" initialPoints in the year before (2025).
  // During year 2026 (player's year 1), initialPoints decay linearly: -1/52 per week.
  // After 52 weeks, initialPoints reach 0 and only actual tournament points (rolling 52w) remain.
  const startYear = 2026, startWeek = 1;
  const weeksElapsedSinceStart = (currentYear - startYear) * 52 + (currentWeek - startWeek);

  // Update each player's points
  for (let i = 0; i < dbCopy.length; i++) {
    const p = dbCopy[i];

    // Expire tournament points older than 52 weeks
    p.pointsLog = (p.pointsLog || []).filter(e => {
      const ageWeeks = (currentYear - e.year) * 52 + (currentWeek - e.week);
      return ageWeeks < 52;
    });

    // Decay the seeded initialPoints linearly over the first year. After that,
    // a player's ranking points are purely the sum of their real rolling 52-week
    // results — no artificial target, so the spread emerges naturally.
    let initialRemaining = p.initialPoints || 0;
    if (weeksElapsedSinceStart > 0) {
      const decayFraction = Math.min(1, weeksElapsedSinceStart / 52);
      initialRemaining = Math.round((p.initialPoints || 0) * (1 - decayFraction));
    }
    const tournamentPoints = p.pointsLog.reduce((a, e) => a + e.pts, 0);
    p.points = Math.max(0, initialRemaining + tournamentPoints);
  }

  const articles = [];

  // Track players that have already been assigned to a tournament this week.
  // Prevents a single NPC from being entered in two tournaments simultaneously.
  const weekPlayedIds = new Set();

  if (tournamentsThisWeek.length > 0) {
    // Order tournaments by tier priority (highest tier first) so top players
    // get assigned to the bigger tournaments before fill happens elsewhere.
    const tierPriority = { GrandSlam: 0, Finals: 0, Masters1000: 1, ATP500: 2, ATP250: 3, Challenger: 4, ITF: 5 };
    const orderedTournaments = [...tournamentsThisWeek].sort(
      (a, b) => (tierPriority[a.tier] ?? 99) - (tierPriority[b.tier] ?? 99)
    );

    for (const tourn of orderedTournaments) {
      const fmt = getTournamentFormat(tourn);
      const fmtKey = fmt._key;
      const pointSplits = getPointSplits(fmtKey, tourn);
      const prizeSplits = PRIZE_SPLITS_V2[fmtKey] || PRIZE_SPLITS_V2.ITF;

      // Build participant pool with REALISTIC participation rules
      // Top players almost always play GS / Masters 1000 / ATP 500
      // For smaller tournaments, more random
      let participants = [];
      const seenIds = new Set();
      const commitParticipant = (player) => {
        if (!seenIds.has(player.id)
            && !weekPlayedIds.has(player.id)
            && participants.length < fmt.drawSize) {
          seenIds.add(player.id);
          weekPlayedIds.add(player.id);
          participants.push(player);
        }
      };
      // Step 1 only COLLECTS eligible players; they are shuffled before the
      // draw is filled, so the draw isn't always made of the best-ranked
      // candidates (which left the bottom of the ranking without matches).
      const eligible = [];
      const eligibleIds = new Set();
      const addParticipant = (player) => {
        if (!eligibleIds.has(player.id) && !weekPlayedIds.has(player.id)) {
          eligibleIds.add(player.id);
          eligible.push(player);
        }
      };

      const tier = tourn.tier;
      const drawSize = fmt.drawSize;

      // Step 1: Force top players based on tier
      if (tier === "Finals") {
        // Les 8 premiers de la Race (points gagnés depuis le 1er janvier).
        raceStandings(dbCopy, currentYear).slice(0, 8).forEach(r => addParticipant(r.p));
      } else if (tier === "GrandSlam") {
        // Top 80 almost always play (95%), top 100 often
        for (let i = 0; i < Math.min(80, dbCopy.length); i++) {
          if (Math.random() < 0.95) addParticipant(dbCopy[i]);
        }
        for (let i = 80; i < Math.min(120, dbCopy.length); i++) {
          if (Math.random() < 0.70) addParticipant(dbCopy[i]);
        }
      } else if (tier === "Masters1000") {
        // Top 50 almost always (90%), top 80 often
        for (let i = 0; i < Math.min(50, dbCopy.length); i++) {
          if (Math.random() < 0.92) addParticipant(dbCopy[i]);
        }
        for (let i = 50; i < Math.min(90, dbCopy.length); i++) {
          if (Math.random() < 0.55) addParticipant(dbCopy[i]);
        }
      } else if (tier === "ATP500") {
        // Top 30 frequently, top 80 often (they spread across multiple ATP500)
        for (let i = 0; i < Math.min(30, dbCopy.length); i++) {
          if (Math.random() < 0.65) addParticipant(dbCopy[i]);
        }
        for (let i = 30; i < Math.min(80, dbCopy.length); i++) {
          if (Math.random() < 0.50) addParticipant(dbCopy[i]);
        }
      } else if (tier === "ATP250") {
        // Top players play these regularly too (fills their calendar / match count)
        for (let i = 0; i < Math.min(20, dbCopy.length); i++) {
          if (Math.random() < 0.30) addParticipant(dbCopy[i]);
        }
        for (let i = 20; i < Math.min(50, dbCopy.length); i++) {
          if (Math.random() < (isWTA() ? WTA_SIM.p250Mid : 0.45)) addParticipant(dbCopy[i]);
        }
        for (let i = 50; i < Math.min(150, dbCopy.length); i++) {
          if (Math.random() < (isWTA() ? WTA_SIM.p250Low : 0.45)) addParticipant(dbCopy[i]);
        }
      } else if (tier === "Challenger") {
        // Challengers are the main circuit for players ranked ~80-250.
        // High participation rates here so their points compensate the
        // yearly decay of initialPoints and the global level stays stable.
        for (let i = 80; i < Math.min(180, dbCopy.length); i++) {
          if (Math.random() < (isWTA() ? WTA_SIM.pChHigh : 0.65)) addParticipant(dbCopy[i]);
        }
        for (let i = 180; i < Math.min(280, dbCopy.length); i++) {
          if (Math.random() < (isWTA() ? WTA_SIM.pChMid : 0.55)) addParticipant(dbCopy[i]);
        }
        for (let i = 280; i < Math.min(400, dbCopy.length); i++) {
          if (Math.random() < 0.30) addParticipant(dbCopy[i]);
        }
      } else if (tier === "ITF") {
        // ITFs are the entry-level circuit for players ranked ~250+.
        // High participation is critical: this is the only point source for low-ranked
        // players, and without it their points decay to 0 after one season.
        for (let i = 250; i < Math.min(400, dbCopy.length); i++) {
          if (Math.random() < 0.75) addParticipant(dbCopy[i]);
        }
        for (let i = 400; i < Math.min(600, dbCopy.length); i++) {
          if (Math.random() < 0.70) addParticipant(dbCopy[i]);
        }
        for (let i = 600; i < dbCopy.length; i++) {
          if (Math.random() < 0.55) addParticipant(dbCopy[i]);
        }
      }

      // Big events keep their stars: top-ranked eligible players first for the
      // Majors / 1000s / 500s, a shuffled pool for the smaller events.
      if (tier === "GrandSlam" || tier === "Finals" || tier === "Masters1000" || tier === "ATP500") {
        for (const pl of eligible) commitParticipant(pl);
      } else {
        for (let i = eligible.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
        }
        for (const pl of eligible) commitParticipant(pl);
      }

      // Step 2: Fill the rest randomly from the appropriate pool
      let poolStart = 0, poolEnd = tier === "Finals" ? 12 : fmt.qualiCut;
      if (drawSize >= 32 && drawSize < 48) poolStart = Math.max(0, (fmt.directCut / 4) | 0);
      if (tier === "ATP250") poolStart = 30;
      if (tier === "Challenger") poolStart = Math.max(80, poolStart);
      if (tier === "ITF") poolStart = Math.max(250, poolStart);
      const candidatePool = dbCopy.slice(poolStart, poolEnd);

      let attempts = 0;
      while (participants.length < drawSize && attempts < drawSize * 5 && candidatePool.length > 0) {
        const i = (Math.random() * candidatePool.length) | 0;
        commitParticipant(candidatePool[i]);
        attempts++;
      }

      // Masters de fin d'année : poules puis demies et finale.
      if (tier === "Finals" && participants.length >= 8) {
        const fr = simulateFinalsRR(participants);
        const decayF = Math.min(1, Math.max(0, weeksElapsedSinceStart / 52));
        for (const r of fr.results) {
          const idx = idxById.get(r.p.id);
          if (idx === undefined) continue;
          const target = dbCopy[idx];
          const prize = Math.round(tourn.prize * r.share);
          if (r.pts > 0) target.pointsLog.push({ year: currentYear, week: currentWeek, pts: r.pts, source: tourn.id });
          target.seasonWins += r.wins;
          target.seasonLosses += r.losses;
          target.seasonEarnings += prize;
          if (r.champion) target.seasonTitles += 1;
          target.recentResults = [{
            tournament: tourn.name, tier: tourn.tier, year: currentYear, week: currentWeek,
            roundReached: r.label, prize, pts: r.pts, isWinner: r.champion,
          }, ...(target.recentResults || [])].slice(0, 6);
          const initialRem = Math.round((target.initialPoints || 0) * (1 - decayF));
          target.points = Math.max(0, initialRem + target.pointsLog.reduce((a, e) => a + e.pts, 0));
        }
        articles.push(generateTournamentArticle(tourn, fr.winner, fr.runnerUp, fr.semifinalists, [], fmt));
        continue;
      }

      const fastResults = fastSimulateBracket(participants, fmt);
      const totalRounds = fastResults.byRound.length;

      // Award points (52-week rolling) + season stats
      // Track all participants for full recompute
      const allParticipantIds = new Set(participants.map(p => p.id));

      fastResults.byRound.forEach((playersAtRound, roundIdx) => {
        const pts = pointSplits.main[roundIdx] || 0;
        const prize = Math.round(tourn.prize * (prizeSplits.main[roundIdx] || 0));
        const isWinner = roundIdx === totalRounds - 1;
        const winsHere = isWinner ? totalRounds - 1 : roundIdx;
        const loss = isWinner ? 0 : 1;

        for (const p of playersAtRound) {
          const idx = idxById.get(p.id);
          if (idx === undefined) continue;
          const target = dbCopy[idx];
          if (pts > 0) {
            target.pointsLog.push({ year: currentYear, week: currentWeek, pts, source: tourn.id });
          }
          target.seasonWins += winsHere;
          target.seasonLosses += loss;
          target.seasonEarnings += prize;
          if (isWinner) target.seasonTitles += 1;
          // Record result for ALL rounds (not just last 4) so historique is always populated
          const roundLabel = isWinner ? "Vainqueur" : (fmt.mainRounds[roundIdx] || "T" + (roundIdx + 1));
          target.recentResults = [{
            tournament: tourn.name, tier: tourn.tier, year: currentYear, week: currentWeek,
            roundReached: roundLabel,
            prize, pts, isWinner,
          }, ...(target.recentResults || [])].slice(0, 6);
        }
      });

      // Recompute points for ALL participants (not just byRound entries)
      const decayFraction = Math.min(1, Math.max(0, weeksElapsedSinceStart / 52));
      for (let i = 0; i < dbCopy.length; i++) {
        if (!allParticipantIds.has(dbCopy[i].id)) continue;
        const target = dbCopy[i];
        const initialRem = Math.round((target.initialPoints || 0) * (1 - decayFraction));
        const tpts = target.pointsLog.reduce((a, e) => a + e.pts, 0);
        target.points = Math.max(0, initialRem + tpts);
      }

      // Only generate articles for ATP250 and above
      const articleTiers = new Set(["GrandSlam", "Finals", "Masters1000", "ATP500", "ATP250"]);
      if (articleTiers.has(tourn.tier)) {
        const article = generateTournamentArticle(tourn, fastResults.winner, fastResults.runnerUp, fastResults.semifinalists, fastResults.surprises, fmt);
        articles.push(article);
      }
    }
  }

  // Circuit secondaire hors calendrier. Le vrai circuit compte bien plus de
  // Challengers et d'ITF que ceux listés dans le jeu (~4 Challengers et ~10
  // ITF par semaine). Sans eux, les joueurs classés au-delà de ~150 jouent
  // trop peu et leurs points fondent : la 258e place passait de ~235 à ~85
  // points en une saison. Chaque semaine, une partie des joueurs sans tournoi
  // dispute donc un tournoi « hors calendrier » de leur niveau, avec le vrai
  // barème de points. Calibré pour que le nombre de points à chaque place
  // reste proche de celui du départ (≈ réel), au bruit près.
  {
    const VIRTUAL_EVENTS = [
      { tournament: "Challenger (hors calendrier)", tier: "Challenger", from: isWTA() ? WTA_SIM.challengerFrom : VIRTUAL_CIRCUIT.challengerFrom, to: 520,  prob: isWTA() ? WTA_SIM.challengerProb : VIRTUAL_CIRCUIT.challengerProb, points: [0, 6, 12, 22, 44, 75] },   // Challenger 75
      { tournament: "Open M25 (hors calendrier)",   tier: "ITF",        from: 280, to: 650,  prob: VIRTUAL_CIRCUIT.m25Prob,        points: [0, 1, 3, 8, 16, 25] },    // ITF M25
      { tournament: "Futures",                      tier: "Futures",    from: 600, to: 99999, prob: VIRTUAL_CIRCUIT.m15Prob,       points: [0, 1, 2, 4, 8, 15] },     // ITF M15
    ];
    const V_ROUNDS = ["1er tour", "2e tour", "8es de finale", "Quarts", "Demies", "Finale"];
    const vFmt = { drawSize: 32, mainRounds: V_ROUNDS };
    const sorted = [...dbCopy].sort((a, b) => (b.points || 0) - (a.points || 0));
    const decayF = Math.min(1, Math.max(0, weeksElapsedSinceStart / 52));

    for (const ev of VIRTUAL_EVENTS) {
      const pool = [];
      for (let r = ev.from; r < Math.min(ev.to, sorted.length); r++) {
        const pl = sorted[r];
        if (!weekPlayedIds.has(pl.id) && Math.random() < ev.prob) pool.push(pl);
      }
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      for (let start = 0; start + 16 <= pool.length; start += 32) {
        const draw = pool.slice(start, start + 32);
        draw.forEach(pl => weekPlayedIds.add(pl.id));
        const res = fastSimulateBracket(draw, vFmt);
        const nRounds = res.byRound.length;
        res.byRound.forEach((playersAtRound, roundIdx) => {
          const isWinner = roundIdx === nRounds - 1;
          // Tableau incomplet (moins de 32) : on aligne les tours sur la fin du barème.
          const ptsIdx = isWinner ? ev.points.length - 1 : Math.max(0, ev.points.length - nRounds + roundIdx);
          const pts = ev.points[ptsIdx] ?? 0;
          for (const p of playersAtRound) {
            const idx = idxById.get(p.id);
            if (idx === undefined) continue;
            const target = dbCopy[idx];
            if (pts > 0) target.pointsLog.push({ year: currentYear, week: currentWeek, pts, source: "virtual" });
            target.seasonWins += isWinner ? nRounds - 1 : roundIdx;
            target.seasonLosses += isWinner ? 0 : 1;
            if (isWinner) target.seasonTitles += 1;
            target.recentResults = [{
              tournament: ev.tournament, tier: ev.tier, year: currentYear, week: currentWeek,
              roundReached: isWinner ? "Vainqueur" : (V_ROUNDS[ptsIdx] || "T" + (roundIdx + 1)),
              prize: 0, pts, isWinner,
            }, ...(target.recentResults || [])].slice(0, 6);
          }
        });
        for (const pl of draw) {
          const t = dbCopy[idxById.get(pl.id)];
          if (!t) continue;
          const initialRem = Math.round((t.initialPoints || 0) * (1 - decayF));
          t.points = Math.max(0, initialRem + t.pointsLog.reduce((a, e) => a + e.pts, 0));
        }
      }
    }
  }

  // ── Évolution des notes (toutes les 4 semaines) ─────────────────────────
  // Chaque joueur a un potentiel caché (pot, ~0,5 à 1,6 ; quelques pépites
  // jusqu'à 2,3). La courbe suit l'âge : forte progression jusqu'à 20 ans,
  // pic vers 25-28 ans, déclin dès 30-31 ans (l'endurance part en premier,
  // le mental tient mieux). La forme de la saison (bilan) pèse un peu.
  if (currentWeek % 4 === 0) {
    for (let i = 0; i < dbCopy.length; i++) {
      const p = dbCopy[i];
      if (p.pot === undefined) p.pot = rollPotential();
      const age = p.age || 25;
      const played = (p.seasonWins || 0) + (p.seasonLosses || 0);
      const form = played >= 8 ? ((p.seasonWins || 0) / played - 0.5) * 1.2 : 0;
      const yearly = ageCurve(age, p.pot) + form;
      for (const k of Object.keys(p.stats)) {
        let d = yearly / 13 * (0.5 + Math.random());
        if (d < 0) d *= k === "stamina" ? 1.4 : k === "mental" ? 0.5 : 1;
        else d *= Math.max(0.15, Math.min(1, (96 - p.stats[k]) / 25)); // plus dur près du sommet
        d += (Math.random() - 0.5) * 0.25; // aléa de forme
        p.stats[k] = Math.max(35, Math.min(99, p.stats[k] + d));
      }
    }
  }

  // Vieillissement et retraites : à chaque anniversaire après 31 ans, chance
  // de raccrocher selon l'âge et le niveau (les cadors durent plus longtemps).
  const retirements = [];
  for (let i = 0; i < dbCopy.length; i++) {
    const p = dbCopy[i];
    p.weeksAtAge = (p.weeksAtAge || 0) + 1;
    let retire = false;
    if (p.weeksAtAge >= 52) {
      p.weeksAtAge = 0;
      p.age = (p.age || 25) + 1;
      const age = p.age;
      if (age >= 32) {
        const base = { 32: 0.07, 33: 0.12, 34: 0.2, 35: 0.3, 36: 0.42, 37: 0.55, 38: 0.7 }[age] ?? 0.85;
        const rankMul = i < 20 ? 0.45 : i < 100 ? 0.8 : i < 300 ? 1.1 : 1.4;
        retire = Math.random() < base * rankMul;
      }
    }
    if (retire || (p.age || 25) >= RETIREMENT_AGE) {
      if (i < 100) retirements.push({ name: p.name, age: p.age, rank: i + 1, nat: p.nat, titles: p.seasonTitles || 0 });
      // Replace this retired player with a young rookie (~18-20) at the bottom of the ladder
      // Every country now has a name list: the rookie keeps the retiree's country.
      const nat = (NAME_PARTS[p.nat?.code] || namesForCountry(p.nat?.country))
        ? p.nat
        : pickNationality();
      const replacement = makeAtpPlayer(generateName(nat), nat, Math.round(5 + Math.random() * 30), 45 + Math.random() * 5);
      replacement.age = 18 + Math.floor(Math.random() * 3);
      replacement.weeksAtAge = Math.floor(Math.random() * 52);
      replacement.pot = rollPotential();
      dbCopy[i] = replacement;
    }
  }

  dbCopy.sort((a, b) => b.points - a.points);
  return { newDb: dbCopy, articles, retirements };
}

export function applyDriftOnly(db) { return db; } // not used anymore - simulateAtpWeek handles all weeks

// Fast bracket simulation: O(participants × rounds) instead of O(participants × rounds × pairwise)
// Uses probability-weighted sampling per round - statistically equivalent to a real bracket.
export function fastSimulateBracket(participants, fmt) {
  const byRound = [];
  const surprises = [];

  // Pre-compute "strength" for each (rating + small random variance per tournament)
  const players = participants.map(p => ({
    ref: p,
    strength: getRating(p.stats) + (Math.random() * 6 - 3),
  }));

  // ── Seed the draw so the strongest players are spread across the bracket and
  // only meet in late rounds, as in real tournaments. We keep the exact number
  // of slots (no padding) so round indexing for points stays correct. Strategy:
  // sort by strength, then distribute in a snake pattern across the draw. ──
  const sorted = [...players].sort((a, b) => b.strength - a.strength);
  const nSlots = sorted.length;
  const slots = new Array(nSlots);
  // Snake distribution: fill positions 0,1,2,... but alternate direction each
  // pass so adjacent seeds land far apart in the bracket tree.
  // Simpler robust approach: place seed k at a bit-reversed position, which is
  // the standard way to keep top seeds maximally separated.
  let pow = 1;
  while (pow < nSlots) pow *= 2;
  const bitReverse = (x, bits) => {
    let r = 0;
    for (let i = 0; i < bits; i++) { r = (r << 1) | (x & 1); x >>= 1; }
    return r;
  };
  const bits = Math.log2(pow);
  let placed = 0;
  for (let i = 0; i < pow && placed < nSlots; i++) {
    const pos = bitReverse(i, bits);
    if (pos < nSlots) { slots[pos] = sorted[placed]; placed++; }
  }

  // Helper: play one round WITHOUT reshuffling, preserving seeded adjacency.
  const playSeededRound = (arr, rIdx) => {
    const winners = [];
    const losers = [];
    for (let i = 0; i < arr.length; i += 2) {
      const a = arr[i], b = arr[i + 1];
      if (!a && !b) continue;
      if (!a) { winners.push(b); continue; }
      if (!b) { winners.push(a); continue; }
      const diff = a.strength - b.strength;
      const pA = aiWinProb(diff);
      const aWins = Math.random() < pA;
      winners.push(aWins ? a : b);
      losers.push(aWins ? b : a);
      if (Math.abs(diff) > 12 && surprises.length < 3) {
        const upset = (diff > 0 && !aWins) || (diff < 0 && aWins);
        if (upset) surprises.push({ winner: aWins ? a.ref : b.ref, loser: aWins ? b.ref : a.ref, round: rIdx });
      }
    }
    return { winners, losers };
  };

  let current = slots;
  let roundIdx = 0;
  while (current.length > 1) {
    const result = playSeededRound(current, roundIdx);
    byRound.push(result.losers);
    current = result.winners;
    roundIdx++;
  }
  byRound.push(current);

  return {
    winner: current[0]?.ref,
    runnerUp: byRound[byRound.length - 2]?.[0]?.ref,
    semifinalists: (byRound[byRound.length - 3] || []).map(p => p.ref),
    byRound: byRound.map(arr => arr.map(p => p.ref)),
    surprises,
  };
}

export function simulateRoundFast(players, surprisesList, roundIdx) {
  // Pair sequentially (already shuffled / sorted before)
  // For more variety in pairings, shuffle here
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const winners = [];
  const losers = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];
    if (!b) { winners.push(a); continue; }
    const diff = a.strength - b.strength;
    // Courbe logistique commune (aiWinProb), calée sur le moteur de match du joueur.
    // diff=5 → ~0.75, diff=10 → ~0.90, diff=15 → ~0.97.
    const pA = aiWinProb(diff);
    const aWins = Math.random() < pA;
    winners.push(aWins ? a : b);
    losers.push(aWins ? b : a);
    if (Math.abs(diff) > 12 && surprisesList.length < 3) {
      const upset = (diff > 0 && !aWins) || (diff < 0 && aWins);
      if (upset) surprisesList.push({
        winner: aWins ? a.ref : b.ref,
        loser: aWins ? b.ref : a.ref,
        round: roundIdx,
      });
    }
  }
  return { winners, losers };
}

export function generateTournamentArticle(tourn, winner, runnerUp, semifinalists, surprises, fmt) {
  if (!winner) {
    return {
      id: "article_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      week: tourn.week,
      title: tourn.name + " annulé cette semaine",
      body: "Le tournoi n'a pas pu être organisé.",
      tournament: tourn.name, tier: tourn.tier, surface: tourn.surface, city: tourn.city,
      winner: { name: "—", flag: "" },
      icon: "ban",
    };
  }

  const tname = tourn.name;
  const w = winner.nat.flag + " " + winner.name;
  const r = runnerUp ? runnerUp.nat.flag + " " + runnerUp.name : "un finaliste";
  const wName = winner.name;
  const rName = runnerUp ? runnerUp.name : "son adversaire";
  const surface = tourn.surface.toLowerCase();
  const tier = tierLabel(tourn.tier);
  const city = tourn.city;
  const prize = tourn.prize.toLocaleString();
  const points = tourn.points;

  // Title templates (lots of variety)
  const titleTemplates = [
    wName + " sacré au " + tname + " !",
    wName + " triomphe au " + tname,
    tname + " : " + wName + " couronné",
    wName + " s'impose au " + tname,
    "Quel parcours ! " + wName + " gagne le " + tname,
    tname + " : la consécration pour " + wName,
    wName + " roi du " + tname,
    "Titre " + tname + " pour " + wName,
    tname + " : " + wName + " marche sur l'eau",
    wName + " ajoute le " + tname + " à son palmarès",
    "Le " + tname + " sourit à " + wName,
    "Domination " + wName + " au " + tname,
  ];

  // Random intro - varies the angle
  const introAngles = ["technical", "emotional", "career", "context", "scoring"];
  const angle = introAngles[Math.floor(Math.random() * introAngles.length)];

  let body = "";

  if (angle === "technical") {
    const techIntros = [
      "Une finale d'un excellent niveau au " + tname + ", marquée par des échanges intenses sur " + surface + ".",
      "Sur la surface " + surface + " de " + city + ", " + w + " a déployé un jeu remarquable.",
      "Le " + tier + " de " + city + " a tenu toutes ses promesses techniques.",
      "Magnifique tennis pratiqué cette semaine au " + tname + " par " + w + ".",
    ];
    body = techIntros[Math.floor(Math.random() * techIntros.length)];
  } else if (angle === "emotional") {
    const emoIntros = [
      "Quelle émotion au " + tname + " ! " + w + " a su faire la différence dans les moments-clés.",
      "Soir de gloire pour " + w + " qui s'adjuge le " + tname + ".",
      "Un parcours de cœur pour " + w + ", qui repart de " + city + " avec un nouveau trophée.",
      w + " repart avec le sourire après une semaine intense au " + tname + ".",
    ];
    body = emoIntros[Math.floor(Math.random() * emoIntros.length)];
  } else if (angle === "career") {
    const careerIntros = [
      w + " confirme son statut en remportant le " + tname + " cette année.",
      "Avec ce nouveau titre au " + tname + ", " + w + " consolide sa place parmi l'élite.",
      "Étape importante pour " + w + ", qui ajoute le " + tname + " à son palmarès.",
      "Le " + tname + " entre dans la collection de " + w + ".",
    ];
    body = careerIntros[Math.floor(Math.random() * careerIntros.length)];
  } else if (angle === "context") {
    const contextIntros = [
      "Dans une ambiance survoltée à " + city + ", " + w + " a fini par s'imposer.",
      "Sur le " + surface + " du " + tname + ", " + w + " a su s'adapter aux conditions particulières.",
      "Le public de " + city + " a assisté à un beau spectacle, conclu par la victoire de " + w + ".",
      "La " + tier + " de " + city + " a couronné " + w + " au terme d'une finale disputée.",
    ];
    body = contextIntros[Math.floor(Math.random() * contextIntros.length)];
  } else {
    const scoreIntros = [
      w + " s'est défait de " + r + " en finale du " + tname + ".",
      "C'est " + w + " qui a fini par avoir le dernier mot face à " + r + ".",
      "Au terme d'une finale serrée, " + w + " a dominé " + r + ".",
      "Finale tendue mais " + w + " a su faire la différence face à " + r + ".",
    ];
    body = scoreIntros[Math.floor(Math.random() * scoreIntros.length)];
  }

  // Random additional context (varied)
  const middleParts = [];
  if (semifinalists.length > 0 && Math.random() < 0.6) {
    const sfNames = semifinalists.slice(0, 2).map(s => s.nat.flag + " " + s.name).join(" et ");
    const sfPhrases = [
      " En demi-finale, " + w + " avait écarté la résistance de " + sfNames + ".",
      " Les deux finalistes avaient préalablement écarté " + sfNames + " en demi-finales.",
      " " + sfNames + " s'arrêtent en demi-finale.",
      " Demi-finalistes éliminés : " + sfNames + ".",
    ];
    middleParts.push(sfPhrases[Math.floor(Math.random() * sfPhrases.length)]);
  }
  if (surprises.length > 0 && Math.random() < 0.5) {
    const surp = surprises[0];
    const surpPhrases = [
      " La grosse surprise du tournoi reste " + surp.winner.nat.flag + " " + surp.winner.name + " qui avait éliminé " + surp.loser.nat.flag + " " + surp.loser.name + " dans les premiers tours.",
      " On retiendra aussi l'exploit de " + surp.winner.nat.flag + " " + surp.winner.name + " contre " + surp.loser.nat.flag + " " + surp.loser.name + ", coup de tonnerre du tournoi.",
      " Mention spéciale à " + surp.winner.nat.flag + " " + surp.winner.name + ", auteur d'une belle remontada face à " + surp.loser.nat.flag + " " + surp.loser.name + ".",
    ];
    middleParts.push(surpPhrases[Math.floor(Math.random() * surpPhrases.length)]);
  }
  // Surface-related comment (sometimes)
  if (Math.random() < 0.3) {
    const surfacePhrases = {
      "Terre battue": [" La terre battue de " + city + " a tenu ses promesses cette semaine.", " Une terre battue lourde qui a favorisé les longs échanges."],
      "Dur": [" Le dur rapide de " + city + " a récompensé l'agressivité.", " Conditions rapides idéales pour les puissants serveurs."],
      "Gazon": [" Le gazon de " + city + ", capricieux, a fait des dégâts cette semaine.", " Un gazon glissant qui a piégé plus d'un favori."],
      "Indoor": [" Conditions indoor parfaites pour les puissants frappeurs.", " L'ambiance feutrée du tournoi indoor a fait son effet."],
    };
    const pool = surfacePhrases[tourn.surface] || [];
    if (pool.length > 0) middleParts.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  body += middleParts.join("");

  // Closing - prize and points (sometimes omitted)
  if (Math.random() < 0.6) {
    const closings = [
      " " + w + " empoche " + prize + "€ et " + points + " points ATP.",
      " À la clé : " + prize + "€ et " + points + " points pour le vainqueur.",
      " Le sacre rapporte à " + w + " la somme de " + prize + "€ et " + points + " points ATP.",
    ];
    body += closings[Math.floor(Math.random() * closings.length)];
  }

  const title = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];

  return {
    id: "article_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    week: tourn.week,
    title,
    body,
    tournament: tourn.name,
    tier: tourn.tier,
    surface: tourn.surface,
    city: tourn.city,
    winner: { name: winner.name, flag: winner.nat.flag },
    icon: tourn.tier === "GrandSlam" ? "trophy" : tourn.tier === "Masters1000" ? "award" : "racquet",
  };
}
