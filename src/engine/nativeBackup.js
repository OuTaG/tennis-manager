// Copie de secours des sauvegardes dans des fichiers de l'app iOS.
// Le stockage web (localStorage) d'une app iOS peut être vidé par le système
// quand l'iPhone manque de place : chaque écriture d'une clé du jeu (tm-… /
// tm_…) est donc recopiée dans un fichier du dossier Library de l'app (plugin
// Capacitor « Filesystem », @capacitor/filesystem), qui n'est jamais purgé.
// Au lancement, toute clé absente du stockage web est restaurée depuis son
// fichier. Sur le web, ou si le plugin n'est pas installé, rien ne change.
import { Capacitor, registerPlugin } from "@capacitor/core";

const DIR = "LIBRARY";
const FOLDER = "courtside-saves";
const isGameKey = (k) => typeof k === "string" && /^tm[-_]/.test(k);
const fileOf = (k) => FOLDER + "/" + encodeURIComponent(k) + ".txt";
const keyOf = (name) => { try { return decodeURIComponent(String(name).replace(/\.txt$/, "")); } catch { return null; } };

let fs = null;
const files = () => fs || (fs = registerPlugin("Filesystem"));

function isNative() {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

// Restaure les clés manquantes, puis recopie celles qui n'ont pas encore de
// fichier (premier lancement après la mise à jour). Ne bloque jamais plus
// de `timeoutMs` le démarrage du jeu.
export async function restoreNativeBackup(timeoutMs = 4000) {
  if (!isNative()) return { restored: 0 };
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
      if (localStorage.getItem(key) !== null) continue;
      try {
        const { data } = await files().readFile({ path: fileOf(key), directory: DIR, encoding: "utf8" });
        if (typeof data === "string") { localStorage.setItem(key, data); restored++; }
      } catch { /* fichier illisible : ignoré */ }
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (isGameKey(key) && !onDisk.has(key)) writeNow(key, localStorage.getItem(key));
    }
    return { restored };
  })();
  const timeout = new Promise(res => setTimeout(() => res({ restored: 0, timeout: true }), timeoutMs));
  try { return await Promise.race([work, timeout]); } catch { return { restored: 0 }; }
}

function writeNow(key, value) {
  files().writeFile({ path: fileOf(key), data: value, directory: DIR, encoding: "utf8", recursive: true }).catch(() => {});
}

// Recopie chaque écriture / suppression du jeu. Les écritures rapprochées
// d'une même clé sont regroupées (la dernière valeur seule est écrite).
const pending = new Map();
let installed = false;
export function installNativeBackup() {
  if (!isNative() || installed) return;
  installed = true;
  // Le prototype est patché (assigner localStorage.setItem créerait une
  // entrée nommée « setItem ») ; seul window.localStorage est concerné.
  const ls = window.localStorage;
  const proto = Object.getPrototypeOf(ls);
  const set = proto.setItem;
  const remove = proto.removeItem;
  proto.setItem = function (key, value) {
    set.call(this, key, value);
    if (this !== ls || !isGameKey(key)) return;
    clearTimeout(pending.get(key));
    pending.set(key, setTimeout(() => { pending.delete(key); const v = ls.getItem(key); if (v !== null) writeNow(key, v); }, 400));
  };
  proto.removeItem = function (key) {
    remove.call(this, key);
    if (this !== ls || !isGameKey(key)) return;
    clearTimeout(pending.get(key));
    pending.delete(key);
    files().deleteFile({ path: fileOf(key), directory: DIR }).catch(() => {});
  };
  // App mise en arrière-plan : les copies en attente sont écrites aussitôt.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    for (const [key, t] of pending) { clearTimeout(t); const v = ls.getItem(key); if (v !== null) writeNow(key, v); }
    pending.clear();
  });
}
