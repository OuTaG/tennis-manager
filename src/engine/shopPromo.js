// Mise en avant de la boutique : pastille « nouveau » tant que la boutique
// n'a pas été ouverte, et encarts contextuels (fin de saison, fin de
// carrière) qui proposent un article pas encore acquis, avec un argument
// adapté au moment. Rien n'est proposé quand tout est acquis.
import { SHOP_ITEMS, loadPurchases } from "./storage.js";

const SEEN_KEY = "tm-shop-seen";

const AVAILABLE = SHOP_ITEMS.filter(i => i.status === "available");
const unowned = () => { const owned = loadPurchases(); return AVAILABLE.filter(i => !owned.includes(i.id)); };

export function shopIsNew() {
  try { if (localStorage.getItem(SEEN_KEY)) return false; } catch { return false; }
  return unowned().length > 0;
}
export function markShopSeen() {
  try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* stockage indisponible */ }
}

// Argument de vente de chaque article selon le moment.
const PITCH = {
  dlc_challenges: {
    title: "Envie d'un nouveau défi ?",
    text: "8 scénarios imposés à renverser : genou fragile, dette à rembourser, remontée express au classement…",
    cta: "Découvrir les Défis",
  },
  multi_careers: {
    title: "Une autre carrière en parallèle ?",
    text: "Gardez celle-ci et lancez-en deux autres à côté : un autre style, l'autre circuit, une autre ville de départ.",
    cta: "Voir les Carrières multiples",
  },
  custom_mode: {
    title: "Votre propre circuit",
    text: "Renommez et redessinez les 1 200 joueurs de chaque circuit : vos amis, vos idoles, vos rivaux.",
    cta: "Voir la Personnalisation",
  },
};

// Ordre de préférence selon le moment, puis rotation (seed = saison…) parmi
// les articles non acquis.
const ORDER = {
  season: ["dlc_challenges", "multi_careers", "custom_mode"],
  end: ["multi_careers", "dlc_challenges", "custom_mode"],
};

export function shopPromo(moment, seed = 0) {
  const left = unowned().map(i => i.id);
  const ids = (ORDER[moment] || ORDER.season).filter(id => left.includes(id));
  if (!ids.length) return null;
  const id = ids[Math.abs(seed) % ids.length];
  const item = AVAILABLE.find(i => i.id === id);
  return { id, icon: item.icon, name: item.name, ...PITCH[id] };
}
