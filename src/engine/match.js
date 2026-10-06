// Moteur de match : points, jeux, tie-breaks, momentum.
import { random } from "./rng.js";
import { doubleFaultRate, tacticsBonus, tacticsEnergy, tacticsShape } from "./tactics.js";

// ─── INTERACTIVE MATCH ENGINE ─────────────────────────────────────────────────
// No more pre-scripted matches. Each game is computed live based on current state.

// ─── MATCH ENGINE : SERVICE vs RETOUR ─────────────────────────────────────
// Chaque point se joue entre la note de SERVICE du serveur et la note de
// RETOUR du relanceur. La probabilité de gagner un point sur son service part
// d'une base propre à la surface, puis est déplacée par l'écart (courbe
// logistique). Un joueur largement supérieur gagne ainsi plus de 50 % des
// points sur le service adverse (il breake souvent), tandis qu'à niveau égal
// le serveur garde l'avantage (~80 % de jeux de service tenus sur dur).
export const MOMENTUM_WEIGHT = 0.8;   // 1 point de momentum = +0.8 de note
export const MOMENTUM_CAP = 5;        // momentum borné à ±5
export const MATCH_SLOPE = 30;        // pente de la logistique (plus grand = plus d'aléas)
export const DAILY_FORM_SD = 4;       // écart-type de la "forme du jour" (caché)
export const SURFACE_SERVE_POINT = { "Gazon": 0.67, "Indoor": 0.66, "Dur": 0.645, "Terre battue": 0.62 };

