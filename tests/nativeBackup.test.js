// Sauvegardes iOS : stockage web limité à 5 Mo (UTF-16), carrières en fichiers.
import { beforeAll, describe, expect, it, vi } from "vitest";

// Fichiers natifs simulés (plugin Filesystem).
const disk = new Map();
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true },
  registerPlugin: () => ({
    readdir: async () => ({ files: [...disk.keys()].map(p => ({ name: p.split("/").pop() })) }),
    readFile: async ({ path }) => { if (!disk.has(path)) throw new Error("absent"); return { data: disk.get(path) }; },
    writeFile: async ({ path, data }) => { disk.set(path, data); return {}; },
    deleteFile: async ({ path }) => { disk.delete(path); return {}; },
  }),
}));

// Stockage web façon WebKit : 5 Mo, 2 octets par caractère.
const QUOTA = 5 * 1024 * 1024;
class FakeStorage {
  constructor() { Object.defineProperty(this, "_m", { value: new Map() }); }
  get length() { return this._m.size; }
  key(i) { return [...this._m.keys()][i] ?? null; }
}
FakeStorage.prototype.getItem = function (k) { return this._m.has(k) ? this._m.get(k) : null; };
FakeStorage.prototype.setItem = function (k, v) {
  let used = 0;
  for (const [kk, vv] of this._m) if (kk !== k) used += (kk.length + vv.length) * 2;
  if (used + (k.length + String(v).length) * 2 > QUOTA) throw new Error("QuotaExceededError");
  this._m.set(k, String(v));
};
FakeStorage.prototype.removeItem = function (k) { this._m.delete(k); };

const career = (n, size = 1_600_000) => JSON.stringify({ n, savedAt: new Date(2026, 0, n).toISOString(), pad: "x".repeat(size) });
const flush = () => new Promise(r => setTimeout(r, 1200));

let mod;
beforeAll(async () => {
  globalThis.Storage = FakeStorage;
  const ls = new FakeStorage();
  globalThis.window = { localStorage: ls };
  globalThis.localStorage = ls;
  globalThis.document = { visibilityState: "visible", addEventListener: () => {} };
  // Une ancienne carrière déjà dans le stockage web, sans fichier.
  ls.setItem("tm_save_v1", career(1));
  ls.setItem("tm_slot_meta_1", "{}");
  mod = await import("../src/engine/nativeBackup.js");
  await mod.restoreNativeBackup();
  mod.installNativeBackup();
});

describe("sauvegardes iOS", () => {
  it("déplace l'ancienne carrière du stockage web vers son fichier", () => {
    expect(disk.has("courtside-saves/tm_save_v1.txt")).toBe(true);
    expect(JSON.parse(localStorage.getItem("tm_save_v1")).n).toBe(1);
    expect(globalThis.window.localStorage._m.has("tm_save_v1")).toBe(false);
  });

  it("enregistre 3 carrières de 1,6 Mo sans dépasser le quota", async () => {
    localStorage.setItem("tm_save_v1_s2", career(2));
    localStorage.setItem("tm_save_v1_s3", career(3));
    localStorage.setItem("tm_save_v1_s2_live", JSON.stringify({ key: "pre:1:x", t: 5 }));
    expect(JSON.parse(localStorage.getItem("tm_save_v1_s2")).n).toBe(2);
    expect(JSON.parse(localStorage.getItem("tm_save_v1_s3")).n).toBe(3);
    await flush();
    expect(disk.has("courtside-saves/tm_save_v1_s2.txt")).toBe(true);
    expect(disk.has("courtside-saves/tm_save_v1_s3.txt")).toBe(true);
    expect(disk.has("courtside-saves/tm_save_v1_s2_live.txt")).toBe(true);
  });

  it("retrouve les carrières après une relance de l'app", async () => {
    vi.resetModules();
    const ls = new FakeStorage();
    globalThis.window = { localStorage: ls };
    globalThis.localStorage = ls;
    const again = await import("../src/engine/nativeBackup.js");
    await again.restoreNativeBackup();
    again.installNativeBackup();
    expect(JSON.parse(localStorage.getItem("tm_save_v1")).n).toBe(1);
    expect(JSON.parse(localStorage.getItem("tm_save_v1_s2")).n).toBe(2);
    expect(JSON.parse(localStorage.getItem("tm_save_v1_s2_live")).key).toBe("pre:1:x");
  });

  it("efface la carrière et son fichier", async () => {
    localStorage.removeItem("tm_save_v1_s3");
    await flush();
    expect(localStorage.getItem("tm_save_v1_s3")).toBe(null);
    expect(disk.has("courtside-saves/tm_save_v1_s3.txt")).toBe(false);
  });
});
