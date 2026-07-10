import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// --- Supabase stub (in-memory Map als Tabellen-Double; wie app.profiles.test.ts,
//     erweitert um upsert + Fehler-Injektion) ---
type Row = Record<string, any>;
const store: Map<string, Row[]> = new Map();

// Fehler-Injektion: wenn gesetzt, liefert jeder Builder-Lauf { data: null, error }
let injectError: { message: string } | null = null;

// Aufzeichnung des letzten upsert-Aufrufs (Rows + Optionen) für Assertions
let lastUpsert: { table: string; rows: Row[]; options: any } | null = null;
// Aufzeichnung aller eq-Filter des letzten Builders pro Tabelle
let lastEqFilters: Array<{ table: string; col: string; val: any }> = [];

function makeBuilder(tableName: string) {
  const filters: Array<{ col: string; val: any }> = [];
  let op = "select";
  let insertData: any = null;
  let updateData: any = null;
  let upsertRows: Row[] = [];
  let upsertOptions: any = null;

  const builder: any = {
    select() { return builder; },
    insert(data: any) { op = "insert"; insertData = Array.isArray(data) ? data[0] : data; return builder; },
    update(data: any) { op = "update"; updateData = data; return builder; },
    upsert(data: any, options?: any) {
      op = "upsert";
      upsertRows = Array.isArray(data) ? data : [data];
      upsertOptions = options ?? null;
      lastUpsert = { table: tableName, rows: upsertRows, options: upsertOptions };
      return builder;
    },
    delete() { op = "delete"; return builder; },
    eq(col: string, val: any) {
      filters.push({ col, val });
      lastEqFilters.push({ table: tableName, col, val });
      return builder;
    },
    order() { return builder; },
    single() {
      return builder._run().then((r: any) => ({ data: r.data?.[0] ?? null, error: r.error }));
    },
    then(resolve: any, reject?: any) {
      return builder._run().then(resolve, reject);
    },
    _run() {
      if (injectError) {
        return Promise.resolve({ data: null, error: injectError });
      }
      const rows = store.get(tableName) ?? [];
      const matches = (row: Row) => filters.every(f => row[f.col] === f.val);
      if (op === "select") {
        return Promise.resolve({ data: rows.filter(matches), error: null });
      }
      if (op === "insert") {
        const row = { id: `id-${rows.length + 1}`, ...insertData };
        rows.push(row);
        store.set(tableName, rows);
        return Promise.resolve({ data: [row], error: null });
      }
      if (op === "upsert") {
        const conflictCols: string[] = (upsertOptions?.onConflict ?? "").split(",").map((c: string) => c.trim()).filter(Boolean);
        for (const incoming of upsertRows) {
          const existing = rows.find(r => conflictCols.length > 0 && conflictCols.every(c => r[c] === incoming[c]));
          if (existing) Object.assign(existing, incoming);
          else rows.push({ id: `id-${rows.length + 1}`, ...incoming });
        }
        store.set(tableName, rows);
        return Promise.resolve({ data: null, error: null });
      }
      if (op === "update") {
        rows.filter(matches).forEach(r => Object.assign(r, updateData));
        return Promise.resolve({ data: null, error: null });
      }
      if (op === "delete") {
        store.set(tableName, rows.filter(r => !matches(r)));
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
  };
  return builder;
}

const mockSupabaseClient = { from: vi.fn((t: string) => makeBuilder(t)) };

vi.mock("./supabase", () => ({
  isSupabaseConfigured: () => true,
  getServerSupabase: () => mockSupabaseClient,
}));

// requireUserAuth-Mock mit 401-Standardverhalten ohne Bearer-Token
// (Muster aus requireUserAuth.ts: kein "Bearer " → 401 AUTH_REQUIRED)
let activeUserId = "user-A";
vi.mock("./requireUserAuth", () => ({
  requireUserAuth: vi.fn((req: any, res: any, next: any) => {
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      res.status(401).json({ error: "AUTH_REQUIRED", message: "Anmeldung erforderlich." });
      return;
    }
    req.userId = activeUserId;
    next();
  }),
}));

import { createApp } from "./app";
const app = createApp();

const AUTH = ["Authorization", "Bearer test-token"] as const;

function validReflection(overrides: Row = {}): Row {
  return {
    date: "2026-07-10",
    dayType: "ressource",
    reaction: "kenne_ich",
    encounterChoice: "pause",
    vetoChoice: null,
    updatedAt: 1760000000000,
    ...overrides,
  };
}

beforeEach(() => {
  store.clear();
  store.set("nb_daily_reflections", []);
  mockSupabaseClient.from.mockClear();
  mockSupabaseClient.from.mockImplementation((t: string) => makeBuilder(t));
  activeUserId = "user-A";
  injectError = null;
  lastUpsert = null;
  lastEqFilters = [];
});

// --- GET /api/me/reflections ---
describe("GET /api/me/reflections", () => {
  it("401 ohne Token (requireUserAuth)", async () => {
    const res = await request(app).get("/api/me/reflections");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("AUTH_REQUIRED");
  });

  it("gibt nur eigene Reflexionen zurück (expliziter user_id-Filter)", async () => {
    store.set("nb_daily_reflections", [
      { id: "r1", user_id: "user-A", date: "2026-07-09", day_type: "ressource", reaction: "teils", encounter_choice: null, veto_choice: null, updated_at_ms: 1 },
      { id: "r2", user_id: "user-B", date: "2026-07-09", day_type: "ausdruck", reaction: null, encounter_choice: null, veto_choice: null, updated_at_ms: 2 },
    ]);
    const res = await request(app).get("/api/me/reflections").set(...AUTH);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].date).toBe("2026-07-09");
    expect(res.body[0].day_type).toBe("ressource");
    // Service-Role bypasst RLS → Query MUSS from("nb_daily_reflections") + eq("user_id", ...) tragen
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("nb_daily_reflections");
    expect(lastEqFilters).toContainEqual({ table: "nb_daily_reflections", col: "user_id", val: "user-A" });
  });

  it("502 db_error bei Supabase-Fehler", async () => {
    injectError = { message: "boom" };
    const res = await request(app).get("/api/me/reflections").set(...AUTH);
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("db_error");
  });
});

