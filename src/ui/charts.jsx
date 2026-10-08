// Graphiques et libellés à définition.
import { useState } from "react";
import { T } from "./theme.js";
import { fmtNum } from "./format.js";

// Libellé cliquable qui déplie une courte définition, façon BD : pastille
// « i » encrée (jaune quand elle est ouverte) et bulle de récitatif à queue.
export function DefinitionLabel({ label, info }) {
  const [open, setOpen] = useState(false);
  const labelStyle = { color: "#141414", fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" };
  if (!info) return <span style={labelStyle}>{label}</span>;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", maxWidth: "100%" }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} style={{
        ...labelStyle, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: T.body,
        display: "inline-flex", alignItems: "center", gap: 6,
      }}>
        {label}
        <span className="tm-display" aria-hidden="true" style={{
          width: 17, height: 17, display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, lineHeight: 1, textTransform: "none",
          background: open ? "#d6ef3c" : "#141414", color: open ? "#141414" : "#ffffff",
          border: "2px solid #141414", boxShadow: open ? "none" : "2px 2px 0 #141414",
          transform: open ? "translate(2px, 2px) rotate(-6deg)" : "rotate(-6deg)",
        }}>i</span>
      </button>
      {open && (
        <span style={{ position: "relative", display: "block", marginTop: 10, maxWidth: 280, transform: "rotate(-0.6deg)" }}>
          {/* Queue de la bulle, pointée vers la pastille */}
          <span aria-hidden="true" style={{
            position: "absolute", top: -7, left: 18, width: 12, height: 12, background: "#d6ef3c",
            borderLeft: "2.5px solid #141414", borderTop: "2.5px solid #141414", transform: "rotate(45deg)",
          }} />
          <span className="tm-lettering" style={{
            display: "block", color: "#141414", background: "#d6ef3c",
            backgroundImage: "radial-gradient(rgba(20,20,20,0.10) 1px, transparent 1.3px)", backgroundSize: "5px 5px",
            border: "2.5px solid #141414", boxShadow: "3px 3px 0 #141414",
            padding: "7px 10px 8px", fontSize: 15, lineHeight: 1.22, textTransform: "none", letterSpacing: 0,
          }}>{info}</span>
        </span>
      )}
    </span>
  );
}

// Courbe façon BD : case cernée d'encre avec ombre décalée, trait épais de
// couleur cerné d'encre, remplissage en trame de points, balle au bout.
export function MiniLineChart({ data, color, height = 80, label = "", suffix = "", invertY = false, info = null }) {
  const [hoverIdx, setHoverIdx] = useState(null); // point under the pointer / finger
  const card = { marginBottom: 12, background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, color: "#141414" };
  if (!data || data.length < 2) {
    return (
      <div style={{ ...card, padding: 12 }}>
        <DefinitionLabel label={label} info={info} />
        <div className="tm-lettering" style={{ fontSize: 14, textAlign: "center", padding: "10px 6px 4px", color: "#141414" }}>Pas encore assez de données…</div>
      </div>
    );
  }
  const w = 320;
  const h = height;
  const padX = 10, padY = 10;
  const c = color || T.green;
  const values = data.map(d => d.value);
  let minV = Math.min(...values), maxV = Math.max(...values);
  if (minV === maxV) { maxV = minV + 1; }
  const range = maxV - minV;
  const stepX = (w - 2 * padX) / (data.length - 1);
  const toY = (v) => {
    const norm = (v - minV) / range;
    const final = invertY ? norm : 1 - norm;
    return padY + final * (h - 2 * padY);
  };
  const points = data.map((d, i) => [padX + i * stepX, toY(d.value)]);
  const pathLine = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const pathFill = pathLine + " L" + points[points.length - 1][0].toFixed(1) + "," + (h - padY + 4) + " L" + padX + "," + (h - padY + 4) + " Z";
  const first = data[0].value, last = data[data.length - 1].value;
  const delta = last - first;
  const isPositive = (delta > 0) === (!invertY);
  const trendBg = delta === 0 ? T.bg3 : isPositive ? "#1f7a45" : "#c4302b";
  const trend = delta === 0 ? "→" : isPositive ? "↑" : "↓";
  const lastPt = points[points.length - 1];
  const patId = "dots_" + label.replace(/[^a-z0-9]/gi, "") + "_" + h;
  const hover = hoverIdx !== null && data[hoverIdx] ? { d: data[hoverIdx], pt: points[hoverIdx] } : null;
  // Map the pointer's x position to the nearest data point.
  const onPointer = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xView = ((e.clientX - rect.left) / rect.width) * w;
    const i = Math.round((xView - padX) / stepX);
    setHoverIdx(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, padding: "7px 10px", borderBottom: "2px solid " + T.ink }}>
        <DefinitionLabel label={label} info={info} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {hover && (
            <span className="tm-num" style={{ color: "#141414", background: "#ffffff", border: "2px solid " + T.ink, padding: "0 4px", fontSize: 10, fontWeight: 800 }}>
              S{hover.d.x}{hover.d.year ? " · " + hover.d.year : ""}
            </span>
          )}
          <span className="tm-display" style={{ fontSize: 16, lineHeight: 1 }}>
            {fmtNum(hover ? hover.d.value : last)}{suffix}
          </span>
          {!hover && delta !== 0 && (
            <span className="tm-num" style={{ background: trendBg, color: "#ffffff", border: "2px solid " + T.ink, fontSize: 10.5, fontWeight: 800, padding: "0 4px", transform: "rotate(-3deg)" }}>
              {trend} {fmtNum(Math.abs(delta))}
            </span>
          )}
        </div>
      </div>
      <svg viewBox={"0 0 " + w + " " + h} width="100%" height={h}
        style={{ display: "block", overflow: "visible", touchAction: "pan-y", cursor: "crosshair" }}
        onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={() => setHoverIdx(null)}>
        <defs>
          <pattern id={patId} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.5" fill={c} opacity="0.55" />
          </pattern>
        </defs>
        {/* Ligne de base à l'encre, pointillée */}
        <line x1={padX} y1={h - padY + 4} x2={w - padX} y2={h - padY + 4} stroke={T.ink} strokeWidth="1.5" strokeDasharray="4 4" />
        {/* Remplissage tramé sous la courbe */}
        <path d={pathFill} fill={"url(#" + patId + ")"} />
        {/* Trait : encre épaisse dessous, couleur par-dessus */}
        <path d={pathLine} fill="none" stroke={T.ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathLine} fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Balle de tennis au bout de la courbe */}
        <circle cx={lastPt[0]} cy={lastPt[1]} r="5.5" fill="#d6ef3c" stroke={T.ink} strokeWidth="2" />
        {hover && (
          <g pointerEvents="none">
            <line x1={hover.pt[0]} y1={padY / 2} x2={hover.pt[0]} y2={h - padY / 2} stroke={T.ink} strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx={hover.pt[0]} cy={hover.pt[1]} r="5" fill="#ffffff" stroke={T.ink} strokeWidth="2.5" />
          </g>
        )}
        {/* Transparent layer to capture the pointer across the whole chart */}
        <rect x="0" y="0" width={w} height={h} fill="transparent" />
      </svg>
    </div>
  );
}
