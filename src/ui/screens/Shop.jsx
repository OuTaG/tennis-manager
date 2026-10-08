// Écran Boutique.
import { useState } from "react";
import { SHOP_ITEMS, SHOP_STORAGE_KEY, loadPurchases } from "../../engine/storage.js";
import { Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

const INK = "#141414";

export function ShopScreen() {
  const [owned, setOwned] = useState(() => loadPurchases());
  const [pending, setPending] = useState(null); // article en cours de confirmation
  const purchaseItem = (item) => {
    const next = [...new Set([...owned, item.id])];
    try { localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
    setOwned(next);
    setPending(null);
    
  };
  const cancelItem = (item) => {
    const next = owned.filter(id => id !== item.id);
    try { localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
    setOwned(next);
    
  };
  const categories = [...new Set(SHOP_ITEMS.map(i => i.category || "Options"))];

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Boutique</div>

      {SHOP_ITEMS.length === 0 ? (
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
          {SHOP_ITEMS.filter(i => (i.category || "Options") === cat).map(item => {
            // L'accès complet inclut l'accès Classements.
            const isOwned = owned.includes(item.id) || (item.id === "online_ranked" && owned.includes("online_full"));
            const soon = item.status === "soon";
            return (
              <div key={item.id} style={{ background: "#ffffff", color: INK, border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, marginBottom: 12, opacity: soon ? 0.85 : 1, overflow: "hidden" }}>
                <div className={soon ? "tm-halftone-lilac" : isOwned ? "tm-halftone-cyan" : "tm-halftone-yellow"} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: "2.5px solid " + INK }}>
                  <div style={{ width: 40, height: 40, background: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, transform: "rotate(-4deg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={item.icon || "bag"} size={20} color={INK} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tm-display" style={{ fontSize: 16, lineHeight: 1.1, color: isOwned && !soon ? "#ffffff" : INK, textShadow: isOwned && !soon ? "1.5px 1.5px 0 " + INK : "none" }}>{item.name}</div>
                    <span className="tm-num" style={{ display: "inline-block", marginTop: 4, background: "#ffffff", border: "2px solid " + INK, fontSize: 12, fontWeight: 800, padding: "0 6px" }}>{item.price}{item.period ? " " + item.period : ""}</span>
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
                  {(item.perks || []).length > 0 && (
                    <div style={{ marginTop: item.desc ? 10 : 0, display: "flex", flexDirection: "column", gap: 6 }}>
                      {item.perks.map((pk, pi) => (
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
                  {isOwned && item.type === "subscription" && (
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

      {pending && (
        <div style={{ ...styles.dilemmaOverlay, zIndex: 200 }} onClick={() => setPending(null)}>
          <div style={styles.dilemmaCard} onClick={e => e.stopPropagation()}>
            <div className="tm-halftone-yellow" style={{ margin: "-16px -16px 12px", padding: "10px 16px", borderBottom: "3px solid " + INK, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 36, height: 36, flexShrink: 0, background: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, transform: "rotate(-4deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={pending.icon || "bag"} size={19} color={INK} />
              </span>
              <div className="tm-display" style={{ color: INK, fontSize: 20, lineHeight: 1.05, minWidth: 0 }}>{pending.name}</div>
            </div>
            {pending.desc && <div style={{ color: INK, fontSize: 13, fontWeight: 700, lineHeight: 1.45, marginBottom: 14 }}>{pending.desc}</div>}
            <button style={styles.btnPrimary} onClick={() => purchaseItem(pending)}>
              {pending.type === "subscription" ? "S'abonner" : "Acheter"} · {pending.price}{pending.period ? " " + pending.period : ""}
            </button>
            <button style={{ ...styles.btnSecondary, marginTop: 8 }} onClick={() => setPending(null)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
