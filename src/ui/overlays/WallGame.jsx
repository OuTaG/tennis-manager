// Mini-jeu caché des réglages : « Le mur ». Renvoyer la balle contre le mur
// le plus longtemps possible. Aucun effet sur la carrière ; seul le record
// est gardé sur l'appareil.
import { useEffect, useRef, useState } from "react";
import { T } from "../theme.js";

const INK = "#141414";
const BEST_KEY = "tm-wall-best";
const W = 300, H = 230;
const WALL_Y = 28, HIT_TOP = 182, HIT_BOTTOM = 214;

function readBest() {
  try { return parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0; } catch (e) { return 0; }
}

export function WallGame() {
  const [state, setState] = useState("ready"); // ready → play → over
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);
  const [ball, setBall] = useState({ x: W / 2, y: 120 });
  const [flash, setFlash] = useState(null);
  const sim = useRef({ x: W / 2, y: 120, vx: 1.4, vy: 2.6, score: 0 });
  const raf = useRef(null);

  useEffect(() => {
    if (state !== "play") return undefined;
    let last = null;
    const step = (now) => {
      if (last === null) last = now;
      const dt = Math.min(32, now - last) / 16;
      last = now;
      const b = sim.current;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < 10 || b.x > W - 10) { b.vx = -b.vx; b.x = Math.max(10, Math.min(W - 10, b.x)); }
      if (b.y < WALL_Y + 8) { b.vy = Math.abs(b.vy); b.y = WALL_Y + 8; }
      if (b.y > H + 10) {
        // Balle ratée : fin de partie.
        setState("over");
        setBest(prev => {
          const nb = Math.max(prev, b.score);
          try { localStorage.setItem(BEST_KEY, String(nb)); } catch (e) {}
          return nb;
        });
        return;
      }
      setBall({ x: b.x, y: b.y });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [state]);

  const start = () => {
    sim.current = { x: W / 2, y: 120, vx: (Math.random() < 0.5 ? -1 : 1) * 1.4, vy: 2.6, score: 0 };
    setScore(0); setFlash(null); setState("play");
  };
  const hit = () => {
    if (state !== "play") { start(); return; }
    const b = sim.current;
    if (b.vy > 0 && b.y >= HIT_TOP && b.y <= HIT_BOTTOM) {
      b.score += 1;
      b.vy = -Math.min(7, Math.abs(b.vy) * 1.07);
      b.vx = (Math.random() * 2 - 1) * Math.min(4, 1.4 + b.score * 0.12);
      setScore(b.score);
      setFlash(b.score % 10 === 0 ? "SUPER !" : "PAF !");
      setTimeout(() => setFlash(null), 350);
    }
  };

  return (
    <div style={{ background: "#ffffff", border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, color: INK }}>
      <div className="tm-display" style={{ background: INK, color: "#ffffff", fontSize: 15, padding: "5px 10px", display: "flex", justifyContent: "space-between" }}>
        <span>Le mur</span><span style={{ color: T.gold }}>Record : {best}</span>
      </div>
      <div onPointerDown={hit} style={{ position: "relative", width: "100%", aspectRatio: W + " / " + H, cursor: "pointer", touchAction: "manipulation", userSelect: "none", background: "#1f7a45", overflow: "hidden" }}>
        <svg viewBox={"0 0 " + W + " " + H} width="100%" height="100%" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="tm-bricks" width="30" height="14" patternUnits="userSpaceOnUse">
              <rect width="30" height="14" fill="#c4572b" />
              <path d="M0 0 H30 M0 7 H30 M15 0 V7 M0 7 V14 M30 7 V14" stroke={INK} strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={W} height={WALL_Y} fill="url(#tm-bricks)" />
          <path d={"M0 " + WALL_Y + " H" + W} stroke={INK} strokeWidth="3" />
          {/* Zone de frappe */}
          <rect x="0" y={HIT_TOP} width={W} height={HIT_BOTTOM - HIT_TOP} fill="#d6ef3c" opacity="0.25" />
          <path d={"M0 " + HIT_TOP + " H" + W + " M0 " + HIT_BOTTOM + " H" + W} stroke="#ffffff" strokeWidth="2" strokeDasharray="6 5" />
          <circle cx={ball.x} cy={ball.y} r="8" fill="#d6ef3c" stroke={INK} strokeWidth="2.5" />
        </svg>
        <div className="tm-display" style={{ position: "absolute", right: 10, top: WALL_Y + 8, fontSize: 30, color: "#ffffff", textShadow: "2px 2px 0 " + INK }}>{score}</div>
        {flash && <div className="tm-display" style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%) rotate(-8deg)", fontSize: 26, color: "#d6ef3c", WebkitTextStroke: "1.5px " + INK, textShadow: "3px 3px 0 " + INK }}>{flash}</div>}
        {state !== "play" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(20,20,20,0.35)" }}>
            {state === "over" && <div className="tm-display" style={{ fontSize: 22, color: "#ffffff", textShadow: "2px 2px 0 " + INK }}>{score} renvoi{score > 1 ? "s" : ""}</div>}
            <div className="tm-lettering" style={{ background: "#ffffff", border: "2.5px solid " + INK, padding: "3px 10px", fontSize: 15 }}>
              {state === "over" ? "Touchez pour rejouer" : "Touchez quand la balle passe dans la zone jaune"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
