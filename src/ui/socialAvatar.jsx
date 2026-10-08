// Photos de profil BD des comptes du fil social (écran Bureau › Social).
// Tout est calculé à l'affichage à partir du handle (hachage stable, aucun
// tirage aléatoire) : les anciens posts sauvegardés ont donc aussi leur photo.
//  - personnes (fans, joueurs du circuit, le joueur) : portrait <Avatar> ;
//  - médias : initiales dans une case encrée tramée ;
//  - marques : pictogramme fictif dans une case encrée tramée.
import { Avatar, AVATAR_OPTIONS, aiAvatar } from "./avatar.jsx";

const INK = "#141414";
const PALETTE = ["#1f7a45", "#5b2d8e", "#2c6fd1", "#c4302b", "#e0a21b", "#c4622d"];

// FNV-1a + brassage : même entrée → même suite de choix, sur toutes les
// machines. N'utilise pas le générateur du moteur (aucun tirage décalé).
function fnv(text) {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  // Brassage final (avalanche) pour décorréler des clés voisines.
  h = Math.imul(h ^ (h >>> 16), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
function seeded(str, salt) {
  const base = String(salt || "") + "|" + String(str || "") + "|";
  let n = 0;
  // Chaque choix a son propre hachage (clé + rang) : choix indépendants.
  return (arr) => arr[fnv(base + (n++)) % arr.length];
}

// Genre déduit du handle / du nom affiché quand c'est possible.
const FEMALE_HINT = /girl|queen|lady|madame|mamie|fille|reine|she|woman/i;
const MALE_HINT = /papi|boy|king|monsieur|guy|man\b|roi/i;
const SENIOR_HINT = /papi|mamie|grand(?!chelem)/i;

// Portrait d'un fan : varié (peau, cheveux, accessoires, expressions).
export function fanAvatar(author) {
  const key = (author?.handle || "") + " " + (author?.name || "");
  const pick = seeded(key, "fan");
  const female = FEMALE_HINT.test(key) ? true : MALE_HINT.test(key) ? false : pick([true, false]);
  const senior = SENIOR_HINT.test(key);
  const styles = female
    ? ["queue", "chignon", "carre", "long", "boucles", "court", "meche"]
    : ["court", "pics", "boucles", "meche", "rase", "chauve", "long"];
  return {
    female,
    skin: pick(AVATAR_OPTIONS.skin),
    hair: senior ? "#d8d4c8" : pick(AVATAR_OPTIONS.hair.slice(0, 6)),
    hairStyle: senior && !female ? pick(["chauve", "court", "rase"]) : pick(styles),
    accessory: pick(["aucun", "aucun", "casquette", "casquette-inversee", "bandeau", "visiere", "bandana"]),
    accessoryColor: pick(AVATAR_OPTIONS.accessoryColor),
    shirt: pick(AVATAR_OPTIONS.shirt),
    trim: pick(["#ffffff", "#d6ef3c", "#141414", "#c9b6ea"]),
    facial: female ? "aucun" : senior ? pick(["moustache", "barbe", "bouc-moustache"]) : pick(["aucun", "aucun", "barbe", "moustache", "bouc-moustache"]),
    mood: pick(["sourire", "sourire", "determine", "concentre"]),
  };
}

// Initiales d'un média : « Le Journal du Court » → « JC ».
const SMALL_WORDS = new Set(["le", "la", "les", "du", "de", "des", "l", "d", "the", "of"]);
export function mediaInitials(name) {
  const words = String(name || "").split(/[\s'’-]+/).filter(Boolean);
  const main = words.filter(w => !SMALL_WORDS.has(w.toLowerCase()));
  const src = main.length ? main : words;
  if (src.length === 1) return src[0].slice(0, 2).toUpperCase();
  return src.slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// Pictogrammes des marques fictives (viewBox 0 0 40 40).
const BRAND_LOGOS = {
  "@VoltTennis": { bg: "#5b2d8e", draw: () => (
    <path d="M23 4 L10 22 L19 22 L15 36 L30 16 L21 16 Z" fill="#d6ef3c" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
  ) },
  "@Topspin": { bg: "#1f7a45", draw: () => (
    <>
      <circle cx="20" cy="21" r="10" fill="#d6ef3c" stroke={INK} strokeWidth="2.5" />
      <path d="M12 15 Q20 21 12 28 M28 15 Q20 21 28 28" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 12 Q14 3 25 5" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M23 2 L28 5.5 L22.5 8.5 Z" fill={INK} />
    </>
  ) },
  "@ChronosOfficial": { bg: "#2c6fd1", draw: () => (
    <>
      <rect x="16" y="3" width="8" height="5" fill="#ffffff" stroke={INK} strokeWidth="2" />
      <circle cx="20" cy="22" r="12" fill="#ffffff" stroke={INK} strokeWidth="2.5" />
      <path d="M20 22 L20 14 M20 22 L26 25" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="22" r="1.8" fill="#c4302b" />
    </>
  ) },
  "@ApexCourt": { bg: "#c4302b", draw: () => (
    <>
      <path d="M4 33 L16 11 L23 23 L27 17 L36 33 Z" fill="#ffffff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M12.5 17.5 L16 11 L19.5 17 L16.5 16 Z" fill="#d6ef3c" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ) },
  "@KineticSport": { bg: "#e0a21b", draw: () => (
    <>
      <path d="M5 28 Q18 30 34 10 Q26 26 8 33 Z" fill="#ffffff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M5 12 L15 12 M3 18 L12 18 M6 24 L13 24" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ) },
  "@StriderRun": { bg: "#c9b6ea", draw: () => (
    <>
      <path d="M6 13 L15 20 L6 27 M18 13 L27 20 L18 27" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M6 13 L15 20 L6 27 M18 13 L27 20 L18 27" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      <circle cx="33" cy="20" r="3" fill="#d6ef3c" stroke={INK} strokeWidth="2" />
    </>
  ) },
};

// Logo d'un média ou d'une marque : case carrée encrée, aplat + trame.
function OrgLogo({ author, size, tilt }) {
  const brand = author.type === "brand" ? BRAND_LOGOS[author.handle] : null;
  const pick = seeded(author.handle || author.name, "org");
  const bg = brand ? brand.bg : author.type === "press" ? pick(["#2c6fd1", "#1f7a45", "#5b2d8e", "#c4302b", INK]) : pick(PALETTE);
  const dot = bg === INK ? "rgba(255,255,255,0.18)" : "rgba(20,20,20,0.18)";
  const initials = mediaInitials(author.name || author.handle);
  return (
    <div aria-hidden="true" style={{
      width: size, height: size, flexShrink: 0, boxSizing: "border-box",
      backgroundColor: bg, backgroundImage: "radial-gradient(" + dot + " 1.4px, transparent 1.6px)", backgroundSize: "6px 6px",
      border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK,
      transform: "rotate(" + tilt + "deg)", overflow: "hidden",
    }}>
      <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ display: "block" }}>
        {brand ? brand.draw() : (
          <>
            {author.type === "press" && <rect x="0" y="29" width="40" height="11" fill="#ffffff" />}
            {author.type === "press" && <path d="M0 29 L40 29 M6 34.5 L34 34.5" stroke={INK} strokeWidth="2" />}
            <text x="20" y={author.type === "press" ? 22.5 : 27} textAnchor="middle"
              fontFamily="'Archivo Black', sans-serif" fontSize={initials.length > 1 ? 15 : 19}
              fill="#ffffff" stroke={INK} strokeWidth="2.6" paintOrder="stroke" strokeLinejoin="round">{initials}</text>
          </>
        )}
      </svg>
    </div>
  );
}

// Configuration du portrait d'une personne, ou null pour un média / une marque.
export function socialPersonConfig(author, player) {
  if (!author) return null;
  const wta = player?.circuit === "wta";
  const isSelf = author.type === "self" || (player?.name && author.name === player.name && author.type !== "press" && author.type !== "brand");
  if (isSelf) return player?.avatar ? { ...player.avatar } : aiAvatar({ name: player?.name }, wta);
  if (author.type === "player") return aiAvatar({ name: author.name, avatar: author.avatar }, wta);
  if (author.type === "press" || author.type === "brand") return null;
  return fanAvatar(author);
}

const PERSON_BG = { player: "tm-halftone-yellow", self: "tm-halftone-cyan", fan: "tm-halftone-lilac" };

// Photo de profil BD d'un compte social. Personnes : médaillon rond ;
// médias et marques : case carrée légèrement penchée.
export function SocialAvatar({ author, player, size = 44 }) {
  const a = author || { handle: "@unknown", name: "Anonyme", type: "fan" };
  const cfg = socialPersonConfig(a, player);
  if (!cfg) {
    const tilt = seeded(a.handle || a.name, "tilt")([-4, -3, 3, 4]);
    return <OrgLogo author={a} size={size} tilt={tilt} />;
  }
  const isSelf = a.type === "self" || (player?.name && a.name === player.name);
  const bgClass = PERSON_BG[isSelf ? "self" : a.type] || PERSON_BG.fan;
  return (
    <div aria-hidden="true" className={bgClass} style={{
      width: size, height: size, flexShrink: 0, boxSizing: "border-box",
      borderRadius: "50%", overflow: "hidden", position: "relative",
      border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK,
    }}>
      <Avatar config={cfg} size={size} bare style={{ position: "absolute", left: -2.5, top: 1 }} />
    </div>
  );
}
