// Petits utilitaires de texte.

// Première phrase d'un texte, sans couper sur l'initiale d'un prénom
// (« C. Alcázar », « J.-M. Dupont ») ni sur une abréviation d'une lettre.
// Renvoie le texte entier s'il n'y a pas de fin de phrase.
export function firstSentence(text) {
  if (!text) return "";
  const re = /[.!?…](?=\s|$)/gu;
  let m;
  while ((m = re.exec(text)) !== null) {
    const end = m.index;
    if (text[end] === ".") {
      // Mot juste avant le point : une seule lettre (initiale) → on continue.
      const before = text.slice(0, end).match(/([\p{L}.-]+)$/u);
      if (before && /^\p{L}(\.?-\p{L})*$/u.test(before[1])) continue;
    }
    return text.slice(0, end + 1);
  }
  return text;
}

// ── Formats de nombres (français) ─────────────────────────────────────────
// Séparateur de milliers : espace fine insécable (U+202F, celle d'Intl fr-FR).
// Entre le nombre et l'unité (€, km, pts…) : espace insécable (U+00A0).
// Signe négatif : vrai signe moins « − » (U+2212).
export const NNBSP = "\u202f";
export const NBSP = "\u00a0";
export const MINUS = "−";
// Nombre de décimales des gains de compétences (« Service +0,34 »).
export const STAT_DECIMALS = 2;

const intFmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const decFmts = {};
function decFmt(d) {
  return decFmts[d] || (decFmts[d] = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }));
}
const clean = (s) => s.replace(/[\u00a0\u202f ]/g, NNBSP);

function signed(abs, neg, sign) {
  if (neg) return MINUS + abs;
  return (sign ? "+" : "") + abs;
}

// Entier arrondi : 12345 → « 12 345 ». { sign: true } → « +12 345 » / « −282 ».
export function fmtNum(n, { sign = false } = {}) {
  const v = Math.round(Number(n) || 0);
  return signed(clean(intFmt.format(Math.abs(v))), v < 0, sign);
}

// Décimal à nombre fixe de décimales : fmtDec(0.1, 2) → « 0,10 ».
export function fmtDec(n, decimals = 1, { sign = false } = {}) {
  const v = Number(n) || 0;
  const s = clean(decFmt(decimals).format(Math.abs(v)));
  const isZero = !/[1-9]/.test(s);
  return signed(s, v < 0 && !isZero, sign);
}

// Gain/perte de compétence : « +0,34 », « −0,10 ».
export function fmtStatDelta(n) {
  return fmtDec(n, STAT_DECIMALS, { sign: true });
}

// Montant en euros : « 12 000 € », { sign: true } → « +1 428 € » / « −282 € ».
export function fmtMoney(n, opts) {
  return fmtNum(n, opts) + NBSP + "€";
}

// Montant compact : « 950 € », « 12,5 k€ », « 1,2 M€ ».
export function fmtMoneyShort(n) {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  const neg = v < 0 ? MINUS : "";
  if (a >= 1e6) return neg + fmtDec(Math.round(a / 1e5) / 10, 1).replace(/,0$/, "") + NBSP + "M€";
  if (a >= 1000) return neg + fmtDec(Math.round(a / 100) / 10, 1).replace(/,0$/, "") + NBSP + "k€";
  return fmtMoney(v);
}

// Distance : « 17 250 km ».
export function fmtKm(n) {
  return fmtNum(n) + NBSP + "km";
}

// Élision devant un nom propre commençant par une voyelle : « le Open Doha »
// → « l'Open Doha », « du Open » → « de l'Open », « au ITF » → « à l'ITF ».
// Le h est laissé tel quel (souvent aspiré dans les noms de villes).
const VOWEL = "AEIOUYÉÈÊÂÎÔÛ";
export function elide(text) {
  if (!text) return text;
  const v = "(?=[" + VOWEL + "])";
  return text
    .replace(new RegExp("\\b([Ll])e " + v, "gu"), "$1'")
    .replace(new RegExp("\\b([Dd])u " + v, "gu"), (_, d) => d + "e l'")
    .replace(new RegExp("\\b([Aa])u " + v, "gu"), (_, a) => (a === "A" ? "À" : "à") + " l'");
}
