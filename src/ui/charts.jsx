// Graphiques et libellés à définition.
import { useState } from "react";
import { Icon } from "./icons.jsx";
import { T } from "./theme.js";

// Clickable label that reveals a short definition.
export function DefinitionLabel({ label, info }) {
  const [open, setOpen] = useState(false);
  if (!info) return <span className="tm-eyebrow">{label}</span>;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start" }}>
      <button onClick={() => setOpen(o => !o)} className="tm-eyebrow" style={{
        background: "none", border: "none", padding: 0, cursor: "pointer",
        color: "inherit", textDecoration: "underline dotted", textUnderlineOffset: 3,
        display: "inline-flex", alignItems: "center", gap: 4,
      }}>
        {label} <Icon name="info" size={10} />
      </button>
      {open && (
        <span style={{ color: T.fg3, fontSize: 11, lineHeight: 1.45, marginTop: 6, maxWidth: 260, textTransform: "none", letterSpacing: 0 }}>{info}</span>
      )}
    </span>
  );
}

export function MiniLineChart({ data, color, height = 80, label = "", suffix = "", invertY = false, info = null }) {
  const [hoverIdx, setHoverIdx] = useState(null); // point under the pointer / finger
  if (!data || data.length < 2) {
    return (
      <div style={{ color: T.fg5, fontSize: 10, fontStyle: "italic", textAlign: "center", padding: 16, background: T.bg2, borderRadius: 8, marginBottom: 8 }}>
        Pas assez de données
      </div>
    );
  }
  const w = 320;
  const h = height;
  const padX = 8, padY = 10;
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
  const pathFill = pathLine + " L" + points[points.length - 1][0].toFixed(1) + "," + (h - padY) + " L" + padX + "," + (h - padY) + " Z";
  const first = data[0].value, last = data[data.length - 1].value;
  const delta = last - first;
  const isPositive = (delta > 0) === (!invertY);
  const trendColor = delta === 0 ? T.fg4 : isPositive ? T.green : T.red;
  const trend = delta === 0 ? "→" : isPositive ? "↑" : "↓";
  const lastPt = points[points.length - 1];
  const gradId = "g_" + label.replace(/[^a-z0-9]/gi, "");
  const hover = hoverIdx !== null && data[hoverIdx] ? { d: data[hoverIdx], pt: points[hoverIdx] } : null;
  // Map the pointer's x position to the nearest data point.
  const onPointer = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xView = ((e.clientX - rect.left) / rect.width) * w;
    const i = Math.round((xView - padX) / stepX);
    setHoverIdx(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div style={{ marginBottom: 12, padding: 14, background: T.bg2, borderRadius: 10, border: "1px solid " + T.brd }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <DefinitionLabel label={label} info={info} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          {hover && (
            <span className="tm-num" style={{ color: T.fg4, fontSize: 10, fontWeight: 700 }}>
              S{hover.d.x}{hover.d.year ? " · " + hover.d.year : ""}
            </span>
          )}
          <span className="tm-num" style={{ color: hover ? c : T.fg, fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>
            {Math.round(hover ? hover.d.value : last).toLocaleString()}{suffix}
          </span>
          {!hover && delta !== 0 && (
            <span className="tm-num" style={{ color: trendColor, fontSize: 11, fontWeight: 700 }}>
              {trend} {Math.abs(Math.round(delta)).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <svg viewBox={"0 0 " + w + " " + h} width="100%" height={h}
        style={{ display: "block", overflow: "visible", touchAction: "pan-y", cursor: "crosshair" }}
        onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={() => setHoverIdx(null)}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.30" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={pathFill} fill={"url(#" + gradId + ")"} />
        <path d={pathLine} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={c} />
        <circle cx={lastPt[0]} cy={lastPt[1]} r="6" fill={c} opacity="0.2" />
        {hover && (
          <g pointerEvents="none">
            <line x1={hover.pt[0]} y1={padY / 2} x2={hover.pt[0]} y2={h - padY / 2} stroke={T.fg4} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hover.pt[0]} cy={hover.pt[1]} r="4" fill={T.bg2} stroke={c} strokeWidth="2" />
          </g>
        )}
        {/* Transparent layer to capture the pointer across the whole chart */}
        <rect x="0" y="0" width={w} height={h} fill="transparent" />
      </svg>
    </div>
  );
}
