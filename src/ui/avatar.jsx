// Avatar de BD du joueur / de la joueuse et son éditeur.
import { useId } from "react";
import { isWTA } from "../engine/circuit.js";
import { T } from "./theme.js";

// ─── AVATAR SYSTEM ─────────────────────────────────────────────────────────────
// Personnage de BD dessiné à l'encre : gros trait, ombres en aplat, yeux et
// sourcils expressifs, accessoires de tennis (bandeau noué, casquette,
// visière, bandana). Le même composant sert partout (manchette, une,
// entraînements…).
//
// Configuration : { skin, hair, hairStyle, accessory, accessoryColor, shirt,
// trim, facial, mood, female }. Les anciennes configurations (coiffures
// short/buzz/cap…, couleur des yeux) restent lisibles, voir normalizeAvatar.
const INK = "#141414";

export const AVATAR_OPTIONS = {
  skin:    ["#fbd9bd", "#f2c29b", "#e2a982", "#c98a5e", "#8a5534", "#5e3a22"],
  hair:    ["#141414", "#2b1d14", "#5a3a22", "#9a5a2a", "#d9a441", "#a8432a", "#d8d4c8"],
  hairStyle: ["court", "pics", "boucles", "meche", "rase", "chauve", "long", "queue", "chignon", "carre"],
  accessory: ["aucun", "bandeau", "casquette", "casquette-inversee", "visiere", "bandana"],
  accessoryColor: ["#d6ef3c", "#5b2d8e", "#1f7a45", "#c9b6ea", "#ffffff", "#c4302b", "#141414"],
  shirt:   ["#1f7a45", "#5b2d8e", "#d6ef3c", "#c9b6ea", "#ffffff", "#141414", "#c4302b", "#2c6fd1"],
  facial:  ["aucun", "barbe", "moustache", "bouc-moustache"],
  mood:    ["determine", "sourire", "concentre"],
  // Conservé pour les anciennes sauvegardes (plus affiché).
  eyes:    ["#3f6f8f"],
};

export const AVATAR_LABELS = {
  court: "Court", pics: "Pics", boucles: "Boucles", meche: "Mèche", rase: "Rasé", chauve: "Chauve",
  long: "Long", queue: "Queue", chignon: "Chignon", carre: "Carré",
  aucun: "Aucun", bandeau: "Bandeau", casquette: "Casquette", "casquette-inversee": "À l'envers", visiere: "Visière", bandana: "Bandana",
  barbe: "Barbe", moustache: "Moustache", "bouc-moustache": "Bouc",
  determine: "Déterminé", sourire: "Sourire", concentre: "Concentré",
};

// Anciennes coiffures → nouvelles coiffures (+ accessoire éventuel).
const LEGACY_STYLE = {
  short: ["court"], long: ["long"], buzz: ["rase"], cap: ["court", "casquette"], bald: ["chauve"],
  ponytail: ["queue"], bun: ["chignon"], bob: ["carre"], flowing: ["long"], braid: ["queue"], visor: ["queue", "visiere"],
};

export function normalizeAvatar(config) {
  const cfg = { ...(config || {}) };
  const fem = cfg.female !== undefined ? !!cfg.female : isWTA();
  const legacy = LEGACY_STYLE[cfg.hairStyle];
  if (legacy) {
    cfg.hairStyle = legacy[0];
    if (legacy[1] && !cfg.accessory) cfg.accessory = legacy[1];
  }
  if (!AVATAR_OPTIONS.hairStyle.includes(cfg.hairStyle)) cfg.hairStyle = fem ? "queue" : "court";
  return {
    female: fem,
    skin: cfg.skin || AVATAR_OPTIONS.skin[1],
    hair: cfg.hair || AVATAR_OPTIONS.hair[1],
    hairStyle: cfg.hairStyle,
    accessory: AVATAR_OPTIONS.accessory.includes(cfg.accessory) ? cfg.accessory : "aucun",
    accessoryColor: cfg.accessoryColor || AVATAR_OPTIONS.accessoryColor[0],
    shirt: cfg.shirt || AVATAR_OPTIONS.shirt[0],
    trim: cfg.trim || "#ffffff",
    facial: !fem && AVATAR_OPTIONS.facial.includes(cfg.facial) ? cfg.facial : "aucun",
    mood: AVATAR_OPTIONS.mood.includes(cfg.mood) ? cfg.mood : "determine",
  };
}

