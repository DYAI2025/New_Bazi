# FuFirE Engine Fixtures — birth_time_known:false

Generated: 2026-06-12 via `scripts/fufire-unknown-time-spike.mts` (REQ-P4-001)
Birth: 1990-06-15T12:00:00, tz=Europe/Berlin, lat=52.52, lon=13.405

## Contract Verification Matrix (Spike Results)

| Endpoint | Status | Key Finding |
|---|---|---|
| `/v1/calculate/bazi` | ✓ CONFIRMED | `precision.provisional_fields=["hour"]` ✓; `pillars.hour` is NOT null — normalizer MUST null based on provisional_fields (F-02 confirmed) |
| `/v1/calculate/western` | ✓ CONFIRMED | `provisional_fields=["ascendant","houses","mc"]` ✓; `angles.Ascendant=163.89` (non-null) — normalizer MUST short-circuit (F-01 confirmed) |
| `/v1/calculate/fusion` | ✓ CONFIRMED | `provisional_fields=["signature","hour","ascendant","houses"]` ✓; `calibration.quality="ok"` (not "sparse") — F-04 hypothesis correct |
| `/v1/experience/bootstrap` | ⚠ CONTRACT UPDATED | No `chart_type_quality` at top-level; `profile.ascendant_sign="Jungfrau"` (12:00-computed) — normalizer must null ascendant_sign when timeKnown:false |
| `/v1/experience/daily` | ✓ CONFIRMED | `quality_flags.chart_type_quality="assumed_day"` ✓ |
| `/v1/calculate/bazi/dayun` | ⚠ CONTRACT UPDATED | `precision.birth_time_known=true` (engine echo bug), `provisional_fields=[]` — dayun does NOT degrade, 大運 are date-based. Pass-through. |

## Normalizer Implementation Notes

### bazi.json — F-02 Trip Hazard (CRITICAL)
`pillars.hour` is populated despite `provisional_fields=["hour"]`. The normalizer MUST:
```typescript
const hourPillar = provisionalFields.includes("hour") ? null : (rawBazi.hour ?? null);
```
Do NOT use `rawBazi.hour || { stem: defaultStem, branch: defaultBranch }` — this `||` fallback
would propagate the 12:00-computed hour pillar as if it were a fact.

### western.json — F-01 Trip Hazard (CRITICAL)
`angles.Ascendant=163.893` is present and NON-NULL despite `provisional_fields=["ascendant"]`.
The normalizer MUST short-circuit the entire fallback chain before reaching `angles.Ascendant`:
```typescript
if (provisionalFields.includes("ascendant")) {
  return null; // STOP — do not fall through to angles.Ascendant or houseCusps[0]
}
```
Test fixture deliberately has `angles.Ascendant` non-null to prove the short-circuit works.

### bootstrap.json — F-05 (NEW — Spike Finding)
`profile.ascendant_sign="Jungfrau"` is a 12:00-computed value. Normalizer must:
```typescript
if (timeKnown === false) profile.ascendant_sign = null;
```

### dayun.json — No Degradation Required
Dayun (大運, large cycles) are calculated from birth year/month/day, not birth hour.
`birth_time_known:true` in dayun response is an engine echo bug but behavior is architecturally correct.
Normalizer passes dayun through unchanged for unknown-time profiles.
