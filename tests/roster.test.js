import { describe, it, expect, beforeEach } from "vitest";
import { seedRandom } from "./helpers.js";
import { baseRoster, rosterEntries, setRosterEdit, loadRosterConfigs, saveRosterConfigs, ROSTER_SIZE } from "../src/engine/roster.js";
import { generateAtpDatabase } from "../src/engine/database.js";
import { getRngState } from "../src/engine/rng.js";

// Petit localStorage en mémoire (les tests tournent sous Node).
if (typeof globalThis.localStorage === "undefined") {
  const mem = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
  };
}

describe("bases de joueurs personnalisées", () => {
  beforeEach(() => { try { localStorage.clear(); } catch (e) {} });

  it("la base de référence est fixe et ne touche pas au hasard de la partie", () => {
    seedRandom(5);
    const before = getRngState();
    const a = baseRoster("atp");
    expect(getRngState()).toBe(before);
    expect(a.length).toBe(ROSTER_SIZE);
    expect(baseRoster("atp")[500].name).toBe(a[500].name);
    expect(baseRoster("wta")[0].name).not.toBe(a[0].name);
  });

  it("les modifications s'appliquent à la base de la carrière", () => {
    let cfg = loadRosterConfigs()[0];
    const avatar = { hairStyle: "pics", skin: "#5e3a22" };
    cfg = setRosterEdit(cfg, "atp", 3, { name: "Arthur Test", code: "fr", avatar });
    cfg = setRosterEdit(cfg, "atp", 700, { name: "Joueur Perso" });
    const entries = rosterEntries(cfg, "atp");
    seedRandom(9);
    const db = generateAtpDatabase(entries);
    expect(db.length).toBe(ROSTER_SIZE);
    expect(db.find(p => p.name === "Arthur Test").avatar).toEqual(avatar);
    expect(db.some(p => p.name === "Joueur Perso")).toBe(true);
    // retirer une modification rend le joueur d'origine
    cfg = setRosterEdit(cfg, "atp", 700, null);
    expect(rosterEntries(cfg, "atp")[700].name).toBe(baseRoster("atp")[700].name);
  });

  it("3 configurations enregistrées sur l'appareil", () => {
    const cfgs = loadRosterConfigs();
    expect(cfgs.length).toBe(3);
    cfgs[1] = { ...cfgs[1], name: "Ma ligue" };
    saveRosterConfigs(cfgs);
    expect(loadRosterConfigs()[1].name).toBe("Ma ligue");
  });
});