// --- PUT /api/me/reflections ---
describe("PUT /api/me/reflections", () => {
  it("401 ohne Token", async () => {
    const res = await request(app).put("/api/me/reflections").send({ reflections: [validReflection()] });
    expect(res.status).toBe(401);
  });

  it("400 bei fehlendem reflections-Feld", async () => {
    const res = await request(app).put("/api/me/reflections").set(...AUTH).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_input");
  });

  it("400 bei leerem Array", async () => {
    const res = await request(app).put("/api/me/reflections").set(...AUTH).send({ reflections: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_input");
  });

  it("400 bei mehr als 400 Einträgen", async () => {
    const reflections = Array.from({ length: 401 }, (_, i) =>
      validReflection({ date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}` }));
    const res = await request(app).put("/api/me/reflections").set(...AUTH).send({ reflections });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_input");
  });

  it("400 bei falschem date-Format", async () => {
    const res = await request(app).put("/api/me/reflections").set(...AUTH)
      .send({ reflections: [validReflection({ date: "10.07.2026" })] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_input");
    expect(res.body.message).toContain("YYYY-MM-DD");
  });

  it("400 bei unbekanntem dayType", async () => {
    const res = await request(app).put("/api/me/reflections").set(...AUTH)
      .send({ reflections: [validReflection({ dayType: "chaos" })] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_input");
    expect(res.body.message).toContain("dayType");
  });

  it("400 bei unbekannter reaction", async () => {
    const res = await request(app).put("/api/me/reflections").set(...AUTH)
      .send({ reflections: [validReflection({ reaction: "super" })] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_input");
    expect(res.body.message).toContain("reaction");
  });

  it("204 happy path: upsert mit onConflict user_id,date + user_id in jeder Row", async () => {
    const res = await request(app).put("/api/me/reflections").set(...AUTH).send({
      reflections: [
        validReflection({ date: "2026-07-09", dayType: "struktur", reaction: null }),
        validReflection({ date: "2026-07-10", dayType: "gleichrang", reaction: "gegenseite", vetoChoice: "spaeter" }),
      ],
    });
    expect(res.status).toBe(204);
    expect(lastUpsert).not.toBeNull();
    expect(lastUpsert!.table).toBe("nb_daily_reflections");
    expect(lastUpsert!.options).toEqual({ onConflict: "user_id,date" });
    expect(lastUpsert!.rows).toHaveLength(2);
    // PROJEKTREGEL: Service-Role bypasst RLS → user_id MUSS in JEDER Row stecken
    for (const row of lastUpsert!.rows) {
      expect(row.user_id).toBe("user-A");
    }
    expect(lastUpsert!.rows[0]).toMatchObject({
      date: "2026-07-09", day_type: "struktur", reaction: null, updated_at_ms: 1760000000000,
    });
    expect(lastUpsert!.rows[1]).toMatchObject({
      date: "2026-07-10", day_type: "gleichrang", reaction: "gegenseite", veto_choice: "spaeter",
    });
  });

  it("kürzt encounterChoice/vetoChoice auf 120 Zeichen", async () => {
    const long = "x".repeat(200);
    const res = await request(app).put("/api/me/reflections").set(...AUTH)
      .send({ reflections: [validReflection({ encounterChoice: long, vetoChoice: long })] });
    expect(res.status).toBe(204);
    expect(lastUpsert!.rows[0].encounter_choice).toBe("x".repeat(120));
    expect(lastUpsert!.rows[0].veto_choice).toBe("x".repeat(120));
  });

  it("nicht-string encounterChoice/vetoChoice und fehlende reaction werden zu null; updatedAt-Fallback", async () => {
    const res = await request(app).put("/api/me/reflections").set(...AUTH)
      .send({ reflections: [{ date: "2026-07-10", dayType: "einfluss", encounterChoice: 42, vetoChoice: { a: 1 } }] });
    expect(res.status).toBe(204);
    const row = lastUpsert!.rows[0];
    expect(row.reaction).toBeNull();
    expect(row.encounter_choice).toBeNull();
    expect(row.veto_choice).toBeNull();
    expect(typeof row.updated_at_ms).toBe("number");
    expect(Number.isFinite(row.updated_at_ms)).toBe(true);
  });

  it("502 db_error bei Supabase-Fehler", async () => {
    injectError = { message: "boom" };
    const res = await request(app).put("/api/me/reflections").set(...AUTH)
      .send({ reflections: [validReflection()] });
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("db_error");
  });
});

// --- DELETE /api/me/reflections ---
describe("DELETE /api/me/reflections", () => {
  it("401 ohne Token", async () => {
    const res = await request(app).delete("/api/me/reflections");
    expect(res.status).toBe(401);
  });

  it("204: löscht nur eigene Zeilen (expliziter user_id-Filter)", async () => {
    store.set("nb_daily_reflections", [
      { id: "r1", user_id: "user-A", date: "2026-07-09", day_type: "ressource", updated_at_ms: 1 },
      { id: "r2", user_id: "user-B", date: "2026-07-09", day_type: "ausdruck", updated_at_ms: 2 },
    ]);
    const res = await request(app).delete("/api/me/reflections").set(...AUTH);
    expect(res.status).toBe(204);
    const remaining = store.get("nb_daily_reflections")!;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].user_id).toBe("user-B");
    expect(lastEqFilters).toContainEqual({ table: "nb_daily_reflections", col: "user_id", val: "user-A" });
  });

  it("502 db_error bei Supabase-Fehler", async () => {
    injectError = { message: "boom" };
    const res = await request(app).delete("/api/me/reflections").set(...AUTH);
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("db_error");
  });
});
