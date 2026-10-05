// Boutique (achats), emplacements de sauvegarde.
import { CHALLENGE_SLOT } from "./challenges.js";
import { getPlayerRanking, totalAtpPoints } from "./player.js";

// ─── BOUTIQUE ─────────────────────────────────────────────────────────────
// Catalogue des options payantes. À remplir : chaque article est
// { id, name, desc, price: "2,99 €", category, icon }. Les achats sont liés à
// l'appareil (localStorage « tm-purchases »), pas à la carrière, pour rester
// acquis quand on recommence une partie.
// Paiement réel non branché : `purchaseItem` simule l'achat. À remplacer par
// l'appel à la plateforme (Google Play Billing / App Store) le moment venu.
// status : "available" (achetable) ou "soon" (affiché, pas encore achetable).
// perks : contenu de l'offre ; ready = déjà fonctionnel dans le jeu.
// Prix indicatifs, à ajuster.
export const SHOP_ITEMS = [
  {
    id: "sub_perso", category: "Abonnement", type: "subscription", icon: "star",
    name: "Abonnement Premium", price: "2,99 €", period: "/ mois", status: "available",
    desc: "Le confort et la personnalisation complète de votre carrière.",
    perks: [
      { label: "Vitesse de match ×4", ready: true, entitlement: "speed_x4" },
      { label: "Staffs exclusifs", ready: false },
      { label: "Noms et pays des joueurs personnalisables", ready: false },
      { label: "Suppression des publicités", ready: false },
    ],
  },
  { id: "dlc_challenges", category: "Modes de jeu", type: "dlc", icon: "target", name: "Défis scénarisés", price: "2,99 €", status: "available",
    desc: "Des situations imposées à renverser : blessure, dette, remontée au classement…" },
  {
    id: "season_pass", category: "Pass de saison", type: "pass", icon: "calendar",
    name: "Pass de saison", price: "4,99 €", period: "/ saison", status: "soon",
    desc: "Une saison d'objectifs en plus, à jouer contre les autres joueurs.",
    perks: [
      { label: "Défis hebdomadaires", ready: false },
      { label: "Classement entre joueurs", ready: false },
      { label: "Gains de sponsors en récompense", ready: false },
    ],
  },
  { id: "multi_careers", category: "Achat unique", type: "once", icon: "history", name: "Carrières multiples", price: "1,99 €", status: "available",
    desc: "Deux emplacements de sauvegarde en plus, pour mener jusqu'à 3 carrières en parallèle." },
];
export const SHOP_STORAGE_KEY = "tm-purchases";

// ─── EMPLACEMENTS DE CARRIÈRE ─────────────────────────────────────────────
// Emplacement 1 = ancienne clé (les sauvegardes existantes restent lisibles).
// Un petit résumé par emplacement évite de relire toute la sauvegarde au menu.
export const SAVE_SLOTS = 3;
export function saveKeyFor(i) { return i === 0 ? "tm_save_v1" : "tm_save_v1_s" + (i + 1); }
export function slotMetaKeyFor(i) { return "tm_slot_meta_" + (i + 1); }
export function writeSlotMeta(i, player, atpDb) {
  if (!player) return;
  try {
    const pts = totalAtpPoints(player.atpPointsLog || []);
    const rank = atpDb && pts > 0 ? getPlayerRanking(pts, atpDb) : null;
    localStorage.setItem(slotMetaKeyFor(i), JSON.stringify({
      name: player.name, flag: player.nationalityFlag || "", circuit: player.circuit || "atp",
      challenge: player.challenge ? player.challenge.id : null,
      year: player.year, week: player.week, rank, savedAt: Date.now(),
    }));
  } catch (e) {}
}
// Partie du défi en cours (emplacement à part).
export function loadChallengeMeta() {
  try {
    if (!localStorage.getItem(saveKeyFor(CHALLENGE_SLOT))) return null;
    const m = localStorage.getItem(slotMetaKeyFor(CHALLENGE_SLOT));
    return m ? JSON.parse(m) : null;
  } catch (e) { return null; }
}
export function loadSlotMetas() {
  const out = [];
  for (let i = 0; i < SAVE_SLOTS; i++) {
    let meta = null;
    try {
      const m = localStorage.getItem(slotMetaKeyFor(i));
      if (m) meta = JSON.parse(m);
      else {
        // Ancienne sauvegarde sans résumé : on le reconstruit une fois.
        const raw = localStorage.getItem(saveKeyFor(i));
        if (raw) {
          const data = JSON.parse(raw);
          if (data.player && data.atpDb) {
            const pts = totalAtpPoints(data.player.atpPointsLog || []);
            meta = {
              name: data.player.name, flag: data.player.nationalityFlag || "", circuit: data.player.circuit || "atp",
              year: data.player.year, week: data.player.week,
              rank: pts > 0 ? getPlayerRanking(pts, data.atpDb) : null,
            };
            localStorage.setItem(slotMetaKeyFor(i), JSON.stringify(meta));
          }
        }
      }
    } catch (e) {}
    out.push(meta);
  }
  return out;
}

export function loadPurchases() {
  try { return JSON.parse(localStorage.getItem(SHOP_STORAGE_KEY) || "[]"); } catch (e) { return []; }
}
export function hasPurchased(id) { return loadPurchases().includes(id); }
// Droit débloqué par un achat (ex. "speed_x4" via l'abonnement).
export function hasEntitlement(key) {
  const owned = loadPurchases();
  return SHOP_ITEMS.some(it => owned.includes(it.id) && (it.perks || []).some(p => p.ready && p.entitlement === key));
}