export function serveRating(s) {
  return 0.45 * s.serve + 0.20 * s.forehand + 0.15 * (s.net ?? 50) + 0.20 * s.mental;
}
export function returnRating(s) {
  return 0.30 * s.forehand + 0.30 * s.backhand + 0.20 * s.stamina + 0.20 * s.mental;
}
export function clampMomentum(v) { return Math.max(-MOMENTUM_CAP, Math.min(MOMENTUM_CAP, v)); }
export function gaussian() {
  const u = 1 - random(), v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export function rollDailyForm() {
  return Math.max(-2.5 * DAILY_FORM_SD, Math.min(2.5 * DAILY_FORM_SD, gaussian() * DAILY_FORM_SD));
}
// Bonus situationnel commun (énergie + momentum + forme du jour), en points de note.
export function situationalBonus(energy, momentum, form) {
  return (energy - 70) * 0.08 + clampMomentum(momentum || 0) * MOMENTUM_WEIGHT + (form || 0);
}
// Probabilité que le SERVEUR gagne un point donné.
// Affinité style/surface : les profils "serveurs" (service > retour) sont
// avantagés sur surface rapide, les profils "relanceurs" sur terre battue.
export const SURFACE_STYLE_FACTOR = { "Gazon": 0.35, "Indoor": 0.2, "Dur": 0, "Terre battue": -0.35 };
export function surfaceStyleBonus(stats, surface) {
  const k = SURFACE_STYLE_FACTOR[surface] ?? 0;
  return k * (serveRating(stats) - returnRating(stats)) / 2;
}
export function servePointProb(serverStats, receiverStats, surface, serverBonus, receiverBonus) {
  const base = SURFACE_SERVE_POINT[surface] ?? SURFACE_SERVE_POINT["Dur"];
  const sB = serverBonus + surfaceStyleBonus(serverStats, surface);
  const rB = receiverBonus + surfaceStyleBonus(receiverStats, surface);
  const diff = (serveRating(serverStats) + sB) - (returnRating(receiverStats) + rB);
  const logit = Math.log(base / (1 - base)) + diff / MATCH_SLOPE;
  return Math.max(0.2, Math.min(0.9, 1 / (1 + Math.exp(-logit))));
}
// Force d'un joueur dans le moteur de match sur une surface donnée : moyenne
// de ses notes de service et de retour, plus son affinité style/surface.
// C'est exactement ce que pèse servePointProb point après point, si bien que
// les matchs simulés entre joueurs IA suivent les mêmes règles que ceux du
// joueur (spécialistes de la terre, rois du gazon…).
export function matchStrength(stats, surface) {
  return (serveRating(stats) + returnRating(stats)) / 2 + surfaceStyleBonus(stats, surface);
}
// Probabilité de victoire pour les matchs simulés entre joueurs IA (écart de
// matchStrength). Calibrée sur le moteur ci-dessus ; en 3 sets gagnants le
// plus fort s'impose un peu plus souvent.
export function aiWinProb(diff, bestOfFive = false) {
  return Math.max(0.01, Math.min(0.99, 1 / (1 + Math.exp(-diff / (bestOfFive ? 4.1 : 4.5)))));
}
// Probabilité que A batte B (deux joueurs IA) sur cette surface.
export function aiMatchProb(statsA, statsB, surface, bestOfFive = false) {
  return aiWinProb(matchStrength(statsA, surface) - matchStrength(statsB, surface), bestOfFive);
}

// ─── POINT-BY-POINT SIMULATION ────────────────────────────────────────────
// The match engine decides game/tiebreak WINNERS via probabilities. To power
// the rally animation and the point-by-point scoreboard, we additionally
// generate a believable sequence of individual points whose tally is coherent
// with the decided winner. Each point also carries a short "rally" descriptor
// (number of exchanges + how it ended) so the animation has something to play.

// Tennis point labels for a standard game.
export const POINT_LABELS = ["0", "15", "30", "40"];

// How a point ended — drives the rally animation's finish.
// "ace"/"winner" = quick, "rally"/"long_rally" = more exchanges, "error" = fault.
// Le profil compte : un gros service fait plus d'aces, surtout sur surface
// rapide ; la terre battue allonge les échanges, le gazon les raccourcit.
export const SURFACE_ACE_FACTOR = { "Gazon": 1.5, "Indoor": 1.25, "Dur": 1, "Terre battue": 0.6 };
export const SURFACE_RALLY_FACTOR = { "Gazon": 0.6, "Indoor": 0.8, "Dur": 1, "Terre battue": 1.5 };
// shape = { serve: note de service du serveur, surface }
export function rollPointKind(winnerServing, rng, shape = {}) {
  const longF = (SURFACE_RALLY_FACTOR[shape.surface] ?? 1) * (shape.longMul ?? 1);
  const r = rng();
  if (winnerServing) {
    const aceF = (SURFACE_ACE_FACTOR[shape.surface] ?? 1) * (shape.aceMul ?? 1);
    const ace = Math.max(0.03, Math.min(0.35, 0.13 * aceF * (1 + ((shape.serve ?? 70) - 70) / 40)));
    const long = 0.10 * longF;
    const k = (1 - ace - long) / 0.74; // winner / error / rally : 26 / 26 / 22
    if (r < ace) return { kind: "ace", rallies: 1 };
    if (r < ace + 0.26 * k) return { kind: "winner", rallies: 2 + Math.floor(rng() * 3) };
    if (r < ace + 0.52 * k) return { kind: "error", rallies: 3 + Math.floor(rng() * 4) };
    if (r < 1 - long)  return { kind: "rally", rallies: 4 + Math.floor(rng() * 5) };
    return { kind: "long_rally", rallies: 8 + Math.floor(rng() * 8) };
  }
  const long = 0.14 * longF;
  const k = (1 - 0.04 - long) / 0.82; // winner / error / rally : 30 / 28 / 24
  if (r < 0.04) return { kind: "ace", rallies: 1 }; // return-game ace is rare
  if (r < 0.04 + 0.30 * k) return { kind: "winner", rallies: 3 + Math.floor(rng() * 4) };
  if (r < 0.04 + 0.58 * k) return { kind: "error", rallies: 3 + Math.floor(rng() * 5) };
  if (r < 1 - long) return { kind: "rally", rallies: 5 + Math.floor(rng() * 6) };
  return { kind: "long_rally", rallies: 9 + Math.floor(rng() * 9) };
}
// Profil du point pour rollPointKind, selon qui sert.
export function pointShape(ctx, playerServes) {
  if (!ctx) return {};
  const ts = ctx.tactics ? tacticsShape(ctx.tactics) : { aceMul: 1, longMul: 1 };
  return { serve: (playerServes ? ctx.playerStats : ctx.oppStats)?.serve, surface: ctx.surface, aceMul: playerServes ? ts.aceMul : 1, longMul: ts.longMul };
}

// Build a sequence of points for ONE game given who eventually wins it.
// pPointWin = per-point probability the PLAYER wins the point. We keep sampling
// points until someone "wins" the game; if the resulting winner contradicts the
// decided outcome, we resample (capped). Fallback forces the intended winner.
export function buildGamePoints(playerWon, isPlayerServing, pPointWin, shape = {}) {
  const rng = random;
  for (let attempt = 0; attempt < 24; attempt++) {
    const points = [];
    let pp = 0, op = 0;
    let guard = 0;
    while (guard++ < 60) {
      const playerPt = rng() < pPointWin;
      if (playerPt) pp++; else op++;
      const winner = playerPt ? "p" : "o";
      const pk = rollPointKind(playerPt === isPlayerServing, rng, shape);
      let label;
      if (pp >= 3 && op >= 3) {
        if (pp === op) label = "ÉGALITÉ";
        else if (pp > op) label = "AV. JOUEUR";
        else label = "AV. ADV.";
      } else {
        label = POINT_LABELS[Math.min(3, pp)] + "-" + POINT_LABELS[Math.min(3, op)];
      }
      points.push({ winner, kind: pk.kind, rallies: pk.rallies, label, servingPlayer: isPlayerServing });
      const gameOver = (pp >= 4 && pp - op >= 2) || (op >= 4 && op - pp >= 2);
      if (gameOver) {
        // Relabel the deciding point as "JEU" for clarity.
        points[points.length - 1].label = "JEU";
        const pWonGame = pp > op;
        if (pWonGame === playerWon) return points;
        break;
      }
    }
  }
  const pts = [];
  for (let i = 0; i < 4; i++) {
    const winner = playerWon ? "p" : "o";
    const pk = rollPointKind((winner === "p") === isPlayerServing, random, shape);
    const lp = playerWon ? POINT_LABELS[Math.min(3, i + 1)] : "0";
    const lo = playerWon ? "0" : POINT_LABELS[Math.min(3, i + 1)];
    pts.push({ winner, kind: pk.kind, rallies: pk.rallies, label: i === 3 ? "JEU" : (lp + "-" + lo), servingPlayer: isPlayerServing });
  }
  return pts;
}

// Build the point sequence for a tiebreak given final pPts/oPts.
// Builds the displayed tiebreak points from the ACTUAL simulated sequence of
// point winners, so the score shown can never reach an end condition early.
export function buildTiebreakPoints(seq, firstServerIsPlayer, ctx) {
  const rng = random;
  let pc = 0, oc = 0;
  return seq.map((winner, i) => {
    if (winner === "p") pc++; else oc++;
    const served = i === 0 ? firstServerIsPlayer : (Math.floor((i + 1) / 2) % 2 === 0) === firstServerIsPlayer;
    const pk = rollPointKind((winner === "p") === served, rng, pointShape(ctx, served));
    return { winner, kind: pk.kind, rallies: pk.rallies, label: pc + "-" + oc, servingPlayer: served };
  });
}

// Compute single game result given current state.
// Returns { playerWon, points } — `points` is the point-by-point sequence.
// Probabilité que le JOUEUR gagne le point, selon qui sert.
// Le plan de jeu du joueur (ctx.tactics, voir engine/tactics.js) s'ajoute à
// son bonus ; au service, les doubles fautes du réglage « 1re balle » ôtent
// une part des points.
export function playerPointProb(ctx, playerServes) {
  const tb = ctx.tactics ? tacticsBonus(ctx.tactics, ctx.playerStats, ctx.oppStats, ctx.surface, playerServes) : 0;
  const pB = situationalBonus(ctx.playerEnergy, ctx.playerMomentum, ctx.playerForm) + tb;
  const oB = situationalBonus(ctx.oppEnergy, ctx.oppMomentum, ctx.oppForm);
  if (playerServes) {
    const df = ctx.tactics ? doubleFaultRate(ctx.tactics, ctx.playerEnergy) : 0;
    return servePointProb(ctx.playerStats, ctx.oppStats, ctx.surface, pB, oB) * (1 - df);
  }
  return 1 - servePointProb(ctx.oppStats, ctx.playerStats, ctx.surface, oB, pB);
}

// ctx = { playerStats, oppStats, surface, playerEnergy, oppEnergy,
//         playerMomentum, oppMomentum, playerForm, oppForm }
// opts.stopOnAdvantage : s'arrêter dès que le joueur obtient l'avantage
//   (point décisif joué en mini-jeu) → { pending: true, pp, op, points }.
// opts.start = { pp, op, points } : reprendre un jeu interrompu.
export function playOneGame(ctx, isPlayerServing, forceLoss = false, opts = {}) {
  const pPoint = playerPointProb(ctx, isPlayerServing);
  const shape = pointShape(ctx, isPlayerServing);
  // Le jeu est simulé point par point : le vainqueur découle des points.
  const rng = random;
  const points = opts.start ? [...opts.start.points] : [];
  let pp = opts.start ? opts.start.pp : 0, op = opts.start ? opts.start.op : 0;
  if ((pp >= 4 && pp - op >= 2) || (op >= 4 && op - pp >= 2)) return { playerWon: pp > op, points };
  while (true) {
    const playerPt = rng() < pPoint;
    if (playerPt) pp++; else op++;
    const pk = rollPointKind(playerPt === isPlayerServing, rng, shape);
    let label;
    if (pp >= 3 && op >= 3) label = pp === op ? "ÉGALITÉ" : pp > op ? "AV. JOUEUR" : "AV. ADV.";
    else label = POINT_LABELS[Math.min(3, pp)] + "-" + POINT_LABELS[Math.min(3, op)];
    points.push({ winner: playerPt ? "p" : "o", kind: pk.kind, rallies: pk.rallies, label, servingPlayer: isPlayerServing });
    if ((pp >= 4 && pp - op >= 2) || (op >= 4 && op - pp >= 2)) {
      points[points.length - 1].label = "JEU";
      break;
    }
    if (opts.stopOnAdvantage && !forceLoss && pp >= 3 && op >= 3 && pp - op === 1) {
      return { pending: true, pp, op, points };
    }
  }
  const playerWon = pp > op;
  // Match truqué : le joueur ne doit pas gagner ce jeu.
  if (forceLoss && playerWon) {
    return { playerWon: false, points: buildGamePoints(false, isPlayerServing, 0.3, shape) };
  }
  return { playerWon, points };
}

// opts.mentalChance : sur chaque balle de set (pour l'un ou l'autre), chance
//   de s'arrêter pour un mini-jeu mental → { pending: true, pPts, oPts, seq }.
// opts.start = { pPts, oPts, seq, next } : reprendre un tie-break interrompu,
//   next = vainqueur ("p" ou "o") du point joué en mini-jeu.
export function playOneTiebreak(ctx, target, firstServerIsPlayer = true, forceLoss = false, opts = {}) {
  let pPts = opts.start ? opts.start.pPts : 0, oPts = opts.start ? opts.start.oPts : 0;
  const seq = opts.start ? [...opts.start.seq] : [];
  let forced = opts.start ? opts.start.next : null;
  while (true) {
    const decisive = (pPts + 1 >= target && pPts + 1 - oPts >= 2) || (oPts + 1 >= target && oPts + 1 - pPts >= 2);
    if (!forced && decisive && !forceLoss && opts.mentalChance && random() < opts.mentalChance) {
      return { pending: true, pPts, oPts, seq };
    }
    // Server of this point: first server serves 1 point, then 2 each.
    const ptIdx = pPts + oPts;
    const playerServes = ((Math.floor((ptIdx + 1) / 2) % 2) === 0) === firstServerIsPlayer;
    const pWin = playerPointProb(ctx, playerServes);
    let playerTakes = forced ? forced === "p" : random() < (forceLoss ? 0.3 : pWin);
    forced = null;
    // Thrown match: the player never gets the point that would win the tiebreak.
    if (forceLoss && playerTakes && pPts + 1 >= target && pPts + 1 - oPts >= 2) playerTakes = false;
    if (playerTakes) { pPts++; seq.push("p"); }
    else { oPts++; seq.push("o"); }
    if (pPts >= target && pPts - oPts >= 2) { const points = buildTiebreakPoints(seq, firstServerIsPlayer, ctx); return { pPts, oPts, playerWon: true, points }; }
    if (oPts >= target && oPts - pPts >= 2) { const points = buildTiebreakPoints(seq, firstServerIsPlayer, ctx); return { pPts, oPts, playerWon: false, points }; }
  }
}

// Main function: advance ONE game in the live match, using current state
// opts.allowMiniGame : ce jeu peut s'interrompre sur un avantage du joueur
// (renvoie { pending: true, … } et garde le jeu dans m.pendingGame).
// Pour reprendre : m.pendingGame.miniGameWon = true/false, puis rappeler la
// fonction. Gagné → le joueur remporte le jeu ; perdu → retour à égalité,
// la fin du jeu se joue normalement.
export function advanceMatchOneGame(matchData, playerStats, oppStats, opts = {}) {
  const m = matchData;
  if (m.matchComplete) return { gameType: "noop", score: { p: 0, o: 0 } };
  const resume = m.pendingGame && typeof m.pendingGame.miniGameWon === "boolean" ? m.pendingGame : null;
  if (resume) delete m.pendingGame;
  // Currently playing set
  let curSet = m.sets[m.sets.length - 1];
  if (!curSet || curSet.completed) {
    curSet = { pGames: 0, oGames: 0, gameLog: [], completed: false, winner: null, tiebreak: null };
    m.sets.push(curSet);
  }

  // Qui sert : le service alterne à chaque jeu, sans repartir à zéro entre
  // deux sets. Après un tie-break, sert celui qui a relancé le premier point.
  // (Anciennes sauvegardes sans nextServerIsPlayer : ancienne règle.)
  let isPlayerServing = resume ? resume.isPlayerServing : m.nextServerIsPlayer;
  if (typeof isPlayerServing !== "boolean") {
    const setNum = m.sets.length - 1;
    const totalGamesInSet = curSet.pGames + curSet.oGames;
    const firstServerIsPlayer = setNum % 2 === 0 ? m.firstServerIsPlayer : !m.firstServerIsPlayer;
    isPlayerServing = totalGamesInSet % 2 === 0 ? firstServerIsPlayer : !firstServerIsPlayer;
  }
  m.nextServerIsPlayer = !isPlayerServing;

  // Apply effective stats (with persistent effects)
  const effPlayerStats = { ...playerStats };
  if (m.persistentDebuff) {
    Object.keys(effPlayerStats).forEach(k => effPlayerStats[k] -= m.persistentDebuff);
  }

  // Check tiebreak
  if (curSet.pGames === 6 && curSet.oGames === 6) {
    // Set décisif d'un Grand Chelem (5e set en 3 sets gagnants, 3e set chez
    // les femmes) : jeu décisif en 10 points.
    const lastSet = m.isGrandSlam ? 2 : 1;
    const isDecider = m.pSets === lastSet && m.oSets === lastSet;
    const tbTarget = isDecider && (m.isGrandSlam || m.tb10Decider) ? 10 : 7;
    // Server of the first TB point follows the normal serve rotation ; the
    // other player serves first in the next set (already set above).
    const tbFirstServer = isPlayerServing;
    const tbCtx = buildMatchCtx(m, effPlayerStats, oppStats);
    let tb, tbResumeFrom = 0;
    if (resume && resume.isTiebreak) {
      // Reprise après le mini-jeu mental : son point est joué, puis la suite.
      tbResumeFrom = resume.seq.length;
      tb = playOneTiebreak(tbCtx, tbTarget, tbFirstServer, !!m.matchFixThrown, { start: { pPts: resume.pPts, oPts: resume.oPts, seq: resume.seq, next: resume.miniGameWon ? "p" : "o" } });
    } else {
      // Au plus un mini-jeu mental par tie-break, 20 % par balle de set.
      tb = playOneTiebreak(tbCtx, tbTarget, tbFirstServer, !!m.matchFixThrown, { mentalChance: opts.allowTiebreakMental ? 0.2 : 0 });
      if (tb.pending) {
        m.nextServerIsPlayer = isPlayerServing;
        m.pendingGame = { isTiebreak: true, isPlayerServing, pPts: tb.pPts, oPts: tb.oPts, seq: tb.seq, target: tbTarget };
        return { pending: true, gameType: "pending", isTiebreak: true, isPlayerServing, tbTarget, points: buildTiebreakPoints(tb.seq, tbFirstServer, tbCtx), score: { p: curSet.pGames, o: curSet.oGames }, setComplete: false };
      }
    }
    curSet.tiebreak = tb;
    // Momentum : le perdant du set (tie-break) accuse le coup.
    if (tb.playerWon) m.oppMomentum = clampMomentum((m.oppMomentum || 0) - 1);
    else m.playerMomentum = clampMomentum((m.playerMomentum || 0) - 1);
    if (tb.playerWon) { curSet.pGames = 7; curSet.gameLog.push({ playerWon: true, isPlayerServing: false, isTiebreak: true, tbScore: tb.pPts + "-" + tb.oPts, tb }); }
    else { curSet.oGames = 7; curSet.gameLog.push({ playerWon: false, isPlayerServing: false, isTiebreak: true, tbScore: tb.oPts + "-" + tb.pPts, tb }); }
    curSet.completed = true;
    curSet.winner = tb.playerWon ? "p" : "o";
    if (tb.playerWon) m.pSets++;
    else m.oSets++;
    // Check if this tiebreak set ended the match
    const setsToWin = m.isGrandSlam ? 3 : 2;
    if (m.pSets === setsToWin || m.oSets === setsToWin) m.matchComplete = true;
    return { gameType: tb.playerWon ? "tb_won" : "tb_lost", isPlayerServing: false, isTiebreak: true, points: tb.points, resumeFrom: tbResumeFrom, score: { p: curSet.pGames, o: curSet.oGames }, setComplete: true, setWonByPlayer: tb.playerWon, tbScore: (tb.playerWon ? tb.oPts : tb.pPts), tbTarget };
  }

  // Normal game (éventuellement interrompu puis repris sur un point décisif)
  const ctxGame = buildMatchCtx(m, effPlayerStats, oppStats);
  let gameResult;
  let resumeFrom = 0;
  if (resume) {
    resumeFrom = resume.points.length;
    const pts = [...resume.points];
    if (resume.miniGameWon) {
      const pk = rollPointKind(isPlayerServing, random, pointShape(ctxGame, isPlayerServing));
      pts.push({ winner: "p", kind: pk.kind, rallies: pk.rallies, label: "JEU", servingPlayer: isPlayerServing, miniGame: true });
      gameResult = { playerWon: true, points: pts };
    } else {
      const pk = rollPointKind(!isPlayerServing, random, pointShape(ctxGame, isPlayerServing));
      pts.push({ winner: "o", kind: pk.kind, rallies: pk.rallies, label: "ÉGALITÉ", servingPlayer: isPlayerServing, miniGame: true });
      gameResult = playOneGame(ctxGame, isPlayerServing, !!m.matchFixThrown, { start: { pp: resume.pp, op: resume.op + 1, points: pts } });
    }
  } else {
    gameResult = playOneGame(ctxGame, isPlayerServing, !!m.matchFixThrown, { stopOnAdvantage: !!opts.allowMiniGame });
    if (gameResult.pending) {
      // Le jeu attend le mini-jeu : le serveur ne change pas encore.
      m.nextServerIsPlayer = isPlayerServing;
      m.pendingGame = { isPlayerServing, pp: gameResult.pp, op: gameResult.op, points: gameResult.points };
      return { pending: true, gameType: "pending", isPlayerServing, points: gameResult.points, score: { p: curSet.pGames, o: curSet.oGames }, setComplete: false };
    }
  }
  const playerWon = gameResult.playerWon;
  const gamePoints = gameResult.points;
  if (playerWon) curSet.pGames++;
  else curSet.oGames++;

  // Energy drain per game (much smaller now: 1-3 per game)
  // Energy drain per game - reduced by player's stamina stat
  // Base 0.4-1.2 energy per game, reduced if high stamina
  const staminaFactor = Math.max(0.4, 1 - (playerStats.stamina - 50) / 80); // stat 50 = 1.0, stat 90 = 0.5
  const tEnergy = m.tactics ? tacticsEnergy(m.tactics) : { self: 1, opp: 1 };
  m.playerEnergy = Math.max(10, m.playerEnergy - (0.4 + random() * 0.8) * staminaFactor * tEnergy.self);
  m.oppEnergy = Math.max(10, m.oppEnergy - (0.4 + random() * 0.8) * Math.max(0.4, 1 - (oppStats.stamina - 50) / 80) * tEnergy.opp);

  // Apply persistent momentum decay
  if (m.persistMomentumGames > 0) {
    m.persistMomentumGames--;
    if (m.persistMomentumGames === 0) m.playerMomentum = Math.round(m.playerMomentum * 0.5);
  }
  if (m.persistEnergyDrainGames > 0) {
    m.persistEnergyDrainGames--;
    m.playerEnergy = Math.max(0, m.playerEnergy - 1);
  }

  // Momentum naturel : un break donne +1 à celui qui le réalise, puis chaque
  // momentum revient d'un cran vers 0 tous les 3 jeux (sauf effet de dilemme
  // encore actif côté joueur).
  if (!playerWon && isPlayerServing) m.oppMomentum = clampMomentum((m.oppMomentum || 0) + 1);
  if (playerWon && !isPlayerServing) m.playerMomentum = clampMomentum((m.playerMomentum || 0) + 1);
  m.gamesSinceMomentumDecay = (m.gamesSinceMomentumDecay || 0) + 1;
  if (m.gamesSinceMomentumDecay >= 3) {
    m.gamesSinceMomentumDecay = 0;
    const toward0 = v => (v > 0 ? v - 1 : v < 0 ? v + 1 : 0);
    m.oppMomentum = toward0(m.oppMomentum || 0);
    if (!(m.persistMomentumGames > 0)) m.playerMomentum = toward0(m.playerMomentum || 0);
  }
  m.playerMomentum = clampMomentum(m.playerMomentum || 0);

  // Count breaks in current set so far (before this game)
  let playerBreaksInSet = 0, oppBreaksInSet = 0;
  for (const g of curSet.gameLog) {
    if (g.gameType === "break_clean" || g.gameType === "break_grind" || g.gameType === "rebreak") playerBreaksInSet++;
    else if (g.gameType === "lose_serve" || g.gameType === "opp_rebreak") oppBreaksInSet++;
  }

  let gameType, setComplete = false, setWonByPlayer = null;
  // Special commentary for double breaks (taken, or being clawed back).
  let commentType = null;
  const breakDiff = playerBreaksInSet - oppBreaksInSet;
  if (playerWon && !isPlayerServing) {
    if (breakDiff + 1 >= 3) commentType = "triple_break";
    else if (breakDiff + 1 === 2) commentType = "double_break";
    else if (breakDiff === -2) commentType = "rebreak_double";
  } else if (!playerWon && isPlayerServing) {
    if (breakDiff - 1 <= -3) commentType = "opp_triple_break";
    else if (breakDiff - 1 === -2) commentType = "opp_double_break";
    else if (breakDiff === 2) commentType = "opp_rebreak_double";
  }
  if (playerWon) {
    if (isPlayerServing) gameType = random() < 0.7 ? "hold_easy" : "hold_tough";
    else {
      // Player breaks (on opp's serve) - if opp had broken before, this is a rebreak
      if (oppBreaksInSet > playerBreaksInSet) gameType = "rebreak";
      else gameType = random() < 0.6 ? "break_clean" : "break_grind";
    }
  } else {
    if (isPlayerServing) {
      // Player loses serve - is it a debreak by opponent?
      if (playerBreaksInSet > oppBreaksInSet) gameType = "opp_rebreak";
      else gameType = "lose_serve";
    }
    else gameType = "opp_hold";
  }

  const log = { playerWon, isPlayerServing, isTiebreak: false, gameType, points: gamePoints };
  curSet.gameLog.push(log);

  // Check set complete (6 games + 2 ahead, or 7-5)
  if (curSet.pGames >= 6 && curSet.pGames - curSet.oGames >= 2) { curSet.completed = true; curSet.winner = "p"; setComplete = true; setWonByPlayer = true; m.pSets++; }
  else if (curSet.oGames >= 6 && curSet.oGames - curSet.pGames >= 2) { curSet.completed = true; curSet.winner = "o"; setComplete = true; setWonByPlayer = false; m.oSets++; }
  else if (curSet.pGames === 7 && curSet.oGames === 5) { curSet.completed = true; curSet.winner = "p"; setComplete = true; setWonByPlayer = true; m.pSets++; }
  else if (curSet.oGames === 7 && curSet.pGames === 5) { curSet.completed = true; curSet.winner = "o"; setComplete = true; setWonByPlayer = false; m.oSets++; }

  // Momentum : le perdant du set accuse le coup.
  if (setComplete) {
    if (setWonByPlayer) m.oppMomentum = clampMomentum((m.oppMomentum || 0) - 1);
    else m.playerMomentum = clampMomentum((m.playerMomentum || 0) - 1);
  }

  // Check match complete
  const setsToWin = m.isGrandSlam ? 3 : 2;
  if (m.pSets === setsToWin || m.oSets === setsToWin) m.matchComplete = true;

  return { gameType, commentType, isPlayerServing, points: gamePoints, resumeFrom, score: { p: curSet.pGames, o: curSet.oGames }, setComplete, setWonByPlayer, isInjuryNote: false };
}

export function buildMatchCtx(m, playerStats, oppStats) {
  return {
    playerStats, oppStats,
    surface: m.surface || "Dur",
    playerEnergy: m.playerEnergy, oppEnergy: m.oppEnergy,
    playerMomentum: m.playerMomentum || 0, oppMomentum: m.oppMomentum || 0,
    playerForm: m.playerForm || 0, oppForm: m.oppForm || 0,
    tactics: m.tactics || null,
  };
}

export function createInitialMatchData(isGrandSlam, playerEnergy, surface) {
  const firstServer = random() < 0.5;
  return {
    sets: [],
    pSets: 0, oSets: 0,
    matchComplete: false,
    isGrandSlam,
    surface: surface || "Dur",
    // Forme du jour (cachée) : tirée une fois par match pour chaque joueur.
    playerForm: rollDailyForm(),
    oppForm: rollDailyForm(),
    formNoted: false,
    gamesSinceMomentumDecay: 0,
    firstServerIsPlayer: firstServer,
    nextServerIsPlayer: firstServer,
    playerEnergy: playerEnergy,
    oppEnergy: 90 + random() * 10,
    playerMomentum: 0,
    oppMomentum: 0,
    persistentDebuff: 0,
    persistMomentumGames: 0,
    persistEnergyDrainGames: 0,
    dilemmaSchedule: [], // games at which dilemmas trigger
  };
}
