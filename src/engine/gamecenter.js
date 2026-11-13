// Classement en ligne via Game Center (Apple), par un petit module natif
// « GameCenter » ajouté au projet iOS (ios-native/GameCenterPlugin.swift).
// Un seul classement : le score d'héritage. Chaque envoi porte la
// configuration de départ (encodeConfig) pour se comparer à conditions
// égales. Les carrières « triche » et les défis n'envoient rien.
// Sur le web, ou sans le module, tout est simplement indisponible.
import { Capacitor, registerPlugin } from "@capacitor/core";
import { careerConfigOf, encodeConfig } from "./careerConfig.js";

export const LEADERBOARD_ID = "courtside.legacy";

let plugin = null;
// Tests dans le navigateur : un faux module peut être fourni via
// window.__courtsideGameCenterMock (jamais défini dans l'app).
const mock = () => (typeof window !== "undefined" ? window.__courtsideGameCenterMock : null);
const gc = () => mock() || plugin || (plugin = registerPlugin("GameCenter"));

export function gameCenterSupported() {
  if (mock()) return true;
  try { return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios"; } catch { return false; }
}

let auth = null; // { authenticated, displayName }
let authPromise = null;
// Connexion silencieuse au lancement (Apple affiche lui-même sa bannière ou
// sa fenêtre si le joueur n'est pas encore connecté).
export function authenticateGameCenter() {
  if (!gameCenterSupported()) return Promise.resolve({ authenticated: false, unsupported: true });
  if (!authPromise) {
    authPromise = gc().authenticate()
      // Non connecté : on pourra réessayer plus tard (ouverture du classement).
      .then(r => { auth = r; if (!r || !r.authenticated) authPromise = null; return r; })
      .catch(e => { authPromise = null; auth = { authenticated: false, error: String((e && e.message) || e) }; return auth; });
  }
  return authPromise;
}
export function gameCenterAuth() { return auth; }

// Connexion ou déconnexion signalée par GameKit (bouton « Se connecter »,
// connexion faite depuis la fenêtre Game Center…).
const authListeners = new Set();
let listening = false;
export function onGameCenterAuth(fn) {
  authListeners.add(fn);
  if (!listening && gameCenterSupported() && gc().addListener) {
    listening = true;
    gc().addListener("authChanged", r => { auth = r; if (r && r.authenticated) authPromise = Promise.resolve(r); authListeners.forEach(f => f(r)); });
  }
  return () => authListeners.delete(fn);
}

// Bouton « Se connecter à Game Center » : ouvre la fenêtre de connexion.
export async function signInGameCenter() {
  if (!gameCenterSupported()) return null;
  try {
    const r = await gc().signIn();
    if (r) { auth = r; if (r.authenticated) authPromise = Promise.resolve(r); }
    return r;
  } catch (e) { return { authenticated: false, error: String((e && e.message) || e) }; }
}

// Envoi du score d'héritage : seulement s'il a progressé depuis le dernier
// envoi de cette carrière, et au plus une fois toutes les 5 secondes.
const SENT_KEY = "tm-gc-sent";
let lastSendAt = 0;
export async function submitLegacyScore(player, score) {
  if (!gameCenterSupported() || !player || player.cheated || player.challenge || !(score > 0)) return;
  const sent = (() => { try { return JSON.parse(localStorage.getItem(SENT_KEY) || "{}"); } catch { return {}; } })();
  if ((sent[player.careerId] || 0) >= score) return;
  if (Date.now() - lastSendAt < 5000) return;
  const a = await authenticateGameCenter();
  if (!a || !a.authenticated) return;
  lastSendAt = Date.now();
  try {
    await gc().submitScore({ leaderboardId: LEADERBOARD_ID, score: Math.round(score), context: encodeConfig(careerConfigOf(player)) });
    sent[player.careerId] = score;
    try { localStorage.setItem(SENT_KEY, JSON.stringify(sent)); } catch { /* stockage plein */ }
  } catch { /* réessayé à la prochaine semaine */ }
}

// Entrées du classement : { entries: [{ rank, score, context, name, local }],
// local: entrée du joueur ou null, total }.
// scope : "global" ou "friends" ; start : premier rang (1 = n°1).
export async function loadLeaderboard({ scope = "global", start = 1, length = 100, leaderboardId = LEADERBOARD_ID } = {}) {
  const a = await authenticateGameCenter();
  if (!a || !a.authenticated) return { unavailable: true, reason: a && a.unsupported ? "unsupported" : "signedOut", error: (a && a.error) || "" };
  return gc().loadEntries({ leaderboardId, scope, start, length });
}

// Défi de la semaine : score d'un essai terminé, envoyé au classement
// hebdomadaire (classement récurrent, remis à zéro chaque lundi). Game
// Center ne garde que le meilleur score de la semaine.
export async function submitWeeklyScore(leaderboardId, score, context = 0) {
  if (!gameCenterSupported() || !(score > 0)) return false;
  const a = await authenticateGameCenter();
  if (!a || !a.authenticated) return false;
  try { await gc().submitScore({ leaderboardId, score: Math.round(score), context }); return true; } catch { return false; }
}
