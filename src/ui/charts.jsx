// Graphiques et libellés à définition.
import { useState } from "react";
import { Icon } from "./icons.jsx";
import { T } from "./theme.js";

// Clickable label that reveals a short definition.
export function DefinitionLabel({ label, info }) {
  const [open, setOpen] = useState(false);
  if (!info) return <span style={{ color: "#141414", fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>{label}</span>;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: T.body,
        color: "#141414", fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase",
        textDecoration: "underline dashed", textDecorationThickness: 2, textUnderlineOffset: 3,
        display: "inline-flex", alignItems: "center", gap: 4,
      }}>
        {label} <Icon name="info" size={10} />
      </button>
      {open && (
        <span className="tm-lettering" style={{ color: "#141414", background: "#d6ef3c", border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "5px 8px", fontSize: 13.5, lineHeight: 1.25, marginTop: 6, maxWidth: 260, textTransform: "none", letterSpacing: 0 }}>{info}</span>
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
            {Math.round(hover ? hover.d.value : last).toLocaleString("fr-FR")}{suffix}
          </span>
          {!hover && delta !== 0 && (
            <span className="tm-num" style={{ background: trendBg, color: "#ffffff", border: "2px solid " + T.ink, fontSize: 10.5, fontWeight: 800, padding: "0 4px", transform: "rotate(-3deg)" }}>
              {trend} {Math.abs(Math.round(delta)).toLocaleString("fr-FR")}
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
