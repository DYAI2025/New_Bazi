# FuFirE Review-Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve the code-review findings (I1, I2, M1) and close the named test gaps without weakening any existing acceptance criterion.

**Architecture:** Same BFF. Changes are surgical: drop a misleading geocode field, make one error path safe, tighten one availability heuristic, and add two missing tests. TDD where a behavior changes.

**Tech Stack:** Express BFF, vitest + supertest, Playwright (unchanged).

---

### Task 1: I2 — Gemini route must not leak upstream SDK error text

**Files:**
- Modify: `src/server/app.ts` (gemini catch block)

**Step 1:** In the `/api/gemini/reading` catch, stop forwarding `error?.message`. Return a fixed message; log detail server-side.

```ts
} catch (error: any) {
  console.error("Gemini provider error (server-side only):", error?.message);
  sendError(res, { code: "gemini_error", httpStatus: 502, message: "Gemini-Deutung ist derzeit nicht verfügbar." });
}
```

**Step 2:** `npm run lint` → clean. (No behavior test: Gemini SDK is hard to mock; this is a message-only change. Verified by reading + lint.)

**Step 3:** Commit-worthy with later tasks.

---

### Task 2: I1 — `/api/geocode` must not return a "now"-based timezone offset

**Files:**
- Modify: `src/server/app.ts` (`/api/geocode`)
- Modify: `src/api/bazodiacClient.ts` (`resolvePlace` reads only `tz`, unaffected)
- Test: `src/server/app.test.ts`

**Decision:** `tz_id` (IANA, timestamp-independent) is the contract used downstream. The `utcOffsetMinutes` from `getTimezone()` is computed for "now" and is wrong for historical births. Drop it from the geocode response rather than fabricate a wrong offset.

**Step 1 (RED):** Add to the geocode test that the response has `tz` but NOT `utcOffsetMinutes`.

```ts
it("POST /api/geocode returns tz without a now-based offset", async () => {
  (getPlaceDetails as any).mockResolvedValue({ name: "Berlin", formattedAddress: "Berlin, DE", lat: 52.52, lon: 13.405 });
  (getTimezone as any).mockResolvedValue({ tz: "Europe/Berlin", utcOffsetMinutes: 120 });
  const res = await request(app).post("/api/geocode").send({ placeId: "abc" });
  expect(res.status).toBe(200);
  expect(res.body.tz).toBe("Europe/Berlin");
  expect(res.body.utcOffsetMinutes).toBeUndefined();
});
```

**Step 2:** Run → fails (field still present).

**Step 3 (GREEN):** Remove `utcOffsetMinutes` from the geocode JSON response in `app.ts`.

**Step 4:** Run geocode tests → pass.

---

### Task 3: M1 — Daily `available` requires user-facing text

**Files:**
- Modify: `src/server/app.ts` (`normalizeDaily`)
- Test: `src/server/app.test.ts`

**Step 1 (RED):** Add a test: a daily payload with only `qiResonance` (no description) → `available:false`, `source:"missing"`.

```ts
it("daily with no description is treated as missing", async () => {
  (FuFirEClient.postExperienceBootstrap as any).mockResolvedValue({});
  (FuFirEClient.postExperienceDaily as any).mockResolvedValue({ qiResonance: 50 });
  const res = await request(app).post("/api/azodiac/daily").send(VALID_BODY);
  expect(res.body.available).toBe(false);
  expect(res.body.source).toBe("missing");
});
```

**Step 2:** Run → fails (currently available true on qiResonance alone).

**Step 3 (GREEN):** In `normalizeDaily`, require `description`:

```ts
const available = Boolean(description) && (qiResonance !== null || Boolean(dominantPhase));
```

**Step 4:** Run daily tests (existing full-payload test still passes; it has description) → pass.

---

### Task 4: I3 — Real timeout aborts and maps to `fufire_unavailable`

**Files:**
- Test: `src/utils/fufireClient.test.ts`

**Step 1 (RED):** Add a test where `fetch` rejects with an `AbortError` when the signal fires, driven by fake timers, asserting `fufire_unavailable`.

```ts
it("aborts after REQUEST_TIMEOUT_MS and maps to fufire_unavailable", async () => {
  vi.useFakeTimers();
  process.env.REQUEST_TIMEOUT_MS = "50";
  global.fetch = vi.fn((_url: any, opts: any) => new Promise((_resolve, reject) => {
    opts.signal.addEventListener("abort", () => {
      const e = new Error("aborted"); (e as any).name = "AbortError"; reject(e);
    });
  })) as any;
  const p = FuFirEClient.postChart({} as any);
  await vi.advanceTimersByTimeAsync(60);
  await expect(p).rejects.toMatchObject({ code: "fufire_unavailable" });
  vi.useRealTimers();
});
```

**Step 2:** Run → should pass if the client wires AbortController correctly; if it fails, the client has a timeout bug to fix.

**Step 3 (GREEN):** If failing, ensure `request()` aborts on timer and the catch maps abort → `fufire_unavailable` (already implemented; test confirms).

---

### Task 5: Document deferred findings + full re-validation

**Files:**
- Modify: `docs/qa/2026-05-26-fufire-backend-integration.md` (add "Deferred follow-ups" section)

**Deferred (not coded now):**
- **M2** pickSection looseness — needs a live FuFirE contract fixture; add once `FUFIRE_API_URL` is reachable.
- **M3** demo timezone default `Europe/Berlin` — gated to test/`ENABLE_DEMO_PROFILES`, not a product path.
- **M4** vanilla `BazodiacInput`/`BazodiacButton` web components — kept as design-system + tests; product forms use plain React due to React↔web-component DOM-ownership conflict. Document the incompatibility.

**Final gate:** `npm test`, `npm run lint`, `npm run build`, `npx playwright test` all green.
