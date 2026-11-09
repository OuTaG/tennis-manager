// Musique et sons du jeu.
// - Musique : les morceaux de MUSIC s'enchaînent en boucle, l'un après
//   l'autre, sur les écrans hors match.
// - Ambiance de match : une boucle des seuls sons des points (frappes de
//   balle, réactions du public), jamais la voix de l'arbitre. Elle se tait
//   quand le match est en pause, pendant un mini-jeu et à la fin du match.
// - Effets ponctuels : le vol (calé sur la durée de l'animation), les
//   applaudissements d'un mini-jeu réussi, la clameur du public dès la fin
//   d'un match. Tout son de match s'arrête en quittant le match en direct.
// Tout passe par Web Audio : sur iPhone, le volume d'un élément <audio> ne
// se règle pas, seul un nœud de gain le permet. Les fichiers sont servis à
// côté de index.html (dossier audio/) ; un fichier absent est ignoré.
// iPhone : la musique n'est jamais mise en pause (seulement réduite à zéro
// pendant les matchs et les vols) et la session audio est en « lecture »,
// sans quoi le bouton silencieux coupe le Web Audio.
// Réglages (volume musique, volume effets, son coupé) gardés sur l'appareil.
// Dans l'app iPhone, la lecture passe par le module natif « GameAudio »
// (ios-native/GameAudioPlugin.swift, AVAudioPlayer), plus fiable que le son
// du WebView ; sans ce module (web), par Web Audio comme ci-dessous.
import { Capacitor, registerPlugin } from "@capacitor/core";

const KEY = "tm-audio";
const MUSIC = [1, 2, 3, 4, 5].map(n => "audio/music-" + n + ".mp3");
const AMBIENCE = "audio/match-ambience.m4a"; // AAC : boucle sans trou
const SFX = { flight: "audio/flight.mp3", matchEnd: "audio/match-end.mp3", cheer: "audio/cheer.mp3" };
// Sons propres au match, coupés dès qu'on quitte le match en direct.
const MATCH_SFX = ["matchEnd", "cheer"];
const inMatch = (sc) => sc === "match" || sc === "matchQuiet";

const DEFAULTS = { music: 0.6, sfx: 0.8, muted: false };
let settings = load();
const listeners = new Set();

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) { return { ...DEFAULTS }; }
}

let ctx = null, master = null, musicGain = null, sfxGain = null;
let musicEl = null, musicIndex = 0;
let ambSource = null, ambBuffer = null;
let scene = "menu";
const buffers = {};

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.connect(ctx.destination);
  musicGain = ctx.createGain(); musicGain.connect(master);
  sfxGain = ctx.createGain(); sfxGain.connect(master);
  applyVolumes(0);
  // App en arrière-plan : tout se tait.
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.visibilityState === "hidden") { ctx.suspend(); if (musicEl) musicEl.pause(); }
    else { ctx.resume(); if (musicEl && !settings.muted) musicEl.play().catch(() => {}); }
  });
  return ctx;
}

function applyVolumes(fade = 0.25) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const set = (g, v) => { g.gain.cancelScheduledValues(now); g.gain.setTargetAtTime(v, now, Math.max(0.01, fade / 3)); };
  set(master, settings.muted ? 0 : 1);
  set(musicGain, scene === "menu" ? settings.music : 0); // match, vol : musique à zéro
  set(sfxGain, settings.sfx);
}

function startMusic() {
  if (!ctx || musicEl) return;
  musicEl = new Audio();
  musicEl.preload = "auto";
  try { ctx.createMediaElementSource(musicEl).connect(musicGain); } catch (e) { /* déjà relié */ }
  // Morceau suivant à la fin (ou en cas de fichier absent), en boucle.
  let failures = 0;
  const next = () => { musicIndex = (musicIndex + 1) % MUSIC.length; play(); };
  const play = () => { musicEl.src = MUSIC[musicIndex]; musicEl.play().then(() => { failures = 0; }).catch(() => {}); };
  musicEl.addEventListener("ended", next);
  musicEl.addEventListener("error", () => { if (++failures < MUSIC.length) next(); });
  play();
}

