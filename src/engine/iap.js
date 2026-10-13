// Achats intégrés (App Store) via le plugin Capacitor « NativePurchases »
// (@capgo/native-purchases, installé dans le projet iOS). Dans l'app iOS,
// chaque article de la boutique correspond à un produit non consommable
// d'identifiant `com.outag.courtside.<id>` (à créer dans App Store Connect).
// Sur le web (GitHub Pages), la boutique garde son fonctionnement simulé.
import { Capacitor, registerPlugin } from "@capacitor/core";
import { SHOP_ITEMS, SHOP_STORAGE_KEY, loadPurchases } from "./storage.js";

export const IAP_PREFIX = "com.outag.courtside.";
export const productIdOf = (itemId) => IAP_PREFIX + itemId;
const itemIdOf = (productId) => (productId || "").startsWith(IAP_PREFIX) ? productId.slice(IAP_PREFIX.length) : null;

export function isNativeStore() {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

let plugin = null;
const store = () => plugin || (plugin = registerPlugin("NativePurchases"));

// Articles réellement en vente (les articles « bientôt » ne sont pas proposés).
export const SELLABLE_ITEMS = SHOP_ITEMS.filter(i => i.status === "available");

function saveOwned(ids) {
  try { localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify([...new Set(ids)])); } catch { /* stockage indisponible */ }
}

// Prix localisés de l'App Store : { itemId: "2,99 €" }. Vide si les produits
// ne sont pas (encore) disponibles.
export async function loadStorePrices() {
  const { products } = await store().getProducts({ productIdentifiers: SELLABLE_ITEMS.map(i => productIdOf(i.id)) });
  const out = {};
  (products || []).forEach(p => { const id = itemIdOf(p.identifier); if (id) out[id] = p.priceString; });
  return out;
}

// Achat : { ok } si l'achat est validé, { cancelled } si le joueur annule,
// { error } sinon.
export async function buyItem(item) {
  try {
    const tx = await store().purchaseProduct({ productIdentifier: productIdOf(item.id), productType: "inapp", quantity: 1 });
    const id = itemIdOf(tx && tx.productIdentifier) || item.id;
    saveOwned([...loadPurchases(), id]);
    return { ok: true };
  } catch (e) {
    const msg = String((e && (e.message || e.code)) || e || "");
    if (/cancel/i.test(msg)) return { cancelled: true };
    return { error: msg || "Achat impossible pour le moment." };
  }
}

// Droits actuels du compte App Store → liste des articles acquis sur
// l'appareil. `restore` relance d'abord la restauration (bouton « Restaurer
// les achats »). En cas d'échec (hors ligne…), les achats connus sont gardés.
export async function syncEntitlements(restore = false) {
  if (restore) await store().restorePurchases();
  const { purchases } = await store().getPurchases({ productType: "inapp", onlyCurrentEntitlements: true });
  const ids = (purchases || [])
    .filter(t => !t.revocationDate)
    .map(t => itemIdOf(t.productIdentifier))
    .filter(Boolean);
  saveOwned(ids);
  return ids;
}
