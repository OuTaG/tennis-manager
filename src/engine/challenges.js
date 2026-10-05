// Défis scénarisés : définitions, objectifs, score, événements.
import { LIFE_EVENTS } from "../data/life.js";
import { ALL_TOURNAMENTS } from "./circuit.js";
import { getRating } from "./database.js";
import { getPlayerRanking, totalAtpPoints } from "./player.js";
import { playerRaceRank, racePointsOf, raceStandings } from "./race.js";
import { pickRandom } from "./social.js";

// ─── DÉFIS SCÉNARISÉS ────────────────────────────────────────────────────────
// Chaque défi démarre une partie dans une situation imposée (âge, classement,
// argent, palmarès…), avec un objectif, une échéance et des règles propres
// (événements dédiés, contraintes, mécaniques spéciales). La partie est
// sauvegardée dans un emplacement à part (CHALLENGE_SLOT).
//
// Le défi en cours est exposé aux fonctions du moteur via ACTIVE_CHALLENGE
// (tenu à jour par TennisManager), comme CIRCUIT pour le circuit WTA.
export const CHALLENGE_SLOT = 3;
export let ACTIVE_CHALLENGE = null;
export function setActiveChallenge(c) { ACTIVE_CHALLENGE = c; }
export function challengeActive(id) {
  return !!(ACTIVE_CHALLENGE && ACTIVE_CHALLENGE.status === "active" && (!id || ACTIVE_CHALLENGE.id === id));
}

// Points à détenir pour occuper le rang `rank` dans la base IA.
export function challengeRankPoints(db, rank) {
  if (!db || !db.length) return 0;
  if (rank <= 1) return (db[0].points || 0) + 250;
  const hi = db[Math.min(rank - 2, db.length - 1)].points || 0;
  const lo = db[Math.min(rank - 1, db.length - 1)].points || 0;
  return Math.max(1, Math.round((hi + lo) / 2));
}
// Répartit `total` points sur les 52 dernières semaines : `racePts` sur l'année
// en cours (semaines déjà jouées), le reste sur la fin de l'année précédente.
export function challengeSeedPoints(p, total, racePts, week, year) {
  const log = [];
  let cur = Math.max(0, Math.min(total, racePts || 0));
  const curWeeks = [];
  for (let w = 2; w < week; w++) curWeeks.push(w);
  if (!curWeeks.length) cur = 0;
  const prev = Math.max(0, total - cur);
  const prevWeeks = [];
  for (let w = week + 1; w <= 52; w++) prevWeeks.push(w);
  const spread = (amount, weeks, y) => {
    if (amount <= 0 || !weeks.length) return;
    const n = Math.min(8, weeks.length);
    const step = weeks.length / n;
    let left = amount;
    for (let i = 0; i < n; i++) {
      const w = weeks[Math.min(weeks.length - 1, Math.floor(i * step))];
      const pts = i === n - 1 ? left : Math.round(amount / n);
      left -= pts;
      log.push({ week: w, year: y, points: pts, source: "challenge" });
    }
  };
  spread(cur, curWeeks, year);
  spread(prev, prevWeeks.length ? prevWeeks : [52], year - 1);
  p.atpPointsLog = log;
}
// Statistiques de départ autour d'une note moyenne cible.
export function challengeStats(base, avg) {
  const keys = ["serve", "forehand", "backhand", "stamina", "mental", "net"];
  const cur = keys.reduce((a, k) => a + base[k], 0) / keys.length;
  const out = {};
  keys.forEach(k => { out[k] = Math.max(35, Math.min(95, base[k] + (avg - cur))); });
  return out;
}
// Titre passé ajouté à l'historique (pour le palmarès et les trophées).
export function challengePastTitle(t, year, week) {
  return {
    tournament: t.name, round: "Vainqueur", won: true, score: "", playedRound: "Finale",
    opponent: "—", opponentRank: 0, prize: 0, pts: 0, year, week,
    isQualifying: false, tierWon: t.tier, opponentName: "—", surface: t.surface, city: t.city,
    tiebreaksWon: 0, setsCount: 0, seeded: true,
  };
}
export function challengeAbs(p) { return (p.year || 0) * 52 + (p.week || 0); }
export function challengeWonSince(p, startAbs, pred) {
  return (p.matchHistory || []).some(m => m.won && m.round === "Vainqueur" && !m.seeded
    && ((m.year || 0) * 52 + (m.week || 0)) >= startAbs && pred(m));
}
export const tName = (id) => (ALL_TOURNAMENTS.find(t => t.id === id) || {}).name || id;

