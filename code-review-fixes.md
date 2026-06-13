# Code Review Fixes — Sprint P1 PR #18

## Goal
Fix all 6 actionable findings from code review before merging PR #18.

## Tasks

- [ ] **F2** `Overview.tsx:706` — change `key={w}` → `key={i}` (duplicate-warning key collision)
  → Verify: `npx vitest run src/components/Overview.warnings.test.tsx` still passes

- [ ] **F3** `BaZiDetail.tsx:114` — add `block mb-1` to the `<span>` for "Kuratierte Element-Deutung"
  → Verify: `npm run lint` clean; span renders above quote (visual)

- [ ] **F4** `Overview.warnings.test.tsx:27,36` — remove `async` from both test functions
  → Verify: `npx vitest run src/components/Overview.warnings.test.tsx` still passes

- [ ] **F5** `fufireClient.ts:184` — update comment: say "also guard 400 defensively" or drop `|| res.status === 400`
  → Verify: `npm run lint` clean; existing DST tests still pass

- [ ] **F6** `renderComponent.tsx` — add guard at top of `renderComponent()`: throw if `root` already active
  → Verify: tests that call `cleanupComponent()` properly still pass; misuse without cleanup throws

- [ ] **F1** `TensionNavigator.tsx:839-841` — guard `__resetIntroForTests` behind `import.meta.env.MODE === "test"` or make it non-exported (test files can access via dynamic import or a test-only module)
  → Verify: `npm run build` confirms function absent from prod bundle (check `dist/assets/index-*.js`)

- [ ] Commit all fixes + run full suite
  → `npm run lint && npx vitest run && npm run build` — all pass

## Done When
- [ ] PR #18 has a follow-up commit with all 6 fixes
- [ ] 259+ tests passing, lint clean, build clean
