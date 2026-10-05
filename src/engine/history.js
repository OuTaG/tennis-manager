// Historique des tournois joués.
import { ALL_TOURNAMENTS } from "./circuit.js";

// Retrouve un tournoi du calendrier à partir de son nom (historiques).
// Anciennes sauvegardes : reconstitue les gains par édition (tournoi + semaine
// + année) à partir de l'historique de matchs conservé.
export function tournamentEarningsFromHistory(matchHistory) {
  const map = new Map();
  for (const m of matchHistory || []) {
    const key = m.tournament + "|" + m.week + "|" + m.year;
    const e = map.get(key) || { tid: tournamentIdByName(m.tournament), name: m.tournament, week: m.week, year: m.year, prize: 0 };
    e.prize += m.prize || 0;
    map.set(key, e);
  }
  return [...map.values()];
}

export function tournamentIdByName(name) {
  const t = ALL_TOURNAMENTS.find(x => x.name === name);
  return t ? t.id : null;
}
