// Son du match (lecture native) : sons des points seulement pendant le jeu,
// clameur à la fin, plus rien une fois le match quitté.
import { beforeAll, describe, expect, it, vi } from "vitest";

const calls = [];
const playing = new Set();
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true, isPluginAvailable: () => true },
  registerPlugin: () => ({
    preload: async () => {},
    addListener: () => {},
    play: async ({ id }) => { calls.push("play " + id); playing.add(id); },
    stop: async ({ id }) => { calls.push("stop " + id); playing.delete(id); },
    setVolume: async () => {},
  }),
}));

let A;
const tick = () => new Promise(r => setTimeout(r, 0));
beforeAll(async () => {
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
  A = await import("../src/engine/audio.js");
  A.unlockAudio();
  await tick(); await tick();
});

describe("son du match", () => {
  it("joue les sons des points pendant le jeu, pas en pause ni en mini-jeu", () => {
    A.setAudioScene("match");
    expect(playing.has("amb")).toBe(true);
    A.setAudioScene("matchQuiet");
    expect(playing.has("amb")).toBe(false);
  });
  it("applaudit un mini-jeu réussi et lance la clameur de fin", () => {
    A.playSfx("cheer");
    A.playSfx("matchEnd");
    expect(playing.has("cheer") && playing.has("matchEnd")).toBe(true);
  });
  it("coupe tout son de match en quittant le match", () => {
    A.setAudioScene("menu");
    expect(playing.has("matchEnd") || playing.has("cheer") || playing.has("amb")).toBe(false);
    A.playSfx("matchEnd");
    expect(playing.has("matchEnd")).toBe(false);
  });
  it("un nouveau match repart de zéro", () => {
    calls.length = 0;
    A.setAudioScene("matchQuiet");
    A.setAudioScene("match");
    expect(calls).toContain("play amb");
    expect(calls).not.toContain("play matchEnd");
  });
});
