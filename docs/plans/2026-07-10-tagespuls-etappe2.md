# Tagespuls 2.0 — Etappe 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wochenbogen (Muster-Spiegel-Payoff), Sektor-Taxonomie mit echtem `/v1/transit/now`, Dayun-Fix (Stub → echter Endpunkt) und Supabase-Sync der Tages-Reflexionen — auf dem Fundament von Etappe 1 (PR #57).

**Architecture:** Vier unabhängige Arbeitspakete auf einem Branch `feat/tagespuls-etappe2`, jedes einzeln committet und testbar. BFF bleibt einzige FuFirE-Kontaktstelle (X-API-Key nie im Browser). Persistenz bleibt localStorage-first; Supabase ist Sync-Layer für eingeloggte Nutzer (updatedAt-wins-Merge). Alle neuen Nutzer-Texte laufen durch die bestehenden Wording-Gates (Beobachtung, nie Urteil; ehrliche Missing-States).

**Tech Stack:** Express-BFF (`src/server/app.ts`), FuFirEClient (`src/utils/fufireClient.ts`, Auth via X-API-Key ist dort bereits implementiert), React 19 + Vitest, Supabase (Service-Role serverseitig + RLS, anon-Client im Browser), localStorage-Store aus Etappe 1.

**Live-verifizierte Fakten (10.07.2026, gegen api.fufire.space — NICHT raten, diese Shapes sind real):**

- `GET /v1/transit/now` → 200:
  `{ computed_at, planets: { sun|moon|mercury|venus|mars|jupiter|saturn|…: { longitude, sector, sign, speed } } }`
  **Sektoren sind 0-indiziert** (saturn: sector 0 beobachtet). Für die UI auf 1–12 normalisieren.
- `POST /v1/calculate/bazi/dayun` → 200 mit Request
  `{ "date": "1985-06-15T14:30", "tz": "Europe/Berlin", "lat": 52.52, "lon": 13.405, "sex_at_birth": "male"|"female", "direction_method": "year_stem_yinyang_and_sex" }`
  Response: `dayun.{ display_label_de, direction, start.start_age.decimal_years, cycles[8], current }`, jeder Cycle:
  `{ sequence, age_start, age_end, date_start, date_end, pillar: { stem, branch, stem_cn, branch_cn, element, polarity }, relation_to_day_master: { day_master, ten_god, label_de }, is_current }`
  (`label_de` z. B. "Druck / Struktur" — deckungsgleich mit unserem Tagestyp-Vokabular.)
  Ohne `sex_at_birth` → 422 `direction_basis_missing`. **Konsequenz:** Geschlecht "Divers"/unbekannt ⇒ ehrlicher Missing-State (keine erfundene Laufrichtung).

**Bestehende Muster, die du kopierst (nicht neu erfinden):**

- FuFirE-Methode hinzufügen: `src/utils/fufireClient.ts` — statische Methoden ~Zeile 201–245, alle rufen `request(...)`.
- Payload-Mapper: `src/utils/fufirePayloadMappers.ts` — `buildBaziPayload` nutzt `localIsoDatetime(input)` (liefert exakt `"YYYY-MM-DDTHH:mm"`).
- Auth-geschützte BFF-Route: `src/server/app.ts` — `/api/me/profiles`-Block (requireUserAuth, `getServerSupabase()!`, expliziter `.eq("user_id", req.userId!)`-Filter, `sendError` bei DB-Fehler).
- Browser-Auth-Header: `src/components/AccountMenu.tsx:50-54` — `supabase.auth.getSession()` → `Authorization: Bearer ${access_token}`.
- Migration-Vorlage: `supabase/migrations/20260612_p3_foundation.sql` (RLS-Muster dort abschauen).
- Server-Tests: `src/server/app.test.ts` — FuFirEClient ist gemockt; `clearBootstrapCache()` läuft im beforeEach.
- Wording-Gate für daily/: `src/components/daily/TagespulsV2.test.tsx` unterer describe-Block (FORBIDDEN/ESO/VERDICT-Regexe) — **jede neue Datei unter daily/ dort in `FILES` eintragen.**

**Setup (einmal, vor Task 1):**

```bash
cd /Users/benjaminpoersch/Projects/New_Bazi
git checkout main && git pull
git checkout -b feat/tagespuls-etappe2
npx vitest run   # muss 712+ grün sein, sonst STOP
```

---

## Paket A — Dayun-Fix (der Stub lügt: "nicht berechenbar" ist falsch)

### Task A1: FuFirEClient.postBaziDayun

**Files:**
- Modify: `src/utils/fufireClient.ts` (bei den anderen `post*`-Methoden, ~Zeile 234)
- Test: `src/utils/fufireClient.test.ts` (existiert; Muster der anderen post-Tests kopieren — wenn keine Datei existiert, Test in A2 über den Mapper abdecken und diesen Teststep überspringen)

**Step 1: Methode ergänzen** (Signatur-Muster von `postTst` direkt darüber kopieren)

```ts
  static postBaziDayun(payload: DayunRequestPayload): Promise<any> {
    return request("POST", "/calculate/bazi/dayun", payload);
  }
```

Typ in `src/utils/fufirePayloadMappers.ts` (bei den anderen Request-Payload-Interfaces):

```ts
export interface DayunRequestPayload {
  date: string; // "YYYY-MM-DDTHH:mm" lokale Geburtszeit
  tz: string;
  lat: number;
  lon: number;
  sex_at_birth: "male" | "female";
  direction_method: "year_stem_yinyang_and_sex";
}
```

**Step 2: Typecheck**

Run: `npx tsc --noEmit` → sauber.

**Step 3: Commit**

```bash
git add src/utils/fufireClient.ts src/utils/fufirePayloadMappers.ts
git commit -m "feat(dayun): FuFirEClient.postBaziDayun + Request-Typ (live-verifiziertes Schema)"
```

