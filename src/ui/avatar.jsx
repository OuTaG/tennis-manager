// Avatar illustré du joueur / de la joueuse et son éditeur.
import { useId } from "react";
import { isWTA } from "../engine/circuit.js";
import { T } from "./theme.js";

// ─── AVATAR SYSTEM ─────────────────────────────────────────────────────────────
// Customizable cartoon avatar. The same `Avatar` component is used everywhere
// the player is shown (hub header, match screen, etc).
export const AVATAR_OPTIONS = {
  skin:    ["#f5d4b3", "#e8b990", "#d29672", "#a06b46", "#74482a"],
  hair:    ["#2e2721", "#5b3a1e", "#8a5a2b", "#c99a4e", "#9a4a2e", "#cfc6b8"],
  hairStyle: ["short", "long", "buzz", "cap", "bald"], // 5 hairstyles
  // Coiffures du circuit WTA (avatar féminin : config.female = true)
  hairStyleF: ["ponytail", "bun", "bob", "flowing", "braid", "visor"],
  eyes:    ["#3f6f8f", "#4d7a3a", "#5b3a1e", "#2b2620"],
  shirt:   ["#4d7a3a", "#b44a2f", "#3f6f8f", "#d9b24a", "#c9704a", "#7a6a8e", "#2b2620", "#f4eee3"],
};

// Avatar illustré, dans la DA « papier & gazon » : formes pleines et douces,
// pas de contour noir, fond carte crème avec un disque teinté par le maillot.
// Mêmes options qu'avant (skin, hair, hairStyle, eyes, shirt), donc les
// avatars déjà sauvegardés s'affichent sans migration.
export function avatarTone(hex, amt) {
  // amt > 0 éclaircit, amt < 0 assombrit. Couleur non hexadécimale : inchangée.
  if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const out = n.map(v => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)));
  return "#" + out.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

// Coiffure affichée : une coiffure masculine sur un avatar féminin (ancienne
// sauvegarde WTA) est convertie vers son équivalent.
export function femaleHairStyle(fem, hs) {
  if (!fem) return hs || "short";
  if (AVATAR_OPTIONS.hairStyleF.includes(hs)) return hs;
  return { long: "flowing", short: "ponytail", buzz: "bob", cap: "visor", bald: "bun" }[hs] || "ponytail";
}

