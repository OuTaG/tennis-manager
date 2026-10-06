// Mini-jeux de choix : duel au service, duel au retour, smash au bon moment
// (en match) et fiches d'entraînement. Règles pures, hasard du moteur.
import { random } from "./rng.js";

// Zones du carré de service, de l'extérieur (contre le couloir) au T
// (contre la ligne médiane) : l'indice donne aussi la position, la
// distance entre deux zones se compte en cases.
export const ZONES = ["Extérieur", "Corps", "Au T"];

// ─── EN MATCH ──────────────────────────────────────────────────────────────
// Quel mini-jeu proposer à la place d'un dilemme ? Duel au service si le
// joueur sert le prochain jeu, duel au retour sinon, parfois un smash.
export function pickMatchMiniGame(nextServerIsPlayer) {
  if (random() < 0.3) return "smash";
  return nextServerIsPlayer ? "serve_duel" : "return_duel";
}

// L'adversaire lit le jeu : plus il a de mental, plus il repère la zone
// que le joueur choisit le plus souvent (history = zones déjà servies).
export function opponentRead(history, oppStats) {
  const readP = Math.max(0.15, Math.min(0.55, 0.3 + ((oppStats?.mental ?? 60) - 60) / 120));
  const counts = [0, 0, 0];
  for (const z of history || []) if (z >= 0 && z < 3) counts[z]++;
  const favourite = counts.indexOf(Math.max(...counts));
  if ((history || []).length > 0 && random() < readP) return favourite;
  return Math.floor(random() * 3);
}

// Les 10 façons de jouer le point quand le retour est remis en jeu :
// 6 gagnées par le serveur, 4 par le relanceur, tirées au hasard.
// rallies = nombre d'allers-retours avant le dernier coup ;
// end = fin visuelle : "winner" (passe l'adversaire et sort du cadre),
// "net" (dans le filet), "out" (dehors), "drop" (amortie qui meurt).
export const RALLY_POINTS = [
  { serverWins: true,  rallies: 0, end: "net",    text: "Retour dans le filet." },
  { serverWins: true,  rallies: 1, end: "winner", text: "Service-volée : volée gagnante." },
  { serverWins: true,  rallies: 2, end: "winner", text: "Coup droit d'attaque gagnant du serveur." },
  { serverWins: true,  rallies: 3, end: "drop",   text: "Amortie gagnante du serveur." },
  { serverWins: true,  rallies: 3, end: "winner", text: "Lob trop court, smash du serveur." },
  { serverWins: true,  rallies: 5, end: "out",    text: "Long échange, le relanceur finit par sortir la balle." },
  { serverWins: false, rallies: 2, end: "winner", text: "Passing-shot le long de la ligne !" },
  { serverWins: false, rallies: 3, end: "net",    text: "Faute directe du serveur dans le filet." },
  { serverWins: false, rallies: 2, end: "winner", text: "Lob gagnant par-dessus le serveur !" },
  { serverWins: false, rallies: 4, end: "winner", text: "Revers croisé gagnant du relanceur !" },
];

// Duel service / retour : serveZone = où part le service, readZone = où
// le relanceur s'est placé. Selon l'écart en cases :
// - 0 au T ou à l'extérieur : bien lu, retour gagnant ;
// - 0 dans le corps, ou 1 case : le relanceur se décale, remet la balle,
//   et un point se joue (RALLY_POINTS) ;
// - 2 cases : il se décale d'une case, trop tard : ace.
// Renvoie { kind: "return_winner" | "rally" | "ace", serverWins, rally?, shift }.
export function resolveServeDuel(serveZone, readZone) {
  const dist = Math.abs(serveZone - readZone);
  if (dist === 2) return { kind: "ace", serverWins: true, shift: readZone + Math.sign(serveZone - readZone), dist };
  if (dist === 0 && serveZone !== 1) return { kind: "return_winner", serverWins: false, shift: readZone, dist };
  const rally = RALLY_POINTS[Math.floor(random() * RALLY_POINTS.length)];
  return { kind: "rally", serverWins: rally.serverWins, rally, shift: serveZone, dist };
}

// Duel au service : le joueur sert en pick, l'adversaire a lu guess.
export function serveDuel(pick, guess) {
  const r = resolveServeDuel(pick, guess);
  const text = r.kind === "ace" ? "Il attendait " + ZONES[guess].toLowerCase() + " : ace !"
    : r.kind === "return_winner" ? "Il avait lu votre service : retour gagnant."
    : r.rally.text;
  return { ...r, win: r.serverWins, text };
}

// Duel au retour : le joueur se place en guess, l'adversaire sert au hasard.
export function returnDuel(guess) {
  const target = Math.floor(random() * 3);
  const r = resolveServeDuel(target, guess);
  const text = r.kind === "ace" ? "Il a servi " + ZONES[target].toLowerCase() + " : ace."
    : r.kind === "return_winner" ? "Bien lu ! Retour gagnant."
    : r.rally.text;
  return { ...r, target, win: !r.serverWins, text };
}

// Smash : précision de 0 (raté) à 1 (pile au centre de la zone verte).
export function smashResult(precision) {
  if (precision >= 0.6) return { win: true, text: "SMASH ! Imparable." };
  if (precision >= 0.25) return { win: random() < 0.5, text: "Smash un peu court…" };
  return { win: false, text: "Dans le filet !" };
}

// Effet d'un mini-jeu sur le match : l'élan.
export function miniGameEffect(win) {
  return win ? { momentumDelta: 2 } : { momentumDelta: -1 };
}

// ─── À L'ENTRAÎNEMENT ──────────────────────────────────────────────────────
// Trois programmes, comme les programmes d'essais libres : chacun affiche sa
// probabilité de réussite. Réussi, il rapporte son gain ; raté, rien.
// Plus le programme est risqué, plus il rapporte. Tous coûtent la même énergie.
export const TRAINING_CARDS = [
  { id: "commune", rarity: "Routine", name: "Séance de routine", baseP: 0.85, successMul: 1, failMul: 0, desc: "Sûr, gain modeste." },
  { id: "rare", rarity: "Intensif", name: "Séance intensive", baseP: 0.6, successMul: 1.4, failMul: 0, desc: "Meilleur gain, plus incertain." },
  { id: "mystere", rarity: "Exploit", name: "Pari du coach", baseP: 0.3, successMul: 2, failMul: 0, desc: "Gros gain, rarement réussi." },
];

// Probabilité de réussite d'un programme, selon la forme du joueur :
// énergie, bonheur et qualité du staff (trainGain).
// ctx = { energy, happiness, staffTrainGain }
export function trainingOdds(card, ctx = {}) {
  const energy = ctx.energy ?? 80, happiness = ctx.happiness ?? 70, staff = ctx.staffTrainGain ?? 0;
  const p = card.baseP + (energy - 70) * 0.003 + (happiness - 60) * 0.002 + staff * 0.6;
  return Math.max(0.05, Math.min(0.97, p));
}

// Tirage d'un programme : le jet (0–1) est comparé à la probabilité.
// Renvoie { success, roll, p, gainMul }.
export function rollTraining(card, ctx) {
  const p = trainingOdds(card, ctx);
  const roll = random();
  const success = roll < p;
  return { success, roll, p, gainMul: success ? card.successMul : card.failMul };
}
