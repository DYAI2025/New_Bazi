// BaZiDetail — echte Dekaden-Zyklen (Tagespuls-Etappe-2, Task A4).
// Muster: TagespulsV2.test.tsx (vi.mock mit importOriginal, createRoot + act).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import type { DayunResponse } from "../api/bazodiacClient";
import type { ProfileViewModel } from "../viewmodels/profileViewModel";
import type { BirthData } from "../types";
import { ElementType } from "../types";

const fetchDayun = vi.fn();
vi.mock("../api/bazodiacClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../api/bazodiacClient")>();
  return {
    ...mod,
    BazodiacClient: { ...mod.BazodiacClient, fetchDayun: (...args: unknown[]) => fetchDayun(...args) },
  };
});

import BaZiDetail from "./BaZiDetail";

const birth = (): BirthData =>
  ({ name: "Ada", birthDate: "1985-06-15", birthTime: "14:30" } as unknown as BirthData);

/** Minimales viewModel: BaZiDetail liest bazi.{available,hourAvailable,pillars,dayMaster,dayun}, provenance, source. */
function vmFixture(): ProfileViewModel {
  return {
    source: "fufire",
    provenance: [],
    bazi: {
      available: true,
      hourAvailable: true,
      pillars: [],
      dayMaster: {
        element: ElementType.METAL,
        name: "Xin",
        pinyin: "Xīn",
        chinese: "辛",
        polarity: "Yin",
        coreInterpretation: "Kern",
        strengths: "Stärken",
        shadow: "Blockaden",
      },
      dayun: {
        available: false,
        status: "stub-noch-nicht-geladen",
        message: "Stub-Zustand aus dem Profil-ViewModel.",
        cycles: [],
      },
    },
  } as unknown as ProfileViewModel;
}

function dayunOk(): DayunResponse {
  return {
    available: true,
    source: "fufire",
    labelDe: "Dekaden-Säule",
    direction: "backward",
    startAgeYears: 3.26,
    cycles: [
      {
        sequence: 1, ageLabel: "3–13",
        dateStart: "1988-08-31", dateEnd: "1998-07-10",
        stem: "Xin", stemHanzi: "辛", branch: "Si", branchHanzi: "巳",
        element: "metal", polarity: "yin",
        tenGodDe: "Druck / Struktur", isCurrent: false,
      },
      {
        sequence: 2, ageLabel: "13–23",
        dateStart: "1998-07-10", dateEnd: "2008-05-19",
        stem: "Ren", stemHanzi: "壬", branch: "Wu", branchHanzi: "午",
        element: "water", polarity: "yang",
        tenGodDe: "Ausdruck / Leistung", isCurrent: true,
      },
    ],
  };
}

let container: HTMLElement;
let root: Root;

async function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<BaZiDetail viewModel={vmFixture()} birthData={birth()} />);
  });
}

beforeEach(() => {
  fetchDayun.mockReset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("BaZiDetail — echte Dekaden (Da Yun)", () => {
  it("rendert bei available:true die Zyklen-Liste mit ageLabel, Hanzi, tenGod-Chip und genau einem aktuellen Zyklus", async () => {
    fetchDayun.mockResolvedValue(dayunOk());
    await render();

    expect(fetchDayun).toHaveBeenCalledTimes(1);
    const text = container.textContent ?? "";
    expect(text).toContain("3–13");
    expect(text).toContain("辛");
    expect(text).toContain("Druck / Struktur");
    expect(container.querySelectorAll('[data-testid="dayun-current"]')).toHaveLength(1);
    // Quellenzeile unter der Liste
    expect(text).toContain("Quelle: fufire");
    expect(text).toContain("Dekaden-Säule");
  });

  it("zeigt bei available:false den Missing-State mit status und message", async () => {
    fetchDayun.mockResolvedValue({
      available: false,
      status: "missing-birth-time",
      source: "missing",
      message: "Die Dekaden-Säulen sind ohne belastbare Geburtszeit nicht seriös bestimmbar.",
      cycles: [],
    } satisfies DayunResponse);
    await render();

    const text = container.textContent ?? "";
    expect(text).toContain("missing-birth-time");
    expect(text).toContain("Die Dekaden-Säulen sind ohne belastbare Geburtszeit nicht seriös bestimmbar.");
    expect(container.querySelector('[data-testid="dayun-current"]')).toBeNull();
  });

  it("rendert bei rejected fetchDayun ohne Crash weiter den viewModel-Stub-Zustand", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchDayun.mockRejectedValue(new Error("network down"));
    await render();

    const text = container.textContent ?? "";
    // Alter Stub-Zustand (available:false im viewModel) bleibt sichtbar.
    expect(text).toContain("stub-noch-nicht-geladen");
    expect(text).toContain("Stub-Zustand aus dem Profil-ViewModel.");
    expect(container.querySelector('[data-testid="dayun-current"]')).toBeNull();
    expect(consoleError).toHaveBeenCalled();
  });
});