// bare : sans carte de fond (portraits imprimés de la une).
export function Avatar({ config, size = 96, style, bare = false }) {
  const cfg = config || {};
  const skin   = cfg.skin   || AVATAR_OPTIONS.skin[1];
  const hair   = cfg.hair   || AVATAR_OPTIONS.hair[0];
  const eyes   = cfg.eyes   || AVATAR_OPTIONS.eyes[0];
  const shirt  = cfg.shirt  || AVATAR_OPTIONS.shirt[0];
  // Carrière WTA créée avant les avatars féminins : on bascule automatiquement.
  const fem = cfg.female !== undefined ? !!cfg.female : isWTA();
  const hStyle = femaleHairStyle(fem, cfg.hairStyle);

  const clipId = "av" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const skinShade = avatarTone(skin, -0.14);
  const skinDeep  = avatarTone(skin, -0.32);
  const hairLight = avatarTone(hair, 0.18);
  const shirtDark = avatarTone(shirt, -0.22);
  const shirtTint = avatarTone(shirt, 0.72);
  const lightShirt = /^#[0-9a-f]{6}$/i.test(shirt) && parseInt(shirt.slice(1, 3), 16) > 220;
  const trim = lightShirt ? "#b95d38" : "#f4eee3"; // liseré du col, lisible sur tous les maillots
  const brow = hStyle === "bald" ? skinDeep : hair;

  // Chevelure du haut du crâne, commune à plusieurs coupes.
  const topHair = "M30.5 43 C29 26 39 18.5 50.5 18.5 C62.5 18.5 72 26.5 69.5 43 C67 36.5 62 33 55.5 32.4 C51 35.6 44 36.4 37.8 35.4 C34.4 37.2 32 39.8 30.5 43 Z";
  // Avatar féminin : cheveux tirés en arrière avec une raie sur le côté.
  const topHairF = "M31 43 C29.5 26 39.5 18.5 50.5 18.5 C62 18.5 71 26 69.5 43 C67.5 35.5 63 31.6 56 31 C52.5 31.6 48.5 33.4 45 36 C40.5 35.2 34.5 37.6 31 43 Z";
  const tieColor = shirt;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ flexShrink: 0, display: "block", ...(style || {}) }} aria-hidden="true">
      <defs>
        <clipPath id={clipId}><rect x="0" y="0" width="100" height="100" rx={bare ? 0 : 26} /></clipPath>
      </defs>
      <g clipPath={"url(#" + clipId + ")"}>
        {/* Fond : carte crème + disque teinté par la couleur du maillot */}
        {!bare && <rect x="0" y="0" width="100" height="100" style={{ fill: "var(--tm-bg2)" }} />}
        {!bare && <circle cx="50" cy="52" r="40" fill={shirtTint} opacity="0.55" />}

        {/* Avatar féminin : chevelure derrière la tête */}
        {fem && hStyle === "flowing" && (
          <path d="M28.5 44 C26 24 39 16 50.5 16 C63 16 75 24 72 45 C73 58 75 70 78 82 C70 86 63 80 61 66 L39 66 C37 80 30 86 22 82 C25 70 27 58 28.5 44 Z" fill={hair} />
        )}
        {fem && hStyle === "bob" && (
          <path d="M28 44 C26 24 39 17 50.5 17 C62 17 75 24 72 44 C72.6 52 72.2 58 70 63 L62 63 L38 63 L30 63 C27.8 58 27.4 52 28 44 Z" fill={hair} />
        )}
        {fem && (hStyle === "ponytail" || hStyle === "visor") && (
          <>
            <path d="M63 27 C75 25 82.5 37 80 55 C79 61 75 64 72.5 60 C75.5 49 73 38 64 33 Z" fill={hair} />
            <path d="M66 29.5 C73 31 77 39 77 48" stroke={hairLight} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6" />
          </>
        )}
        {fem && hStyle === "braid" && (
          <g fill={hair}>
            {[0, 1, 2, 3, 4].map(k => (
              <ellipse key={k} cx={67.5 + k * 0.9} cy={58 + k * 6.6} rx={4.2 - k * 0.25} ry="3.9" />
            ))}
            <circle cx="72" cy="89.5" r="1.8" fill={tieColor} />
          </g>
        )}
        {fem && hStyle === "bun" && (
          <>
            <circle cx="50" cy="16.5" r="8" fill={hair} />
            <path d="M45 13.5 C47.5 11 52.5 11 55 13.5" stroke={hairLight} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6" />
          </>
        )}

        {/* Cheveux longs : mèches derrière la tête */}
        {!fem && hStyle === "long" && (
          <path d="M28.5 44 C26 24 39 16 50.5 16 C63 16 75 24 72 45 C72.5 54 73.5 62 76 70 C69 73 62 70 60 63 L40 63 C38 70 31 73 24 70 C26.5 62 28 54 28.5 44 Z" fill={hair} />
        )}

        {fem ? (
          <>
            {/* Buste : débardeur de tennis, encolure ronde */}
            <path d="M16 104 C17 85 30 74.5 50 74.5 C70 74.5 83 85 84 104 Z" fill={shirt} />
            <path d="M25 104 C26.5 92 31 84.5 36.5 80" stroke={shirtDark} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.45" />
            {/* Cou, plus fin */}
            <path d="M44.2 60 L55.8 60 L55.8 74 C53.4 77 46.6 77 44.2 74 Z" fill={skinShade} />
            {/* Encolure */}
            <path d="M40.5 74.6 Q50 85 59.5 74.6" stroke={trim} strokeWidth="2.4" fill={skinShade} strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Buste et maillot */}
            <path d="M12 104 C13 83 29 72.5 50 72.5 C71 72.5 87 83 88 104 Z" fill={shirt} />
            <path d="M22 104 C24 90 30 82 36 78" stroke={shirtDark} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
            {/* Cou */}
            <path d="M43 60 L57 60 L57 73.5 C54 76.5 46 76.5 43 73.5 Z" fill={skinShade} />
            {/* Col polo */}
            <path d="M41.5 72.4 L50 80.5 L58.5 72.4" stroke={trim} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M50 80.5 L50 90" stroke={shirtDark} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
            <circle cx="50" cy="85" r="1.1" fill={shirtDark} opacity="0.7" />
          </>
        )}

        {/* Oreilles et tête */}
        <circle cx="31" cy="47.5" r="4.4" fill={skinShade} />
        <circle cx="69" cy="47.5" r="4.4" fill={skinShade} />
        <ellipse cx="50" cy="45" rx={fem ? 18.2 : 19} ry={fem ? 21 : 21.5} fill={skin} />
        {fem && (
          <>
            <circle cx="31.4" cy="52.4" r="1.4" fill="#d9b24a" />
            <circle cx="68.6" cy="52.4" r="1.4" fill="#d9b24a" />
          </>
        )}

        {/* Coupes (féminines) */}
        {fem && <path d={topHairF} fill={hair} />}
        {fem && <path d="M56 31 C61 32.4 65.5 35.6 68 40.5" stroke={hairLight} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6" />}
        {fem && hStyle === "bob" && (
          <>
            <path d="M31.4 41 C30.4 50 31 57 33.4 62.5 L37.4 62.5 C35.2 56 34.6 48.5 35.4 40 Z" fill={hair} />
            <path d="M68.6 41 C69.6 50 69 57 66.6 62.5 L62.6 62.5 C64.8 56 65.4 48.5 64.6 40 Z" fill={hair} />
          </>
        )}
        {fem && hStyle === "flowing" && (
          <>
            <path d="M31.2 41 C30.2 52 30.6 60 32.6 66 L36.6 66 C34.6 58 34.2 49 35.2 40 Z" fill={hair} />
            <path d="M68.8 41 C69.8 52 69.4 60 67.4 66 L63.4 66 C65.4 58 65.8 49 64.8 40 Z" fill={hair} />
          </>
        )}
        {fem && (hStyle === "ponytail" || hStyle === "braid") && (
          <circle cx="66.2" cy="30.6" r="2.1" fill={tieColor} />
        )}
        {fem && hStyle === "visor" && (
          <>
            {/* Bandeau sur le haut du front, visière au-dessus des sourcils */}
            <path d="M31 33.4 C37 27.6 63 27.6 69 33.4 L69.4 36.2 C63.4 31.2 36.6 31.2 30.6 36.2 Z" fill={shirt} />
            <path d="M32.6 34.6 C41 37.6 59 37.6 67.4 34.6 L70.8 36.4 C61 39.2 39 39.2 29.2 36.4 Z" fill={shirtDark} />
          </>
        )}

        {/* Coupes */}
        {!fem && (hStyle === "short" || hStyle === "long") && <path d={topHair} fill={hair} />}
        {!fem && hStyle === "short" && <path d="M37.8 35.4 C40 31.6 44 30 47 30.4" stroke={hairLight} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7" />}
        {!fem && hStyle === "buzz" && (
          <>
            <path d="M31.2 41 C31 27.5 40 21 50.5 21 C61 21 69.4 27.5 68.8 41 C64.5 35.6 58 33.4 50 33.4 C42 33.4 35.6 35.6 31.2 41 Z" fill={hair} opacity="0.62" />
            <path d="M40 27 l1.2 1 M46 24.6 l1.2 1 M53.6 24.6 l1.2 1 M60 27 l1.2 1 M43 30.4 l1.2 1 M57 30.4 l1.2 1" stroke={hair} strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          </>
        )}
        {!fem && hStyle === "cap" && (
          <>
            <path d="M29.6 41.5 C29.6 26 39 19 50 19 C61.5 19 70.4 26 70.4 41.5 Z" fill={shirt} />
            <path d="M50 39.4 L80 40.4 C81.4 43.6 78 45.6 72 45 L50 43.6 Z" fill={shirtDark} />
            <path d="M50 20 L50 41" stroke={shirtDark} strokeWidth="1.3" opacity="0.5" />
            <circle cx="50" cy="19.6" r="2" fill={shirtDark} />
            <path d="M31.6 41.5 C33 44 32.6 47 31.4 49" stroke={hair} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </>
        )}
        {!fem && hStyle === "bald" && <ellipse cx="42" cy="30" rx="6" ry="3.2" fill="#ffffff" opacity="0.22" />}

        {/* Visage */}
        <path d="M39.5 40.6 Q43 38.8 46.4 40.2" stroke={brow} strokeWidth={fem ? 1.4 : 2} fill="none" strokeLinecap="round" />
        <path d="M53.6 40.2 Q57 38.8 60.5 40.6" stroke={brow} strokeWidth={fem ? 1.4 : 2} fill="none" strokeLinecap="round" />
        {fem && (
          <>
            <path d="M40.6 44.4 L38.9 43.2" stroke="#2b2620" strokeWidth="1" strokeLinecap="round" />
            <path d="M59.4 44.4 L61.1 43.2" stroke="#2b2620" strokeWidth="1" strokeLinecap="round" />
          </>
        )}
        <ellipse cx="43" cy="46.5" rx="2.5" ry="2.9" fill={eyes} />
        <ellipse cx="57" cy="46.5" rx="2.5" ry="2.9" fill={eyes} />
        <circle cx="43.8" cy="45.5" r="0.85" fill="#ffffff" />
        <circle cx="57.8" cy="45.5" r="0.85" fill="#ffffff" />
        <circle cx="38.6" cy="53" r="3.2" fill="#d9735a" opacity="0.22" />
        <circle cx="61.4" cy="53" r="3.2" fill="#d9735a" opacity="0.22" />
        <path d="M50 47.5 Q48.2 51.8 50.6 52.4" stroke={skinDeep} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {fem
          ? <path d="M45.6 56.2 Q50 60.4 54.4 56.2 Q50 57.6 45.6 56.2 Z" fill="#b5534a" stroke="#b5534a" strokeWidth="1.2" strokeLinejoin="round" />
          : <path d="M45.2 56.4 Q50 60.2 54.8 56.4" stroke="#8a3f2c" strokeWidth="1.9" fill="none" strokeLinecap="round" />}
      </g>
      {!bare && <rect x="0.6" y="0.6" width="98.8" height="98.8" rx="25.5" fill="none" style={{ stroke: "var(--tm-brd2)" }} strokeWidth="1.2" />}
    </svg>
  );
}

