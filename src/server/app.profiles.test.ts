import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// --- Supabase stub (in-memory Map as Tabellen-Double) ---
type Row = Record<string, any>;
const store: Map<string, Row[]> = new Map();

function makeBuilder(tableName: string) {
  const filters: Array<{ col: string; val: any }> = [];
  let op = "select";
  let insertData: any = null;
  let updateData: any = null;
  let colStr = "*";
  let withSelect = false;

  const builder: any = {
    select(cols = "*") { colStr = cols; return builder; },
    insert(data: any) { op = "insert"; insertData = Array.isArray(data) ? data[0] : data; return builder; },
    update(data: any) { op = "update"; updateData = data; return builder; },
    delete() { op = "delete"; return builder; },
    eq(col: string, val: any) { filters.push({ col, val }); return builder; },
    order() { return builder; },
    single() {
      withSelect = true;
      return builder._run().then((r: any) => ({ data: r.data?.[0] ?? null, error: r.error }));
    },
    then(resolve: any, reject?: any) {
      return builder._run().then(resolve, reject);
    },
    _run() {
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

// requireUserAuth injects req.userId and calls next() with configurable userId
let activeUserId = "user-A";
vi.mock("./requireUserAuth", () => ({
  requireUserAuth: vi.fn((req: any, _res: any, next: any) => {
    req.userId = activeUserId;
    next();
  }),
}));

import { createApp } from "./app";
const app = createApp();

const VALID_BIRTH = {
  name: "Hannah Arendt",
  birthDate: "1906-10-14",
  birthTime: "21:15",
  placeId: "ChIJxyz",
  birthPlaceLabel: "Linden, Hannover",
  lat: 52.37,
  lon: 9.73,
  tz: "Europe/Berlin",
  gender: "Weiblich",
};

beforeEach(() => {
  store.clear();
  store.set("nb_profiles", []);
  store.set("nb_partner_profiles", []);
  mockSupabaseClient.from.mockImplementation((t: string) => makeBuilder(t));
  activeUserId = "user-A";
});

// UUID fixtures (must pass UUID_RE for DELETE routes)
const UUID_A = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const UUID_B = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const UUID_C = "cccccccc-cccc-4ccc-cccc-cccccccccccc";
const UUID_D = "dddddddd-dddd-4ddd-dddd-dddddddddddd";

// --- nb_profiles ---
describe("GET /api/me/profiles", () => {
  it("gibt leere Liste zurück wenn keine Profile vorhanden", async () => {
    const res = await request(app).get("/api/me/profiles");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("gibt nur eigene Profile zurück (owner filter)", async () => {
    store.set("nb_profiles", [
      { id: UUID_A, user_id: "user-A", label: "Ich", birth_data: {}, is_default: true, updated_at: "2026-01-01" },
      { id: UUID_B, user_id: "user-B", label: "Fremdes", birth_data: {}, is_default: false, updated_at: "2026-01-02" },
    ]);
    const res = await request(app).get("/api/me/profiles");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(UUID_A);
  });
});

describe("POST /api/me/profiles", () => {
  it("400 bei ungültigen Geburtsdaten", async () => {
    const res = await request(app).post("/api/me/profiles").send({ birth_data: { name: "" } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_birth_input");
  });

  it("201 + Profil-Objekt bei gültigen Daten", async () => {
    const res = await request(app)
      .post("/api/me/profiles")
      .send({ label: "Hauptprofil", birth_data: VALID_BIRTH });
    expect(res.status).toBe(201);
    expect(res.body.user_id).toBe("user-A");
    expect(res.body.label).toBe("Hauptprofil");
  });

  it("makeDefault=true setzt vorhandene Profile auf is_default=false", async () => {
    store.set("nb_profiles", [
      { id: UUID_A, user_id: "user-A", label: "Alt-Default", birth_data: {}, is_default: true },
    ]);
    const res = await request(app)
      .post("/api/me/profiles")
      .send({ label: "Neu-Default", birth_data: VALID_BIRTH, makeDefault: true });
    expect(res.status).toBe(201);
    expect(res.body.is_default).toBe(true);
    const existing = (store.get("nb_profiles") ?? []).find((r: Row) => r.id === UUID_A);
    expect(existing?.is_default).toBe(false);
  });
});

describe("DELETE /api/me/profiles/:id", () => {
  it("400 bei ungültiger UUID", async () => {
    const res = await request(app).delete("/api/me/profiles/not-a-uuid");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_id");
  });

  it("204 bei eigenem Profil", async () => {
    store.set("nb_profiles", [
      { id: UUID_A, user_id: "user-A", label: "Ich", birth_data: {} },
    ]);
    const res = await request(app).delete(`/api/me/profiles/${UUID_A}`);
    expect(res.status).toBe(204);
    expect(store.get("nb_profiles")).toHaveLength(0);
  });

  it("User B kann Profil von User A NICHT löschen (owner filter)", async () => {
    store.set("nb_profiles", [
      { id: UUID_A, user_id: "user-A", label: "Ich", birth_data: {} },
    ]);
    activeUserId = "user-B";
    const res = await request(app).delete(`/api/me/profiles/${UUID_A}`);
    expect(res.status).toBe(204);
    // Owner filter: eq('id',UUID_A).eq('user_id','user-B') → kein Match → Profil bleibt
    expect(store.get("nb_profiles")).toHaveLength(1);
  });
});

// --- nb_partner_profiles ---
describe("GET /api/me/partners", () => {
  it("gibt nur eigene Partner-Profile zurück", async () => {
    store.set("nb_partner_profiles", [
      { id: UUID_C, user_id: "user-A", label: "Partner", birth_data: {} },
      { id: UUID_D, user_id: "user-B", label: "Fremd", birth_data: {} },
    ]);
    const res = await request(app).get("/api/me/partners");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(UUID_C);
  });
});

describe("POST /api/me/partners", () => {
  it("400 ohne label", async () => {
    const res = await request(app).post("/api/me/partners").send({ birth_data: VALID_BIRTH });
    expect(res.status).toBe(400);
  });

  it("201 bei gültigen Daten", async () => {
    const res = await request(app)
      .post("/api/me/partners")
      .send({ label: "Maria", birth_data: VALID_BIRTH });
    expect(res.status).toBe(201);
    expect(res.body.user_id).toBe("user-A");
    expect(res.body.label).toBe("Maria");
  });
});

describe("DELETE /api/me/partners/:id", () => {
  it("400 bei ungültiger UUID", async () => {
    const res = await request(app).delete("/api/me/partners/not-a-uuid");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_id");
  });

  it("User B kann Partner von User A NICHT löschen", async () => {
    store.set("nb_partner_profiles", [
      { id: UUID_C, user_id: "user-A", label: "Partner", birth_data: {} },
    ]);
    activeUserId = "user-B";
    const res = await request(app).delete(`/api/me/partners/${UUID_C}`);
    expect(res.status).toBe(204);
    expect(store.get("nb_partner_profiles")).toHaveLength(1);
  });
});
