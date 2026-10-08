// Mini-jeux de choix : duel au service, duel au retour, smash au bon moment
// (en match) et fiches d'entraînement. Règles pures, hasard du moteur.
import { random } from "./rng.js";

// Zones du carré de service, de l'extérieur (contre le couloir) au T
// (contre la ligne médiane) : l'indice donne aussi la position, la
// distance entre deux zones se compte en cases.
export const ZONES = ["Extérieur", "Corps", "Au T"];
// Les mêmes zones dans une phrase (« Il attendait au T », « Il a servi à
// l'extérieur ») : préposition comprise, le T reste en majuscule.
export const ZONE_PHRASES = ["à l'extérieur", "dans le corps", "au T"];

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

// Les 10 façons de jouer le point quand le retour est remis en jeu. Chaque
// texte existe vu par le joueur quand il sert (serve) et quand il retourne
// (ret) ; text est la version neutre.
// 6 gagnées par le serveur, 4 par le relanceur, tirées au hasard.
// rallies = nombre d'allers-retours avant le dernier coup ;
// end = fin visuelle : "winner" (passe l'adversaire et sort du cadre),
// "net" (dans le filet), "out" (dehors), "drop" (amortie qui meurt).
// dir (facultatif) : direction imposée par le texte du coup gagnant
// ("line" = le long de la ligne, "cross" = croisé) ; shot : "lob" (rebond
// profond). Sans dir, le gagnant part simplement loin de l'adversaire.
export const RALLY_POINTS = [
  { serverWins: true,  rallies: 0, end: "net",    text: "Retour dans le filet.",
    serve: "Le retour adverse finit dans le filet.", ret: "Votre retour finit dans le filet." },
  { serverWins: true,  rallies: 1, end: "winner", text: "Service-volée : volée gagnante.",
    serve: "Service-volée : votre volée est gagnante.", ret: "Service-volée de l'adversaire : volée gagnante." },
  { serverWins: true,  rallies: 2, end: "winner", text: "Coup droit d'attaque gagnant du serveur.",
    serve: "Votre coup droit d'attaque est gagnant.", ret: "Coup droit d'attaque gagnant de l'adversaire." },
  { serverWins: true,  rallies: 3, end: "drop",   text: "Amortie gagnante du serveur.",
    serve: "Votre amortie meurt juste derrière le filet.", ret: "Amortie gagnante de l'adversaire." },
  { serverWins: true,  rallies: 3, end: "winner", text: "Lob trop court, smash du serveur.",
    serve: "L'adversaire tente le lob, trop court : vous concluez d'un smash.", ret: "Votre lob est trop court : l'adversaire conclut d'un smash." },
  { serverWins: true,  rallies: 5, end: "out",    text: "Long échange, le relanceur finit par sortir la balle.",
    serve: "Long échange, l'adversaire finit par sortir la balle.", ret: "Long échange, vous finissez par sortir la balle." },
  { serverWins: false, rallies: 2, end: "winner", dir: "line", text: "Passing-shot le long de la ligne !",
    serve: "Passing-shot de l'adversaire le long de la ligne.", ret: "Votre passing-shot passe le long de la ligne !" },
  { serverWins: false, rallies: 3, end: "net",    text: "Faute directe du serveur dans le filet.",
    serve: "Vous envoyez la balle dans le filet.", ret: "L'adversaire envoie la balle dans le filet." },
  { serverWins: false, rallies: 2, end: "winner", shot: "lob", text: "Lob gagnant par-dessus le serveur !",
    serve: "Lob gagnant de l'adversaire par-dessus vous.", ret: "Votre lob passe par-dessus l'adversaire !" },
  { serverWins: false, rallies: 4, end: "winner", dir: "cross", text: "Revers croisé gagnant du relanceur !",
    serve: "Revers croisé gagnant de l'adversaire.", ret: "Votre revers croisé est gagnant !" },
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
  const text = r.kind === "ace" ? "Il attendait " + ZONE_PHRASES[guess] + ", vous servez " + ZONE_PHRASES[pick] + " : ace !"
    : r.kind === "return_winner" ? "Il avait lu votre service : retour gagnant."
    : r.rally.serve;
  return { ...r, win: r.serverWins, text };
}

// Duel au retour : le joueur se place en guess, l'adversaire sert au hasard.
export function returnDuel(guess) {
  const target = Math.floor(random() * 3);
  const r = resolveServeDuel(target, guess);
  const text = r.kind === "ace" ? "Il a servi " + ZONE_PHRASES[target] + ", vous l'attendiez " + ZONE_PHRASES[guess] + " : ace."
    : r.kind === "return_winner" ? "Bien lu ! Retour gagnant."
    : r.rally.ret;
  return { ...r, target, win: !r.serverWins, text };
}

// Smash : précision de 0 (raté) à 1 (pile au centre de la zone verte).
// Zone « presque » : le smash est trop court pour être imparable, une fois
// sur deux l'adversaire le remet. Le texte dit lequel des deux s'est produit.
export function smashResult(precision) {
  if (precision >= 0.6) return { win: true, label: "Parfaite", text: "SMASH ! Imparable." };
  if (precision >= 0.25) {
    const win = random() < 0.5;
    return { win, label: "Un peu courte", text: win ? "Smash un peu court… mais l'adversaire ne le remet pas !" : "Smash un peu court… l'adversaire le remet et gagne le point." };
  }
  return { win: false, label: "Dans le filet", text: "Dans le filet !" };
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
