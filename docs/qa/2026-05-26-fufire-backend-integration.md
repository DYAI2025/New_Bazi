# QA — FuFirE Backend Integration

Date: 2026-05-26
Branch: `feat/fufire-backend-integration`
Reference plan: `docs/plans/2026-05-26-fufire-backend-integration.md`

## Architecture

Browser → `BazodiacClient` → Same-Origin Express BFF (`/api/*`) → Validation → Places/Timezone → `FuFirEClient` (`/v1/*`) → `normalizeFuFireProfile` → `ProfileViewModel`.

The browser never calls FuFirE or Google directly. All secrets stay in server env.

## Commands

| Command | Result |
| --- | --- |
| `npm test` (vitest) | 68 passed (7 files) |
| `npm run lint` (tsc --noEmit) | clean |
| `npm run build` (vite + esbuild) | success |
| `npx playwright test` | 8 passed |

## Secret handling

- Client bundle scanned: no secret values, no `X-API-Key`, no `process.env.*_KEY` inlined.
- No `VITE_*` secrets in source.
- The only `GOOGLE_MAPS_API_KEY` occurrence in the client bundle is the env-var *name* inside a user-facing "not configured" message, not a key value.
- FuFirE/Places errors map to stable codes (`missing_fufire_url/key`, `fufire_auth_failed`, `invalid_fufire_payload`, `fufire_rate_limited`, `fufire_unavailable`, `missing_places_key`) with safe messages — no upstream stack traces or keys reach the browser.

## Provenance / source model

`ProfileViewModel.source ∈ { fufire-chart, fufire-orchestrated, fallback-local, missing }`.
Per-section provenance carries `status` (`server-used | fallback-local | missing | error`) and `source` (`fufire | fallback-local | missing`).
Local astrology is only used when `ENABLE_LOCAL_ASTROLOGY_FALLBACK=true` and is then labelled `fallback-local` end-to-end.
Dayun returns `{ available:false, status:"missing-capability", source:"missing" }` with no mystical placeholder language.

## Playwright scenarios (mocked FuFirE upstream)

A mock FuFirE server (`tests/e2e/mock-fufire.mjs`) serves `/v1/chart`, `/v1/calculate/*`, `/v1/experience/*`, `/v1/health` (requires `X-API-Key`). The app runs against it with demo places enabled.

| Scenario | Screenshot |
| --- | --- |
| App starts empty on the input tab, no demo profile | `screenshots/fufire-backend-integration/input-empty.png` |
| Submit blocked until place resolved (lat/lon/tz) | `screenshots/fufire-backend-integration/input-place-selected.png` |
| Overview rendered from FuFirE chart | `screenshots/fufire-backend-integration/overview-fufire-source.png` |
| Fusion tab explains Kohärenzindex + source | `screenshots/fufire-backend-integration/fusion-tab.png` |
| Houses / western section | `screenshots/fufire-backend-integration/houses-section.png` |
| Methodology capability matrix (status + source) | `screenshots/fufire-backend-integration/methodology-capabilities.png` |
| Missing FuFirE key → safe error, no secret leak | `screenshots/fufire-backend-integration/missing-fufire-secret.png` |
| Light theme readable | `screenshots/fufire-backend-integration/overview-light-theme.png` |

## Review fixes applied

- **I1** `/api/geocode` no longer returns a "now"-based `utcOffsetMinutes`; only the timestamp-independent `tz` (IANA) is returned. Test: app.test "returns tz without a now-based offset".
- **I2** Gemini route no longer forwards the raw SDK error message to the browser (fixed message + server-side log).
- **M1** Daily `available` now requires a user-facing `description` (a bare metric counts as missing). Test: app.test "daily payload without description as missing".
- **I3** Added a real fake-timer abort test proving `REQUEST_TIMEOUT_MS` → `fufire_unavailable`.

## Deferred follow-ups (not coded)

- **M2** `pickSection` is tolerant: an unwrapped `calculate/*` response is passed through verbatim. Add a contract fixture + assertion once a live `FUFIRE_API_URL` is reachable to pin the verified shape.
- **M3** The demo timezone fallback returns `Europe/Berlin` for unknown coords. Reachable only under `NODE_ENV=test` or `ENABLE_DEMO_PROFILES=true` — not a production path.
- **M4** Vanilla `BazodiacInput`/`BazodiacButton` web components are retained (with their own tests) but no longer used by the product forms: they mutate React-owned light DOM, which crashes React (`removeChild`) on unmount, so InputForm/Synastry use plain React inputs. Keep as design-system reference or remove in a later cleanup.

## Railway env

See `.env.example`. Required server vars: `FUFIRE_API_URL`, `FUFIRE_API_KEY`, `FUFIRE_API_VERSION=v1`, `REQUEST_TIMEOUT_MS`, `GOOGLE_MAPS_API_KEY`, `ENABLE_LOCAL_ASTROLOGY_FALLBACK=false`, `ENABLE_DEMO_PROFILES=false`, `PORT` (provided by Railway), optional `GEMINI_API_KEY`. No `VITE_*` secrets.
