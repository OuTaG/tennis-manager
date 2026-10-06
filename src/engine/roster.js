// Bases de joueurs personnalisées (mode Personnalisation de la boutique).
//
// La base « Standard » reste tirée au hasard à chaque carrière. Les trois
// configurations personnalisées partent d'une base de référence fixe
// (mêmes 1 200 noms et nationalités à chaque fois, par circuit) et ne
// stockent que les modifications : { index: { name?, code?, avatar? } }.
// Les points et les stats restent tirés à chaque carrière.
import { NAMES_REAL_TOP50, NAMES_REAL_WTA_TOP50, NAT_BY_CODE } from "../data/names.js";
import { CIRCUIT, setCircuit } from "./circuit.js";
import { generateName, pickNationality } from "./names.js";
import { getRngState, setRngState, setSeed } from "./rng.js";

export const ROSTER_SIZE = 1200;
export const ROSTER_SLOTS = 3;
export const ROSTER_STORAGE_KEY = "tm-rosters";
const BASE_SEEDS = { atp: 20260101, wta: 20260202 };

const baseCache = {};
// Base de référence d'un circuit : [{ name, code }] (index 0 = n°1 de départ).
export function baseRoster(circuit) {
  const c = circuit === "wta" ? "wta" : "atp";
  if (baseCache[c]) return baseCache[c];
  // Tirage à graine fixe, sans toucher au hasard de la partie en cours.
  const saved = getRngState(), savedCircuit = CIRCUIT;
  setCircuit(c);
  setSeed(BASE_SEEDS[c]);
  const top = c === "wta" ? NAMES_REAL_WTA_TOP50 : NAMES_REAL_TOP50;
  const out = [];
  for (let i = 0; i < ROSTER_SIZE; i++) {
    if (i < top.length) out.push({ name: top[i].name, code: top[i].code });
    else {
      const nat = pickNationality();
      out.push({ name: generateName(nat), code: nat.code });
    }
  }
  setCircuit(savedCircuit);
  setRngState(saved);
  baseCache[c] = out;
  return out;
}

const emptyConfig = (i) => ({ name: "Configuration " + (i + 1), atp: {}, wta: {} });

export function loadRosterConfigs() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(ROSTER_STORAGE_KEY) || "null"); } catch (e) { raw = null; }
  const out = [];
  for (let i = 0; i < ROSTER_SLOTS; i++) {
    const c = raw && raw[i];
    out.push(c ? { name: c.name || emptyConfig(i).name, atp: c.atp || {}, wta: c.wta || {} } : emptyConfig(i));
  }
  return out;
}

export function saveRosterConfigs(configs) {
  try { localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(configs)); } catch (e) {}
}

// Nombre de joueurs modifiés dans une configuration (tous circuits).
export function rosterEditCount(cfg) {
  return Object.keys(cfg?.atp || {}).length + Object.keys(cfg?.wta || {}).length;
}

// Joueurs d'une configuration pour un circuit : base + modifications.
// Chaque entrée : { index, name, code, nat, avatar, edited }.
export function rosterEntries(cfg, circuit) {
  const c = circuit === "wta" ? "wta" : "atp";
  const edits = (cfg && cfg[c]) || {};
  return baseRoster(c).map((b, index) => {
    const e = edits[index] || {};
    const code = e.code || b.code;
    return { index, name: e.name || b.name, code, nat: NAT_BY_CODE[code] || NAT_BY_CODE.fr, avatar: e.avatar || null, edited: !!edits[index] };
  });
}

// Applique (ou retire, si edit est null) la modification d'un joueur.
export function setRosterEdit(cfg, circuit, index, edit) {
  const c = circuit === "wta" ? "wta" : "atp";
  const next = { ...cfg, [c]: { ...(cfg[c] || {}) } };
  if (!edit) delete next[c][index];
  else next[c][index] = edit;
  return next;
}