### Task A2: buildDayunPayload-Mapper (TDD)

**Files:**
- Modify: `src/utils/fufirePayloadMappers.ts`
- Test: `src/utils/fufirePayloadMappers.test.ts` (existiert — dort anhängen)

**Step 1: Failing Test schreiben**

```ts
describe("buildDayunPayload", () => {
  const base = {
    name: "X", birthDate: "1985-06-15", birthTime: "14:30",
    placeId: "p", birthPlaceLabel: "Berlin", lat: 52.52, lon: 13.405,
    tz: "Europe/Berlin", gender: "Männlich", timeKnown: true,
  } as ValidatedBirthInput;

  it("baut das live-verifizierte Dayun-Schema (sex_at_birth aus Gender)", () => {
    expect(buildDayunPayload(base)).toEqual({
      date: "1985-06-15T14:30",
      tz: "Europe/Berlin",
      lat: 52.52,
      lon: 13.405,
      sex_at_birth: "male",
      direction_method: "year_stem_yinyang_and_sex",
    });
    expect(buildDayunPayload({ ...base, gender: "Weiblich" })!.sex_at_birth).toBe("female");
  });

  it("gibt für Divers/unbekannt ehrlich null zurück (Laufrichtung nicht ableitbar, 422 upstream)", () => {
    expect(buildDayunPayload({ ...base, gender: "Divers" })).toBeNull();
    expect(buildDayunPayload({ ...base, gender: "" })).toBeNull();
  });
});
```

**Step 2:** `npx vitest run src/utils/fufirePayloadMappers.test.ts` → FAIL (`buildDayunPayload is not defined`).

**Step 3: Implementieren**

```ts
/**
 * Dayun braucht sex_at_birth für die Laufrichtung (direction_method
 * year_stem_yinyang_and_sex; ohne → 422 direction_basis_missing, live
 * verifiziert 2026-07-10). "Divers"/unbekannt ⇒ null — die Route liefert
 * dann einen ehrlichen Missing-State statt einer erfundenen Richtung.
 */
export function buildDayunPayload(input: ValidatedBirthInput): DayunRequestPayload | null {
  const g = (input.gender || "").toLowerCase();
  const sex = g === "männlich" || g === "male" ? "male"
    : g === "weiblich" || g === "female" ? "female"
    : null;
  if (!sex) return null;
  return {
    date: localIsoDatetime(input),
    tz: input.tz,
    lat: input.lat,
    lon: input.lon,
    sex_at_birth: sex,
    direction_method: "year_stem_yinyang_and_sex",
  };
}
```

**Step 4:** Test → PASS. **Step 5:** Commit `feat(dayun): buildDayunPayload mit ehrlichem Divers-Missing`.

### Task A3: Route ersetzt den falschen Stub (TDD)

**Files:**
- Modify: `src/server/app.ts` (Block `/api/azodiac/bazi/dayun`, ~Zeile 600 — der Stub mit "Da Yun ist nicht berechenbar")
- Test: `src/server/app.test.ts`

**Step 1: Failing Tests** (im Daily/Detail-Bereich von app.test.ts; `VALID_BODY` existiert dort)

```ts
describe("POST /api/azodiac/bazi/dayun", () => {
  it("ruft den echten Dayun-Endpunkt und liefert normalisierte Zyklen mit label_de", async () => {
    (FuFirEClient.postBaziDayun as any).mockResolvedValue({
      dayun: {
        display_label_de: "Dekaden-Säule", direction: "backward",
        start: { start_age: { decimal_years: 3.26 } },
        cycles: [{
          sequence: 1, age_start: 3.26, age_end: 13.26,
          date_start: "1988-08-31", date_end: "1998-07-10",
          pillar: { stem: "Xin", branch: "Si", stem_cn: "辛", branch_cn: "巳", element: "metal", polarity: "yin" },
          relation_to_day_master: { ten_god: "Qi Sha", label_de: "Druck / Struktur" },
          is_current: false,
        }],
      },
    });
    const res = await request(app).post("/api/azodiac/bazi/dayun").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.source).toBe("fufire");
    expect(res.body.cycles[0]).toMatchObject({
      ageLabel: "3–13", stem: "Xin", stemHanzi: "辛", branch: "Si", branchHanzi: "巳",
      element: "metal", tenGodDe: "Druck / Struktur", isCurrent: false,
      dateStart: "1988-08-31",
    });
  });

  it("liefert ehrlichen Missing-State bei Gender ohne sex_at_birth-Ableitung", async () => {
    const res = await request(app).post("/api/azodiac/bazi/dayun").send({ ...VALID_BODY, gender: "Divers" });
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
    expect(res.body.status).toBe("missing-direction-basis");
    expect(FuFirEClient.postBaziDayun).not.toHaveBeenCalled();
  });

  it("validiert die Geburtsdaten wie alle anderen Routen", async () => {
    const res = await request(app).post("/api/azodiac/bazi/dayun").send({ name: "x" });
    expect(res.status).toBe(400);
  });
});
```

Achtung: der FuFirEClient-Mock oben in app.test.ts (vi.mock-Block) braucht `postBaziDayun: vi.fn()` zusätzlich.

**Step 2:** Run → FAIL (Stub antwortet mit altem Shape). **Step 3: Route ersetzen**