export const CHALLENGES = [
  {
    id: "retour", circuit: "atp", name: "Le Retour", difficulty: 4,
    tagline: "Ancien n°1 mondial, de retour au 150e rang",
    context: "Il y a deux ans, vous étiez n°1 mondial. Une blessure au genou vous a tenu loin des courts pendant quatorze mois. À 32 ans, vous repartez du 150e rang. Personne ne vous attend… sauf le public.",
    objectiveLabel: "Revenir dans le top 10",
    deadlineLabel: "Avant la fin de la saison 2027",
    perks: [
      "Classement protégé : vous entrez comme un n°8 sur 8 tournois",
      "L'argent et la popularité d'une ancienne star",
      "Un genou fragile : des alertes vont survenir",
    ],
    startWeek: 1, deadline: { year: 2027, week: 52 },
    style: "allcourt", city: "Paris",
    setup(p, db) {
      p.age = 32;
      p.stats = challengeStats({ serve: 80, forehand: 82, backhand: 78, stamina: 66, mental: 86, net: 72 }, 77.5);
      p.money = 350000; p.popularity = 75; p.image = 72; p.happiness = 60;
      p.titlesWon = 31; p.titlesByTier = { GrandSlam: 3, Masters1000: 7, ATP500: 8, ATP250: 13 };
      p.careerWins = 412; p.careerLosses = 118;
      challengeSeedPoints(p, challengeRankPoints(db, 150), 0, 1, 2026);
      p.challenge.capBonus = 25; // ancienne star : la notoriété reste
      p.challenge.protectedRank = 8;
      p.challenge.protectedUses = 8;
    },
    objective(p, ctx) {
      return { done: ctx.ranking <= 10, progress: "Classement : #" + ctx.ranking + " · objectif top 10" };
    },
  },
  {
    id: "derniere_danse", circuit: "wta", name: "Dernière danse", difficulty: 4,
    tagline: "35 ans, dernière saison, un Majeur à gagner",
    context: "Quatre finales de Majeur, quatre défaites. À 35 ans, vous êtes la doyenne du top 20 et vous avez annoncé que cette saison serait la dernière. Il reste une saison, une seule, pour aller chercher le titre qui manque à votre carrière.",
    objectiveLabel: "Gagner un Majeur",
    deadlineLabel: "Avant la fin de la saison 2026",
    perks: [
      "Mental d'expérience, mais récupération plus lente (−8 énergie par semaine)",
      "Tournée d'adieu : un moment fort avant chaque Majeur",
      "Le public vous porte : popularité au sommet",
    ],
    startWeek: 1, deadline: { year: 2026, week: 52 },
    style: "allcourt", city: "Melbourne",
    setup(p, db) {
      p.age = 35;
      p.stats = challengeStats({ serve: 84, forehand: 80, backhand: 77, stamina: 58, mental: 90, net: 80 }, 79.5);
      p.money = 900000; p.popularity = 88; p.image = 80; p.happiness = 70;
      p.titlesWon = 38; p.titlesByTier = { Masters1000: 5, ATP500: 11, ATP250: 22 };
      p.careerWins = 560; p.careerLosses = 230;
      challengeSeedPoints(p, challengeRankPoints(db, 18), 0, 1, 2026);
      p.challenge.energyRegenMod = -8;
    },
    objective(p, ctx) {
      const won = challengeWonSince(p, ctx.startAbs, m => m.tierWon === "GrandSlam");
      return { done: won, progress: won ? "Majeur gagné !" : "Majeur à gagner · classement #" + ctx.ranking };
    },
  },
  {
    id: "fauche", circuit: "wta", name: "Fauché", difficulty: 3,
    tagline: "50 000 € de dettes, aucun sponsor",
    context: "Un agent peu scrupuleux a vidé vos comptes et signé des prêts à votre nom. Vous êtes 150e mondiale, vous devez 50 000 € et plus aucune marque ne veut associer son nom au vôtre. Tout doit être remboursé avant la fin de la saison.",
    objectiveLabel: "Rembourser 50 000 €",
    deadlineLabel: "Avant la fin de la saison 2026",
    perks: [
      "Remboursez quand vous voulez depuis l'accueil",
      "Échéance obligatoire de 2 500 € toutes les 4 semaines, sinon +10 % de pénalité",
      "Aucun sponsor au départ et une image écornée",
      "Des propositions douteuses vont arriver…",
    ],
    startWeek: 1, deadline: { year: 2026, week: 52 },
    style: "baseliner", city: "Paris",
    setup(p, db) {
      p.age = 24;
      p.stats = challengeStats({ serve: 64, forehand: 70, backhand: 69, stamina: 70, mental: 64, net: 58 }, 66);
      p.money = 4000; p.popularity = 22; p.image = 36; p.happiness = 50;
      p.titlesWon = 4; p.titlesByTier = { Challenger: 3, ITF: 1 };
      p.careerWins = 96; p.careerLosses = 70;
      challengeSeedPoints(p, challengeRankPoints(db, 150), 0, 1, 2026);
      p.challenge.debt = 50000;
      p.challenge.nextDueAbs = challengeAbs(p) + 4;
    },
    objective(p) {
      const debt = Math.max(0, Math.round(p.challenge.debt || 0));
      return { done: debt <= 0, progress: debt <= 0 ? "Dette remboursée !" : "Dette restante : " + debt.toLocaleString("fr-FR") + " €" };
    },
  },
  {
    id: "prodige", circuit: "wta", name: "Le Prodige", difficulty: 3,
    tagline: "17 ans, 900e mondiale, tout le monde vous attend",
    context: "Championne du monde junior, vous passez pro à 17 ans. La presse vous compare déjà aux plus grandes. Il faut transformer l'essai : entrer dans le top 100 en deux saisons.",
    objectiveLabel: "Entrer dans le top 100",
    deadlineLabel: "Avant la fin de la saison 2027",
    perks: [
      "Âge d'or : progression ×1,3 à l'entraînement",
      "Une popularité qui attire les wildcards",
      "Des choix de vie à faire : études, famille, académie",
    ],
    startWeek: 1, deadline: { year: 2027, week: 52 },
    style: "allcourt", city: "Paris",
    setup(p, db) {
      p.age = 17;
      p.stats = challengeStats({ serve: 54, forehand: 58, backhand: 55, stamina: 55, mental: 50, net: 52 }, 55);
      p.money = 12000; p.popularity = 48; p.image = 66; p.happiness = 75;
      challengeSeedPoints(p, challengeRankPoints(db, 900), 0, 1, 2026);
      p.challenge.capBonus = 20; // prodige médiatisé
      p.challenge.trainMul = 1.3;
    },
    objective(p, ctx) {
      return { done: ctx.ranking <= 100, progress: "Classement : #" + ctx.ranking + " · objectif top 100" };
    },
  },
  {
    id: "terrien", circuit: "atp", name: "Le Terrien", difficulty: 5,
    tagline: "Il ne manque que le Tournoi de Londres",
    context: "Open d'Australie, Internationaux de Paris, Open des États-Unis : vous les avez tous gagnés. Il ne manque que le gazon londonien pour entrer dans l'histoire. Vous y arrivez cette semaine avec un jeu taillé pour l'ocre. Si ça ne passe pas, vous aurez un an pour transformer votre tennis.",
    objectiveLabel: "Gagner le Tournoi de Londres",
    deadlineLabel: "En 2026 ou en 2027",
    perks: [
      "Déjà à Londres, tableau principal la semaine prochaine",
      "Jeu de terrien : service et filet en retrait",
      "Stage sur gazon, mentor et refonte du jeu au fil de l'année",
      "Le Grand Chelem en carrière est au bout",
    ],
    startWeek: 26, deadline: { year: 2027, week: 27 },
    style: "baseliner", city: "Londres",
    enroll: "wimbledon",
    setup(p, db) {
      p.age = 28;
      p.stats = { serve: 70, forehand: 90, backhand: 86, stamina: 92, mental: 88, net: 58 };
      p.favoriteSurface = "Terre battue";
      p.money = 2500000; p.popularity = 85; p.image = 80; p.happiness = 70;
      p.titlesWon = 26; p.titlesByTier = { GrandSlam: 3, Masters1000: 6, ATP500: 7, ATP250: 10 };
      p.careerWins = 380; p.careerLosses = 95;
      const total = challengeRankPoints(db, 3);
      challengeSeedPoints(p, total, Math.round(total * 0.6), 26, 2026);
      const byId = (id) => ALL_TOURNAMENTS.find(t => t.id === id);
      p.matchHistory = [
        challengePastTitle(byId("rg"), 2026, 22),
        challengePastTitle(byId("uso"), 2025, 35),
        challengePastTitle(byId("ao"), 2025, 3),
      ];
    },
    objective(p, ctx) {
      const name = tName("wimbledon");
      const won = challengeWonSince(p, ctx.startAbs, m => m.tournament === name);
      return { done: won, progress: won ? name + " gagné !" : name + " : semaine 27 · classement #" + ctx.ranking };
    },
  },
  {
    id: "seul", circuit: "atp", name: "Seul au monde", difficulty: 4,
    tagline: "Aucun staff, jamais",
    context: "Pas de coach, pas de préparateur, pas d'agent. Vous gérez tout vous-même, du cordage aux billets d'avion. Objectif : le top 100 en trois saisons, sans jamais engager personne.",
    objectiveLabel: "Entrer dans le top 100",
    deadlineLabel: "Avant la fin de la saison 2028",
    perks: [
      "Impossible d'engager du staff",
      "Voyages low-cost : −25 % sur les billets",
      "Autodidacte : chaque victoire fait un peu progresser une statistique",
      "Des tentations vont se présenter",
    ],
    startWeek: 1, deadline: { year: 2028, week: 52 },
    style: "allcourt", city: "Paris",
    setup(p) {
      p.money = 9000;
      p.challenge.noStaff = true;
    },
    objective(p, ctx) {
      return { done: ctx.ranking <= 100, progress: "Classement : " + (ctx.ranking > 1200 ? "non classé" : "#" + ctx.ranking) + " · objectif top 100" };
    },
  },
  {
    id: "course", circuit: "atp", name: "Course au Masters", difficulty: 3,
    tagline: "Hors du top 8 de la Race, dix semaines pour y entrer",
    context: "L'Open des États-Unis vient de se terminer. Vous pointez juste derrière le top 8 de la Race, à environ 650 points de la dernière place qualificative. Il reste la tournée asiatique et la saison en salle pour décrocher l'un des huit billets pour le Masters de fin d'année.",
    objectiveLabel: "Être dans le top 8 de la Race",
    deadlineLabel: "Au début du Masters de fin d'année",
    perks: [
      "Suivi de la Race en direct sur l'accueil",
      "Wildcard possible pour un tournoi asiatique",
      "Chaque semaine compte : gérez votre énergie",
    ],
    startWeek: 36, deadline: "finals",
    style: "puncher", city: "New York",
    setup(p, db) {
      p.age = 26;
      p.stats = challengeStats({ serve: 88, forehand: 85, backhand: 80, stamina: 80, mental: 82, net: 76 }, 83);
      p.money = 600000; p.popularity = 60; p.image = 65; p.happiness = 65;
      p.titlesWon = 9; p.titlesByTier = { Masters1000: 1, ATP500: 3, ATP250: 5 };
      p.careerWins = 210; p.careerLosses = 110;
      // Juste hors du top 8 : environ 650 points de retard sur la 8e place.
      const race = raceStandings(db, 2026);
      const racePts = Math.max(race[16]?.pts || 0, (race[7]?.pts || 0) - 650);
      const total = Math.max(challengeRankPoints(db, 13), racePts + 250);
      challengeSeedPoints(p, total, racePts, 36, 2026);
    },
    objective(p, ctx) {
      const finals = ALL_TOURNAMENTS.find(t => t.tier === "Finals");
      const reached = finals && ctx.abs >= p.challenge.deadlineAbs;
      return {
        done: reached && ctx.raceRank <= 8,
        failNow: reached && ctx.raceRank > 8 ? "Pas qualifié pour " + (finals ? finals.name : "le Masters") : null,
        progress: "Race : #" + ctx.raceRank + " · " + (ctx.raceRank <= 8 ? "dans le top 8" : "à " + Math.max(0, ctx.raceGap) + " pts de la 8e place"),
      };
    },
    medal(p, ctx) { return ctx.raceRank <= 2 ? "gold" : ctx.raceRank <= 5 ? "silver" : "bronze"; },
  },
  {
    id: "pression", circuit: "wta", name: "Sous pression", difficulty: 4,
    tagline: "19 ans, top 30, les médias ne lâchent rien",
    context: "Révélation de l'an dernier, vous êtes 28e mondiale à 19 ans. Les médias vous présentent comme la future n°1 et chaque défaite fait la une. Remportez un Grand 1000 cette saison sans craquer.",
    objectiveLabel: "Gagner un Grand 1000",
    deadlineLabel: "Avant la fin de la saison 2026",
    perks: [
      "Chaque défaite coûte deux fois plus de bonheur",
      "Conférence de presse imposée après chaque défaite",
      "Unes de journaux et rumeurs régulières",
      "Si le bonheur passe sous 30, le défi est perdu",
    ],
    startWeek: 1, deadline: { year: 2026, week: 52 },
    style: "puncher", city: "Paris",
    setup(p, db) {
      p.age = 19;
      p.stats = challengeStats({ serve: 84, forehand: 82, backhand: 74, stamina: 76, mental: 64, net: 70 }, 77);
      p.money = 180000; p.popularity = 72; p.image = 60; p.happiness = 65;
      p.titlesWon = 2; p.titlesByTier = { ATP250: 2 };
      p.careerWins = 70; p.careerLosses = 38;
      challengeSeedPoints(p, challengeRankPoints(db, 28), 0, 1, 2026);
    },
    objective(p, ctx) {
      const won = challengeWonSince(p, ctx.startAbs, m => m.tierWon === "Masters1000");
      const h = Math.round(p.happiness ?? 0);
      return {
        done: won,
        failNow: !won && h < 30 ? "Le bonheur est passé sous 30 : vous avez craqué." : null,
        progress: (won ? "Grand 1000 gagné !" : "Grand 1000 à gagner") + " · bonheur " + h + " (seuil 30)",
      };
    },
  },
];
export function getChallengeDef(id) { return CHALLENGES.find(c => c.id === id) || null; }

