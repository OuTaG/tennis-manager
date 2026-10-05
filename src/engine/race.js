// Race (points de l'année civile) et expiration des points.
import { totalAtpPoints } from "./player.js";

// Les points d'un tournoi joué par le joueur humain comptent à partir de la
// semaine suivante (comme ceux des tournois simulés au passage de semaine) :
// on les date donc de S+1, pour qu'ils tombent 52 semaines plus tard au même
// moment où les nouveaux points de ce tournoi sont appliqués.
// ─── RACE ─────────────────────────────────────────────────────────────────
// Points gagnés depuis le 1er janvier de l'année en cours.
export function racePointsOf(log, year) {
  let t = 0;
  for (const e of (log || [])) if (e.year === year) t += (e.pts ?? e.points) || 0;
  return t;
}
export function raceStandings(db, year) {
  return (db || []).map(p => ({ p, pts: racePointsOf(p.pointsLog, year) }))
    .sort((a, b) => b.pts - a.pts || (b.p.points || 0) - (a.p.points || 0));
}
// Rang du joueur humain à la Race.
export function playerRaceRank(player, db) {
  if (!player || !db) return 9999;
  const mine = racePointsOf(player.atpPointsLog, player.year);
  // À égalité (début d'année, tout le monde à 0), c'est le classement de fin
  // de saison précédente qui départage, comme pour les joueurs IA.
  const myTotal = totalAtpPoints(player.atpPointsLog || []);
  let rank = 1;
  for (const p of db) {
    const r = racePointsOf(p.pointsLog, player.year);
    if (r > mine || (r === mine && (p.points || 0) > myTotal)) rank++;
  }
  return rank;
}

export function pointsWeekAfter(week, year) {
  return week >= 52 ? { week: 1, year: year + 1 } : { week: week + 1, year };
}

export function expireOldPoints(log, currentWeek, currentYear) {
  return log.filter(e => {
    const weeksAgo = (currentYear - e.year) * 52 + (currentWeek - e.week);
    return weeksAgo < 52;
  });
}