```ts
  // --- Dayun: echter FuFirE-Endpunkt (der frühere "nicht berechenbar"-Stub war faktisch falsch) ---

  app.post("/api/azodiac/bazi/dayun", async (req, res) => {
    const { valid, errors, value } = validateBirthInput(req.body || {});
    if (!valid || !value) {
      logInvalidBirthInput(req.path, errors);
      res.status(400).json({ error: "invalid_birth_input", fields: errors });
      return;
    }
    const payload = buildDayunPayload(value);
    if (!payload) {
      // Ehrlich: ohne sex_at_birth keine Laufrichtung (Engine: 422 direction_basis_missing).
      res.json({
        available: false,
        status: "missing-direction-basis",
        source: "missing",
        message: "Die Dekaden-Laufrichtung ist ohne Geburtsgeschlecht nicht ableitbar — es wird bewusst keine Richtung erfunden.",
        cycles: []
      });
      return;
    }
    try {
      const resp = await FuFirEClient.postBaziDayun(payload);
      const d = resp?.dayun && typeof resp.dayun === "object" ? resp.dayun : null;
      const cyclesRaw = Array.isArray(d?.cycles) ? d.cycles : [];
      const cycles = cyclesRaw
        .filter((c: any) => c && c.pillar && typeof c.pillar === "object")
        .map((c: any) => ({
          sequence: typeof c.sequence === "number" ? c.sequence : null,
          ageLabel: Number.isFinite(c.age_start) && Number.isFinite(c.age_end)
            ? `${Math.round(c.age_start)}–${Math.round(c.age_end)}`
            : null,
          dateStart: dailyText(c.date_start),
          dateEnd: dailyText(c.date_end),
          stem: dailyText(c.pillar.stem),
          stemHanzi: dailyText(c.pillar.stem_cn),
          branch: dailyText(c.pillar.branch),
          branchHanzi: dailyText(c.pillar.branch_cn),
          element: dailyText(c.pillar.element),
          polarity: dailyText(c.pillar.polarity),
          tenGodDe: dailyText(c.relation_to_day_master?.label_de),
          isCurrent: Boolean(c.is_current)
        }));
      if (!d || cycles.length === 0) {
        res.json({ available: false, status: "missing", source: "missing", message: "FuFirE lieferte keine auswertbaren Dekaden-Zyklen.", cycles: [] });
        return;
      }
      res.json({
        available: true,
        source: "fufire",
        labelDe: dailyText(d.display_label_de) || "Dekaden-Säule",
        direction: dailyText(d.direction),
        startAgeYears: Number.isFinite(d.start?.start_age?.decimal_years) ? d.start.start_age.decimal_years : null,
        cycles
      });
    } catch (err) {
      sendError(res, err);
    }
  });
```

Import ergänzen: `buildDayunPayload` in den bestehenden fufirePayloadMappers-Import.

**Step 4:** Tests → PASS. Volle Suite: `npx vitest run` → grün. **Step 5:** Commit `fix(dayun): Stub durch echten /v1/calculate/bazi/dayun ersetzt — Ten-Gods mit label_de`.

### Task A4: Client + BaZiDetail rendert echte Dekaden

**Files:**
- Modify: `src/api/bazodiacClient.ts` (neuer `fetchDayun` + `DayunResponse`-Typ; Muster: `fetchDailyPulse`)
- Modify: `src/components/BaZiDetail.tsx:86,345-382` (lädt on-mount die Route; `viewModel.bazi.dayun` bleibt Fallback bis geladen)
- Test: `src/components/BaZiDetail.dayun.test.tsx` (neu)

**Step 1: Failing Component-Test** (Muster: `TagespulsV2.test.tsx` — vi.mock auf bazodiacClient, createRoot+act; Fixture = A3-Response-Shape mit `available:true`)

Assertions:
- `available:true` → Zyklen-Liste rendert `ageLabel`, `Xin 辛`, `Druck / Struktur`-Chip, `is_current`-Highlight (`data-testid="dayun-current"`).
- Fetch-Fehler → bestehender Missing-Block bleibt (kein Crash, keine erfundenen Zyklen).
- `available:false` + `status:"missing-direction-basis"` → Message sichtbar.

**Step 2:** FAIL. **Step 3: Implementieren**

`bazodiacClient.ts`:

```ts
export interface DayunCycle {
  sequence: number | null; ageLabel: string | null;
  dateStart: string | null; dateEnd: string | null;
  stem: string | null; stemHanzi: string | null;
  branch: string | null; branchHanzi: string | null;
  element: string | null; polarity: string | null;
  tenGodDe: string | null; isCurrent: boolean;
}
export interface DayunResponse {
  available: boolean; source: string; status?: string; message?: string;
  labelDe?: string; direction?: string | null; startAgeYears?: number | null;
  cycles: DayunCycle[];
}
// in BazodiacClient:
  static async fetchDayun(data: BirthData): Promise<DayunResponse> {
    return requestJson("/api/azodiac/bazi/dayun", toBirthInputPayload(data));
  }
```

(`requestJson`/POST-Muster exakt von `fetchDailyPulse` übernehmen — gleiche Fehlerklassen.)

`BaZiDetail.tsx`: `birthData`-Prop prüfen (hat die Komponente sie? Falls nein: von App.tsx durchreichen wie bei DailyPulse — App.tsx:139 `<BaZiDetail viewModel={viewModel} />` um `birthData={birthData}` ergänzen). useEffect lädt `fetchDayun` einmal, State `dayunLive: DayunResponse | null`; Render-Block 351ff nutzt `dayunLive ?? viewModel.bazi.dayun`-Logik: bei `dayunLive.available` neue Liste (ageLabel + Stem/Hanzi + Element-Style wie bisher + tenGodDe-Chip + isCurrent-Rahmen), sonst bestehender Missing-Block mit `status/message` aus der Live-Antwort.

**Step 4:** Tests + `npx vitest run` grün. **Step 5:** Commit `feat(dayun): BaZiDetail lädt echte Dekaden-Zyklen (label_de, is_current)`.

---

## Paket B — Sektor-Taxonomie + /v1/transit/now

> **PO-Vorentscheidung eingebaut:** Die 12 Lebensbereich-Labels unten sind ein VORSCHLAG
> (klassische Häuser-Semantik, deutsch, wertfrei). Vor dem Merge vom User bestätigen lassen —
> im PR explizit als Frage markieren.

### Task B1: sectorLabels.ts (TDD)

