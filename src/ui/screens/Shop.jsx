// Écran Boutique.
import { useEffect, useRef, useState } from "react";
import { SHOP_ITEMS, SHOP_STORAGE_KEY, loadPurchases } from "../../engine/storage.js";
import { buyItem, isNativeStore, loadStorePrices, syncEntitlements } from "../../engine/iap.js";
import { markShopSeen } from "../../engine/shopPromo.js";
import { Icon } from "../icons.jsx";
import { ThankYouScreen } from "../overlays/ThankYou.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

const INK = "#141414";

// `focusId` : article mis en avant à l'ouverture (arrivée depuis un contenu
// verrouillé). `onUse(itemId)` : bouton « en profiter » de la page de
// remerciement (absent en cours de carrière).
export function ShopScreen({ onPurchasesChanged, focusId, onUse }) {
  const [owned, setOwned] = useState(() => loadPurchases());
  const [thanks, setThanks] = useState(null); // article qui vient d'être acheté
  const focusRef = useRef(null);
  useEffect(() => { markShopSeen(); }, []);
  // Différé : le parent remet la page en haut à chaque changement d'écran,
  // après les effets de la boutique.
  useEffect(() => {
    if (!focusId) return;
    const t = setTimeout(() => { if (focusRef.current) focusRef.current.scrollIntoView({ block: "center", behavior: "smooth" }); }, 120);
    return () => clearTimeout(t);
  }, [focusId]);
  const [pending, setPending] = useState(null); // article en cours de confirmation
  // App iOS : vrais achats intégrés (prix de l'App Store, restauration).
  // Web : achat simulé.
  const native = isNativeStore();
  const [prices, setPrices] = useState(null); // { itemId: "2,99 €" } (app iOS)
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // message après achat / restauration
  useEffect(() => {
    if (!native) return;
    let alive = true;
    loadStorePrices().then(p => { if (alive) setPrices(p); }).catch(() => { if (alive) setPrices({}); });
    return () => { alive = false; };
  }, [native]);
  const items = native ? SHOP_ITEMS.filter(i => i.status === "available") : SHOP_ITEMS;
  const priceOf = (item) => (native ? (prices && prices[item.id]) : item.price) || item.price;
  const purchaseItem = async (item) => {
    if (native) {
      setBusy(true);
      const r = await buyItem(item);
      setBusy(false);
      setPending(null);
      if (r.ok) { setOwned(loadPurchases()); setThanks(item); if (onPurchasesChanged) onPurchasesChanged(); }
      else if (r.error) setNotice("L'achat n'a pas abouti : " + r.error);
      return;
    }
    const next = [...new Set([...owned, item.id])];
    try { localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
    setOwned(next);
    setPending(null);
    setThanks(item);
    if (onPurchasesChanged) onPurchasesChanged();
  };
  const restore = async () => {
    setBusy(true);
    try {
      const ids = await syncEntitlements(true);
      setOwned(loadPurchases());
      setNotice(ids.length ? "Achats restaurés." : "Aucun achat à restaurer sur ce compte.");
      if (onPurchasesChanged) onPurchasesChanged();
    } catch {
      setNotice("Restauration impossible pour le moment. Vérifiez votre connexion.");
    }
    setBusy(false);
  };
  const cancelItem = (item) => {
    const next = owned.filter(id => id !== item.id);
    try { localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
    setOwned(next);
    
  };
  const categories = [...new Set(items.map(i => i.category || "Options"))];

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Boutique</div>
      {items.length > 0 && (
        <div className="tm-lettering" style={{ background: "#ffffff", color: INK, border: "2.5px solid " + INK, boxShadow: "3px 3px 0 " + INK, padding: "8px 11px", marginBottom: 16, fontSize: 15, lineHeight: 1.3, transform: "rotate(-0.4deg)" }}>
          Pas de publicité, pas d'abonnement : chaque extension se paie une seule fois et finance les prochaines mises à jour du jeu.
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ ...styles.skillsCard, textAlign: "center", padding: "28px 18px" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 0, margin: "0 auto 12px",
            background: "#d6ef3c", border: "3px solid " + INK, boxShadow: "3px 3px 0 " + INK, transform: "rotate(-4deg)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="bag" size={26} color={INK} />
          </div>
          <div className="tm-display" style={{ color: INK, fontSize: 18, marginBottom: 6 }}>Bientôt disponible</div>
          <div className="tm-lettering" style={{ color: INK, fontSize: 16, lineHeight: 1.25 }}>
            Les options de la boutique arrivent prochainement.
          </div>
        </div>
      ) : categories.map(cat => (
        <div key={cat} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span className="tm-display" style={{ background: INK, color: "#ffffff", border: "2px solid " + INK, padding: "2px 9px", fontSize: 13 }}>{cat}</span>
            <div style={{ flex: 1, borderTop: "2px dashed " + INK }} />
          </div>
          {items.filter(i => (i.category || "Options") === cat).map(item => {
            // L'accès complet inclut l'accès Classements.
            const isOwned = owned.includes(item.id) || (item.id === "online_ranked" && owned.includes("online_full"));
            const soon = item.status === "soon";
            const focused = item.id === focusId && !isOwned;
            return (
              <div key={item.id} ref={focused ? focusRef : null} className={focused ? "tm-shop-focus" : undefined} style={{ background: "#ffffff", color: INK, border: "3px solid " + INK, boxShadow: "4px 4px 0 " + (focused ? "#c4302b" : INK), marginBottom: 12, opacity: soon ? 0.85 : 1, overflow: "hidden" }}>
                <div className={soon ? "tm-halftone-lilac" : isOwned ? "tm-halftone-cyan" : "tm-halftone-yellow"} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: "2.5px solid " + INK }}>
                  <div style={{ width: 40, height: 40, background: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, transform: "rotate(-4deg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={item.icon || "bag"} size={20} color={INK} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tm-display" style={{ fontSize: 16, lineHeight: 1.1, color: isOwned && !soon ? "#ffffff" : INK, textShadow: isOwned && !soon ? "1.5px 1.5px 0 " + INK : "none" }}>{item.name}</div>
                    <span className="tm-num" style={{ display: "inline-block", marginTop: 4, background: "#ffffff", border: "2px solid " + INK, fontSize: 12, fontWeight: 800, padding: "0 6px" }}>{priceOf(item)}{item.period ? " " + item.period : ""}</span>
                  </div>
                  {isOwned ? (
                    <span style={{ background: "#1f7a45", color: "#ffffff", border: "2.5px solid " + INK, fontSize: 11, fontWeight: 800, padding: "2px 7px", textTransform: "uppercase", flexShrink: 0 }}>{item.type === "subscription" ? "Actif" : "Acquis"}</span>
                  ) : soon ? (
                    <span style={{ background: "#ffffff", border: "2.5px solid " + INK, fontSize: 11, fontWeight: 800, padding: "2px 7px", textTransform: "uppercase", flexShrink: 0 }}>Bientôt</span>
                  ) : (
                    <button className="tm-display" style={{ background: "#1f7a45", color: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, padding: "6px 10px", fontSize: 13, cursor: "pointer", flexShrink: 0 }} onClick={() => setPending(item)}>
                      {item.type === "subscription" ? "S'abonner" : "Acheter"}
                    </button>
                  )}
                </div>
                <div style={{ padding: "10px 12px 12px" }}>
                  {item.desc && <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>{item.desc}</div>}
                  {(item.perks || []).filter(pk => !native || pk.ready).length > 0 && (
                    <div style={{ marginTop: item.desc ? 10 : 0, display: "flex", flexDirection: "column", gap: 6 }}>
                      {item.perks.filter(pk => !native || pk.ready).map((pk, pi) => (
                        <div key={pi} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, opacity: pk.ready ? 1 : 0.6 }}>
                          <span style={{ width: 18, height: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: pk.ready ? "#d6ef3c" : "#ffffff", border: "2px solid " + INK }}>
                            <Icon name={pk.ready ? "check" : "history"} size={11} color={INK} />
                          </span>
                          <span style={{ flex: 1 }}>{pk.label}</span>
                          {!pk.ready && <span className="tm-lettering" style={{ fontSize: 13 }}>bientôt</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {!native && isOwned && item.type === "subscription" && (
                    <button
                      style={{ background: "#ffffff", border: "2px solid " + INK, boxShadow: "2px 2px 0 " + INK, padding: "3px 9px", marginTop: 10, color: "#c4302b", fontFamily: T.body, fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3, cursor: "pointer" }}
                      onClick={() => cancelItem(item)}
                    >Résilier l'abonnement</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Restauration des achats (exigée par l'App Store) */}
      {native && (
        <button disabled={busy} onClick={restore} style={{ ...styles.btnSecondary, width: "100%", marginTop: 4, opacity: busy ? 0.6 : 1 }}>
          Restaurer les achats
        </button>
      )}
      {notice && (
        <div role="status" className="tm-lettering" onClick={() => setNotice(null)} style={{ marginTop: 12, background: "#ffffff", color: INK, border: "2.5px solid " + INK, boxShadow: "3px 3px 0 " + INK, padding: "6px 10px", fontSize: 15, lineHeight: 1.25 }}>{notice}</div>
      )}

      {focusId && <style>{`@keyframes tm-shop-focus { 0%, 100% { transform: none; } 30% { transform: rotate(-1deg) scale(1.02); } 60% { transform: rotate(.6deg) scale(1.01); } } .tm-shop-focus { animation: tm-shop-focus .7s ease-in-out .3s 2; } @media (prefers-reduced-motion: reduce) { .tm-shop-focus { animation: none; } }`}</style>}

      {thanks && <ThankYouScreen item={thanks} onUse={onUse} onClose={() => setThanks(null)} />}

      {pending && (
        <div style={{ ...styles.dilemmaOverlay, zIndex: 200 }} onClick={() => { if (!busy) setPending(null); }}>
          <div style={styles.dilemmaCard} onClick={e => e.stopPropagation()}>
            <div className="tm-halftone-yellow" style={{ margin: "-16px -16px 12px", padding: "10px 16px", borderBottom: "3px solid " + INK, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 36, height: 36, flexShrink: 0, background: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, transform: "rotate(-4deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={pending.icon || "bag"} size={19} color={INK} />
              </span>
              <div className="tm-display" style={{ color: INK, fontSize: 20, lineHeight: 1.05, minWidth: 0 }}>{pending.name}</div>
            </div>
            {pending.desc && <div style={{ color: INK, fontSize: 13, fontWeight: 700, lineHeight: 1.45, marginBottom: 14 }}>{pending.desc}</div>}
            <button style={{ ...styles.btnPrimary, opacity: busy || (native && prices && !prices[pending.id]) ? 0.6 : 1 }} disabled={busy || (native && (!prices || !prices[pending.id]))} onClick={() => purchaseItem(pending)}>
              {busy ? "Achat en cours…" : native && prices && !prices[pending.id] ? "Indisponible pour le moment" : (pending.type === "subscription" ? "S'abonner" : "Acheter") + " · " + priceOf(pending) + (pending.period ? " " + pending.period : "")}
            </button>
            <button style={{ ...styles.btnSecondary, marginTop: 8 }} disabled={busy} onClick={() => setPending(null)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
