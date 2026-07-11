// Wochenbogen — ruhiger Rückblick (C3). Store wird direkt befüllt (localStorage
// ist im Test echt); keine Mocks nötig außer Determinismus über relative Daten.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import Wochenbogen, { weekStartIso } from "./Wochenbogen";
import { clearAllReflections, saveReflection } from "../../utils/daily/reflectionStore";

let container: HTMLElement;
let root: Root | null = null;

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(<Wochenbogen />));
}

function cleanup() {
  if (root) {
    act(() => root!.unmount());
    container.remove();
    root = null;
  }
}

const q = (sel: string) => container.querySelector(sel);
const qa = (sel: string) => container.querySelectorAll(sel);

/** Lokales ISO-Datum heute−offset (gleiche Formatierung wie die Komponente). */
function isoDaysAgo(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

beforeEach(() => clearAllReflections());
afterEach(() => cleanup());

describe("weekStartIso", () => {
  it("liefert heute−6 als lokales ISO-Datum", () => {
    expect(weekStartIso(new Date("2026-07-10T12:00:00"))).toBe("2026-07-04");
    expect(weekStartIso(new Date("2026-07-03T12:00:00"))).toBe("2026-06-27"); // Monatsgrenze
  });
});

describe("Wochenbogen", () => {
  it("leerer Store → ehrlicher Leerzustand, keine Abschnitte", () => {
    render();
    expect(q('[data-testid="wochenbogen-empty"]')).not.toBeNull();
    expect(q('[data-testid="wochenbogen-week"]')).toBeNull();
    expect(q('[data-testid="wochenbogen-spiegel"]')).toBeNull();
  });

  it("zeigt Wochenliste + Muster-Spiegel: 3×ausdruck belastbar, 1×struktur ehrlich unbelastbar", () => {
    for (const off of [0, 1, 2]) {
      saveReflection({ date: isoDaysAgo(off), dayType: "ausdruck", reaction: "kenne_ich", encounterChoice: off === 0 ? "Ausdruck" : null, vetoChoice: null });
    }
    saveReflection({ date: isoDaysAgo(3), dayType: "struktur", reaction: "gegenseite", encounterChoice: null, vetoChoice: null });
    render();

    expect(qa('[data-testid="wochenbogen-day"]')).toHaveLength(4);
    const ausdruck = q('[data-testid="spiegel-ausdruck"]');
    expect(ausdruck?.textContent).toContain("3 von 3");
    expect(ausdruck?.textContent).toContain("Prüfe, ob das für dich stimmt");
    const struktur = q('[data-testid="spiegel-struktur"]');
    expect(struktur?.textContent).toContain("noch kein Muster belastbar");
    // Kein Streak-/Lücken-Vokabular
    expect(container.textContent).not.toMatch(/streak|lücke|verpasst|score/i);
  });

  it("Einträge älter als 7 Tage fehlen in der Wochenliste, zählen aber im Muster-Spiegel", () => {
    saveReflection({ date: isoDaysAgo(20), dayType: "einfluss", reaction: "teils", encounterChoice: null, vetoChoice: null });
    render();
    expect(q('[data-testid="wochenbogen-week"]')).toBeNull();
    expect(q('[data-testid="spiegel-einfluss"]')?.textContent).toContain("1 Antwort");
  });
});
