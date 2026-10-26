// Sauvegardes de l'app iOS dans des fichiers (plugin Capacitor « Filesystem »,
// @capacitor/filesystem, dossier Library de l'app, jamais purgé).
//
// Le stockage web (localStorage) d'une app iOS est limité à 5 Mo, comptés en
// UTF-16 (2 octets par caractère) : une carrière y pèse environ 3 Mo, si bien
// qu'à partir de la 2e carrière les sauvegardes échouaient sans bruit. Les
// carrières (clés tm_save_v1, tm_save_v1_s2…) vivent donc en mémoire et dans
// leur fichier uniquement ; localStorage.getItem / setItem / removeItem sont
// redirigés pour elles, le reste du jeu n'y voit aucune différence.
//
// Les autres clés du jeu (tm-… / tm_…) restent dans le stockage web, avec une
// copie de secours en fichier : au lancement, une clé absente est restaurée
// depuis son fichier, et le match en cours (…_live) l'est aussi quand son
// fichier est plus récent (une app fermée de force peut perdre les dernières
// écritures du stockage web, pas celles du fichier).
// Sur le web, ou si le plugin n'est pas installé, rien ne change.
import { Capacitor, registerPlugin } from "@capacitor/core";

const DIR = "LIBRARY";
const FOLDER = "courtside-saves";
const isGameKey = (k) => typeof k === "string" && /^tm[-_]/.test(k);
// Carrière complète (lourde) : en mémoire + fichier, jamais dans le stockage web.
const isCareerKey = (k) => typeof k === "string" && /^tm_save_v1(_s\d+)?$/.test(k);
// Sauvegarde datée (champ t ou savedAt) : la plus récente l'emporte.
const isDatedKey = (k) => typeof k === "string" && /^tm_save_/.test(k);
const fileOf = (k) => FOLDER + "/" + encodeURIComponent(k) + ".txt";
const keyOf = (name) => { try { return decodeURIComponent(String(name).replace(/\.txt$/, "")); } catch { return null; } };

// Date d'écriture d'une sauvegarde, 0 si inconnue.
function stampOf(raw) {
  if (typeof raw !== "string") return 0;
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return 0;
    if (typeof o.t === "number") return o.t;
    const d = Date.parse(o.savedAt || "");
    return Number.isFinite(d) ? d : 0;
  } catch { return 0; }
}

let fs = null;
const files = () => fs || (fs = registerPlugin("Filesystem"));

