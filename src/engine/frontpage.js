// La une du journal d'accueil : l'article principal et les dépêches.
// Fonctions pures : elles lisent l'état du joueur et le fil d'actualité.
import { tierLabel } from "./circuit.js";

// Tour joué → complément correct : « au premier tour », « en quarts de finale »…
const ROUND_PHRASES = {
  "1er tour": "au premier tour", "2e tour": "au deuxième tour", "3e tour": "au troisième tour",
  "8es de finale": "en huitièmes de finale", "Quarts": "en quarts de finale",
  "Demies": "en demi-finale", "Demi-finale": "en demi-finale", "Finale": "en finale",
};
const ORDINALS = ["premier", "deuxième", "troisième", "quatrième"];
export function roundPhrase(round) {
  if (!round) return "";
  if (ROUND_PHRASES[round]) return ROUND_PHRASES[round];
  const q = /^Qualif\. (\d+)$/.exec(round);
  if (q) return "au " + (ORDINALS[q[1] - 1] || q[1] + "e") + " tour des qualifications";
  if (/^Poules/.test(round)) return "en phase de poules";
  const t = /^Tour (\d+)$/.exec(round);
  if (t) return "au " + (ORDINALS[t[1] - 1] || t[1] + "e") + " tour";
  return "en " + round.toLowerCase();
}


const lastName = (name) => (name || "").trim().split(/\s+/).pop() || name || "";
const absWeek = (y, w) => (y || 0) * 52 + (w || 0);

// Article principal, du plus important au plus banal :
// blessure qui empêche de jouer, titre, finale perdue, exploit, élimination
// récente, tournoi à venir, puis un papier sur le classement.
// Renvoie { kicker, title, deck, tone, caption, quote } (tone : "clay" |
// "green" | "blue" | "red") ; caption et quote habillent la case de BD
// (récitatif et bulle). Pas de hasard ici : l'écran se redessine souvent.
export function buildFrontPage({ player, ranking, enrolled }) {
  const story = frontStory({ player, ranking, enrolled });
  const pick = (a) => a[(player.week || 0) % a.length];
  const deck = story.decks ? pick(story.decks) : story.deck;
  return { ...story, deck, quote: pick(story.quotes), quotes: undefined, decks: undefined };
}

function frontStory({ player, ranking, enrolled }) {
  const name = player.name;
  const ln = lastName(name);
  const injury = player.injury;
  if (injury && !injury.canPlay) {
    return {
      kicker: "Infirmerie",
      title: ln + " à l'arrêt",
      deck: injury.label + ". Retour espéré dans " + injury.weeksRemaining + " semaine" + (injury.weeksRemaining > 1 ? "s" : "") + ".",
      tone: "red",
      caption: "À l'infirmerie…",
      quotes: ["Je reviendrai plus fort.", "Patience. Le circuit m'attendra."],
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
        decks: [
          name + " remporte le " + last.tournament + " face à " + last.opponent + " (" + last.score + ").",
          "En finale, " + last.opponent + " n'a rien pu faire : " + last.score + ". Le " + last.tournament + " est pour " + name + ".",
          name + " s'offre le " + last.tournament + " au bout d'une semaine maîtrisée, " + last.score + " en finale contre " + last.opponent + ".",
        ],
        tone: "green",
        caption: (last.city || "Ce soir-là") + ", la balle de match…",
        quotes: ["Je l'ai fait !", "Ce trophée, je ne le lâche plus.", "Je pense à tous ceux qui m'ont aidé cette semaine.", "Une semaine de rêve. Et maintenant, on continue."],
      };
    }
    if (!last.won && last.playedRound === "Finale") {
      return {
        kicker: kicker || "Finale",
        title: "Si près du titre",
        decks: [
          "Battu en finale du " + last.tournament + " par " + last.opponent + " (" + last.score + ").",
          "Le titre a échappé à " + name + " en finale du " + last.tournament + ", face à " + last.opponent + " (" + last.score + ").",
          "Une semaine pleine, une dernière marche manquée : " + last.opponent + " l'emporte en finale (" + last.score + ").",
        ],
        tone: "clay",
        caption: (last.city || "En finale") + ", après la finale…",
        quotes: ["J'y étais presque…", "La prochaine sera la bonne.", "Ça fait mal, mais je garde le positif de la semaine.", "Bravo à " + last.opponent + ", rien à redire aujourd'hui."],
      };
    }
    if (last.won && last.opponentRank && last.opponentRank <= 20 && last.opponentRank < ranking) {
      return {
        kicker: kicker || "Exploit",
        title: ln + " fait tomber le n° " + last.opponentRank,
        decks: [
          "Victoire sur " + last.opponent + " (" + last.score + ") " + roundPhrase(last.playedRound) + " du " + last.tournament + ".",
          "Victoire de prestige pour " + name + " face à " + last.opponent + ", n° " + last.opponentRank + " (" + last.score + "), " + roundPhrase(last.playedRound) + " du " + last.tournament + ".",
        ],
        tone: "green",
        caption: (last.city || "Sur le court") + ", coup de tonnerre…",
        quotes: ["Le n° " + last.opponentRank + " ? Il faudra compter avec moi.", "Je n'ai peur de personne.", "J'y croyais depuis le premier point."],
      };
    }
    if (!last.won) {
      return {
        kicker: kicker || "Résultat",
        title: "Fin de parcours" + where,
        decks: [
          name + " s'incline face à " + last.opponent + " (" + last.score + ") " + roundPhrase(last.playedRound) + ".",
          "Le parcours de " + name + " s'arrête " + roundPhrase(last.playedRound) + ", face à " + last.opponent + " (" + last.score + ").",
          last.opponent + " met fin à la semaine de " + name + " " + roundPhrase(last.playedRound) + " (" + last.score + ").",
        ],
        tone: "clay",
        caption: (last.city || "Au vestiaire") + ", dans les vestiaires…",
        quotes: ["On apprend plus des défaites.", "Je reviendrai.", "Pas mon jour. Il faut l'accepter.", "J'ai déjà hâte du prochain tournoi."],
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
      caption: "Direction " + enrolled.city + "…",
      quotes: ["Cette semaine, je veux aller loin.", "Un tableau à ma portée. Allons-y."],
    };
  }

  if (!ranking || ranking > 1000) {
    return {
      kicker: "Portrait",
      title: "Tout commence ici",
      deck: name + ", " + player.age + " ans, part de " + player.location + " sans le moindre point. Premier objectif : un tournoi à sa portée.",
      tone: "blue",
      caption: player.location + ", premier jour…",
      quotes: ["Un jour, je serai n° 1.", "Tout commence maintenant."],
    };
  }
  return {
    kicker: "Classement",
    title: ln + ", n° " + ranking + " mondial",
    deck: "Aucun tournoi au programme pour l'instant. Le circuit n'attend pas : le calendrier est ouvert.",
    tone: "blue",
    caption: player.location + ", entre deux tournois…",
    quotes: ["Il me faut un tournoi.", "Le classement ne monte pas tout seul."],
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