**Files:**
- Create: `src/utils/daily/sectorLabels.ts`
- Test: `src/utils/daily/sectorLabels.test.ts`
- Modify: `src/components/daily/TagespulsV2.test.tsx` (neue Datei in `FILES` des Wording-Gates eintragen)

**Step 1: Failing Test**

```ts
import { describe, it, expect } from "vitest";
import { sectorLabel, SECTOR_LABELS } from "./sectorLabels";

describe("sectorLabels — 12 Lebensbereiche (0-indizierte Engine-Sektoren)", () => {
  it("kennt genau 12 Labels", () => {
    expect(SECTOR_LABELS).toHaveLength(12);
    expect(new Set(SECTOR_LABELS).size).toBe(12);
  });
  it("normalisiert 0-Index auf 1–12 (live verifiziert: saturn sector 0)", () => {
    expect(sectorLabel(0)).toBe("1 · Selbst & Auftreten");
    expect(sectorLabel(4)).toBe("5 · Ausdruck & Kreativität");
    expect(sectorLabel(11)).toBe("12 · Rückzug & Inneres");
  });
  it("gibt für unbekannte Indizes ehrlich null zurück", () => {
    expect(sectorLabel(12)).toBeNull();
    expect(sectorLabel(-1)).toBeNull();
    expect(sectorLabel(null)).toBeNull();
  });
});
```

**Step 2:** FAIL. **Step 3: Implementieren**

```ts
/**
 * sectorLabels — die 12 Lebensbereich-Labels für Transit-Sektoren.
 *
 * Die Engine liefert Sektoren 0-INDIZIERT (live verifiziert 2026-07-10:
 * /v1/transit/now, saturn sector 0). Hier wird auf 1–12 normalisiert und
 * NUR gerendert, was in dieser Tabelle steht — unbekannt → null.
 *
 * VORSCHLAG (PO-Bestätigung offen): klassische Häuser-Semantik, wertfrei.
 */
export const SECTOR_LABELS: string[] = [
  "Selbst & Auftreten",
  "Besitz & Sicherheit",
  "Kommunikation & nahes Umfeld",
  "Familie & Wurzeln",
  "Ausdruck & Kreativität",
  "Alltag & Gesundheit",
  "Beziehungen & Gegenüber",
  "Wandel & Bindungstiefe",
  "Horizont & Sinn",
  "Beruf & Öffentlichkeit",
  "Freundeskreis & Zukunft",
  "Rückzug & Inneres",
];

export function sectorLabel(zeroBased: number | null | undefined): string | null {
  if (zeroBased === null || zeroBased === undefined) return null;
  if (!Number.isInteger(zeroBased) || zeroBased < 0 || zeroBased > 11) return null;
  return `${zeroBased + 1} · ${SECTOR_LABELS[zeroBased]}`;
}
```

Achtung Test oben: Erwartung an Index 4 = "5 · Ausdruck & Kreativität" — Tabelle und Test müssen zusammenpassen ("Alltag & Gesundheit" ist Index 5). Test zuerst laufen lassen, nicht blind kopieren.

**Step 4:** PASS. **Step 5:** Wording-Gate-`FILES` erweitern, `npx vitest run src/components/daily src/utils/daily` grün. Commit `feat(sektoren): 12 Lebensbereich-Labels + 0/1-Index-Normalisierung (PO-Vorschlag)`.

### Task B2: FuFirEClient.getTransitNow + BFF-Route mit Cache (TDD)

**Files:**
- Modify: `src/utils/fufireClient.ts` (`static getTransitNow(): Promise<any> { return request("GET", "/transit/now"); }` — Muster `getWuxingMapping`)
- Modify: `src/server/app.ts`
- Test: `src/server/app.test.ts` (+ `getTransitNow: vi.fn()` in den Mock-Block)

**Step 1: Failing Tests**

```ts
describe("GET /api/azodiac/transit/now", () => {
  it("liefert Planeten mit rohem 0-Index-Sektor durch (Labeling ist Client-Sache)", async () => {
    (FuFirEClient.getTransitNow as any).mockResolvedValue({
      computed_at: "2026-07-10T18:17:09Z",
      planets: { sun: { longitude: 108.5, sector: 3, sign: "cancer", speed: 0.95 } },
    });
    const res = await request(app).get("/api/azodiac/transit/now");
    expect(res.status).toBe(200);
    expect(res.body.planets.sun).toEqual({ longitude: 108.5, sector: 3, sign: "cancer", speed: 0.95 });
    expect(res.body.computedAt).toBe("2026-07-10T18:17:09Z");
  });

  it("cached 10 Minuten (zweiter Call ohne zweiten Upstream-Call)", async () => {
    (FuFirEClient.getTransitNow as any).mockResolvedValue({ computed_at: "t", planets: {} });
    await request(app).get("/api/azodiac/transit/now");
    await request(app).get("/api/azodiac/transit/now");
    expect(FuFirEClient.getTransitNow).toHaveBeenCalledTimes(1);
  });
});
```

Cache-Reset für Tests: analog `clearBootstrapCache` einen `clearTransitCache()`-Export bauen und im beforeEach von app.test.ts aufrufen.

**Step 2:** FAIL. **Step 3: Route implementieren** (bei den anderen azodiac-Routen)

```ts
// --- Transit-Now: globaler Himmel (nicht profilspezifisch) — 10-min-Cache ---
const TRANSIT_TTL_MS = 10 * 60 * 1000;
let transitCache: { at: number; data: unknown } | null = null;
export function clearTransitCache(): void { transitCache = null; }

app.get("/api/azodiac/transit/now", async (_req, res) => {
  if (transitCache && Date.now() - transitCache.at < TRANSIT_TTL_MS) {
    res.json(transitCache.data);
    return;
  }
  try {
    const raw: any = await FuFirEClient.getTransitNow();
    const planets = raw?.planets && typeof raw.planets === "object" ? raw.planets : null;
    const vm = { computedAt: dailyText(raw?.computed_at), planets: planets ?? {} };
    transitCache = { at: Date.now(), data: vm };
    res.json(vm);
  } catch (err) {
    sendError(res, err);
  }
});
```

