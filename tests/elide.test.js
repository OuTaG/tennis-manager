import { describe, it, expect } from "vitest";
import { elide } from "../src/engine/text.js";
import { CITIES } from "../src/data/geo.js";

describe("elide", () => {
  it("élide le / du / au devant une voyelle", () => {
    expect(elide("Le Open Doha commence")).toBe("L'Open Doha commence");
    expect(elide("roi du Open Doha")).toBe("roi de l'Open Doha");
    expect(elide("sacré au ITF de Doha")).toBe("sacré à l'ITF de Doha");
  });
  it("laisse les consonnes et le h tels quels", () => {
    expect(elide("Le Dubai Open")).toBe("Le Dubai Open");
    expect(elide("au Hobart International")).toBe("au Hobart International");
  });
});

describe("villes", () => {
  it("Dubaï n'apparaît qu'une fois, l'ancien nom reste lisible", () => {
    expect(Object.keys(CITIES).filter(n => /^Duba/.test(n))).toEqual(["Dubaï"]);
    expect(CITIES["Dubai"]).toBe(CITIES["Dubaï"]);
  });
});
