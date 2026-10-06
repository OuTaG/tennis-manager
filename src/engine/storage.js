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
// Modèle : jeu gratuit (circuit féminin et vitesse ×4 compris), achats
// optionnels sans avantage en jeu. L'en ligne se paie une seule fois, en deux
// niveaux : Classements (défis hebdo + classement mondial) ou Complet (+ coop),
// le passage de l'un à l'autre coûtant la différence.
// Prix indicatifs, à ajuster.
export const SHOP_ITEMS = [
  {
    id: "online_ranked", category: "En ligne", type: "once", icon: "trophy",
    name: "Accès Classements", price: "2,99 €", status: "soon",
    desc: "Payé une fois. Vos carrières comptent dans les classements en ligne. Aucun avantage en jeu.",
    perks: [
      { label: "Défis hebdomadaires", ready: false },
      { label: "Classement mondial de carrière (masculin, féminin, par style)", ready: false },
    ],
  },
  {
    id: "online_full", category: "En ligne", type: "once", icon: "users",
    name: "Accès En ligne complet", price: "4,99 €", status: "soon",
    desc: "Payé une fois. Tout l'accès Classements, plus les carrières coop. Déjà l'accès Classements ? Le passage coûte la différence (2,00 €).",
    perks: [
      { label: "Défis hebdomadaires", ready: false },
      { label: "Classement mondial de carrière (masculin, féminin, par style)", ready: false },
      { label: "Carrières coop", ready: false },
    ],
  },
  { id: "dlc_challenges", category: "Modes de jeu", type: "dlc", icon: "target", name: "Défis scénarisés", price: "2,99 €", status: "available",
    desc: "Des situations imposées à renverser : blessure, dette, remontée au classement…" },
  {
    id: "custom_mode", category: "Options", type: "once", icon: "edit",
    name: "Mode Personnalisation", price: "2,99 €", status: "available",
    desc: "Payé une fois. Renommez et redessinez tous les joueurs du jeu, comme à la création de votre joueur, puis jouez vos carrières avec votre propre base.",
    perks: [
      { label: "Nom, nationalité et portrait des 1 200 joueurs de chaque circuit", ready: true },
      { label: "3 configurations enregistrées, en plus de la base Standard", ready: true },
      { label: "Choix de la base au lancement de chaque carrière", ready: true },
    ],
  },
  { id: "multi_careers", category: "Options", type: "once", icon: "history", name: "Carrières multiples", price: "1,99 €", status: "available",
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
// Droit débloqué par un achat (perk { ready: true, entitlement: "clé" }).
export function hasEntitlement(key) {
  const owned = loadPurchases();
  return SHOP_ITEMS.some(it => owned.includes(it.id) && (it.perks || []).some(p => p.ready && p.entitlement === key));
}
