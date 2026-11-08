import { describe, expect, it } from "vitest";
import { isDoorOpen, SCENES, SCENE_IDS } from "./scenes";

/**
 * Source of truth: „Balul de Revelion TV8 — Cenușăreasa zilelor noastre”.
 * Every line spoken by DOCHIȚA in Sc. 2 and Sc. 3, in screenplay order.
 * Only spelling/diacritics are normalised (e.g. „Doriti sa” → „Doriți să”,
 * „inregistartă” → „înregistrată”, „totți” → „toți”).
 */
const SCREENPLAY_DOCHITA_LINES = [
  // Sc. 2 — EXT. INTRAREA PALATULUI REGAL
  "Bună ziua. Față nerecunoscută.",
  "Da. Problema nu era la claritate.",
  "Ocupația nu ține loc de identitate. Ieri a venit un domn care era împărat. Vindea covoare.",
  "Accesoriile se pot cumpăra. Vă rog să scoateți coroana.",
  "Apropiați-vă. Puțin la stânga. Cealaltă stângă.",
  "Zâmbiți.",
  "Fără amenințări, vă rog.",
  "Atunci încercăm întrebarea de securitate. Cine conduce în această casă?",
  "Răspuns greșit. Mai aveți două încercări.",
  "Corect. Verificare de prezență: clipiți de două ori.",
  "Acum întoarceți capul.",
  "Eu nu am. Pe al dumneavoastră încerc să-l identific.",
  "Identitatea este aproape confirmată. Mai lipsește codul primit pe telefon.",
  "Puteți încărca telefonul în hol.",
  "Cu codul primit pe telefon.",
  "Reparația costă mai mult decât mine.",
  "Ce faceți?",
  // Sc. 3 — INT. PALAT REGAL
  "Doriți să-i permit ieșirea, Majestate?",
  "Doamna Regină, confirmați?",
  "De la întâi noiembrie plătesc toți. Este ordinul Dvs., Majestate.",
  "Declarație înregistrată și publicată. Doriți să activez comentariile?",
];

const norm = (s: string) =>
  s
    .toLocaleLowerCase("ro")
    .replace(/[.,!?:…]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sentences = (line: string) =>
  line
    .split(/(?<=[.?!])\s+/)
    .map(norm)
    .filter(Boolean);

describe("screenplay conformance", () => {
  it("contains every Dochița line, verbatim and in screenplay order", () => {
    const fromScenes = SCENES.filter((s) => s.line).map((s) => s.line).join(" ");
    expect(fromScenes).toBe(SCREENPLAY_DOCHITA_LINES.join(" "));
  });

  it("in full-text mode, shows every sentence of the spoken line", () => {
    for (const scene of SCENES) {
      if (!scene.line) continue;
      const text = scene.full ?? scene;
      const shown = norm(`${text.status ?? scene.status} ${text.title} ${text.subtitle ?? ""}`);
      for (const sentence of sentences(scene.line)) {
        expect(shown, `${scene.id}: "${sentence}"`).toContain(sentence);
      }
    }
  });

  it("filming mode never shows a punchline before the voice says it", () => {
    for (const scene of SCENES) {
      if (!scene.punchline) continue;
      expect(scene.line, scene.id).toContain(scene.punchline);
      const shown = norm(`${scene.status} ${scene.title} ${scene.subtitle ?? ""} ${scene.overlay.trackingLabel ?? ""}`);
      for (const sentence of sentences(scene.punchline)) {
        expect(shown, `${scene.id} spoils "${sentence}"`).not.toContain(sentence);
      }
    }
  });

  it("filming mode keeps titles short enough to read on camera", () => {
    for (const scene of SCENES) expect(scene.title.length, scene.id).toBeLessThanOrEqual(32);
  });

  it("uses Romanian comma-below ș/ț, never cedilla ş/ţ", () => {
    const all = JSON.stringify(SCENES);
    expect(all).not.toMatch(/[şţŞŢ]/);
  });

  it("keeps the door locked through the whole of Sc. 2", () => {
    const sc2 = SCENES.filter((s) => s.scene === 2);
    expect(sc2.every((s) => !isDoorOpen(s.id))).toBe(true);
    expect(sc2.some((s) => s.led === "unlocked")).toBe(false);
  });

  it("opens the door at the start of Sc. 3 and keeps it open", () => {
    const firstSc3 = SCENES.findIndex((s) => s.scene === 3);
    expect(SCENE_IDS[firstSc3]).toBe("unlocked");
    expect(SCENES.slice(firstSc3).every((s) => isDoorOpen(s.id))).toBe(true);
  });

  it("asks for the phone code from 'aproape confirmată' until the knocking", () => {
    const codeBeats = SCENES.filter((s) => s.keypad === "code").map((s) => s.id);
    expect(codeBeats).toEqual(["almostConfirmed", "chargePhone", "codeLoop", "repairCost", "knocking"]);
  });

  it("gives the operator a cue for every beat", () => {
    for (const scene of SCENES) expect(scene.cue.length, scene.id).toBeGreaterThan(3);
  });
});
