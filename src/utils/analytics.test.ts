/**
 * P5-T3 — Amendment B: lightweight in-app analytics (RED contract).
 *
 * The Content Registry doors (Overview cards → ExplanationLayer) must emit two
 * in-app events so we can measure whether the "doors" are actually opened:
 *   - card_click  → fires when a card is activated, carries the entry id + card kind
 *   - layer_open  → fires when the explanation drawer mounts
 *
 * HARD product constraints this contract enforces (all asserted below):
 *   1. The event sink is purely in-process and unit-testable — an exported
 *      `trackEvent()` writer plus a `getEvents()` reader (and a `resetEvents()`
 *      test hook). No singleton hidden behind a React context.
 *   2. NO third-party SDK and NO network beacon: trackEvent MUST NOT call
 *      `fetch`, `navigator.sendBeacon`, `XMLHttpRequest`, or `Image()` pings.
 *   3. NO PII EVER: the recorded payload must never contain the user's name,
 *      birth date or birth place (neither as keys nor as values). This is the
 *      Amendment B privacy line — entertainment analytics, not surveillance.
 *
 * RED REASON: src/utils/analytics.ts does not exist yet, so the import below
 * fails to resolve and every test errors. That is the intended failing state;
 * P5-T3 implementation (NOT this test) creates analytics.ts.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { trackEvent, getEvents, resetEvents } from "./analytics";

describe("analytics — Amendment B in-app event sink", () => {
  beforeEach(() => {
    resetEvents();
  });

  it("records a card_click event with entry id + card kind to the retrievable sink", () => {
    trackEvent("card_click", { entryId: "zodiac.libra", card: "sun" });

    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("card_click");
    expect(events[0].props).toMatchObject({ entryId: "zodiac.libra", card: "sun" });
  });

  it("records a layer_open event when the drawer mounts", () => {
    trackEvent("layer_open", { entryId: "stem.jia", card: "pillar" });

    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("layer_open");
    expect(events[0].props).toMatchObject({ entryId: "stem.jia", card: "pillar" });
  });

  it("keeps events in order and accumulates across calls", () => {
    trackEvent("card_click", { entryId: "zodiac.libra", card: "sun" });
    trackEvent("layer_open", { entryId: "zodiac.libra", card: "sun" });

    const names = getEvents().map((e) => e.name);
    expect(names).toEqual(["card_click", "layer_open"]);
  });

  it("resetEvents() clears the sink (test isolation hook)", () => {
    trackEvent("card_click", { entryId: "zodiac.taurus", card: "moon" });
    expect(getEvents()).toHaveLength(1);
    resetEvents();
    expect(getEvents()).toHaveLength(0);
  });

  it("getEvents() returns a copy — mutating it does not corrupt the sink", () => {
    trackEvent("card_click", { entryId: "zodiac.libra", card: "sun" });
    const snapshot = getEvents();
    snapshot.length = 0;
    snapshot.push({ name: "card_click", props: { entryId: "evil", card: "sun" } } as any);
    expect(getEvents()).toHaveLength(1);
    expect(getEvents()[0].props.entryId).toBe("zodiac.libra");
  });

  describe("NO PII — Amendment B privacy line", () => {
    const PII_KEYS = ["name", "birthDate", "birthdate", "birth_date", "birthPlace", "birthplace", "birth_place", "place", "dob"];

    it("does not persist PII keys even if a caller passes them", () => {
      // A careless caller leaks PII into props. The sink MUST strip/ignore them —
      // an entertainment analytics event never stores who the person is.
      trackEvent("card_click", {
        entryId: "zodiac.libra",
        card: "sun",
        name: "Max Mustermann",
        birthDate: "1990-06-15",
        birthPlace: "Berlin, Deutschland",
      } as any);

      const recorded = getEvents()[0].props as Record<string, unknown>;
      for (const key of PII_KEYS) {
        expect(Object.prototype.hasOwnProperty.call(recorded, key)).toBe(false);
      }
    });

    it("never stores PII values anywhere in the recorded payload", () => {
      trackEvent("card_click", {
        entryId: "zodiac.libra",
        card: "sun",
        name: "Max Mustermann",
        birthDate: "1990-06-15",
        birthPlace: "Berlin, Deutschland",
      } as any);

      const serialized = JSON.stringify(getEvents());
      expect(serialized).not.toContain("Max Mustermann");
      expect(serialized).not.toContain("1990-06-15");
      expect(serialized).not.toContain("Berlin");
    });
  });

  describe("NO network beacon — events stay in-process", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;
    let beaconSpy: ReturnType<typeof vi.fn>;
    let xhrOpenSpy: ReturnType<typeof vi.spyOn> | null;

    beforeEach(() => {
      fetchSpy = vi.fn(() => Promise.resolve(new Response("{}")));
      vi.stubGlobal("fetch", fetchSpy);

      beaconSpy = vi.fn(() => true);
      if (!(globalThis as any).navigator) {
        vi.stubGlobal("navigator", {} as any);
      }
      (globalThis.navigator as any).sendBeacon = beaconSpy;

      xhrOpenSpy =
        typeof XMLHttpRequest !== "undefined"
          ? vi.spyOn(XMLHttpRequest.prototype, "open")
          : null;
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      xhrOpenSpy?.mockRestore();
    });

    it("trackEvent fires ZERO network calls (no fetch, no sendBeacon, no XHR)", () => {
      trackEvent("card_click", { entryId: "zodiac.libra", card: "sun" });
      trackEvent("layer_open", { entryId: "zodiac.libra", card: "sun" });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(beaconSpy).not.toHaveBeenCalled();
      if (xhrOpenSpy) expect(xhrOpenSpy).not.toHaveBeenCalled();

      // …and the events still landed in the local sink.
      expect(getEvents()).toHaveLength(2);
    });
  });
});
