// Ombres de défilement : une ombre douce apparaît en haut et/ou en bas d'une
// zone tant qu'il reste du contenu caché de ce côté (même effet que sous le
// fil des commentaires en match).
import { useEffect, useState } from "react";

const SHADE_H = 22;
const gradient = (side) => "linear-gradient(" + (side === "top" ? "180deg" : "0deg") + ", var(--tm-shadow), transparent)";

function edgesOf(el) {
  if (!el) {
    const doc = document.documentElement;
    const y = window.scrollY || doc.scrollTop || 0;
    return { top: y > 2, bottom: y + window.innerHeight < doc.scrollHeight - 2 };
  }
  return { top: el.scrollTop > 2, bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 2 };
}

// Suit l'état des bords : boxRef absent = la fenêtre.
export function useScrollEdges(boxRef) {
  const [edges, setEdges] = useState({ top: false, bottom: false });
  useEffect(() => {
    const el = boxRef ? boxRef.current : null;
    if (boxRef && !el) return undefined;
    const update = () => {
      const e = edgesOf(el);
      setEdges(prev => (prev.top === e.top && prev.bottom === e.bottom ? prev : e));
    };
    update();
    const target = el || window;
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Le contenu change (commentaires, onglets) : on revérifie.
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el || document.body);
      if (el && el.firstElementChild) ro.observe(el.firstElementChild);
    }
    const iv = setInterval(update, 800);
    return () => {
      target.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (ro) ro.disconnect();
      clearInterval(iv);
    };
  }, [boxRef]);
  return edges;
}

// Ombre accrochée au bord d'une barre (position absolue juste sous une barre
// du haut, ou juste au-dessus d'une barre du bas).
export function BarShade({ side, show }) {
  return (
    <div aria-hidden="true" style={{
      position: "absolute", left: 0, right: 0, height: SHADE_H, pointerEvents: "none",
      ...(side === "top" ? { top: "100%" } : { bottom: "100%" }),
      background: gradient(side), opacity: show ? 1 : 0, transition: "opacity 0.2s",
    }} />
  );
}

// Ombres fixées aux bords de l'écran, pour les pages sans barres.
export function WindowShades() {
  const e = useScrollEdges(null);
  const base = { position: "fixed", left: 0, right: 0, height: SHADE_H, pointerEvents: "none", zIndex: 40, transition: "opacity 0.2s" };
  return (
    <>
      <div aria-hidden="true" style={{ ...base, top: 0, background: gradient("top"), opacity: e.top ? 1 : 0 }} />
      <div aria-hidden="true" style={{ ...base, bottom: 0, background: gradient("bottom"), opacity: e.bottom ? 1 : 0 }} />
    </>
  );
}

// Ombres à l'intérieur d'un conteneur qui défile (overflow: auto) : à placer
// en premier et en dernier enfant du conteneur.
export function BoxShade({ boxRef, side }) {
  const e = useScrollEdges(boxRef);
  return (
    <div aria-hidden="true" style={{ position: "sticky", [side]: 0, height: 0, zIndex: 3, pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 0, right: 0, height: SHADE_H,
        ...(side === "top" ? { top: 0 } : { bottom: 0 }),
        background: gradient(side), opacity: e[side] ? 1 : 0, transition: "opacity 0.2s",
      }} />
    </div>
  );
}
