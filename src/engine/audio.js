// Musique et sons du jeu.
// - Musique : les morceaux de MUSIC s'enchaînent en boucle, l'un après
//   l'autre, sur les écrans hors match.
// - Ambiance de match : une boucle de public sans coupure (lecture Web Audio
//   en boucle exacte, pas de trou entre deux tours).
// - Effets ponctuels : le vol (calé sur la durée de l'animation), la
//   clameur du public à la fin d'un match.
// Tout passe par Web Audio : sur iPhone, le volume d'un élément <audio> ne
// se règle pas, seul un nœud de gain le permet. Les fichiers sont servis à
// côté de index.html (dossier audio/) ; un fichier absent est ignoré.
// Réglages (volume musique, volume effets, son coupé) gardés sur l'appareil.

const KEY = "tm-audio";
const MUSIC = [1, 2, 3, 4, 5].map(n => "audio/music-" + n + ".mp3");
const AMBIENCE = "audio/match-ambience.mp3";
const SFX = { flight: "audio/flight.mp3", matchEnd: "audio/match-end.mp3" };

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
    else { ctx.resume(); if (scene === "menu" && musicEl && !settings.muted) musicEl.play().catch(() => {}); }
  });
  return ctx;
}

function applyVolumes(fade = 0.25) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const set = (g, v) => { g.gain.cancelScheduledValues(now); g.gain.setTargetAtTime(v, now, Math.max(0.01, fade / 3)); };
  set(master, settings.muted ? 0 : 1);
  set(musicGain, scene === "menu" ? settings.music : 0);
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
    if (!res.ok) return null;
    buffers[url] = await ctx.decodeAudioData(await res.arrayBuffer());
  } catch (e) { buffers[url] = null; }
  return buffers[url];
}

// Début et fin (en secondes) de la partie audible d'un tampon.
function audibleRange(buf) {
  const d = buf.getChannelData(0), n = d.length, eps = 1e-4;
  let i = 0, j = n - 1;
  while (i < n && Math.abs(d[i]) < eps) i++;
  while (j > i && Math.abs(d[j]) < eps) j--;
  return [i / buf.sampleRate, (j + 1) / buf.sampleRate];
}

async function startAmbience() {
  if (!ctx || ambSource) return;
  ambBuffer = ambBuffer || await loadBuffer(AMBIENCE);
  if (!ambBuffer || scene !== "match" || ambSource) return;
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
  if (!ambSource) return;
  const s = ambSource; ambSource = null;
  s._gain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
  setTimeout(() => { try { s.stop(); } catch (e) { /* déjà arrêtée */ } }, 900);
}

// À appeler au premier toucher : les navigateurs n'autorisent le son
// qu'après un geste du joueur.
export function unlockAudio() {
  if (!ensureContext()) return;
  if (ctx.state === "suspended") ctx.resume();
  startMusic();
  setAudioScene(scene);
}

// « menu » : musique ; « match » : ambiance de public, musique coupée.
export function setAudioScene(next) {
  scene = next;
  if (!ctx) return;
  applyVolumes(0.6);
  if (scene === "match") { if (musicEl) musicEl.pause(); startAmbience(); }
  else { stopAmbience(); if (musicEl && !settings.muted && document.visibilityState !== "hidden") musicEl.play().catch(() => {}); }
}

export async function playSfx(name) {
  if (!ctx || settings.muted || !SFX[name]) return;
  const buf = await loadBuffer(SFX[name]);
  if (!buf) return;
  const src = ctx.createBufferSource(); src.buffer = buf; src.connect(sfxGain); src.start();
}

export function getAudioSettings() { return settings; }
export function setAudioSettings(patch) {
  settings = { ...settings, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) { /* stockage plein */ }
  applyVolumes();
  if (musicEl) { if (settings.muted) musicEl.pause(); else if (scene === "menu") musicEl.play().catch(() => {}); }
  listeners.forEach(fn => fn(settings));
}
export function onAudioSettings(fn) { listeners.add(fn); return () => listeners.delete(fn); }
