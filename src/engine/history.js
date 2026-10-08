// Historique des tournois joués.
import { ALL_TOURNAMENTS } from "./circuit.js";

// Retrouve un tournoi du calendrier à partir de son nom (historiques).
// Anciennes sauvegardes : reconstitue les gains par édition (tournoi + semaine
// + année) à partir de l'historique de matchs conservé.
export function tournamentEarningsFromHistory(matchHistory) {
  const map = new Map();
  for (const m of matchHistory || []) {
    const key = m.tournament + "|" + m.week + "|" + m.year;
    // matchHistory va du plus récent au plus ancien : le premier match vu
    // est le dernier joué dans ce tournoi (tour atteint).
    const e = map.get(key) || { tid: tournamentIdByName(m.tournament), name: m.tournament, week: m.week, year: m.year, prize: 0, round: m.round, won: m.won };
    e.prize += m.prize || 0;
    map.set(key, e);
  }
  return [...map.values()];
}

export function tournamentIdByName(name) {
  const t = ALL_TOURNAMENTS.find(x => x.name === name);
  return t ? t.id : null;
}

// Dernier tour joué dans une édition de tournoi : « Vainqueur », « Éliminé en
// quarts »… ; null si inconnu. ongoing : le tournoi est encore en cours.
export function tournamentOutcome(e, matchHistory) {
  let round = e.round, won = e.won;
  if (round === undefined) {
    const m = (matchHistory || []).find(x => x.tournament === e.name && x.week === e.week && x.year === e.year);
    if (!m) return null;
    round = m.round; won = m.won;
  }
  if (!round) return null;
  if (round === "Vainqueur") return { label: "Vainqueur", title: true };
  const label = /^Q\d+$/.test(round) ? "Qualif " + round.slice(1) : round;
  return { label, title: false, ongoing: !!won };
}