// Contexte d'évaluation commun.
export function challengeContext(p, db) {
  const pts = totalAtpPoints(p.atpPointsLog || []);
  const ranking = db ? (pts > 0 ? getPlayerRanking(pts, db) : 1201) : 9999;
  const raceRank = playerRaceRank(p, db);
  const race = raceStandings(db, p.year);
  const mine = racePointsOf(p.atpPointsLog, p.year);
  const eighth = race[raceRank <= 8 ? 8 : 7]?.pts || 0;
  return {
    ranking, raceRank, raceGap: eighth - mine,
    abs: challengeAbs(p), startAbs: p.challenge?.startAbs || 0, deadlineAbs: p.challenge?.deadlineAbs || 0,
  };
}

// Statut du défi : null (en cours) ou { status: "success" | "fail", ... }.
export function evaluateChallenge(p, db) {
  const c = p.challenge;
  if (!c || c.status !== "active") return null;
  const def = getChallengeDef(c.id);
  if (!def) return null;
  const ctx = challengeContext(p, db);
  const finish = (res) => ({ ...res, ...computeChallengeScore(p, db, res.status, res.weeks) });
  if (c.failReason) return finish({ status: "fail", reason: c.failReason });
  const obj = def.objective(p, ctx);
  if (obj.done) {
    const weeks = Math.max(0, ctx.abs - ctx.startAbs);
    const span = Math.max(1, c.deadlineAbs - ctx.startAbs);
    const ratio = weeks / span;
    const medal = def.medal ? def.medal(p, ctx) : ratio <= 0.5 ? "gold" : ratio <= 0.8 ? "silver" : "bronze";
    return finish({ status: "success", weeks, medal });
  }
  if (obj.failNow) return finish({ status: "fail", reason: obj.failNow });
  if (ctx.abs > c.deadlineAbs) return finish({ status: "fail", reason: "Le temps est écoulé." });
  return null;
}

