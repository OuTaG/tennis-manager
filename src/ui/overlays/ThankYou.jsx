// Page de remerciement après un achat : case BD plein écran avec explosion
// « MERCI ! », ce que l'achat débloque, un mot du développeur et un bouton
// pour en profiter tout de suite.
import { Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

const INK = "#141414";

const DETAILS = {
  dlc_challenges: {
    unlocked: ["8 scénarios à renverser, sur les deux circuits", "Des règles et des événements propres à chaque défi", "Vos meilleurs résultats gardés pour chaque défi"],
    cta: "Jouer un défi",
  },
  custom_mode: {
    unlocked: ["Nom, nationalité et portrait des 1 200 joueurs de chaque circuit", "3 configurations enregistrées, en plus de la base Standard", "Choix de la base au lancement de chaque carrière"],
    cta: "Personnaliser les joueurs",
  },
  multi_careers: {
    unlocked: ["Emplacements de carrière 2 et 3 débloqués", "Jusqu'à 3 carrières menées en parallèle"],
    cta: "Lancer une nouvelle carrière",
  },
};

// Confettis : position, couleur, délai et rotation fixes (rendu stable).
const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37) % 100,
  color: ["#d6ef3c", "#1f7a45", "#c9b6ea", "#c4302b", "#ffffff"][i % 5],
  delay: ((i * 13) % 10) / 10,
  dur: 2.4 + ((i * 7) % 10) / 8,
  size: 7 + (i % 3) * 3,
  rot: (i * 47) % 360,
}));

export function ThankYouScreen({ item, onUse, onClose }) {
  const d = DETAILS[item.id] || { unlocked: [], cta: null };
  return (
    <div role="dialog" aria-label={"Merci pour votre achat : " + item.name} style={{ position: "fixed", inset: 0, zIndex: 500, overflowY: "auto", background: T.overlay }}>
      <style>{`
        @keyframes tm-ty-pop { 0% { transform: scale(.2) rotate(-14deg); opacity: 0; } 60% { transform: scale(1.12) rotate(-5deg); opacity: 1; } 100% { transform: scale(1) rotate(-6deg); } }
        @keyframes tm-ty-fall { 0% { transform: translateY(-30px) rotate(0deg); opacity: 1; } 100% { transform: translateY(105vh) rotate(540deg); opacity: .9; } }
        @keyframes tm-ty-in { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .tm-ty-anim, .tm-ty-confetti { animation: none !important; } .tm-ty-confetti { display: none; } }
      `}</style>
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {CONFETTI.map((c, i) => (
          <span key={i} className="tm-ty-confetti" style={{
            position: "absolute", top: 0, left: c.left + "%", width: c.size, height: c.size * 0.6,
            background: c.color, border: "1.5px solid " + INK, transform: "rotate(" + c.rot + "deg)",
            animation: `tm-ty-fall ${c.dur}s linear ${c.delay}s 2 both`,
          }} />
        ))}
      </div>
      <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 16px" }}>
        <div className="tm-paper tm-ty-anim" style={{ position: "relative", width: "100%", maxWidth: 380, color: INK, border: "3px solid " + INK, boxShadow: "6px 6px 0 " + INK, animation: "tm-ty-in .35s ease-out both" }}>
          {/* Case d'ouverture : explosion « MERCI ! » sur trame jaune */}
          <div className="tm-halftone-yellow" style={{ position: "relative", borderBottom: "3px solid " + INK, padding: "26px 14px 22px", textAlign: "center", overflow: "hidden" }}>
            <svg aria-hidden="true" viewBox="0 0 200 120" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="none">
              {Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2;
                return <line key={i} x1="100" y1="60" x2={100 + Math.cos(a) * 160} y2={60 + Math.sin(a) * 160} stroke="rgba(20,20,20,0.13)" strokeWidth="7" />;
              })}
            </svg>
            <div className="tm-ty-anim" style={{ position: "relative", display: "inline-block", animation: "tm-ty-pop .55s cubic-bezier(.2,1.4,.4,1) .1s both", transform: "rotate(-6deg)" }}>
              <svg aria-hidden="true" width="250" height="120" viewBox="0 0 250 120" style={{ display: "block", overflow: "visible" }}>
                <path d="M125 2 L142 26 L172 8 L172 36 L210 26 L196 52 L246 58 L202 74 L226 104 L182 94 L170 118 L146 98 L118 120 L106 96 L72 114 L72 88 L26 98 L48 72 L4 58 L48 46 L30 18 L76 30 L84 4 L106 24 Z"
                  fill="#ffffff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
              </svg>
              <div className="tm-display" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: "#c4302b", textShadow: "2px 2px 0 " + INK, letterSpacing: 1 }}>MERCI !</div>
            </div>
          </div>

          <div style={{ padding: "16px 16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 52, height: 52, flexShrink: 0, background: "#d6ef3c", border: "3px solid " + INK, boxShadow: "3px 3px 0 " + INK, transform: "rotate(-4deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={item.icon || "bag"} size={26} color={INK} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="tm-display" style={{ fontSize: 21, lineHeight: 1.05 }}>{item.name}</div>
                <span className="tm-display" style={{ display: "inline-block", marginTop: 5, background: "#1f7a45", color: "#ffffff", border: "2px solid " + INK, fontSize: 12, padding: "1px 8px", textTransform: "uppercase" }}>Débloqué</span>
              </div>
            </div>

            {d.unlocked.length > 0 && (
              <div style={{ background: "#ffffff", border: "2.5px solid " + INK, boxShadow: "3px 3px 0 " + INK, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
                {d.unlocked.map((u, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
                    <span style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#d6ef3c", border: "2px solid " + INK }}>
                      <Icon name="check" size={11} color={INK} />
                    </span>
                    <span>{u}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Mot du développeur, en bulle de BD */}
            <div style={{ position: "relative", background: "#ffffff", border: "2.5px solid " + INK, padding: "10px 12px", marginTop: 4 }}>
              <div className="tm-lettering" style={{ fontSize: 16, lineHeight: 1.3 }}>
                Courtside est développé de manière indépendante. Votre achat finance directement les prochaines mises à jour : merci de tout cœur !
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, marginTop: 6, textAlign: "right" }}>Arthur, créateur de Courtside</div>
              <span aria-hidden="true" style={{ position: "absolute", left: 22, bottom: -12, width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "12px solid " + INK }} />
              <span aria-hidden="true" style={{ position: "absolute", left: 25, bottom: -7, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "8px solid #ffffff" }} />
            </div>

            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {onUse && d.cta && <button className="tm-bd-press" style={{ ...styles.btnPrimary, marginBottom: 0 }} onClick={() => onUse(item.id)}>{d.cta} →</button>}
              <button className="tm-bd-press" style={{ ...styles.btnSecondary, marginTop: 0 }} onClick={onClose}>{onUse && d.cta ? "Retour à la boutique" : "Continuer"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