async function loadBuffer(url) {
  if (buffers[url] !== undefined) return buffers[url];
  buffers[url] = null;
  try {
    const res = await fetch(url);
    if (!res.ok) { console.warn("[son] fichier introuvable", url, res.status); return null; }
    buffers[url] = await ctx.decodeAudioData(await res.arrayBuffer());
  } catch (e) { console.warn("[son] lecture impossible", url, e); buffers[url] = null; }
  return buffers[url];
}

// Lecture par un élément <audio> relié au graphe (même chemin que la musique).
function playElement(url, gainNode, loop = false) {
  const el = new Audio(url);
  el.loop = loop; el.preload = "auto";
  try { ctx.createMediaElementSource(el).connect(gainNode); } catch (e) { console.warn("[son] liaison impossible", url, e); }
  el.play().catch(e => console.warn("[son] lecture refusée", url, e));
  return el;
}

// Début et fin (en secondes) de la partie audible d'un tampon.
function audibleRange(buf) {
  const d = buf.getChannelData(0), n = d.length, eps = 1e-4;
  let i = 0, j = n - 1;
  while (i < n && Math.abs(d[i]) < eps) i++;
  while (j > i && Math.abs(d[j]) < eps) j--;
  return [i / buf.sampleRate, (j + 1) / buf.sampleRate];
}

let ambEl = null, ambElGain = null;
async function startAmbience() {
  if (!ctx || ambSource || ambEl) return;
  ambBuffer = ambBuffer || await loadBuffer(AMBIENCE);
  if (scene !== "match" || ambSource || ambEl) return;
  if (!ambBuffer) {
    // Secours : boucle par élément <audio>.
    ambElGain = ctx.createGain(); ambElGain.gain.value = 0.7; ambElGain.connect(sfxGain);
    ambEl = playElement(AMBIENCE, ambElGain, true);
    return;
  }
  ambSource = ctx.createBufferSource();
  ambSource.buffer = ambBuffer; ambSource.loop = true;
  // Le MP3 ajoute un court silence au début et à la fin : la boucle les
  // saute, pour tourner sans le moindre trou.
  const [from, to] = audibleRange(ambBuffer);
  ambSource.loopStart = from; ambSource.loopEnd = to;
  const g = ctx.createGain(); g.gain.value = 0; g.connect(sfxGain);
  g.gain.setTargetAtTime(0.7, ctx.currentTime, 0.4);
  ambSource.connect(g); ambSource.start(0, from);
  ambSource._gain = g;
}

function stopAmbience() {
  if (ambEl) { const el = ambEl; ambEl = null; ambElGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2); setTimeout(() => el.pause(), 900); }
  if (!ambSource) return;
  const s = ambSource; ambSource = null;
  s._gain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
  setTimeout(() => { try { s.stop(); } catch (e) { /* déjà arrêtée */ } }, 900);
}