(Hinweis: `clearTransitCache` muss auf Modulebene exportiert werden, nicht in `createApp` — gleiche Stelle wie `clearBootstrapCache`. `transitCache`-Variable ebenfalls Modulebene.)

**Step 4:** PASS + volle Suite. **Step 5:** Commit `feat(transit): GET /api/azodiac/transit/now mit 10-min-Cache`.

### Task B3: Transit-Verortung in der West-Karte (TagespulsV2)

**Files:**
- Modify: `src/components/daily/TagespulsV2.tsx` (West-Karte)
- Modify: `src/api/bazodiacClient.ts` (`fetchTransitNow(): Promise<TransitNowResponse>` — GET-Variante, Muster fetch-Aufrufe dort)
- Test: `src/components/daily/TagespulsV2.test.tsx`

**Verhalten:** Die West-Karte zeigt zusätzlich eine Verortungszeile aus `westEvidence.transitSectors` (Etappe-1-Daten, KEIN neuer Fetch nötig für die Sektor-Labels selbst): `transitSectors.map(sectorLabel)` — nur nicht-null rendern. Optional-Zeile aus transit/now (Sonne/Mond-Position heute) NUR wenn der Fetch gelingt; Fehler → Zeile fehlt, kein Error-Banner (Zusatzinfo, kein Kernpfad).

**Step 1: Failing Test** (im bestehenden TagespulsV2-describe; fetchTransitNow zusätzlich mocken)

```ts
it("verortet die West-Sektoren mit Lebensbereich-Labels (0-Index normalisiert)", async () => {
  await render(vmFixture()); // westEvidence.transitSectors: [2, 0]
  const loc = q('[data-testid="daily-west-sectors"]');
  expect(loc?.textContent).toContain("3 · Kommunikation & nahes Umfeld");
  expect(loc?.textContent).toContain("1 · Selbst & Auftreten");
});
```

**Step 2:** FAIL. **Step 3:** In der West-Karte nach dem Summary-Absatz:

```tsx
{(westEvidence?.transitSectors ?? []).some((s) => sectorLabel(s)) && (
  <p className="font-mono text-[10px] text-stone-500" data-testid="daily-west-sectors">
    Aktivierte Bereiche: {(westEvidence!.transitSectors).map(sectorLabel).filter(Boolean).join(" · ")}
  </p>
)}
```

Import `sectorLabel` ergänzen. (Der transit/now-Livefetch ist optionaler Feinschliff — nur einbauen, wenn Zeit bleibt; der Kern dieser Task sind die Labels auf vorhandenen Daten.)

**Step 4:** PASS + volle Suite. **Step 5:** Commit `feat(tagespuls): West-Sektoren als Lebensbereiche verortet`.

---

## Paket C — Wochenbogen (Muster-Spiegel-Payoff)

### Task C1: reflectionStore-Erweiterungen (TDD)

**Files:**
- Modify: `src/utils/daily/reflectionStore.ts`
- Test: `src/utils/daily/reflectionStore.test.ts`

**Step 1: Failing Tests**

```ts
describe("Wochenbogen-Erweiterungen", () => {
  beforeEach(() => clearAllReflections());

  it("listReflectionsSince liefert Einträge ab Datum, chronologisch", () => {
    saveReflection({ date: "2026-07-01", dayType: "ausdruck", reaction: "teils", encounterChoice: null, vetoChoice: null });
    saveReflection({ date: "2026-07-08", dayType: "struktur", reaction: "kenne_ich", encounterChoice: "Sorgfalt", vetoChoice: null });
    saveReflection({ date: "2026-07-10", dayType: "ausdruck", reaction: "gegenseite", encounterChoice: null, vetoChoice: null });
    const week = listReflectionsSince("2026-07-04");
    expect(week.map((r) => r.date)).toEqual(["2026-07-08", "2026-07-10"]);
  });

  it("aggregateAll liefert nur Typen mit Einträgen, reliable-Flag pro Typ", () => {
    for (const d of ["2026-07-01", "2026-07-02", "2026-07-03"]) {
      saveReflection({ date: d, dayType: "ausdruck", reaction: "kenne_ich", encounterChoice: null, vetoChoice: null });
    }
    saveReflection({ date: "2026-07-04", dayType: "struktur", reaction: "gegenseite", encounterChoice: null, vetoChoice: null });
    const all = aggregateAll();
    expect(all.map((a) => a.dayType).sort()).toEqual(["ausdruck", "struktur"]);
    expect(all.find((a) => a.dayType === "ausdruck")!.reliable).toBe(true);
    expect(all.find((a) => a.dayType === "struktur")!.reliable).toBe(false);
  });
});
```

**Step 2:** FAIL. **Step 3: Implementieren**

```ts
/** Reflexionen ab einem ISO-Datum (inkl.), chronologisch — für den Wochenbogen. */
export function listReflectionsSince(sinceDate: string): DailyReflection[] {
  return Object.values(readAll())
    .filter((r) => r.date >= sinceDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Aggregate aller Tagestypen, die mindestens einen Eintrag mit Reaktion haben. */
export function aggregateAll(): DayTypeAggregate[] {
  const present = new Set(
    Object.values(readAll())
      .filter((r) => r.reaction !== null)
      .map((r) => r.dayType),
  );
  return [...present].map((t) => aggregateByType(t));
}
```

**Step 4:** PASS. **Step 5:** Commit `feat(wochenbogen): listReflectionsSince + aggregateAll im reflectionStore`.

### Task C2: Beobachtungs-Templates (TDD — Sprache ist hier das Produkt)