function isNative() {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

// Carrières chargées en mémoire (clé → texte JSON).
const careers = new Map();
// Méthodes d'origine du stockage web, avant redirection des carrières.
const native = typeof Storage !== "undefined"
  ? { get: Storage.prototype.getItem, set: Storage.prototype.setItem, remove: Storage.prototype.removeItem }
  : null;

const writeFile = (key, value) =>
  files().writeFile({ path: fileOf(key), data: value, directory: DIR, encoding: "utf8", recursive: true });
function writeNow(key, value) {
  writeFile(key, value).catch(() => {
    // Fichier impossible à écrire : dernier recours, le stockage web.
    try { native.set.call(window.localStorage, key, value); } catch { /* plein */ }
  });
}

// Au lancement : charge les carrières en mémoire, restaure les autres clés
// manquantes, puis recopie celles qui n'ont pas encore de fichier. Ne bloque
// jamais plus de `timeoutMs` le démarrage du jeu.
export async function restoreNativeBackup(timeoutMs = 15000) {
  if (!isNative()) return { restored: 0 };
  const ls = window.localStorage;
  const lsGet = (k) => native.get.call(ls, k);
  const lsRemove = (k) => { try { native.remove.call(ls, k); } catch { /* ignoré */ } };
  const work = (async () => {
    let names = [];
    try {
      const res = await files().readdir({ path: FOLDER, directory: DIR });
      names = (res.files || []).map(f => (typeof f === "string" ? f : f.name));
    } catch { names = []; /* dossier absent : premier lancement */ }
    let restored = 0;
    const onDisk = new Set();
    for (const name of names) {
      const key = keyOf(name);
      if (!isGameKey(key)) continue;
      onDisk.add(key);
      const current = lsGet(key);
      if (current !== null && !isDatedKey(key)) continue;
      let data = null;
      try { ({ data } = await files().readFile({ path: fileOf(key), directory: DIR, encoding: "utf8" })); } catch { /* illisible */ }
      if (isCareerKey(key)) {
        // La plus récente des deux copies ; une copie web plus récente est
        // d'abord écrite dans le fichier, puis retirée du stockage web.
        let best = typeof data === "string" ? data : null;
        let fileHasBest = best !== null;
        if (current !== null && (best === null || stampOf(current) > stampOf(best))) {
          try { await writeFile(key, current); fileHasBest = true; } catch { fileHasBest = false; }
          best = current;
        }
        if (best !== null) { careers.set(key, best); restored++; }
        if (current !== null && fileHasBest) lsRemove(key);
        continue;
      }
      if (typeof data !== "string" || data === current) continue;
      if (current !== null && stampOf(data) <= stampOf(current)) continue;
      try { ls.setItem(key, data); restored++; } catch { /* plein */ }
    }
    // Clés sans fichier (premier lancement après la mise à jour).
    const keys = [];
    for (let i = 0; i < ls.length; i++) keys.push(ls.key(i));
    for (const key of keys) {
      if (!isGameKey(key) || onDisk.has(key)) continue;
      const v = lsGet(key);
      if (v === null) continue;
      if (isCareerKey(key)) {
        try { await writeFile(key, v); careers.set(key, v); lsRemove(key); } catch { careers.set(key, v); }
      } else {
        writeNow(key, v);
      }
    }
    return { restored };
  })();
  const timeout = new Promise(res => setTimeout(() => res({ restored: 0, timeout: true }), timeoutMs));
  try { return await Promise.race([work, timeout]); } catch { return { restored: 0 }; }
}

// Recopie chaque écriture / suppression du jeu. Les écritures rapprochées
// d'une même clé sont regroupées (la dernière valeur seule est écrite),
// mais jamais retardées de plus d'une seconde.
const pending = new Map();
const firstPending = new Map();
let installed = false;
export function installNativeBackup() {
  if (!isNative() || installed) return;
  installed = true;
  // Le prototype est patché (assigner localStorage.setItem créerait une
  // entrée nommée « setItem ») ; seul window.localStorage est concerné.
  const ls = window.localStorage;
  const proto = Object.getPrototypeOf(ls);
  const get = proto.getItem;
  const set = proto.setItem;
  const remove = proto.removeItem;
  const valueOf = (key) => (careers.has(key) ? careers.get(key) : get.call(ls, key));
  const schedule = (key, value) => {
    clearTimeout(pending.get(key));
    // Match en cours (quelques Ko) ou app en train de passer en arrière-plan :
    // copie immédiate, une fermeture forcée peut suivre à tout instant.
    if (/_live$/.test(key) || document.visibilityState === "hidden") {
      pending.delete(key); firstPending.delete(key);
      writeNow(key, value);
      return;
    }
    const now = Date.now();
    if (!firstPending.has(key)) firstPending.set(key, now);
    const wait = Math.max(0, Math.min(400, firstPending.get(key) + 1000 - now));
    pending.set(key, setTimeout(() => {
      pending.delete(key); firstPending.delete(key);
      const v = valueOf(key);
      if (v !== null) writeNow(key, v);
    }, wait));
  };
  proto.getItem = function (key) {
    if (this === ls && isCareerKey(key) && careers.has(key)) return careers.get(key);
    return get.call(this, key);
  };
  proto.setItem = function (key, value) {
    if (this === ls && isCareerKey(key)) {
      careers.set(key, String(value));
      // Ancienne copie web éventuelle : retirée pour libérer de la place.
      try { remove.call(ls, key); } catch { /* ignoré */ }
      schedule(key, String(value));
      return;
    }
    set.call(this, key, value);
    if (this !== ls || !isGameKey(key)) return;
    schedule(key, value);
  };
  proto.removeItem = function (key) {
    remove.call(this, key);
    if (this !== ls || !isGameKey(key)) return;
    careers.delete(key);
    clearTimeout(pending.get(key));
    pending.delete(key);
    firstPending.delete(key);
    files().deleteFile({ path: fileOf(key), directory: DIR }).catch(() => {});
  };
  // App mise en arrière-plan : les copies en attente sont écrites aussitôt.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    for (const [key, t] of pending) { clearTimeout(t); const v = valueOf(key); if (v !== null) writeNow(key, v); }
    pending.clear();
    firstPending.clear();
  });
}
