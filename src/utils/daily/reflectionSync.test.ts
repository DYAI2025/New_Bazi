// reflectionSync — optionaler Abgleich für eingeloggte Nutzer (Etappe 2).
// Verträge: kein Netzwerk ohne Session; Pull gewinnt nur mit neuerem
// updated_at_ms; Push sendet alle lokalen Einträge camelCase; Fehler sind
// still (Konsole) und verhindern den jeweils anderen Schritt nicht.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  clearAllReflections,
  getReflection,
  saveReflection,
} from "./reflectionStore";

const h = vi.hoisted(() => {
  const getSession = vi.fn();
  const state: { supabase: unknown } = { supabase: { auth: { getSession } } };
  return { getSession, state };
});

vi.mock("../../lib/supabaseClient", () => ({
  get supabase() {
    return h.state.supabase;
  },
  supabaseConfigured: true,
}));

import { syncReflections } from "./reflectionSync";

const fetchMock = vi.fn();

function withSession(token = "tok-123") {
  h.getSession.mockResolvedValue({ data: { session: { access_token: token } } });
}

/** Response-artiges Objekt, so viel wie der Sync braucht. */
function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

beforeEach(() => {
  clearAllReflections();
  h.getSession.mockReset();
  h.state.supabase = { auth: { getSession: h.getSession } };
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("syncReflections — kein Netzwerk ohne Login", () => {
  it("supabase nicht konfiguriert (null) → skipped, fetch wird nie gerufen", async () => {
    h.state.supabase = null;
    await expect(syncReflections()).resolves.toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keine Session → skipped, fetch wird nie gerufen", async () => {
    h.getSession.mockResolvedValue({ data: { session: null } });
    await expect(syncReflections()).resolves.toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("syncReflections — Pull-Merge (updatedAt gewinnt)", () => {
  it("Server neuer → überschreibt lokal; lokal neuer → bleibt; lokal fehlend → importiert", async () => {
    withSession();
    saveReflection({ date: "2026-07-01", dayType: "ausdruck", reaction: "teils", encounterChoice: null, vetoChoice: null });
    saveReflection({ date: "2026-07-02", dayType: "struktur", reaction: "kenne_ich", encounterChoice: "Sorgfalt", vetoChoice: null });
    const t1 = getReflection("2026-07-01")!.updatedAt;
    const t2 = getReflection("2026-07-02")!.updatedAt;

    const serverRows = [
      // neuer als lokal → gewinnt
      { date: "2026-07-01", day_type: "ausdruck", reaction: "gegenseite", encounter_choice: null, veto_choice: null, updated_at_ms: t1 + 1000 },
      // älter als lokal → verliert
      { date: "2026-07-02", day_type: "struktur", reaction: "teils", encounter_choice: null, veto_choice: null, updated_at_ms: t2 - 1000 },
      // lokal fehlend → wird importiert
      { date: "2026-06-20", day_type: "einfluss", reaction: "kenne_ich", encounter_choice: "Initiative", veto_choice: "alles zu steuern", updated_at_ms: 1000 },
    ];
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === "PUT" ? jsonResponse(null, true, 204) : jsonResponse(serverRows),
    );

    await expect(syncReflections()).resolves.toBe("synced");

    const r1 = getReflection("2026-07-01")!;
    expect(r1.reaction).toBe("gegenseite");
    expect(r1.updatedAt).toBe(t1 + 1000);

    const r2 = getReflection("2026-07-02")!;
    expect(r2.reaction).toBe("kenne_ich");
    expect(r2.encounterChoice).toBe("Sorgfalt");
    expect(r2.updatedAt).toBe(t2);

    const r3 = getReflection("2026-06-20")!;
    expect(r3.dayType).toBe("einfluss");
    expect(r3.encounterChoice).toBe("Initiative");
    expect(r3.vetoChoice).toBe("alles zu steuern");
    expect(r3.updatedAt).toBe(1000);
  });
});

describe("syncReflections — Push", () => {
  it("sendet alle lokalen Einträge camelCase mit Bearer-Header", async () => {
    withSession("tok-abc");
    saveReflection({ date: "2026-07-01", dayType: "ausdruck", reaction: "teils", encounterChoice: null, vetoChoice: null });
    saveReflection({ date: "2026-07-02", dayType: "struktur", reaction: null, encounterChoice: "Sorgfalt", vetoChoice: "es allen recht zu machen" });

    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === "PUT" ? jsonResponse(null, true, 204) : jsonResponse([]),
    );

    await expect(syncReflections()).resolves.toBe("synced");

    const getCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method !== "PUT")!;
    expect(getCall[0]).toBe("/api/me/reflections");
    expect((getCall[1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer tok-abc" });

    const putCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === "PUT")!;
    expect(putCall[0]).toBe("/api/me/reflections");
    const putInit = putCall[1] as RequestInit;
    expect(putInit.headers).toMatchObject({
      Authorization: "Bearer tok-abc",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(putInit.body as string);
    expect(body.reflections).toHaveLength(2);
    expect(body.reflections[0]).toMatchObject({
      date: "2026-07-01",
      dayType: "ausdruck",
      reaction: "teils",
      encounterChoice: null,
      vetoChoice: null,
    });
    expect(typeof body.reflections[0].updatedAt).toBe("number");
    expect(body.reflections[1]).toMatchObject({
      date: "2026-07-02",
      dayType: "struktur",
      reaction: null,
      encounterChoice: "Sorgfalt",
      vetoChoice: "es allen recht zu machen",
    });
  });

  it("leerer lokaler Store → Push wird übersprungen (nur GET)", async () => {
    withSession();
    fetchMock.mockResolvedValue(jsonResponse([]));
    await expect(syncReflections()).resolves.toBe("synced");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0][1] as RequestInit | undefined)?.method).not.toBe("PUT");
  });
});

describe("syncReflections — Fehler sind still und blockieren einander nicht", () => {
  it("GET scheitert → error, Push läuft trotzdem", async () => {
    withSession();
    saveReflection({ date: "2026-07-01", dayType: "ausdruck", reaction: "teils", encounterChoice: null, vetoChoice: null });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") return jsonResponse(null, true, 204);
      throw new Error("network down");
    });

    await expect(syncReflections()).resolves.toBe("error");
    const putCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === "PUT");
    expect(putCall).toBeDefined();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("PUT scheitert (non-ok) → error, Pull-Ergebnis bleibt importiert", async () => {
    withSession();
    saveReflection({ date: "2026-07-01", dayType: "ausdruck", reaction: "teils", encounterChoice: null, vetoChoice: null });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === "PUT"
        ? jsonResponse({ error: "db_error" }, false, 502)
        : jsonResponse([
            { date: "2026-06-20", day_type: "einfluss", reaction: "kenne_ich", encounter_choice: null, veto_choice: null, updated_at_ms: 1000 },
          ]),
    );

    await expect(syncReflections()).resolves.toBe("error");
    expect(getReflection("2026-06-20")?.dayType).toBe("einfluss");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