export function AvatarBuilder({ config, onChange }) {
  const cfg = config || {};
  const update = (key, value) => onChange({ ...cfg, [key]: value });
  const fem = cfg.female !== undefined ? !!cfg.female : isWTA();
  const skin = cfg.skin || AVATAR_OPTIONS.skin[1];
  const hair = cfg.hair || AVATAR_OPTIONS.hair[0];
  const hairStyle = femaleHairStyle(fem, cfg.hairStyle);
  const eyes = cfg.eyes || AVATAR_OPTIONS.eyes[0];
  const shirt = cfg.shirt || AVATAR_OPTIONS.shirt[0];

  const swatchRow = (label, options, currentValue, key) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: T.fg4, fontSize: 12, fontWeight: 600, marginBottom: 7 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map(opt => {
          const active = currentValue === opt;
          return (
            <button
              key={opt}
              onClick={() => update(key, opt)}
              style={{
                width: 30, height: 30, borderRadius: 15,
                background: opt, cursor: "pointer", padding: 0,
                border: "2px solid " + (active ? "var(--tm-bg1)" : "var(--tm-brd2)"),
                boxShadow: active ? "0 0 0 2px var(--tm-green)" : "none", transition: "box-shadow 0.15s",
              }}
            />
          );
        })}
      </div>
    </div>
  );

  const STYLE_LABELS = {
    short: "Court", long: "Long", buzz: "Rasé", cap: "Casquette", bald: "Chauve",
    ponytail: "Queue", bun: "Chignon", bob: "Carré", flowing: "Lâchés", braid: "Tresse", visor: "Visière",
  };
  const styleList = fem ? AVATAR_OPTIONS.hairStyleF : AVATAR_OPTIONS.hairStyle;

  return (
    <div>
      {/* Preview */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <Avatar config={cfg} size={120} />
      </div>

      {swatchRow("Peau", AVATAR_OPTIONS.skin, skin, "skin")}

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: T.fg4, fontSize: 12, fontWeight: 600, marginBottom: 7 }}>Coiffure</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(" + (fem ? 3 : 5) + ", minmax(0, 1fr))", gap: 4 }}>
          {styleList.map(opt => {
            const on = hairStyle === opt;
            return (
              <button
                key={opt}
                onClick={() => update("hairStyle", opt)}
                style={{
                  background: on ? "var(--tm-greenSub)" : T.bg1,
                  border: on ? "1.5px solid var(--tm-green)" : "1px solid var(--tm-brd2)",
                  borderRadius: 14, padding: "6px 0 5px",
                  color: on ? T.green : T.fg3,
                  fontSize: 10.5, fontWeight: 600, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}
              >
                <Avatar config={{ ...cfg, hairStyle: opt }} size={40} />
                <span style={{ lineHeight: 1.1, fontSize: 9, letterSpacing: -0.2, maxWidth: "100%", overflow: "hidden", whiteSpace: "nowrap" }}>{STYLE_LABELS[opt]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {hairStyle !== "bald" && swatchRow("Couleur cheveux", AVATAR_OPTIONS.hair, hair, "hair")}
      {swatchRow("Yeux", AVATAR_OPTIONS.eyes, eyes, "eyes")}
      {swatchRow("T-shirt", AVATAR_OPTIONS.shirt, shirt, "shirt")}
    </div>
  );
}