// ─── LECTURE NATIVE (iPhone) ──────────────────────────────────────────────
let nat = null;       // module GameAudio, une fois les sons chargés
let natStarting = false;
let natAmbOn = false;
function nativeAvailable() {
  try { return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("GameAudio"); } catch (e) { return false; }
}
const musicVolume = () => (settings.muted || scene !== "menu" ? 0 : settings.music);
async function startNative() {
  if (nat || natStarting) return !!nat;
  natStarting = true;
  const p = registerPlugin("GameAudio");
  const load = (id, file, loop = false) => p.preload({ id, file, loop }).then(() => true).catch(e => { console.warn("[son]", file, e); return false; });
  const ok = await Promise.all([
    ...MUSIC.map((f, i) => load("m" + i, f)),
    load("amb", AMBIENCE, true),
    ...Object.entries(SFX).map(([id, f]) => load(id, f)),
  ]);
  natStarting = false;
  if (!ok.some(Boolean)) return false;
  nat = p;
  // Fin du morceau en cours seulement (et pas d'un son dont le nom commence
  // aussi par « m », comme « matchEnd ») : morceau suivant.
  nat.addListener("ended", ({ id }) => {
    if (id === "m" + musicIndex) { musicIndex = (musicIndex + 1) % MUSIC.length; natMusic(); }
  });
  natMusic();
  natApply();
  return true;
}
// Un seul morceau à la fois : les autres sont arrêtés avant de lancer celui-ci.
function natMusic() {
  MUSIC.forEach((_, i) => { if (i !== musicIndex) nat.stop({ id: "m" + i }).catch(() => {}); });
  nat.play({ id: "m" + musicIndex, volume: musicVolume(), fade: 1, restart: true }).catch(() => {});
}
function natApply(fade = 0.6) {
  // Son coupé : tout se tait ; hors match : plus aucun son de match.
  const silence = settings.muted ? Object.keys(SFX) : inMatch(scene) ? [] : MATCH_SFX;
  silence.forEach(id => nat.stop({ id, fade: 0.3 }).catch(() => {}));
  nat.setVolume({ id: "m" + musicIndex, volume: musicVolume(), fade }).catch(() => {});
  const amb = scene === "match" && !settings.muted;
  if (amb && !natAmbOn) { natAmbOn = true; nat.play({ id: "amb", volume: settings.sfx * 0.7, fade: 0.6, restart: true }).catch(() => {}); }
  else if (amb) nat.setVolume({ id: "amb", volume: settings.sfx * 0.7, fade }).catch(() => {});
  else if (natAmbOn) { natAmbOn = false; nat.stop({ id: "amb", fade: 0.4 }).catch(() => {}); }
}

// À appeler au premier toucher : les navigateurs n'autorisent le son
// qu'après un geste du joueur. Dans l'app iPhone, dès le lancement.
export function unlockAudio() {
  if (nativeAvailable()) { startNative(); return; }
  if (!ensureContext()) return;
  // iOS 17+ : session « lecture », le bouton silencieux ne coupe plus le jeu.
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* non pris en charge */ }
  if (ctx.state === "suspended") ctx.resume();
  startMusic();
  setAudioScene(scene);
}

// « menu » : musique ; « match » : sons des points ; « matchQuiet » : match
// en pause, mini-jeu ou match terminé (ni musique ni ambiance) ; « flight » :
// son de l'avion seul. La musique continue en silence hors menu.
export function setAudioScene(next) {
  if (nat) { if (next !== scene) { scene = next; natApply(); } return; }
  if (next === scene && ctx) return;
  scene = next;
  if (!ctx) return;
  applyVolumes(0.6);
  if (scene === "match") startAmbience(); else stopAmbience();
  if (!inMatch(scene)) stopMatchSfx();
  if (musicEl && musicEl.paused && !settings.muted && document.visibilityState !== "hidden") musicEl.play().catch(() => {});
}

// Effets ponctuels : par élément <audio> (fiable sur iPhone).
const sfxEls = {};
export function playSfx(name) {
  if (MATCH_SFX.includes(name) && !inMatch(scene)) return;
  if (nat) { if (!settings.muted && SFX[name]) nat.play({ id: name, volume: settings.sfx, restart: true }).catch(() => {}); return; }
  if (!ctx || settings.muted || !SFX[name]) return;
  if (ctx.state === "suspended") ctx.resume();
  if (sfxEls[name]) sfxEls[name].pause();
  sfxEls[name] = playElement(SFX[name], sfxGain);
}
function stopMatchSfx() {
  MATCH_SFX.forEach(n => { if (sfxEls[n]) { sfxEls[n].pause(); sfxEls[n] = null; } });
}

export function getAudioSettings() { return settings; }
export function setAudioSettings(patch) {
  settings = { ...settings, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) { /* stockage plein */ }
  if (nat) natApply(0.3);
  applyVolumes();
  if (musicEl) { if (settings.muted) musicEl.pause(); else musicEl.play().catch(() => {}); }
  listeners.forEach(fn => fn(settings));
}
export function onAudioSettings(fn) { listeners.add(fn); return () => listeners.delete(fn); }