// ─── SCORE DE DÉFI ──────────────────────────────────────────────────────────
// Comme le score de légende des carrières : un total de points détaillé,
// qui récompense la réussite mais aussi la manière (rapidité, progression,
// victoires, titres) — un défi échoué rapporte quand même des points.
export const ROUND_DEPTH = { "1er tour": 1, "2e tour": 2, "3e tour": 3, "8es de finale": 4, "Quarts": 5, "Demies": 6, "Demi-finale": 6, "Finale": 7, "Vainqueur": 8 };
export const CHALLENGE_TITLE_PTS = { GrandSlam: 600, Finals: 450, Masters1000: 300, ATP500: 160, ATP250: 90, Challenger: 35, ITF: 12 };
// Comptabilise les matchs d'une semaine donnée dans le bilan du défi.
export function challengeTallyWeek(tally, matchHistory, year, week) {
  const t = { w: 0, l: 0, top10: 0, titles: {}, best: {}, ...(tally || {}) };
  t.titles = { ...(t.titles || {}) };
  t.best = { ...(t.best || {}) };
  const wimb = tName("wimbledon");
  for (const m of (matchHistory || [])) {
    if (m.seeded || m.year !== year || m.week !== week) continue;
    if (m.won) t.w++; else t.l++;
    if (m.won && (m.opponentRank || 999) <= 10) t.top10++;
    if (m.won && m.round === "Vainqueur" && !m.isQualifying) t.titles[m.tierWon] = (t.titles[m.tierWon] || 0) + 1;
    const depth = m.isQualifying ? 0 : (ROUND_DEPTH[m.round] || 0);
    const keys = [];
    if (m.tierWon === "GrandSlam") keys.push("GrandSlam");
    if (m.tierWon === "Masters1000") keys.push("Masters1000");
    if (m.tournament === wimb) keys.push("wimbledon");
    for (const k of keys) t.best[k] = Math.max(t.best[k] || 0, depth);
  }
  return t;
}
// Score du défi. status : "success" | "fail" | null (score provisoire).
export function computeChallengeScore(p, db, status, weeksUsed) {
  const c = p.challenge || {};
  const def = getChallengeDef(c.id);
  if (!def) return { score: 0, rows: [] };
  const ctx = challengeContext(p, db);
  // Bilan : semaines déjà comptées + semaine en cours.
  const tally = challengeTallyWeek(c.tally, p.matchHistory, p.year, p.week);
  const rows = [];
  const span = Math.max(1, c.deadlineAbs - c.startAbs);
  if (status === "success") {
    rows.push({ label: "Objectif atteint", detail: def.objectiveLabel, pts: 3000 });
    const left = Math.max(0, span - (weeksUsed ?? (ctx.abs - c.startAbs)));
    rows.push({ label: "Rapidité", detail: left + " sem. d'avance", pts: Math.round(2000 * left / span) });
  }
  // Progression vers l'objectif (compte aussi en cas d'échec).
  const hist = (p.history || []).filter(h => (h.year * 52 + h.week) >= c.startAbs && (h.points || 0) > 0);
  const bestRank = Math.min(ctx.ranking, ...hist.map(h => h.ranking || 9999));
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  let prog = 0, progDetail = "";
  const rankProg = (from, to) => { prog = clamp01((from - bestRank) / (from - to)); progDetail = "Meilleur classement : " + (bestRank > 1200 ? "non classé" : "#" + bestRank); };
  const depthLabel = (d) => ["aucun match", "1er tour", "2e tour", "3e tour", "8es de finale", "quarts", "demies", "finale", "titre"][d] || "—";
  if (c.id === "retour") rankProg(150, 10);
  else if (c.id === "prodige") rankProg(900, 100);
  else if (c.id === "seul") rankProg(1200, 100);
  else if (c.id === "derniere_danse") { const d = tally.best.GrandSlam || 0; prog = d / 8; progDetail = "Meilleur Majeur : " + depthLabel(d); }
  else if (c.id === "pression") { const d = tally.best.Masters1000 || 0; prog = d / 8; progDetail = "Meilleur Grand 1000 : " + depthLabel(d); }
  else if (c.id === "terrien") { const d = tally.best.wimbledon || 0; prog = d / 8; progDetail = "Tournoi de Londres : " + depthLabel(d); }
  else if (c.id === "fauche") { const repaid = clamp01((50000 - (c.debt || 0)) / 50000); prog = repaid; progDetail = Math.round(repaid * 100) + " % de la dette remboursée"; }
  else if (c.id === "course") { const br = Math.min(ctx.raceRank, c.bestRace || 9999); prog = clamp01((16 - br) / 8); progDetail = "Meilleure place à la Race : #" + br; }
  rows.push({ label: "Progression", detail: progDetail, pts: Math.round(1500 * prog) });
  rows.push({ label: "Victoires", detail: tally.w + " × 10", pts: tally.w * 10 });
  const titlePts = Object.entries(tally.titles).reduce((a, [tier, n]) => a + (CHALLENGE_TITLE_PTS[tier] || 0) * n, 0);
  const titleCount = Object.values(tally.titles).reduce((a, n) => a + n, 0);
  rows.push({ label: "Titres", detail: titleCount + " titre" + (titleCount > 1 ? "s" : ""), pts: titlePts });
  if (tally.top10) rows.push({ label: "Victoires contre le top 10", detail: tally.top10 + " × 60", pts: tally.top10 * 60 });
  // Bonus propre au défi.
  if (c.id === "fauche") rows.push({ label: "Trésorerie finale", detail: Math.max(0, Math.round(p.money)).toLocaleString("fr-FR") + " €", pts: Math.min(1000, Math.max(0, Math.round(p.money / 50))) });
  if (c.id === "pression") rows.push({ label: "Sang-froid", detail: "Bonheur final " + Math.round(p.happiness ?? 0), pts: Math.max(0, Math.round((p.happiness ?? 0) * 10)) });
  if (c.id === "derniere_danse") rows.push({ label: "Adieux au public", detail: "Popularité " + Math.round(p.popularity ?? 0), pts: Math.round((p.popularity ?? 0) * 5) });
  if (c.id === "retour") rows.push({ label: "Entrées protégées gardées", detail: (c.protectedUses || 0) + " × 50", pts: (c.protectedUses || 0) * 50 });
  if (c.id === "seul") rows.push({ label: "Autodidacte", detail: "Note " + getRating(p.stats), pts: Math.max(0, (getRating(p.stats) - 50) * 20) });
  const score = rows.reduce((a, r) => a + r.pts, 0);
  return { score, rows };
}