**Files:**
- Create: `src/utils/daily/weeklyObservations.ts`
- Test: `src/utils/daily/weeklyObservations.test.ts`
- Modify: `src/components/daily/TagespulsV2.test.tsx` (Wording-Gate-`FILES` + neue Datei)

**Step 1: Failing Tests**

```ts
import { describe, it, expect } from "vitest";
import { weeklyObservations } from "./weeklyObservations";
import type { DayTypeAggregate } from "./reflectionStore";

// Bindend (Konzept): "System beobachtet … prüfe, ob das stimmt" — nie Urteil,
// Pflicht-Datenanker (Zahlen n von m), unter n=3 ehrlicher Empty-State.
const VERDICT = /\bdu bist\b|\bdu wirst\b|immer|nie(?!mand)|garantiert|beweist|solltest|musst/i;

const agg = (dayType: string, kenneIch: number, teils: number, gegenseite: number): DayTypeAggregate => ({
  dayType: dayType as any, total: kenneIch + teils + gegenseite,
  kenneIch, teils, gegenseite, reliable: kenneIch + teils + gegenseite >= 3,
});

describe("weeklyObservations", () => {
  it("belastbare Typen ergeben Beobachtungen mit Datenanker (n von m) und Prüf-Einladung", () => {
    const obs = weeklyObservations([agg("ausdruck", 6, 1, 1)]);
    expect(obs).toHaveLength(1);
    expect(obs[0].text).toContain("6 von 8");
    expect(obs[0].text).toContain("Ausdruck-Tag");
    expect(obs[0].invitation).toMatch(/prüfe/i);
  });

  it("unter n=3 gibt es KEINE Beobachtung, sondern den ehrlichen Empty-Marker", () => {
    const obs = weeklyObservations([agg("struktur", 1, 0, 1)]);
    expect(obs).toHaveLength(1);
    expect(obs[0].text).toContain("noch kein Muster belastbar");
    expect(obs[0].text).toContain("2");
  });

  it("kein Template trägt Verdikt-Sprache — für alle Verteilungen", () => {
    const cases = [agg("ausdruck", 5, 0, 0), agg("einfluss", 0, 0, 4), agg("ressource", 2, 2, 2), agg("gleichrang", 0, 1, 0)];
    for (const o of weeklyObservations(cases)) {
      expect(o.text, o.text).not.toMatch(VERDICT);
      expect(o.invitation ?? "").not.toMatch(VERDICT);
    }
  });
});
```

**Step 2:** FAIL. **Step 3: Implementieren**

```ts
/**
 * weeklyObservations — Sprachschablonen des Wochenbogens.
 *
 * Bindend: Beobachtung, nie Urteil. Jede belastbare Beobachtung (n≥3) nennt
 * ihren Datenanker ("n von m") und endet in der Prüf-Einladung. Unter n=3
 * ehrlicher Empty-State. Die dominante Antwortart bestimmt die Schablone.
 */
import { dayTypeById } from "./baziLabels";
import type { DayTypeAggregate } from "./reflectionStore";

export interface WeeklyObservation {
  dayType: DayTypeAggregate["dayType"];
  text: string;
  invitation: string | null;
  anchor: string;
}

export function weeklyObservations(aggregates: DayTypeAggregate[]): WeeklyObservation[] {
  return aggregates.map((a) => {
    const label = dayTypeById(a.dayType).label;
    const anchor = "Deine Antworten auf dem Wiedererkennungs-Tap (dieses Gerät)";
    if (!a.reliable) {
      return {
        dayType: a.dayType, anchor, invitation: null,
        text: `${label}: ${a.total} ${a.total === 1 ? "Antwort" : "Antworten"} — noch kein Muster belastbar.`,
      };
    }
    const top = Math.max(a.kenneIch, a.teils, a.gegenseite);
    const kind = top === a.kenneIch ? "kenne_ich" : top === a.gegenseite ? "gegenseite" : "teils";
    const count = `${top} von ${a.total}`;
    const text =
      kind === "kenne_ich"
        ? `An ${label}en hast du ${count} Mal „Kenne ich“ gewählt.`
        : kind === "gegenseite"
          ? `An ${label}en hast du ${count} Mal die Gegenseite angefragt — die Standard-Lesart scheint dort selten zu passen.`
          : `An ${label}en hast du ${count} Mal „Teils“ gewählt — dort bleibt es offenbar gemischt.`;
    return { dayType: a.dayType, anchor, text, invitation: "Prüfe, ob das für dich stimmt." };
  });
}
```

(`dayTypeById`-Labels enden auf "-Tag" → Plural "…-Tagen" via `${label}en` — im Test verifizieren, sonst Formulierung `an Tagen vom Typ „${label}“` verwenden.)

**Step 4:** PASS. **Step 5:** Wording-Gate-FILES ergänzen. Commit `feat(wochenbogen): Beobachtungs-Templates mit Pflicht-Datenanker`.

### Task C3: Wochenbogen-Komponente

**Files:**
- Create: `src/components/daily/Wochenbogen.tsx`
- Modify: `src/components/daily/TagespulsV2.tsx` (Sektion unter der Begegnungswahl, aufklappbar — Muster: „Herkunft & Methode“-Toggle in `SignatureView.tsx:158-181`)
- Test: `src/components/daily/Wochenbogen.test.tsx` (+ Wording-Gate-FILES)

**Verhalten:**
- Kopf: „Dein Wochenbogen“ + Zeitraum (letzte 7 Tage ab heute).
- Abschnitt 1: Tagestypen der Woche (aus `listReflectionsSince(heute−6)`): einfache Liste `Datum · Tagestyp · gewählte Begegnungsqualität` — Lücken werden NICHT gerendert und NICHT gezählt.
- Abschnitt 2: Muster-Spiegel (aus `aggregateAll()`, ALLE Zeit, nicht nur Woche): `weeklyObservations`-Texte + Prüf-Einladung + Anchor-Chip.
- Leerzustand (keinerlei Einträge): „Noch keine Antworten notiert — der Wochenbogen füllt sich mit deinen Wiedererkennungs-Antworten.“
- KEIN Streak, KEINE Vollständigkeits-Anzeige, Nichtnutzung wird nie erwähnt.