// Portrait d'un joueur de l'ordinateur, toujours le même pour un même nom
// (hachage du nom → choix dans les options). Purement visuel.
export function avatarFromName(name, female) {
  let h = 2166136261;
  for (const ch of String(name || "")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const pick = (arr) => { const v = arr[h % arr.length]; h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; return v; };
  const fem = !!female;
  const styles = fem ? ["queue", "chignon", "carre", "long", "court", "boucles"] : ["court", "pics", "boucles", "meche", "rase", "chauve", "long"];
  return {
    female: fem,
    skin: pick(AVATAR_OPTIONS.skin),
    hair: pick(AVATAR_OPTIONS.hair.slice(0, 6)),
    hairStyle: pick(styles),
    accessory: pick(["aucun", "aucun", "bandeau", "casquette", "visiere", "bandana"]),
    accessoryColor: pick(AVATAR_OPTIONS.accessoryColor),
    shirt: pick(AVATAR_OPTIONS.shirt),
    facial: fem ? "aucun" : pick(["aucun", "aucun", "aucun", "barbe", "moustache", "bouc-moustache"]),
    mood: pick(["determine", "concentre", "determine"]),
  };
}

// Portrait d'un joueur de la base : celui choisi en mode Personnalisation
// s'il existe, sinon le portrait tiré de son nom.
export function aiAvatar(p, female) {
  if (p && p.avatar) return { ...p.avatar, female: !!female };
  return avatarFromName(p ? p.name : "", female);
}

// Compatibilité : coiffure affichée pour un avatar féminin.
export function femaleHairStyle(fem, hs) {
  return normalizeAvatar({ female: fem, hairStyle: hs }).hairStyle;
}

export function avatarTone(hex, amt) {
  // amt > 0 éclaircit, amt < 0 assombrit. Couleur non hexadécimale : inchangée.
  if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const out = n.map(v => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)));
  return "#" + out.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

// Mèches du dessus de la tête, par coiffure.
const HAIR_FRONT = {
  court: "M34 52 Q30 19 60 17 Q90 19 86 52 Q81 35 70 33 Q62 41 48 37 Q38 41 34 52 Z",
  pics: "M34 50 L30 28 L41 33 L43 16 L53 27 L59 10 L65 27 L75 14 L77 31 L89 26 L86 50 Q80 37 60 37 Q40 37 34 50 Z",
  boucles: "M28 58 Q16 42 28 28 Q30 10 47 12 Q56 2 69 10 Q86 6 92 23 Q105 34 93 54 Q87 40 60 38 Q35 40 28 58 Z",
  meche: "M34 54 Q28 18 62 16 Q92 20 86 46 Q76 30 56 34 Q50 46 38 44 Q35 48 34 54 Z",
  long: "M33 54 Q30 19 60 17 Q90 19 87 54 Q82 36 66 32 Q54 42 40 40 Q35 46 33 54 Z",
  queue: "M34 50 Q31 19 60 17 Q89 19 86 50 Q76 36 62 35 Q48 35 34 50 Z",
  chignon: "M34 50 Q31 19 60 17 Q89 19 86 50 Q76 36 62 35 Q48 35 34 50 Z",
  carre: "M33 54 Q30 19 60 17 Q90 19 87 54 Q80 38 60 36 Q40 38 33 54 Z",
};
const BROWS = {
  determine: "M42 50 L55 54 M78 50 L65 54",
  sourire: "M42 50 Q48 46 55 49 M78 50 Q72 46 65 49",
  concentre: "M42 52 L55 52 M78 52 L65 52",
};
const MOUTH = {
  determine: { d: "M51 83 Q60 87 69 82", fill: "none" },
  sourire: { d: "M50 81 Q60 91 70 81 Z", fill: "#ffffff" },
  concentre: { d: "M52 84 L68 84", fill: "none" },
};