// Meilleurs résultats (par appareil).
export const CHALLENGE_RESULTS_KEY = "tm-challenge-results";
export function loadChallengeResults() {
  try { return JSON.parse(localStorage.getItem(CHALLENGE_RESULTS_KEY) || "{}"); } catch (e) { return {}; }
}
// Garde la meilleure tentative de chaque défi (au score), réussie ou non.
export function saveChallengeResult(id, res, p) {
  try {
    const all = loadChallengeResults();
    const prev = all[id];
    const attempts = ((prev && prev.attempts) || 0) + 1;
    const better = !prev || (res.score || 0) > (prev.score || 0);
    all[id] = better ? {
      score: res.score || 0, rows: res.rows || [], status: res.status, medal: res.medal || null, weeks: res.weeks,
      name: p ? p.name : "", flag: p ? p.nationalityFlag : "", circuit: p ? (p.circuit || "atp") : "atp",
      date: Date.now(), attempts,
    } : { ...prev, attempts };
    localStorage.setItem(CHALLENGE_RESULTS_KEY, JSON.stringify(all));
  } catch (e) {}
}
export const MEDAL_INFO = {
  gold: { label: "Or", color: "#b8891f" },
  silver: { label: "Argent", color: "#7d8a93" },
  bronze: { label: "Bronze", color: "#a86b3c" },
};

// ─── ÉVÉNEMENTS DE DÉFI ──────────────────────────────────────────────────────
// Même format que LIFE_EVENTS, plus :
//   challenge   — id du défi
//   forced(p)   — renvoie une clé quand l'événement doit tomber cette semaine
//   when(p)     — condition pour les événements tirés au hasard
//   once        — ne tombe qu'une fois
//   option.apply(p) — modifie le joueur (dette, stats, règles du défi…)
//   option.chips    — étiquettes supplémentaires affichées sous le choix
export const addStats = (p, delta) => {
  const s = { ...p.stats };
  Object.entries(delta).forEach(([k, v]) => { s[k] = Math.max(35, Math.min(99, (s[k] || 50) + v)); });
  return { ...p, stats: s };
};
export const patchChallenge = (p, patch) => ({ ...p, challenge: { ...p.challenge, ...patch } });
export const GS_IDS = ["ao", "rg", "wimbledon", "uso"];