**Step 1: Failing Tests** — 3 Fälle: (a) leer → Empty-Text, (b) 3× ausdruck+1× struktur → Beobachtung „3 von 3“ sichtbar + struktur als „noch kein Muster belastbar“, (c) Wochenliste zeigt nur vorhandene Tage. localStorage direkt über `saveReflection` befüllen (kein Mock nötig — Store ist echt).

**Step 2:** FAIL. **Step 3:** Implementieren (Chip-Komponente aus TagespulsV2 exportieren oder klein duplizieren; Styling-Muster: glass-card wie die anderen Karten). **Step 4:** PASS + volle Suite. **Step 5:** Commit `feat(wochenbogen): ruhiger Rückblick — Wochenliste + Muster-Spiegel ab n≥3`.

---

## Paket D — Supabase-Sync der Reflexionen

### Task D1: Migration

**Files:**
- Create: `supabase/migrations/20260710_daily_reflections.sql`
- Vorlage lesen: `supabase/migrations/20260612_p3_foundation.sql` (RLS-Syntax exakt übernehmen)

```sql
-- Tagespuls 2.0 Etappe 2: Sync der Tages-Reflexionen für eingeloggte Nutzer.
-- localStorage bleibt Primärquelle für anonyme Nutzung; dieser Store ist der
-- optionale Sync-Layer (updatedAt-wins-Merge im Client).
create table if not exists public.nb_daily_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  day_type text not null check (day_type in ('ressource','ausdruck','einfluss','struktur','gleichrang')),
  reaction text check (reaction in ('kenne_ich','teils','gegenseite')),
  encounter_choice text,
  veto_choice text,
  updated_at_ms bigint not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.nb_daily_reflections enable row level security;

create policy "own reflections select" on public.nb_daily_reflections
  for select using (auth.uid() = user_id);
create policy "own reflections insert" on public.nb_daily_reflections
  for insert with check (auth.uid() = user_id);
create policy "own reflections update" on public.nb_daily_reflections
  for update using (auth.uid() = user_id);
create policy "own reflections delete" on public.nb_daily_reflections
  for delete using (auth.uid() = user_id);
```

**Steps:** Datei anlegen → gegen Vorlage abgleichen (Policy-Namen-Stil!) → Commit `feat(sync): Migration nb_daily_reflections mit RLS`. Anwendung auf die echte DB ist ein SEPARATER, expliziter Schritt nach dem Merge (nicht im Plan automatisieren — Benjamin fragen).

### Task D2: BFF-Routen (TDD) — Muster 1:1 von /api/me/profiles

**Files:**
- Modify: `src/server/app.ts` (neuer Block bei den /api/me-Routen)
- Test: `src/server/app.profiles.test.ts` ansehen und Muster in neuem describe in derselben Datei ODER `src/server/app.reflections.test.ts` (neu, Setup kopieren)

**Routen:**

```ts
  // --- Tages-Reflexionen (Sync-Layer; localStorage bleibt Primärquelle) ---

  app.get("/api/me/reflections", requireUserAuth, async (req, res) => {
    const supabase = getServerSupabase()!;
    const { data, error } = await supabase
      .from("nb_daily_reflections")
      .select("date, day_type, reaction, encounter_choice, veto_choice, updated_at_ms")
      .eq("user_id", req.userId!)
      .order("date", { ascending: true });
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.json(data ?? []);
  });

  app.put("/api/me/reflections", requireUserAuth, async (req, res) => {
    const items = Array.isArray(req.body?.reflections) ? req.body.reflections : null;
    if (!items || items.length === 0 || items.length > 400) {
      res.status(400).json({ error: "invalid_input", message: "reflections (1–400 Einträge) erforderlich." });
      return;
    }
    const DAY_TYPES = ["ressource", "ausdruck", "einfluss", "struktur", "gleichrang"];
    const REACTIONS = [null, "kenne_ich", "teils", "gegenseite"];
    const rows = [];
    for (const r of items) {
      if (typeof r?.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) { res.status(400).json({ error: "invalid_input", message: "date muss YYYY-MM-DD sein." }); return; }
      if (!DAY_TYPES.includes(r.dayType)) { res.status(400).json({ error: "invalid_input", message: "unbekannter dayType." }); return; }
      if (!REACTIONS.includes(r.reaction ?? null)) { res.status(400).json({ error: "invalid_input", message: "unbekannte reaction." }); return; }
      rows.push({
        user_id: req.userId!,
        date: r.date,
        day_type: r.dayType,
        reaction: r.reaction ?? null,
        encounter_choice: typeof r.encounterChoice === "string" ? r.encounterChoice.slice(0, 120) : null,
        veto_choice: typeof r.vetoChoice === "string" ? r.vetoChoice.slice(0, 120) : null,
        updated_at_ms: Number.isFinite(r.updatedAt) ? r.updatedAt : Date.now()
      });
    }
    const supabase = getServerSupabase()!;
    const { error } = await supabase
      .from("nb_daily_reflections")
      .upsert(rows, { onConflict: "user_id,date" });
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.status(204).send();
  });

  app.delete("/api/me/reflections", requireUserAuth, async (req, res) => {
    const supabase = getServerSupabase()!;
    const { error } = await supabase
      .from("nb_daily_reflections")
      .delete()
      .eq("user_id", req.userId!);
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.status(204).send();
  });
```

