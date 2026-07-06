# P3 Code Review Fixes

## Goal
Fix all findings from Sprint P3 code review (blocking → important → minor).

## Tasks

- [ ] **1. live-check field names** — `scripts/supabase-live-check.mts:117-122,149-154`: replace `date/time/lng/timezone` with `birthDate/birthTime/lon/tz` (both payloads) → Verify: `POST /api/me/profiles` returns 201, not 400

- [ ] **2. makeDefault error handling** — `src/server/app.ts:535-536`: capture error from `update({is_default:false})`, return 502 if it fails → Verify: test for makeDefault error path passes

- [ ] **3. clearTimeout on auth success** — `src/server/requireUserAuth.ts:30-31`: store timer handle, call `clearTimeout(timer)` after race resolves (both success and error paths) → Verify: `npm run lint` clean

- [ ] **4. logout resets view** — `src/components/AccountMenu.tsx:94`: add `setView("menu")` in `logout()` → Verify: unit test or manual — open menu, go to login-email, log out via another tab, reopen: shows "menu" not "link-sent"

- [ ] **5. setSaving in finally** — `src/components/AccountMenu.tsx:89`: move `setSaving(false)` into a `finally` block → Verify: function structure change only; `npm run lint` clean

- [ ] **6. UUID guard on DELETE** — `src/server/app.ts:547,590`: add UUID-format check on `req.params.id` before DB call, return 400 on invalid format → Verify: `DELETE /api/me/profiles/not-a-uuid` returns 400

- [ ] **7. Cross-user DELETE status assertion** — `src/server/app.profiles.test.ts:147,189`: add `expect(res.status).toBe(204)` to both cross-user DELETE tests → Verify: tests still pass green

- [ ] **8. makeDefault=true test coverage** — `src/server/app.profiles.test.ts`: add test: POST with `makeDefault:true` → first profile gets is_default=true; second POST with makeDefault:true → first reset to false → Verify: new test passes

- [ ] **9. Lint + tests + commit** — `npm run lint && npm test` → all 276+ tests green, no lint errors; commit: `fix: P3 code review findings (live-check fields, timeout leak, logout view, makeDefault, uuid guard, test coverage)`

## Done When
- [ ] `npm test` shows all tests passing (≥277 after new test)
- [ ] `npm run lint` exits 0
- [ ] `npx tsx scripts/supabase-live-check.mts` can proceed past POST step (when env set)
- [ ] No setTimeout handle leaks in requireUserAuth
