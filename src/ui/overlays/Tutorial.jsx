// Tutoriel guidé : l'écran est grisé sauf l'élément à toucher (repéré par
// son attribut data-tuto), avec une bulle d'une ou deux lignes. Les touchers
// hors de la découpe sont bloqués ; l'élément découpé reste utilisable.
// Les fenêtres du jeu (z-index ≥ 200) passent au-dessus du voile.
import { useEffect, useState } from "react";
import { T } from "../theme.js";

const INK = "#141414";
const PAD = 6;     // marge autour de l'élément découpé
const DIM = "rgba(20,20,20,0.66)";

// step : { target, text, next? } ; index / total : position affichée.
// onNext : bouton de la bulle (étape sans action, ou élément introuvable).
export function TutorialOverlay({ step, index, total, onNext, onSkip }) {
  const [rect, setRect] = useState(null);
  const [missing, setMissing] = useState(false);

  // Suit l'élément visé (défilement, animations) à chaque image.
  useEffect(() => {
    setRect(null);
    setMissing(false);
    if (!step.target) return undefined;
    let raf = 0, scrolled = false;
    const t0 = performance.now();
    const tick = () => {
      const el = document.querySelector(step.target);
      if (el) {
        if (!scrolled) {
          scrolled = true;
          const r0 = el.getBoundingClientRect();
          if (r0.top < 70 || r0.bottom > window.innerHeight - 70) el.scrollIntoView({ block: "center" });
        }
        const r = el.getBoundingClientRect();
        setRect(prev => (prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height)
          ? prev : { top: r.top, left: r.left, width: r.width, height: r.height });
        setMissing(false);
      } else {
        setRect(null);
        if (performance.now() - t0 > 1500) setMissing(true);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step.target]);

  const vw = window.innerWidth, vh = window.innerHeight;
  const hole = rect && {
    top: Math.max(0, rect.top - PAD), left: Math.max(0, rect.left - PAD),
    right: Math.min(vw, rect.left + rect.width + PAD), bottom: Math.min(vh, rect.top + rect.height + PAD),
  };
  // Pas encore d'élément : on attend un instant sans rien bloquer.
  if (step.target && !hole && !missing) return null;

  const block = (style) => <div style={{ position: "fixed", background: DIM, zIndex: 150, ...style }} />;
  // Bulle sous l'élément s'il est en haut de l'écran, au-dessus sinon.
  const below = hole ? (hole.top + hole.bottom) / 2 < vh * 0.5 : false;
  const bubblePos = !hole ? { top: "40%" }
    : below ? { top: hole.bottom + 14 } : { bottom: vh - hole.top + 14 };
  const showButton = !!step.next || missing || !step.target;

  return (
    <>
      <style>{`
        @keyframes tm-tuto-pulse { 0%, 100% { box-shadow: 0 0 0 3px #d6ef3c, 0 0 0 6px ${INK}; } 50% { box-shadow: 0 0 0 6px #d6ef3c, 0 0 0 9px ${INK}; } }
        @keyframes tm-tuto-in { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .tm-tuto-anim { animation: none !important; } }
      `}</style>
      {hole ? (
        <>
          {block({ top: 0, left: 0, right: 0, height: hole.top })}
          {block({ top: hole.bottom, left: 0, right: 0, bottom: 0 })}
          {block({ top: hole.top, left: 0, width: hole.left, height: hole.bottom - hole.top })}
          {block({ top: hole.top, left: hole.right, right: 0, height: hole.bottom - hole.top })}
          <div className="tm-tuto-anim" aria-hidden="true" style={{
            position: "fixed", top: hole.top, left: hole.left, width: hole.right - hole.left, height: hole.bottom - hole.top,
            zIndex: 151, pointerEvents: "none", animation: "tm-tuto-pulse 1.2s ease-in-out infinite",
          }} />
        </>
      ) : block({ inset: 0 })}
      <div role="dialog" aria-label={"Tutoriel, étape " + (index + 1) + " sur " + total} key={index} className="tm-tuto-anim" style={{
        position: "fixed", left: 16, right: 16, margin: "0 auto", ...bubblePos,
        maxWidth: 380, zIndex: 152,
        background: "#ffffff", color: INK, border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK,
        padding: "10px 12px", animation: "tm-tuto-in 0.25s ease-out both",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <span className="tm-display" style={{ background: INK, color: "#d6ef3c", fontSize: 11.5, padding: "1px 7px" }}>{index + 1} / {total}</span>
          <button onClick={onSkip} style={{ background: "none", border: "none", color: INK, fontSize: 12, fontWeight: 800, textDecoration: "underline", cursor: "pointer", padding: 2 }}>Passer le tutoriel</button>
        </div>
        <div className="tm-lettering" style={{ fontSize: 17, lineHeight: 1.25 }}>{step.text}</div>
        {showButton && (
          <button className="tm-display" onClick={onNext} style={{
            marginTop: 8, width: "100%", minHeight: 40, background: T.magenta, color: "#ffffff",
            border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontSize: 15, cursor: "pointer", textTransform: "uppercase",
          }}>{step.next || "Continuer"}</button>
        )}
      </div>
    </>
  );
}