**Failing Tests zuerst** (Setup/Mocks aus `app.profiles.test.ts` kopieren — dort ist der Supabase-Mock-Stil etabliert): 401 ohne Token, GET liefert Liste mit user_id-Filter, PUT validiert dayType/date/Grenzen (400-Fälle), PUT upsert mit onConflict, DELETE löscht nur eigene. **WICHTIG:** Jede Query MUSS `.eq("user_id", req.userId!)` tragen (Service-Role bypasst RLS — Projektregel).

**Commits:** `feat(sync): /api/me/reflections GET/PUT/DELETE hinter requireUserAuth`.

### Task D3: Client-Sync (TDD)

**Files:**
- Create: `src/utils/daily/reflectionSync.ts`
- Test: `src/utils/daily/reflectionSync.test.ts` (+ Wording-Gate-FILES)
- Modify: `src/utils/daily/reflectionStore.ts` (Export `importReflections(items)` für den Merge)

**Verhalten (updatedAt-wins, localStorage bleibt Wahrheit auf dem Gerät):**

```ts
/**
 * reflectionSync — optionaler Sync für eingeloggte Nutzer.
 * Pull: Server-Einträge, die lokal fehlen ODER neueres updated_at_ms tragen → importieren.
 * Push: alle lokalen Einträge als Upsert (Server macht onConflict user_id+date).
 * Kein Sync ohne Session; Fehler sind still (Konsole), nie UI-blockierend.
 */
export async function syncReflections(): Promise<"synced" | "skipped" | "error">
```

- Session via `supabase.auth.getSession()` (Muster AccountMenu.tsx:50); ohne Session → "skipped".
- GET `/api/me/reflections` → Merge via `importReflections` (nur wenn Server-`updated_at_ms` > lokalem `updatedAt` oder lokal fehlend).
- PUT `/api/me/reflections` mit allen lokalen Einträgen (Shape: `{reflections: [...]}`, camelCase wie Route erwartet).
- Tests: fetch + supabase mocken (vi.mock auf `../../lib/supabaseClient`); Fälle: keine Session → skipped + kein fetch; Merge-Gewinner-Logik (server neuer / lokal neuer / lokal fehlt); Push-Payload-Shape.

`importReflections` im Store:

```ts
/** Merge externer Einträge (Sync): gewinnt nur mit neuerem updatedAt oder wenn lokal fehlend. */
export function importReflections(items: DailyReflection[]): number {
  const all = readAll();
  let imported = 0;
  for (const item of items) {
    const local = all[item.date];
    if (!local || item.updatedAt > local.updatedAt) {
      all[item.date] = item;
      imported++;
    }
  }
  if (imported > 0) writeAll(all);
  return imported;
}
```

**Commits:** `feat(sync): reflectionSync (updatedAt-wins) + importReflections`.

### Task D4: Sync-Trigger verdrahten

**Files:**
- Modify: `src/components/daily/TagespulsV2.tsx` — nach jedem `saveReflection`-Aufruf fire-and-forget `void syncReflections()` (debounced reicht nicht nötig — max 3 Writes pro Ritual); beim Mount einmal `void syncReflections()`.
- Test: bestehende TagespulsV2-Tests dürfen NICHT brechen (syncReflections im Test-Setup mocken: `vi.mock("../../utils/daily/reflectionSync", () => ({ syncReflections: vi.fn().mockResolvedValue("skipped") }))`).

**Steps:** Mock zuerst in Test einbauen → grün halten → Trigger einbauen → `npx vitest run` grün → Commit `feat(sync): Sync-Trigger bei Mount und nach jeder Antwort`.

---

## Paket E — Abschluss

### Task E1: Volle Verifikation

```bash
npx vitest run            # alles grün (Ziel: >760 Tests)
npx tsc --noEmit          # sauber
npm run build             # Prod-Build ok
npx tsx server.ts &       # lokal starten
# Live-Smoke lokal:
curl -s -X POST localhost:3000/api/azodiac/bazi/dayun -H "Content-Type: application/json" \
  -d '{"name":"Benjamin Pörsch","birthDate":"1985-06-15","birthTime":"14:30","placeId":"p","birthPlaceLabel":"Berlin","lat":52.52,"lon":13.405,"tz":"Europe/Berlin","gender":"Männlich"}' | head -c 400
# Erwartet: available:true, cycles[0].tenGodDe gefüllt
curl -s localhost:3000/api/azodiac/transit/now | head -c 300
# Erwartet: computedAt + planets.sun.sector (0-indiziert)
```

Browser-Check: Tagespuls-Tab → West-Karte zeigt „Aktivierte Bereiche“, Wochenbogen-Sektion klappt auf; BaZi-Tab → Dekaden-Liste mit label_de-Chips.

### Task E2: PR

```bash
git push -u origin feat/tagespuls-etappe2
gh pr create --title "feat(tagespuls): Etappe 2 — Wochenbogen, Sektor-Verortung, Dayun-Fix, Reflexions-Sync" --body "..."
```

PR-Body MUSS enthalten:
1. **PO-Frage:** die 12 Sektor-Labels (Task B1) sind Vorschlag — bestätigen oder ändern.
2. **Deploy-Hinweis:** Migration `20260710_daily_reflections.sql` muss manuell auf die Supabase-Instanz (User fragen, nicht automatisch anwenden).
3. Dayun: „nicht berechenbar“-Stub war faktisch falsch; Divers → ehrlicher Missing-State (`missing-direction-basis`).

---

## Offene PO-Entscheidungen (im PR spiegeln, nicht selbst entscheiden)

1. **Sektor-Labels:** B1-Vorschlag bestätigen/ändern.
2. **Dayun bei „Divers“:** Missing-State ok, oder UI-Wahl der Laufrichtung (`direction_method: "explicit"`) anbieten?
3. **Migration anwenden:** wann und durch wen (Supabase-Dashboard vs. CLI)?
4. **Wochenbogen-Platzierung:** in TagespulsV2 aufklappbar (Plan-Default) oder eigener Tab?