// size : côté du carré affiché. bare : sans case de fond (portraits de la une).
export function Avatar({ config, size = 96, style, bare = false }) {
  const a = normalizeAvatar(config);
  const uid = "av" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const shade = avatarTone(a.skin, -0.22);
  const sw = size < 56 ? 4.6 : 3.5; // trait plus épais en petit
  const st = { stroke: INK, strokeWidth: sw, strokeLinejoin: "round" };
  const acc = a.accessoryColor;
  const covered = a.accessory === "casquette" || a.accessory === "casquette-inversee" || a.accessory === "bandana";
  const hs = a.hairStyle;
  const mouth = MOUTH[a.mood] || MOUTH.determine;
  const pL = a.mood === "concentre" ? 50 : 50.5, pR = a.mood === "concentre" ? 70 : 72.5;

  return (
    <svg viewBox="-10 0 140 140" width={size} height={size} style={{ flexShrink: 0, display: "block", ...(style || {}) }} aria-hidden="true">
      <defs>
        <pattern id={uid + "d"} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.7" fill={a.shirt} /></pattern>
      </defs>
      {!bare && <rect x="-10" y="0" width="140" height="140" style={{ fill: "var(--tm-bg1)" }} />}
      {!bare && <rect x="-10" y="0" width="140" height="140" fill={"url(#" + uid + "d)"} opacity="0.5" />}

      {/* Cheveux derrière la tête */}
      {hs === "long" && <path d="M30 52 Q24 18 60 16 Q96 18 90 52 L95 104 Q84 112 76 98 L76 62 L44 62 L44 98 Q36 112 25 104 Z" fill={a.hair} {...st} />}
      {hs === "carre" && !covered && <path d="M31 52 Q27 18 60 16 Q93 18 89 52 L91 84 L72 84 L72 62 L48 62 L48 84 L29 84 Z" fill={a.hair} {...st} />}
      {hs === "queue" && <path d="M84 40 Q108 42 104 78 Q100 92 92 84 Q98 62 82 50 Z" fill={a.hair} {...st} />}
      {hs === "chignon" && !covered && <circle cx="60" cy="14" r="11" fill={a.hair} {...st} />}

      {/* Buste, bande du polo, cou, col */}
      <path d="M8 140 Q12 104 60 97 Q108 104 112 140 Z" fill={a.shirt} {...st} />
      <path d="M16 124 Q60 114 104 124 L106 131 Q60 121 14 131 Z" fill={a.trim} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M49 84 L49 102 Q60 109 71 102 L71 84 Z" fill={a.skin} {...st} />
      <path d="M49 88 Q60 96 71 88 L71 94 Q60 101 49 94 Z" fill={shade} />
      {a.female
        ? <path d="M46 100 Q60 112 74 100" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        : <path d="M44 99 L60 114 L76 99 L70 97 L60 106 L50 97 Z" fill="#ffffff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />}

      {/* Oreilles et tête, ombre en aplat */}
      <ellipse cx="33" cy="62" rx="6" ry="9" fill={a.skin} stroke={INK} strokeWidth="3" />
      <ellipse cx="87" cy="62" rx="6" ry="9" fill={a.skin} stroke={INK} strokeWidth="3" />
      {a.female && <><circle cx="33" cy="72" r="2.2" fill="#d6ef3c" stroke={INK} strokeWidth="1.2" /><circle cx="87" cy="72" r="2.2" fill="#d6ef3c" stroke={INK} strokeWidth="1.2" /></>}
      <path d="M35 56 Q33 23 60 21 Q87 23 85 56 Q85 80 72 90 Q60 97 48 90 Q35 80 35 56 Z" fill={a.skin} {...st} />
      <path d="M77 32 Q87 48 84 68 Q81 83 71 90 Q79 70 77 32 Z" fill={shade} />

      {/* Barbe, moustache */}
      {a.facial === "barbe" && <path d="M36 66 Q38 94 60 98 Q82 94 84 66 Q82 84 72 86 Q60 93 48 86 Q38 84 36 66 Z" fill={a.hair} stroke={INK} strokeWidth="3" strokeLinejoin="round" />}
      {a.facial === "bouc-moustache" && <path d="M51.5 91 Q60 89.6 68.5 91 Q67.5 98 60 98.5 Q52.5 98 51.5 91 Z" fill={a.hair} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />}
      {(a.facial === "moustache" || a.facial === "bouc-moustache") && <path d="M51 77.4 Q55 74.6 60 75.9 Q65 74.6 69 77.4 Q64.5 78.6 60 77.6 Q55.5 78.6 51 77.4 Z" fill={a.hair} stroke={avatarTone(a.hair, -0.35)} strokeWidth="1" strokeLinejoin="round" />}

      {/* Visage */}
      <ellipse cx="49" cy="61" rx="5.5" ry="6.5" fill="#ffffff" stroke={INK} strokeWidth="2.5" />
      <ellipse cx="71" cy="61" rx="5.5" ry="6.5" fill="#ffffff" stroke={INK} strokeWidth="2.5" />
      <circle cx={pL} cy="62" r="2.9" fill={INK} />
      <circle cx={pR} cy="62" r="2.9" fill={INK} />
      {a.female && <path d="M43 55 L40 52 M77 55 L80 52" stroke={INK} strokeWidth="2" strokeLinecap="round" />}
      <path d={BROWS[a.mood] || BROWS.determine} fill="none" stroke={INK} strokeWidth={a.female ? 3 : 4} strokeLinecap="round" />
      <path d="M60 63 L57.5 72 L61.5 72.8" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={mouth.d} fill={mouth.fill} stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Coiffure */}
      {HAIR_FRONT[hs] && !covered && <path d={HAIR_FRONT[hs]} fill={a.hair} {...st} />}
      {hs === "rase" && !covered && <path d="M36 50 Q34 22 60 21 Q86 22 84 50 Q74 40 60 40 Q46 40 36 50 Z" fill={a.hair} opacity="0.55" stroke={INK} strokeWidth="2.5" />}
      {hs === "chauve" && !covered && <path d="M46 30 Q52 26 58 27" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />}

      {/* Accessoires */}
      {a.accessory === "bandeau" && (
        <>
          <path d="M34 44 Q60 35 86 44 L86 53 Q60 44 34 53 Z" fill={acc} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M85 46 L99 38 L97 50 L86 51 Z M86 50 L100 56 L92 60 Z" fill={acc} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M56 41 L62 41 L62 47 L56 47 Z" fill="#ffffff" stroke={INK} strokeWidth="1.5" />
        </>
      )}
      {a.accessory === "casquette" && (
        <>
          <path d="M33 47 Q32 18 60 17 Q88 18 87 47 Z" fill={acc} {...st} />
          <path d="M40 46 Q60 40 104 49 Q104 55 96 55 Q66 51 40 52 Z" fill={acc} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M60 18 L60 46" stroke={INK} strokeWidth="2" />
          <circle cx="60" cy="18" r="3" fill={INK} />
        </>
      )}
      {a.accessory === "casquette-inversee" && (
        <>
          <path d="M33 47 Q32 18 60 17 Q88 18 87 47 Z" fill={acc} {...st} />
          <path d="M33 47 Q60 41 87 47 L87 50 Q60 45 33 50 Z" fill="#ffffff" stroke={INK} strokeWidth="2" />
          <path d="M8 44 Q20 40 34 44 L34 50 Q20 48 10 51 Z" fill={acc} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </>
      )}
      {a.accessory === "visiere" && (
        <>
          <path d="M34 44 Q60 37 86 44 L86 50 Q60 43 34 50 Z" fill={acc} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M38 48 Q60 42 82 48 Q84 56 74 56 Q60 52 46 56 Q36 56 38 48 Z" fill={acc} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </>
      )}
      {a.accessory === "bandana" && (
        <>
          <path d="M33 50 Q30 18 60 17 Q90 18 87 50 Q60 40 33 50 Z" fill={acc} {...st} />
          {[[48, 30], [62, 25], [75, 32], [54, 40], [70, 42]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.2" fill={acc === "#ffffff" ? INK : "#ffffff"} />
          ))}
          <path d="M86 44 L100 50 L94 58 L88 50 Z M88 50 L98 64 L90 66 Z" fill={acc} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}

      {!bare && <rect x="-8.5" y="1.5" width="137" height="137" fill="none" stroke={INK} strokeWidth="3.5" />}
    </svg>
  );
}

