// Petits formats d'affichage partagés.
import { ALL_TOURNAMENTS, getTournamentFormat } from "../engine/circuit.js";

// Premium SVG line chart with gradient area, dots, and smooth curve
// Round in which a history match was PLAYED (a quarter-final loss is a
// "Quarts", a round-of-16 win is a "8es"). Older saves stored the round
// reached, so it is converted back when needed.
export function historyRoundLabel(m) {
  if (m.playedRound) return m.playedRound;
  if (!m.won || !m.round || /^Q\d/.test(m.round)) return m.round || "";
  const t = ALL_TOURNAMENTS.find(x => x.name === m.tournament);
  const rounds = t ? getTournamentFormat(t).mainRounds : null;
  if (!rounds) return m.round;
  if (m.round === "Vainqueur") return rounds[rounds.length - 1];
  const i = rounds.indexOf(m.round);
  return i > 0 ? rounds[i - 1] : m.round;
}

// Name as shown in rankings, like every other player: "J. Tipsarević".
export function rankingName(name) {
  const n = (name || "").trim();
  const i = n.indexOf(" ");
  if (i <= 0) return n;
  const first = n.slice(0, i);
  if (/^[A-ZÀ-Ý]\.$/.test(first)) return n; // already abbreviated
  return first[0].toUpperCase() + ". " + n.slice(i + 1).trim();
}
