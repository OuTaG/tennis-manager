// Génération de noms (masculins et féminins) et de nationalités.
import { COUNTRY_NAME_KEYS, EXTRA_NAME_LISTS, FEMALE_FIRST_NAMES, NAME_PARTS, NATIONALITIES, WTA_EXTRA_NAME_LISTS, WTA_NATIONALITIES } from "../data/names.js";
import { isWTA } from "./circuit.js";

export const _femaleFirstCache = {};
export function femaleFirstNames(country) {
  if (!FEMALE_FIRST_NAMES[country]) return null;
  return _femaleFirstCache[country] || (_femaleFirstCache[country] = FEMALE_FIRST_NAMES[country].split(" "));
}

// Forme féminine d'un nom de famille, pour les pays où elle diffère.
export function feminizeSurname(country, last) {
  if (!last) return last;
  switch (country) {
    case "Russie": case "Bulgarie": case "Kazakhstan": case "Ouzbékistan": case "Azerbaïdjan":
      if (/(ov|ev|yev|in|yn)$/.test(last)) return last + "a";
      if (/skiy?$/.test(last)) return last.replace(/skiy?$/, "skaya");
      return last;
    case "Tchéquie": case "Slovaquie":
      if (/ý$/.test(last)) return last.slice(0, -1) + "á";
      if (/ek$/.test(last)) return last.slice(0, -2) + "ková";
      if (/[ao]$/.test(last)) return last.slice(0, -1) + "ová";
      return last + "ová";
    case "Pologne":
      return last.replace(/ski$/, "ska").replace(/cki$/, "cka");
    case "Lettonie":
      if (/us$/.test(last)) return last.slice(0, -2) + "a";
      if (/[sš]$/.test(last)) return last.slice(0, -1) + "a";
      return last;
    case "Lituanie":
      if (/ius$/.test(last)) return last.slice(0, -3) + "iūtė";
      if (/as$/.test(last)) return last.slice(0, -2) + "aitė";
      if (/[iy]s$/.test(last)) return last.slice(0, -2) + "ytė";
      if (/us$/.test(last)) return last.slice(0, -2) + "utė";
      return last;
    case "Grèce":
      if (/idis$/.test(last)) return last.slice(0, -4) + "idou";
      if (/os$/.test(last)) return last.slice(0, -2) + "ou";
      if (/[ai]s$/.test(last)) return last.slice(0, -1);
      return last;
    default:
      return last;
  }
}
export const _namesCache = {};
export function namesForCountry(country) {
  if (!country) return null;
  if (_namesCache[country]) return _namesCache[country];
  let parts = null;
  if (COUNTRY_NAME_KEYS[country]) parts = NAME_PARTS[COUNTRY_NAME_KEYS[country]];
  else if (EXTRA_NAME_LISTS[country] || WTA_EXTRA_NAME_LISTS[country]) {
    const [f, l] = EXTRA_NAME_LISTS[country] || WTA_EXTRA_NAME_LISTS[country];
    parts = { first: f.split(" "), last: l.split(" ").map(x => x.replace(/_/g, " ")) };
  }
  if (parts) _namesCache[country] = parts;
  return parts;
}
// Random full name ("Prénom Nom") for a country (any country if none given).
// female : prénom féminin et nom de famille accordé (circuit WTA).
export function randomFullName(country, female = isWTA()) {
  let parts = namesForCountry(country);
  if (!parts) {
    const all = [...Object.keys(COUNTRY_NAME_KEYS), ...Object.keys(EXTRA_NAME_LISTS)];
    country = all[Math.floor(Math.random() * all.length)];
    parts = namesForCountry(country);
  }
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  if (female) {
    const firsts = femaleFirstNames(country) || parts.first;
    return pick(firsts) + " " + feminizeSurname(country, pick(parts.last));
  }
  return pick(parts.first) + " " + pick(parts.last);
}

export function pickNationality() {
  const list = isWTA() ? WTA_NATIONALITIES : NATIONALITIES;
  const total = list.reduce((a, n) => a + n.weight, 0);
  let r = Math.random() * total;
  for (const n of list) { r -= n.weight; if (r <= 0) return n; }
  return list[0];
}

export function generateName(nat) {
  // Some real players' countries have no name list: fall back to a random one.
  const parts = NAME_PARTS[nat?.code] || namesForCountry(nat?.country) || NAME_PARTS[Object.keys(NAME_PARTS)[Math.floor(Math.random() * Object.keys(NAME_PARTS).length)]];
  const firsts = isWTA() ? (femaleFirstNames(nat?.country) || parts.first) : parts.first;
  const first = firsts[Math.floor(Math.random() * firsts.length)];
  let last = parts.last[Math.floor(Math.random() * parts.last.length)];
  if (isWTA()) last = feminizeSurname(nat?.country, last);
  return first[0] + ". " + last;
}
