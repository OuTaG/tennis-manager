// Mini-jeux de choix : duel au service, duel au retour, smash au bon moment
// (en match) et fiches d'entraînement. Règles pures, hasard du moteur.
import { random } from "./rng.js";

export const ZONES = ["Large", "Corps", "Au T"];

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

// Duel au service : servir là où il n'attend pas. S'il devine, le point
// reste jouable selon la qualité du service.
export function serveDuel(pick, guess, myServe) {
  if (pick !== guess) return { win: true, text: "Il attendait " + ZONES[guess].toLowerCase() + ". Ace !" };
  const p = Math.max(0.15, Math.min(0.55, 0.25 + ((myServe ?? 60) - 60) / 120));
  const win = random() < p;
  return { win, text: win ? "Il a deviné, mais votre service passe quand même !" : "Il a deviné : retour gagnant…" };
}

// Duel au retour : deviner où l'adversaire va servir.
export function returnDuel(guess, oppServe) {
  const target = Math.floor(random() * 3);
  if (guess === target) return { win: true, target, text: "Bien lu ! Retour gagnant sur son service " + ZONES[target].toLowerCase() + "." };
  const p = Math.max(0.1, Math.min(0.35, 0.25 - ((oppServe ?? 60) - 60) / 200));
  const win = random() < p;
  return { win, target, text: win ? "Mauvaise lecture, mais vous remettez la balle… et gagnez l'échange !" : "Il a servi " + ZONES[target].toLowerCase() + ". Trop tard." };
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
// Plus le programme est risqué, plus il rapporte et plus il fatigue.
export const TRAINING_CARDS = [
  { id: "commune", rarity: "Routine", name: "Séance de routine", baseP: 0.85, successMul: 1, failMul: 0, energyMul: 1, desc: "Sûr, gain modeste." },
  { id: "rare", rarity: "Intensif", name: "Séance intensive", baseP: 0.6, successMul: 2.2, failMul: 0, energyMul: 1.4, desc: "Gros gain, plus de fatigue." },
  { id: "mystere", rarity: "Exploit", name: "Pari du coach", baseP: 0.3, successMul: 3.6, failMul: 0, energyMul: 1.8, desc: "Énorme gain, épuisant." },
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