// stickyTop : bord où l'aperçu se colle. Par défaut sous la barre d'état
// (la page défile) ; 0 dans une fiche plein écran qui défile elle-même.
export function AvatarBuilder({ config, onChange, stickyTop = "env(safe-area-inset-top, 0px)" }) {
  const cfg = config || {};
  const a = normalizeAvatar(cfg);
  const update = (key, value) => onChange({ ...cfg, ...a, [key]: value });

  const swatchRow = (label, options, currentValue, key) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "inline-block", background: T.ink, color: "#ffffff", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", padding: "1px 6px", marginBottom: 7 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map(opt => {
          const active = currentValue === opt;
          return (
            <button
              key={opt}
              aria-label={label + " " + opt}
              onClick={() => update(key, opt)}
              style={{
                width: 40, height: 40, borderRadius: 0,
                background: opt, cursor: "pointer", padding: 0,
                border: "2.5px solid " + T.ink,
                boxShadow: active ? "3px 3px 0 " + T.ink : "none",
                transform: active ? "translate(-1px, -1px)" : "none", transition: "box-shadow 0.12s",
              }}
            />
          );
        })}
      </div>
    </div>
  );

  // Grille de vignettes : chaque option dessinée sur l'avatar courant.
  const pickRow = (label, options, currentValue, key) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "inline-block", background: T.ink, color: "#ffffff", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", padding: "1px 6px", marginBottom: 7 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 5 }}>
        {options.map(opt => {
          const on = currentValue === opt;
          return (
            <button
              key={opt}
              onClick={() => update(key, opt)}
              style={{
                background: on ? T.gold : T.bg1,
                border: "2.5px solid " + T.ink,
                boxShadow: on ? "3px 3px 0 " + T.ink : "none",
                borderRadius: 0, padding: "4px 0 3px", color: "#141414",
                fontSize: 9.5, fontWeight: 800, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              }}
            >
              <Avatar config={{ ...a, [key]: opt }} size={44} bare />
              <span style={{ lineHeight: 1.1, maxWidth: "100%", overflow: "hidden", whiteSpace: "nowrap", color: on ? "#141414" : T.fg }}>{AVATAR_LABELS[opt] || opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {/* Aperçu : grande case de BD */}
      {/* Collé en haut de l'écran : la tête reste visible pendant qu'on choisit les dernières options. */}
      <div className="tm-halftone-lilac" style={{ position: "sticky", top: stickyTop, zIndex: 2, display: "flex", justifyContent: "center", alignItems: "flex-end", height: 170, marginBottom: 16, border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, overflow: "hidden" }}>
        <Avatar config={a} size={170} bare />
        <div className="tm-lettering" style={{ position: "absolute", left: 8, top: 8, background: T.gold, border: "2.5px solid " + T.ink, padding: "2px 8px", fontSize: 15, color: "#141414" }}>Le futur n° 1 ?</div>
      </div>

      {swatchRow("Peau", AVATAR_OPTIONS.skin, a.skin, "skin")}
      {pickRow("Coiffure", AVATAR_OPTIONS.hairStyle, a.hairStyle, "hairStyle")}
      {a.hairStyle !== "chauve" && swatchRow("Couleur des cheveux", AVATAR_OPTIONS.hair, a.hair, "hair")}
      {pickRow("Accessoire", AVATAR_OPTIONS.accessory, a.accessory, "accessory")}
      {a.accessory !== "aucun" && swatchRow("Couleur de l'accessoire", AVATAR_OPTIONS.accessoryColor, a.accessoryColor, "accessoryColor")}
      {swatchRow("Maillot", AVATAR_OPTIONS.shirt, a.shirt, "shirt")}
      {!a.female && pickRow("Pilosité", AVATAR_OPTIONS.facial, a.facial, "facial")}
      {pickRow("Expression", AVATAR_OPTIONS.mood, a.mood, "mood")}
    </div>
  );
}
