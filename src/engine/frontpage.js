// La une du journal d'accueil : l'article principal et les dépêches.
// Fonctions pures : elles lisent l'état du joueur et le fil d'actualité.
import { tierLabel } from "./circuit.js";

const lastName = (name) => (name || "").trim().split(/\s+/).pop() || name || "";
const absWeek = (y, w) => (y || 0) * 52 + (w || 0);

// Article principal, du plus important au plus banal :
// blessure qui empêche de jouer, titre, finale perdue, exploit, élimination
// récente, tournoi à venir, puis un papier sur le classement.
// Renvoie { kicker, title, deck, tone } (tone : "clay" | "green" | "blue" | "red").
export function buildFrontPage({ player, ranking, enrolled }) {
  const name = player.name;
  const ln = lastName(name);
  const injury = player.injury;
  if (injury && !injury.canPlay) {
    return {
      kicker: "Infirmerie",
      title: ln + " à l'arrêt",
      deck: injury.label + ". Retour espéré dans " + injury.weeksRemaining + " semaine" + (injury.weeksRemaining > 1 ? "s" : "") + ".",
      tone: "red",
    };
  }

  const last = (player.matchHistory || [])[0];
  const recent = last && absWeek(player.year, player.week) - absWeek(last.year, last.week) <= 1;
  if (recent && !last.isQualifying) {
    const where = last.city ? " à " + last.city : "";
    const tier = last.tierWon ? tierLabel(last.tierWon) : "";
    const kicker = [tier, last.surface].filter(Boolean).join(" · ");
    if (last.won && last.round === "Vainqueur") {
      return {
        kicker: kicker || "Titre",
        title: "Sacre de " + ln + where,
        deck: name + " remporte le " + last.tournament + " face à " + last.opponent + " (" + last.score + ").",
        tone: "green",
      };
    }
    if (!last.won && last.playedRound === "Finale") {
      return {
        kicker: kicker || "Finale",
        title: "Si près du titre",
        deck: "Battu en finale du " + last.tournament + " par " + last.opponent + " (" + last.score + ").",
        tone: "clay",
      };
    }
    if (last.won && last.opponentRank && last.opponentRank <= 20 && last.opponentRank < ranking) {
      return {
        kicker: kicker || "Exploit",
        title: ln + " fait tomber le n° " + last.opponentRank,
        deck: "Victoire sur " + last.opponent + " (" + last.score + ") au " + last.tournament + ", " + (last.playedRound || "").toLowerCase() + ".",
        tone: "green",
      };
    }
    if (!last.won) {
      return {
        kicker: kicker || "Résultat",
        title: "Fin de parcours" + where,
        deck: name + " s'incline face à " + last.opponent + " (" + last.score + ") en " + (last.playedRound || "").toLowerCase() + ".",
        tone: "clay",
      };
    }
  }

  if (enrolled) {
    const status = player.enrollment?.entryStatus === "qualifying" ? " Passage par les qualifications."
      : player.enrollment?.entryStatus === "wildcard" ? " Invité grâce à une wildcard." : "";
    return {
      kicker: tierLabel(enrolled.tier) + " · " + enrolled.surface,
      title: "Cap sur " + enrolled.city,
      deck: name + " est inscrit au " + enrolled.name + ", semaine " + enrolled.week + "." + status,
      tone: "blue",
    };
  }

  if (!ranking || ranking > 1000) {
    return {
      kicker: "Portrait",
      title: "Tout commence ici",
      deck: name + ", " + player.age + " ans, part de " + player.location + " sans le moindre point. Premier objectif : un tournoi à sa portée.",
      tone: "blue",
    };
  }
  return {
    kicker: "Classement",
    title: ln + ", n° " + ranking + " mondial",
    deck: "Aucun tournoi au programme pour l'instant. Le circuit n'attend pas : le calendrier est ouvert.",
    tone: "blue",
  };
}

// Dépêches : les dernières nouvelles du circuit (fil « Monde »).
// Renvoie [{ rubric, text }].
export function pickDispatches(news, count = 3) {
  const out = [];
  for (const n of news || []) {
    if (out.length >= count) break;
    if (n.feed && n.feed !== "world") continue;
    const text = String(n.content || "").replace(/^[^\p{L}\p{N}«"]+/u, "").trim();
    if (!text) continue;
    const rubric = String(n.id || "").startsWith("post_ret_") ? "Retraite"
      : n.tournamentMeta ? "Résultats" : "Circuit";
    out.push({ rubric, text });
  }
  return out;
}
