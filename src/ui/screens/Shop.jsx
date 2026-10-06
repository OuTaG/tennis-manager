// Écran Boutique.
import { useState } from "react";
import { SHOP_ITEMS, SHOP_STORAGE_KEY, loadPurchases } from "../../engine/storage.js";
import { Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

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
            background: T.amberSub, border: "1px solid " + T.amberBrd,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="bag" size={26} color={T.amber} />
          </div>
          <div style={{ color: T.fg, fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Bientôt disponible</div>
          <div style={{ color: T.fg3, fontSize: 13, lineHeight: 1.5 }}>
            Les options de la boutique arrivent prochainement.
          </div>
        </div>
      ) : categories.map(cat => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ color: T.fg3, fontSize: 12, fontWeight: 600, margin: "0 2px 8px" }}>{cat}</div>
          {SHOP_ITEMS.filter(i => (i.category || "Options") === cat).map(item => {
            // L'accès complet inclut l'accès Classements.
            const isOwned = owned.includes(item.id) || (item.id === "online_ranked" && owned.includes("online_full"));
            const soon = item.status === "soon";
            return (
              <div key={item.id} style={{ ...styles.skillsCard, marginBottom: 8, padding: 14, opacity: soon ? 0.85 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 0, background: soon ? T.bg2 : T.amberSub, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={item.icon || "bag"} size={20} color={soon ? T.fg4 : T.amber} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.fg, fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                    <div className="tm-num" style={{ color: T.fg4, fontSize: 12, marginTop: 2 }}>{item.price}{item.period ? " " + item.period : ""}</div>
                  </div>
                  {isOwned ? (
                    <span style={{ ...styles.badge, color: T.green, borderColor: T.greenBrd, background: T.greenSub }}>{item.type === "subscription" ? "Actif" : "Acquis"}</span>
                  ) : soon ? (
                    <span style={styles.badge}>Bientôt</span>
                  ) : (
                    <button style={{ ...styles.btnSmall, background: T.amber, color: T.onAccent, borderColor: T.amber, flexShrink: 0 }} onClick={() => setPending(item)}>
                      {item.type === "subscription" ? "S'abonner" : "Acheter"}
                    </button>
                  )}
                </div>
                {item.desc && <div style={{ color: T.fg3, fontSize: 13, lineHeight: 1.45, marginTop: 10 }}>{item.desc}</div>}
                {(item.perks || []).length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {item.perks.map((pk, pi) => (
                      <div key={pi} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: pk.ready ? T.fg2 : T.fg4 }}>
                        <Icon name={pk.ready ? "check" : "history"} size={14} color={pk.ready ? T.green : T.fg5} />
                        <span style={{ flex: 1 }}>{pk.label}</span>
                        {!pk.ready && <span style={{ fontSize: 11, color: T.fg5 }}>bientôt</span>}
                      </div>
                    ))}
                  </div>
                )}
                {isOwned && item.type === "subscription" && (
                  <button
                    style={{ background: "none", border: "none", padding: 0, marginTop: 10, color: T.fg4, fontSize: 12, textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer" }}
                    onClick={() => cancelItem(item)}
                  >Résilier l'abonnement</button>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {pending && (
        <div style={{ ...styles.dilemmaOverlay, zIndex: 200 }} onClick={() => setPending(null)}>
          <div style={styles.dilemmaCard} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.fg, fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{pending.name}</div>
            {pending.desc && <div style={{ color: T.fg3, fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>{pending.desc}</div>}
            <button style={{ ...styles.btnPrimary, background: T.amber, boxShadow: "0 3px 0 " + T.clay }} onClick={() => purchaseItem(pending)}>
              {pending.type === "subscription" ? "S'abonner" : "Acheter"} · {pending.price}{pending.period ? " " + pending.period : ""}
            </button>
            <button style={{ ...styles.btnSecondary, marginTop: 8 }} onClick={() => setPending(null)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
