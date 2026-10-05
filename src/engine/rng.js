// Hasard du jeu : générateur reproductible (mulberry32).
// Tout le moteur tire ses nombres ici plutôt que dans Math.random : avec la
// même graine et les mêmes choix, une carrière se rejoue à l'identique.
// L'état (un entier) est enregistré dans la sauvegarde.

let state = (Math.random() * 4294967296) >>> 0;

export function random() {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function setSeed(seed) { state = seed >>> 0; }
export function newSeed() { return (Math.random() * 4294967296) >>> 0; }
export function getRngState() { return state; }
export function setRngState(s) { if (Number.isFinite(s)) state = s >>> 0; }