export const CHALLENGE_EVENTS = [
  // ── Le Retour ─────────────────────────────────────────────────────────────
  { id: "ch_retour_genou", challenge: "retour", title: "Le genou proteste",
    body: "Une douleur sourde au genou opéré après l'entraînement. Votre kiné conseille de lever le pied.",
    options: [
      { label: "Une semaine de repos complet", restWeeks: 1, effects: { energy: 15, happiness: -2 } },
      { label: "Infiltration et on continue (3 000€)", effects: { money: -3000 }, injuryRisk: 0.15 },
      { label: "Serrer les dents", effects: { happiness: -1 }, injuryRisk: 0.35 },
    ] },
  { id: "ch_retour_rival", challenge: "retour", once: true, title: "L'ancien rival",
    body: "Votre grand rival de l'époque, désormais retraité, propose de devenir votre coach le temps du retour.",
    options: [
      { label: "Accepter (40 000€)", effects: { money: -40000, happiness: 4, popularity: 4 }, apply: p => addStats(p, { mental: 2, forehand: 1 }), chips: [{ label: "Mental +2 · Coup droit +1", color: "var(--tm-green)" }] },
      { label: "Décliner poliment", effects: { image: 1 } },
    ] },
  { id: "ch_retour_doc", challenge: "retour", once: true, title: "Documentaire « Le Retour »",
    body: "Une plateforme veut filmer votre retour au sommet, caméras dans le vestiaire comprises.",
    options: [
      { label: "Signer (60 000€)", effects: { money: 60000, popularity: 8, energy: -10, happiness: -3 } },
      { label: "Refuser, rester concentré", effects: { image: 2, happiness: 2 } },
    ] },
  { id: "ch_retour_jeunes", challenge: "retour", once: true, title: "Les jeunes n'ont plus peur",
    body: "Un jeune du top 50 déclare en conférence : « Son nom ne fait plus peur à personne. »",
    options: [
      { label: "Répondre sur le court", effects: { happiness: 3, image: 2 }, apply: p => addStats(p, { mental: 1 }), chips: [{ label: "Mental +1", color: "var(--tm-green)" }] },
      { label: "Répondre sur les réseaux", effects: { popularity: 5, image: -3 } },
      { label: "Ignorer", effects: { image: 1 } },
    ] },
  { id: "ch_retour_protege", challenge: "retour", once: true, when: p => (p.challenge.protectedUses || 0) <= 2, title: "Fin du classement protégé",
    body: "La fédération vous rappelle qu'il ne vous reste presque plus d'entrées avec votre classement protégé.",
    options: [
      { label: "Faire valoir votre statut (5 000€ d'avocats)", effects: { money: -5000, happiness: 2 }, apply: p => patchChallenge(p, { protectedUses: (p.challenge.protectedUses || 0) + 2 }), chips: [{ label: "+2 entrées protégées", color: "var(--tm-green)" }] },
      { label: "Accepter et compter sur son classement réel", effects: { image: 1 } },
    ] },

  // ── Dernière danse ────────────────────────────────────────────────────────
  { id: "ch_danse_majeur", challenge: "derniere_danse",
    forced: (p) => {
      const t = ALL_TOURNAMENTS.find(x => GS_IDS.includes(x.id) && x.week === p.week + 1);
      return t ? "gs_" + t.id + "_" + p.year : null;
    },
    title: "Dernier passage",
    body: (p) => {
      const t = ALL_TOURNAMENTS.find(x => GS_IDS.includes(x.id) && x.week === p.week + 1);
      return "La semaine prochaine, " + (t ? t.name : "un Majeur") + " pour la dernière fois de votre carrière. Les organisateurs préparent un hommage.";
    },
    options: [
      { label: "L'annoncer en conférence et jouer avec le cœur", effects: { happiness: 12, popularity: 4, energy: -3 } },
      { label: "Pas d'hommage avant la fin : focus total", effects: { energy: 10, image: 2 } },
      { label: "Séance d'entraînement ouverte au public", effects: { popularity: 6, happiness: 6, energy: -6 } },
    ] },
  { id: "ch_danse_dos", challenge: "derniere_danse", title: "Le dos se raidit",
    body: "Les longues nuits d'avion ne pardonnent plus. Votre dos est bloqué au réveil.",
    options: [
      { label: "Kiné et repos (2 semaines)", restWeeks: 2, effects: { energy: 25 } },
      { label: "Anti-inflammatoires et on joue", effects: { happiness: -2 }, injuryRisk: 0.3 },
    ] },
  { id: "ch_danse_jeune", challenge: "derniere_danse", once: true, title: "Le jeune qui vous admire",
    body: "Un espoir de 18 ans qui a grandi avec vos posters vous demande une séance d'entraînement.",
    options: [
      { label: "Lui transmettre vos secrets", effects: { happiness: 6, image: 4, energy: -5 } },
      { label: "Pas le temps, la saison est trop courte", effects: { image: -1, energy: 5 } },
    ] },
  { id: "ch_danse_famille", challenge: "derniere_danse", once: true, title: "La famille sur la route",
    body: "Vos enfants veulent vous suivre sur la tournée pour cette dernière saison.",
    options: [
      { label: "Toute la famille vient", effects: { happiness: 10, money: -15000, energy: -4 } },
      { label: "Seulement pour les Majeurs", effects: { happiness: 5, money: -5000 } },
    ] },

  // ── Fauché ────────────────────────────────────────────────────────────────
  { id: "ch_fauche_usurier", challenge: "fauche", title: "Un prêteur généreux",
    body: "Un « ami d'ami » propose 10 000 € tout de suite. Il récupérera 15 000 € sur votre dette.",
    options: [
      { label: "Accepter", effects: { money: 10000, happiness: 2 }, apply: p => patchChallenge(p, { debt: (p.challenge.debt || 0) + 15000 }), chips: [{ label: "Dette +15 000€", color: "var(--tm-red)" }] },
      { label: "Refuser", effects: { image: 1 } },
    ] },
  { id: "ch_fauche_trophees", challenge: "fauche", once: true, title: "Vendre ses trophées",
    body: "Un collectionneur veut racheter les trophées de vos premiers titres.",
    options: [
      { label: "Vendre (8 000€)", effects: { money: 8000, happiness: -6 } },
      { label: "Hors de question", effects: { happiness: 2 } },
    ] },
  { id: "ch_fauche_arrange", challenge: "fauche", once: true, title: "Une offre à ne pas accepter",
    body: "Un inconnu vous propose 25 000 € pour perdre un match de Circuit Pro. « Personne ne saura. »",
    options: [
      { label: "Accepter", effects: { money: 25000 }, outcomes: [
        { chance: 0.6, msg: "Personne n'a rien vu… pour l'instant", effects: { happiness: -8 } },
        { chance: 0.4, msg: "Démasqué : enquête et suspension médiatique", effects: { image: -35, popularity: -15, happiness: -15 } },
      ] },
      { label: "Refuser et signaler", effects: { image: 6, happiness: 2 } },
      { label: "Refuser sans rien dire", effects: { happiness: -1 } },
    ] },
  { id: "ch_fauche_exhib", challenge: "fauche", title: "Exhibition rémunérée",
    body: "Un club privé vous paie pour une exhibition le week-end. Ça fatigue, mais ça rapporte.",
    options: [
      { label: "Jouer l'exhibition (6 000€)", effects: { money: 6000, energy: -18 } },
      { label: "Refuser, préserver l'énergie", effects: { energy: 5 } },
    ] },
  { id: "ch_fauche_stage", challenge: "fauche", title: "Stage pour enfants",
    body: "Une académie cherche quelqu'un pour animer un stage d'une journée.",
    options: [
      { label: "Accepter (2 500€)", effects: { money: 2500, energy: -8, image: 2, happiness: 2 } },
      { label: "Pas cette semaine", effects: {} },
    ] },
  { id: "ch_fauche_sponsor", challenge: "fauche", once: true, when: p => (p.image ?? 0) >= 50, title: "Une marque revient",
    body: "Votre image remonte : une petite marque locale propose une avance si vous portez son logo.",
    options: [
      { label: "Signer (avance de 12 000€)", effects: { money: 12000, popularity: 2 } },
      { label: "Attendre mieux", effects: { image: 1 } },
    ] },

  // ── Le Prodige ────────────────────────────────────────────────────────────
  { id: "ch_prodige_parents", challenge: "prodige", once: true, title: "Papa veut être manager",
    body: "Votre père veut gérer votre carrière lui-même : contrats, calendrier, coach.",
    options: [
      { label: "Accepter : la famille d'abord", effects: { happiness: 6, image: -3 } },
      { label: "Prendre un vrai agent", effects: { money: -3000, image: 3, happiness: -3 } },
      { label: "Trouver un compromis", effects: { happiness: 2, image: 1 } },
    ] },
  { id: "ch_prodige_bac", challenge: "prodige", once: true, title: "Les examens",
    body: "Vos examens de fin d'année tombent pendant la saison. Vos professeurs proposent des cours à distance.",
    options: [
      { label: "Passer les examens (2 semaines sans tournoi)", restWeeks: 2, effects: { happiness: 5, image: 4 } },
      { label: "Tout miser sur le tennis", effects: { happiness: -3 }, apply: p => addStats(p, { mental: 1 }), chips: [{ label: "Mental +1", color: "var(--tm-green)" }] },
    ] },
  { id: "ch_prodige_academie", challenge: "prodige", once: true, title: "L'académie américaine",
    body: "Une prestigieuse académie de Floride vous offre une bourse pour un stage intensif.",
    options: [
      { label: "Partir trois semaines", effects: { energy: -10, happiness: -2 }, trainBoost: { mul: 1.4, weeks: 6 } },
      { label: "Rester avec votre entraîneur de toujours", effects: { happiness: 3 } },
    ] },
  { id: "ch_prodige_agent", challenge: "prodige", once: true, title: "Un agent pressé",
    body: "Un agent célèbre vous promet des millions si vous signez un contrat de dix ans.",
    options: [
      { label: "Signer (20 000€ tout de suite)", effects: { money: 20000, popularity: 4, happiness: -2 } },
      { label: "Refuser, trop tôt", effects: { image: 2 } },
    ] },
  { id: "ch_prodige_burnout", challenge: "prodige", title: "Coup de fatigue",
    body: "Entre les voyages, les médias et l'entraînement, vous avez du mal à suivre le rythme.",
    options: [
      { label: "Une semaine à la maison", restWeeks: 1, effects: { happiness: 8, energy: 20 } },
      { label: "Continuer coûte que coûte", effects: { happiness: -5 } },
    ] },

  // ── Le Terrien ────────────────────────────────────────────────────────────
  { id: "ch_terrien_stage", challenge: "terrien", once: true, when: p => challengeAbs(p) >= 2026 * 52 + 30, title: "Stage sur gazon",
    body: "Un club anglais propose de vous ouvrir ses courts en gazon pour un stage de trois semaines.",
    options: [
      { label: "Stage intensif (30 000€)", effects: { money: -30000, energy: -10 }, apply: p => addStats(p, { serve: 2, net: 2.5 }), chips: [{ label: "Service +2 · Filet +2,5", color: "var(--tm-green)" }] },
      { label: "Pas maintenant", effects: {} },
    ] },
  { id: "ch_terrien_mentor", challenge: "terrien", once: true, when: p => challengeAbs(p) >= 2026 * 52 + 36, title: "Le mentor du gazon",
    body: "Une légende du service-volée, plusieurs fois titrée à Londres, accepte de vous conseiller.",
    options: [
      { label: "Accepter (50 000€)", effects: { money: -50000, happiness: 3 }, apply: p => addStats(p, { serve: 1.5, net: 1.5, mental: 1 }), chips: [{ label: "Service +1,5 · Filet +1,5 · Mental +1", color: "var(--tm-green)" }] },
      { label: "Décliner", effects: {} },
    ] },
  { id: "ch_terrien_refonte", challenge: "terrien", once: true, when: p => challengeAbs(p) >= 2026 * 52 + 44, title: "Refondre son tennis",
    body: "Votre équipe propose de reconstruire votre jeu autour du gazon : plus de service, plus de filet, moins de fond de court. Un pari risqué.",
    options: [
      { label: "Tout changer : le gazon devient votre surface", effects: { happiness: -4 }, apply: p => ({ ...addStats(p, { serve: 2, net: 3, forehand: -1, backhand: -1, stamina: -1 }), favoriteSurface: "Gazon" }), chips: [{ label: "Surface favorite : gazon", color: "var(--tm-green)" }, { label: "Service +2 · Filet +3 · fond de court −1", color: "var(--tm-amber)" }] },
      { label: "Rester fidèle à votre tennis", effects: { happiness: 2 } },
    ] },
  { id: "ch_terrien_critiques", challenge: "terrien", title: "« Il ne gagnera jamais sur herbe »",
    body: "Un consultant célèbre affirme à la télévision que votre jeu ne passera jamais sur gazon.",
    options: [
      { label: "Répondre avec humour", effects: { popularity: 4, happiness: 1 } },
      { label: "Encadrer la citation dans le vestiaire", effects: { happiness: 2 }, apply: p => addStats(p, { mental: 1 }), chips: [{ label: "Mental +1", color: "var(--tm-green)" }] },
    ] },
  { id: "ch_terrien_prepa", challenge: "terrien", once: true, when: p => p.year === 2027 && p.week >= 21 && p.week <= 23, title: "Préparation sur gazon",
    body: "Les organisateurs d'un tournoi sur gazon en juin vous proposent une invitation pour préparer Londres.",
    options: [
      { label: "Accepter l'invitation", effects: { popularity: 2 }, apply: p => {
        const t = ALL_TOURNAMENTS.filter(x => x.surface === "Gazon" && x.week > p.week && x.week < 27 && x.tier !== "GrandSlam")[0];
        if (!t) return p;
        return { ...p, wildcardOffers: [...(p.wildcardOffers || []), { tournamentId: t.id, tournamentName: t.name, tournamentWeek: t.week, tournamentYear: p.year, week: p.week, year: p.year }] };
      }, chips: [{ label: "Wildcard pour un tournoi sur gazon", color: "var(--tm-green)" }] },
      { label: "Préférer s'entraîner", effects: { energy: 10 } },
    ] },

  // ── Seul au monde ─────────────────────────────────────────────────────────
  { id: "ch_seul_coach", challenge: "seul", once: true, when: p => challengeAbs(p) >= 2026 * 52 + 20, title: "Une main tendue",
    body: "Un coach réputé a remarqué votre parcours. Il vous propose de vous suivre gratuitement pendant un an.",
    options: [
      { label: "Accepter (le défi est perdu)", effects: { happiness: 5 }, apply: p => patchChallenge(p, { failReason: "Vous avez accepté un coach." }), chips: [{ label: "Fin du défi", color: "var(--tm-red)" }] },
      { label: "Refuser : seul jusqu'au bout", effects: { happiness: 2 }, apply: p => addStats(p, { mental: 1 }), chips: [{ label: "Mental +1", color: "var(--tm-green)" }] },
    ] },
  { id: "ch_seul_video", challenge: "seul", title: "Analyse vidéo maison",
    body: "Vous passez la soirée à décortiquer vos matchs sur votre ordinateur portable.",
    options: [
      { label: "Toute la nuit", effects: { energy: -8 }, statGain: 0.6 },
      { label: "Une heure, pas plus", effects: {}, statGain: 0.25 },
    ] },
  { id: "ch_seul_cordage", challenge: "seul", title: "Cordage maison",
    body: "Votre machine à corder fait des siennes. Faire réparer coûte cher, bricoler prend du temps.",
    options: [
      { label: "Faire réparer (800€)", effects: { money: -800 } },
      { label: "Bricoler soi-même", effects: { energy: -6, happiness: -1 } },
    ] },
  { id: "ch_seul_solitude", challenge: "seul", title: "La solitude du circuit",
    body: "Encore une chambre d'hôtel vide. Personne pour débriefer le match.",
    options: [
      { label: "Appeler la famille", effects: { happiness: 5 } },
      { label: "Sortir rencontrer d'autres joueurs", effects: { happiness: 3, popularity: 2, energy: -4 } },
      { label: "Se coucher tôt", effects: { energy: 8, happiness: -2 } },
    ] },

  // ── Course au Masters ─────────────────────────────────────────────────────
  { id: "ch_course_wc", challenge: "course", once: true, title: "Invitation en Asie",
    body: "Un tournoi asiatique vous propose une wildcard. Des points en plus, mais un long voyage.",
    options: [
      { label: "Accepter la wildcard", effects: { popularity: 1 }, apply: p => {
        const asia = ["Pékin", "Tokyo", "Shanghai", "Chengdu", "Hangzhou", "Zhuhai", "Séoul", "Osaka", "Hong Kong", "Ningbo", "Wuhan", "Guangzhou"];
        const t = ALL_TOURNAMENTS.find(x => asia.includes(x.city) && x.week > p.week && x.week <= p.week + 3 && ["ATP500", "ATP250"].includes(x.tier));
        if (!t) return p;
        return { ...p, wildcardOffers: [...(p.wildcardOffers || []), { tournamentId: t.id, tournamentName: t.name, tournamentWeek: t.week, tournamentYear: p.year, week: p.week, year: p.year }] };
      }, chips: [{ label: "Wildcard pour un tournoi asiatique", color: "var(--tm-green)" }] },
      { label: "Décliner", effects: { energy: 5 } },
    ] },
  { id: "ch_course_calcul", challenge: "course", once: true, title: "Calculs d'apothicaire",
    body: "Votre équipe a fait les comptes : faire l'impasse sur une semaine pour récupérer pourrait payer en fin de course.",
    options: [
      { label: "Semaine de récupération", restWeeks: 1, effects: { energy: 30, happiness: 3 } },
      { label: "Jouer tout ce qui est possible", effects: { energy: -5 } },
    ] },
  { id: "ch_course_rival", challenge: "course", title: "Un concurrent forfait",
    body: "Un joueur devant vous à la Race déclare forfait pour le reste de la tournée asiatique.",
    options: [
      { label: "Une occasion à saisir", effects: { happiness: 4 } },
      { label: "Lui souhaiter un bon rétablissement", effects: { image: 2, happiness: 2 } },
    ] },
  { id: "ch_course_spasme", challenge: "course", title: "Alerte aux adducteurs",
    body: "Une gêne aux adducteurs à l'échauffement. Le médecin parle de quelques jours de prudence.",
    options: [
      { label: "Lever le pied cette semaine", restWeeks: 1, effects: { energy: 15 } },
      { label: "Strapping et on y va", effects: {}, injuryRisk: 0.25 },
    ] },

  // ── Sous pression ─────────────────────────────────────────────────────────
  { id: "ch_pression_conf", challenge: "pression",
    forced: (p) => {
      const m = (p.matchHistory || [])[0];
      if (!m || m.won || m.seeded) return null;
      const key = "loss_" + m.year + "_" + m.week + "_" + m.tournament + "_" + m.playedRound;
      return key;
    },
    title: "Conférence de presse",
    body: (p) => {
      const m = (p.matchHistory || [])[0] || {};
      return "Après votre défaite contre " + (m.opponent || "votre adversaire") + ", la salle de presse est pleine. Première question : « Est-ce que vous êtes surcoté ? »";
    },
    options: [
      { label: "Rester calme et analyser le match", effects: { image: 3, happiness: -2 } },
      { label: "Retourner la question au journaliste", effects: { popularity: 4, image: -4, happiness: 1 } },
      { label: "Écourter la conférence", effects: { image: -2, happiness: -4 } },
    ] },
  { id: "ch_pression_une", challenge: "pression", title: "À la une",
    body: "Un grand quotidien sportif titre : « Le futur n°1 est-il déjà fini ? »",
    options: [
      { label: "Ne pas lire la presse", effects: { happiness: 1, popularity: -1 } },
      { label: "Accorder une interview pour répondre", effects: { energy: -6, image: 3, happiness: -2 } },
      { label: "Poster une réponse cinglante", effects: { popularity: 4, image: -3, happiness: 2 } },
    ] },
  { id: "ch_pression_rumeur", challenge: "pression", title: "Rumeur",
    body: "Une rumeur affirme que vous allez quitter votre entraîneur. Votre téléphone n'arrête pas de sonner.",
    options: [
      { label: "Démentir publiquement", effects: { image: 2, happiness: -2 } },
      { label: "Laisser dire", effects: { happiness: -4 } },
    ] },
  { id: "ch_pression_psy", challenge: "pression", once: true, title: "Un préparateur mental",
    body: "Votre entourage vous conseille un préparateur mental spécialisé dans la gestion des médias.",
    options: [
      { label: "Commencer un suivi (10 000€)", effects: { money: -10000, happiness: 12 }, apply: p => addStats(p, { mental: 2 }), chips: [{ label: "Mental +2", color: "var(--tm-green)" }] },
      { label: "Je n'en ai pas besoin", effects: { happiness: -3 } },
    ] },
  { id: "ch_pression_fans", challenge: "pression", title: "Le soutien des fans",
    body: "Des fans ont lancé un mot-dièse de soutien qui tourne dans le monde entier.",
    options: [
      { label: "Les remercier en vidéo", effects: { happiness: 8, popularity: 3, energy: -3 } },
      { label: "Un simple message", effects: { happiness: 4 } },
    ] },
];
export function getEventById(id) {
  return LIFE_EVENTS.find(e => e.id === id) || CHALLENGE_EVENTS.find(e => e.id === id) || null;
}
// Événement de défi à proposer cette semaine (ou null).
export function pickChallengeEvent(p) {
  const c = p.challenge;
  if (!c || c.status !== "active") return null;
  const seen = c.seenEvents || [];
  const pool = CHALLENGE_EVENTS.filter(e => e.challenge === c.id);
  for (const e of pool) {
    if (!e.forced) continue;
    const key = e.forced(p);
    if (key && !seen.includes(key)) return { ev: e, key };
  }
  if (Math.random() >= 0.3) return null;
  const eligible = pool.filter(e => !e.forced && !(e.once && seen.includes(e.id)) && (!e.when || e.when(p)));
  if (!eligible.length) return null;
  const ev = pickRandom(eligible);
  return { ev, key: ev.id };
}
