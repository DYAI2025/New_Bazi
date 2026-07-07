# Sprint P2 — Engine-Track: Daily-Variation, daily_elemental_comparison, Dayun, Unknown-Time-Contract

> **ZUERST lesen:** `docs/plans/2026-06-11-MASTER-fullfeature-roadmap.md` (bindende Regeln, §1).
> **Arbeits-Repo dieses Plans: `/Users/benjaminpoersch/Projects/FuFirE`** (FastAPI-Engine, NICHT New_Bazi!)
> — außer Task 3b, der explizit in New_Bazi stattfindet.
> Branch (Engine): `feat/sprint-p2-daily-field-dayun`. Branch (New_Bazi, nur Task 3b): `feat/sprint-p2b-dayun-client`.

---

## 0. Code-Realität (am 2026-06-11 verifiziert — NICHT neu raten, aber Explorations-Schritte trotzdem ausführen)

Diese Fakten wurden beim Planschreiben gegen den echten Code UND die Live-API geprüft:

1. **B-003-Root-Cause ist DIFFERENZIERTER als im Master-Plan notiert.** Direkter Live-Probe
   gegen `https://api.fufire.space/v1/experience/daily` (X-API-Key, target_dates
   2026-06-11/-14/-20, identische Geburt+Sektoren) ergab: `eastern.summary` ist für alle 3
   Daten VERSCHIEDEN (Tages-Säule + Tagesvarianten greifen); `western.summary/caution/
   opportunity/themes` + `western.evidence.transit_sectors` sind für 2026-06-14 und 2026-06-20
   **byte-identisch** (beide `[2, 10]`); `fusion.summary` erbt die Western-Starrheit teilweise.
   **Der Engine-Task ist damit der „Honest note“-Zweig:** Texte SIND date-derived, aber der
   Western-Teil zu grob → Fix = feinere Granularität (Task 1). Die UI-Beobachtung „ALLE Texte
   byte-identisch“ ist gegen die Engine nicht reproduzierbar → Rest vermutlich New_Bazi-Deploy-Lag
   (PR #16 `deliver the full engine DailyResponse` ist erst vom 2026-06-11); wird in P2 nur im
   Report notiert, Live-Re-Check gehört zu P9.
2. **Mechanik der Western-Starrheit** (`bazi_engine/services/daily_western.py`, 71 Zeilen):
   `compute_transit_now()` (`bazi_engine/transit.py:103`) gewichtet langsame Planeten am
   höchsten (`PLANET_WEIGHTS` Z. 41–52: Pluto 2.0, Neptun 1.8 — Mond nur 0.5);
   `combined = sector_intensity * soulprint` → Top-2-Sektoren ändern sich wochenlang nicht.
   `PLANET_WEIGHTS` wird auch von `/v1/transit/state` benutzt → **dort NICHT anfassen**,
   der Fix bekommt eigene Daily-Gewichte im Service.
3. **Issue #133:** Daily-Response soll additiv `daily_elemental_comparison` liefern: pro Element
   `{natal, daily, difference}`. WICHTIG: das natale „westernToWuxing“
   (`calculate_wuxing_vector_from_planets`, `bazi_engine/wuxing/analysis.py:78`) mappt
   **Planet→Element FIX** (`PLANET_TO_WUXING`, `wuxing/constants.py`) — positionsunabhängig bis
   auf Retrograde-Gewicht (1.3×) und Merkur Tag/Nacht; ein Tagesvektor NUR aus Transit-Planeten
   ändert sich nur an Retrograde-Stationen. Deshalb spiegelt der Tagesvektor die Natal-Konvention:
   **avg(Planetenvektor des Tages, BaZi-Vektor der Tages-Säule)** — die Tages-Säule wechselt
   täglich (Sexagesimal-Zyklus).
4. **B-012 Dayun:** Die Engine HAT `/v1/calculate/bazi/dayun` voll implementiert
   (`bazi_engine/routers/dayun.py`, 347 Z.; Live-Fixture: Landingpage
   `tests/fixtures/responses/post__v1_calculate_bazi_dayun.json`, capturedLive 2026-06-04).
   New_Bazi gibt `missing-capability` zurück, weil der BFF-Stub hartkodiert ist
   (`New_Bazi/src/server/app.ts:469–474`). **Task 3 ist primär ein New_Bazi-Task** (3b),
   Engine-seitig nur Verifikation (3a).
5. **Unknown-Time:** `birth_time_known` existiert in bazi/western/fusion-Routern (mit
   `precision.provisional_fields`), im Experience-`BirthInput` und in `/v1/experience/daily`
   (`chart_type_quality` forced `assumed_day`). Zwei Inkonsistenzen: (a) `/v1/experience/bootstrap`
   AKZEPTIERT `birth_time_known`, IGNORIERT es aber — kein Quality-Flag trotz zeitabhängigem
   `ascendant_sign`; (b) `/v1/calculate/bazi/dayun` hat kein Request-Flag,
   `precision.birth_time_known` ist hartkodiert `True` (dayun.py:330–338, eigener TODO-Kommentar).
6. **Konventionen:** Router doppelt gemountet (unprefixed = legacy/deprecated + `/v1`,
   `bazi_engine/app.py:324–351`) — neue Felder erscheinen automatisch auf beiden. Spec-Snapshot
   `spec/openapi/openapi.json` via `uv run python scripts/export_openapi.py` (CI-Drift: `--check`).
   Tests flach in `tests/` (`test_*.py`, `starlette.testclient.TestClient`, Auth-Fixture-Muster
   `tests/test_experience_daily_v2.py:11–29`). CI (`ci.yml`): pytest+cov≥75 auf 3.10/3.11/3.12,
   mypy, ruff, radon (CC>15 verboten), OpenAPI-Drift, redocly + TS-Client-Codegen.
   Template-Strings ASCII-clean (ue/ae/oe, kein ß).
7. **Trap:** `/health` liefert einen STATISCHEN Versionsstring — beweist KEINE Deploy-Frische.
   Frische nach Merge über das NEUE Feld (`daily_elemental_comparison`) verifizieren.

---

## Task 0 — Setup + Baseline

```bash
cd /Users/benjaminpoersch/Projects/FuFirE
git checkout main && git fetch origin && git reset --hard origin/main
git checkout -b feat/sprint-p2-daily-field-dayun
# Baseline-Gates (Zahlen im Report notieren — Stand ~2526 Tests):
uv run pytest -q
uv run mypy bazi_engine --ignore-missing-imports && uv run ruff check bazi_engine/ \
  && uv run python scripts/check_complexity.py --check \
  && uv run python scripts/export_openapi.py --check
```

Alles muss VOR der Arbeit grün sein; sonst STOPP, Befund im Report, Benjamin fragen.
rtk-Hook-Falle: `uv run python3` statt `python3`; bei „Use \`rtk ...\` instead“ exakt so
wiederholen; `rtk proxy curl` für rohe JSON-Ausgaben (rtk komprimiert curl-JSON sonst).

---

## Task 1 — B-003: Daily-Variation (Western-Granularität)

### 1.1 Exploration (Pflicht, Ergebnisse in den Report)

```bash
cd /Users/benjaminpoersch/Projects/FuFirE
# Beleg der Starrheit: gleiche Geburt, Daten 6 Tage auseinander
uv run python3 - <<'PY'
from bazi_engine.services.daily_western import generate_western_daily
kw = dict(sun_sign_idx=11, moon_sign_idx=3, asc_sign_idx=6,
          soulprint_sectors=[0.05,0.1,0.08,0.07,0.12,0.06,0.09,0.11,0.07,0.08,0.09,0.08],
          tz="Europe/Berlin", lat=52.52, lon=13.405, locale="de-DE")
a = generate_western_daily(target_date="2026-06-14", **kw)
b = generate_western_daily(target_date="2026-06-20", **kw)
print("summary gleich:", a["summary"] == b["summary"])      # erwartet: True (der Bug)
print("evidence gleich:", a["evidence"] == b["evidence"])    # erwartet: True
print(a["evidence"]["transit_sectors"], b["evidence"]["transit_sectors"])
PY
```

Erwartung (2026-06-11 verifiziert): beides `True`, Sektoren `[2, 10]` beide Male. Falls schon
`False`: STOPP, melden (parallel gefixt). Danach komplett lesen:
`services/daily_western.py`, `services/daily_templates.py` (insb. `select_variant`
Z. 196–200), `transit.py:103–160`.

### 1.2 Failing Test (RED)

Anhängen an `tests/test_daily_western.py` (dort existieren 2 Tests, gleicher Stil):

```python
def test_western_daily_nearby_dates_vary():
    """B-003: Tages-Lesung muss sich innerhalb einer Woche aendern (Mond-getrieben)."""
    kwargs = dict(
        sun_sign_idx=11, moon_sign_idx=3, asc_sign_idx=6,
        soulprint_sectors=[0.05, 0.1, 0.08, 0.07, 0.12, 0.06, 0.09, 0.11, 0.07, 0.08, 0.09, 0.08],
        tz="Europe/Berlin", lat=52.52, lon=13.405, locale="de-DE",
    )
    a = generate_western_daily(target_date="2026-06-14", **kwargs)
    b = generate_western_daily(target_date="2026-06-20", **kwargs)
    assert a["summary"] != b["summary"]
    assert a["evidence"] != b["evidence"]


def test_western_daily_adjacent_days_vary_text():
    """Auch direkt benachbarte Tage muessen unterschiedliche Formulierungen liefern."""
    kwargs = dict(
        sun_sign_idx=4, moon_sign_idx=6, asc_sign_idx=5,
        soulprint_sectors=[0.08] * 12,
        tz="Europe/Berlin", lat=53.5511, lon=9.9937, locale="de-DE",
    )
    a = generate_western_daily(target_date="2026-06-14", **kwargs)
    b = generate_western_daily(target_date="2026-06-15", **kwargs)
    assert a["summary"] != b["summary"]
    # additives Evidence-Feld:
    assert isinstance(a["evidence"]["moon_sector"], int)
    assert 0 <= a["evidence"]["moon_sector"] <= 11
```

```bash
uv run pytest -q tests/test_daily_western.py    # RED-Beweis in den Report (3 Failures)
```

### 1.3 Implementation

**a) `bazi_engine/services/daily_templates.py`** — am Ende anfügen (ASCII-clean!):

```python
# ---------------------------------------------------------------------------
# Western daily variants (B-003) — phrasing keyed on day-of-year.
# ---------------------------------------------------------------------------
WESTERN_SUMMARY_VARIANTS_DE = [
    "Fuer dich als {sun_sign} stehen heute {themes} im Fokus. Der Mond in {moon_sign} aktiviert deine Sektoren {s1} und {s2}.",
    "Der Mond zieht heute durch {moon_sign} und legt fuer dich als {sun_sign} den Akzent auf {themes} (Sektoren {s1} und {s2}).",
    "Tagesimpuls fuer {sun_sign}: {themes}. Mond in {moon_sign}, aktivierte Sektoren {s1} und {s2}.",
]

WESTERN_CAUTION_VARIANTS_DE = [
    "Achte in Sektor {s2} auf Ueberanstrengung -- hier liegt heute Spannung.",
    "Sektor {s2} traegt heute Reibung. Dosiere deinen Einsatz dort bewusst.",
    "Spannungsfeld Sektor {s2}: nicht erzwingen, sondern beobachten.",
]

WESTERN_OPPORTUNITY_VARIANTS_DE = [
    "Sektor {s1} bietet dir heute besonderes Potenzial. Nutze die Energie aktiv.",
    "Das staerkste Feld liegt heute in Sektor {s1} -- ein guter Ort fuer den ersten Schritt.",
    "Heute traegt Sektor {s1}. Plane dort eine konkrete Handlung ein.",
]
```

(Anti-Reification-Check: keine „Du bist…“-Festlegung, kein Coaching/Therapie-Vokabular.)

**b) `bazi_engine/services/daily_western.py`** — `generate_western_daily` umbauen.
Imports erweitern und VOR der Funktion einfügen:

```python
from .daily_templates import (
    WESTERN_CAUTION_VARIANTS_DE,
    WESTERN_OPPORTUNITY_VARIANTS_DE,
    WESTERN_SUMMARY_VARIANTS_DE,
    get_weekday_modifier,
    select_variant,
)

# Daily-spezifische Gewichte: schnelle Laeufer dominieren die TAGES-Lesung.
# transit.PLANET_WEIGHTS (Pluto 2.0 ... Mond 0.5) bleibt unangetastet —
# es gehoert zu /v1/transit/state und friert sonst die Top-Sektoren fuer
# Wochen ein (B-003-Root-Cause).
_DAILY_PLANET_WEIGHTS = {
    "moon": 2.0, "sun": 1.2, "mercury": 1.0, "venus": 1.0, "mars": 0.9,
    "jupiter": 0.5, "saturn": 0.3, "uranus": 0.2, "neptune": 0.2, "pluto": 0.2,
}


def _daily_sector_intensity(transit_planets):
    """Fast-mover-gewichtete Sektor-Intensitaet fuer Tages-Lesungen."""
    intensity = [0.0] * 12
    for name, pdata in transit_planets.items():
        weight = _DAILY_PLANET_WEIGHTS.get(name, 0.2)
        intensity[pdata["sector"]] += weight
    max_val = max(intensity, default=0.0)
    if max_val <= 0:
        max_val = 1.0
    return [round(v / max_val, 4) for v in intensity]
```

Funktionskoerper (Z. 37–70) ersetzen durch:

```python
    dt = datetime.strptime(target_date, "%Y-%m-%d").replace(hour=12, tzinfo=timezone.utc)
    transit_data = compute_transit_now(dt)
    transit_planets = transit_data["planets"]
    daily_intensity = _daily_sector_intensity(transit_planets)

    # 0.35-Floor: haelt das Transit-Signal auch in Sektoren mit Soulprint ~0
    # am Leben — sonst koennte der Mond das Ranking nie bewegen.
    combined = [d * (0.35 + s) for d, s in zip(daily_intensity, soulprint_sectors)]
    active_indices = sorted(range(12), key=lambda i: combined[i], reverse=True)[:2]

    themes = []
    for idx in active_indices:
        themes.extend(_SECTOR_THEMES_DE.get(idx, ["Energie"])[:1])

    sun_sign = ZODIAC_SIGNS[sun_sign_idx % 12]
    moon_sector = transit_planets["moon"]["sector"]
    moon_sign = ZODIAC_SIGNS[moon_sector]
    weekday_name, weekday_planet, weekday_energy = get_weekday_modifier(target_date)

    summary = select_variant(WESTERN_SUMMARY_VARIANTS_DE, target_date).format(
        sun_sign=sun_sign.title(), moon_sign=moon_sign.title(),
        themes=", ".join(themes), s1=active_indices[0] + 1, s2=active_indices[1] + 1,
    )
    weekday_note = f"{weekday_name} ({weekday_planet}): {weekday_energy}"
    caution = select_variant(WESTERN_CAUTION_VARIANTS_DE, target_date).format(
        s2=active_indices[1] + 1,
    )
    opportunity = select_variant(WESTERN_OPPORTUNITY_VARIANTS_DE, target_date).format(
        s1=active_indices[0] + 1,
    )

    return {
        "summary": summary,
        "themes": themes,
        "caution": caution,
        "opportunity": opportunity,
        "weekday_note": weekday_note,
        "evidence": {
            "transit_sectors": active_indices,
            "natal_focus": ["sun", "ascendant"],
            "weekday": weekday_name,
            "moon_sector": moon_sector,
        },
    }
```

**c) `bazi_engine/routers/experience.py`** — `DailyEvidence` (Z. 202–209) additiv erweitern:

```python
    moon_sector: Optional[int] = Field(
        None, ge=0, le=11,
        description="Zodiac sector (0=Aries..11=Pisces) of the transiting Moon on target_date.",
    )
```

(Additiv + Optional ⇒ DailyResponse bleibt rueckwaertskompatibel für Landingpage/New_Bazi.)

### 1.4 Gates + Commit

```bash
uv run pytest -q                                   # voller Lauf — Zahl notieren
uv run python scripts/export_openapi.py            # Snapshot regenerieren (DailyEvidence geaendert!)
uv run python scripts/export_openapi.py --check
uv run mypy bazi_engine --ignore-missing-imports && uv run ruff check bazi_engine/ \
  && uv run python scripts/check_complexity.py --check

git add bazi_engine/services/daily_western.py bazi_engine/services/daily_templates.py \
        bazi_engine/routers/experience.py tests/test_daily_western.py spec/openapi/openapi.json
git commit -m "fix(daily): date-sensitive western daily — fast-mover weights + day-keyed variants (B-003)"
```

Falls irgendein Bestandstest die ALTE Western-Formulierung wortwoertlich pinnt (Stand
2026-06-11: keiner gefunden), nur die Literal-Assertion an die neuen Templates anpassen —
NIE eine Variations-Assertion entfernen.

---

## Task 2 — Issue #133: `daily_elemental_comparison` (additiv)

### 2.1 Exploration (Pflicht)

```bash
gh issue view 133 --repo DYAI2025/FuFirE
# Beleg: Planeten-only-Tagesvektor variiert kaum (fixe PLANET_TO_WUXING-Map):
cd /Users/benjaminpoersch/Projects/FuFirE && uv run python3 - <<'PY'
from datetime import datetime, timezone
from bazi_engine.transit import compute_transit_now
from bazi_engine.wuxing import calculate_wuxing_vector_from_planets, calculate_wuxing_from_bazi
from bazi_engine.bazi import sexagenary_day_index_from_date, pillar_from_index60
from bazi_engine.constants import STEMS, BRANCHES
for d in ("2026-06-14", "2026-06-15"):
    dt = datetime.strptime(d, "%Y-%m-%d").replace(hour=12, tzinfo=timezone.utc)
    t = compute_transit_now(dt)["planets"]
    bodies = {n.title(): {"longitude": p["longitude"], "is_retrograde": p["speed"] < 0} for n, p in t.items()}
    print(d, "west:", calculate_wuxing_vector_from_planets(bodies).normalize().to_dict())
    p = pillar_from_index60(sexagenary_day_index_from_date(*map(int, d.split("-"))))
    print(d, "tagessaeule:", STEMS[p.stem_index], BRANCHES[p.branch_index],
          calculate_wuxing_from_bazi({"day": {"stem": STEMS[p.stem_index], "branch": BRANCHES[p.branch_index]}}).normalize().to_dict())
PY
```

Erwartung: `west:` für beide Tage identisch, `tagessaeule:` verschieden → bestaetigt das Design
„daily = avg(west, tages-saeule)“ (Spiegel der Natal-Fusion, `routers/experience.py:398–406`).

### 2.2 Failing Tests (RED) — neue Datei `tests/test_daily_elemental_comparison.py`

Datei-Kopf: docstring + `env`(autouse)/`client`-Fixtures EXAKT aus
`tests/test_experience_daily_v2.py:11–29` kopieren (FUFIRE_REQUIRE_API_KEYS=false etc.). Dann:

```python
GERMAN_ELEMENTS = ["Holz", "Feuer", "Erde", "Metall", "Wasser"]


def _daily_body(target_date: str) -> dict:
    return {
        "birth": {"date": "1990-05-23", "time": "14:30:00", "tz": "Europe/Berlin",
                  "lat": 52.52, "lon": 13.405},
        "soulprint_sectors": [0.08, 0.09, 0.08, 0.09, 0.08, 0.08, 0.09, 0.08, 0.09, 0.08, 0.08, 0.08],
        "quiz_sectors": [0.08, 0.09, 0.08, 0.09, 0.08, 0.08, 0.09, 0.08, 0.09, 0.08, 0.08, 0.08],
        "target_date": target_date,
    }


def test_daily_contains_elemental_comparison(client):
    r = client.post("/v1/experience/daily", json=_daily_body("2026-06-14"))
    assert r.status_code == 200
    comp = r.json()["daily_elemental_comparison"]
    assert comp is not None
    assert sorted(comp.keys()) == sorted(GERMAN_ELEMENTS)
    for elem in GERMAN_ELEMENTS:
        entry = comp[elem]
        assert set(entry.keys()) == {"natal", "daily", "difference"}
        assert 0.0 <= entry["natal"] <= 1.0
        assert 0.0 <= entry["daily"] <= 1.0
        # Konvention wie fusion.elemental_comparison: difference = erstes - zweites Feld
        assert entry["difference"] == pytest.approx(entry["natal"] - entry["daily"], abs=0.002)


def test_daily_vector_changes_with_target_date(client):
    a = client.post("/v1/experience/daily", json=_daily_body("2026-06-14")).json()
    b = client.post("/v1/experience/daily", json=_daily_body("2026-06-15")).json()
    daily_a = {k: v["daily"] for k, v in a["daily_elemental_comparison"].items()}
    daily_b = {k: v["daily"] for k, v in b["daily_elemental_comparison"].items()}
    assert daily_a != daily_b  # Tages-Saeule wechselt taeglich
    natal_a = {k: v["natal"] for k, v in a["daily_elemental_comparison"].items()}
    natal_b = {k: v["natal"] for k, v in b["daily_elemental_comparison"].items()}
    assert natal_a == natal_b  # Natal haengt nicht vom target_date ab
```

(Falls 2026-06-14/15 zufaellig denselben normalisierten Tagesvektor liefern — unwahrscheinlich,
Branch wechselt taeglich — einen Tag verschieben und im Report dokumentieren.)

```bash
uv run pytest -q tests/test_daily_elemental_comparison.py   # RED-Beweis
```

### 2.3 Implementation

**a) Neues Service-Modul `bazi_engine/services/daily_elements.py`** (eigene Datei — Radon-Gate,
`experience.py` nicht weiter aufblasen):

```python
"""daily_elements.py — daily_elemental_comparison (Issue #133).

daily  = avg( Wu-Xing der Transit-Planeten des Tages, Wu-Xing der Tages-Saeule ),
         Spiegel der Natal-Fusion (avg western/bazi in routers/experience.py).
natal  = der bereits fusionierte Natal-Vektor (profile_data["wuxing_vector"]).
difference = natal - daily (Konvention von fusion.elemental_comparison).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from ..bazi import pillar_from_index60, sexagenary_day_index_from_date
from ..constants import BRANCHES, STEMS
from ..transit import compute_transit_now
from ..wuxing import (
    WUXING_ORDER,
    calculate_wuxing_from_bazi,
    calculate_wuxing_vector_from_planets,
)

_TRANSIT_TO_BODY = {
    "sun": "Sun", "moon": "Moon", "mercury": "Mercury", "venus": "Venus",
    "mars": "Mars", "jupiter": "Jupiter", "saturn": "Saturn",
    "uranus": "Uranus", "neptune": "Neptune", "pluto": "Pluto",
}


def _transit_bodies(transit_planets: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """compute_transit_now()-Planeten → bodies-Shape von compute_western_chart()."""
    bodies: Dict[str, Dict[str, Any]] = {}
    for name, pdata in transit_planets.items():
        body = _TRANSIT_TO_BODY.get(name)
        if body is None:
            continue
        bodies[body] = {
            "longitude": pdata["longitude"],
            "is_retrograde": pdata.get("speed", 0.0) < 0,
        }
    return bodies


def compute_daily_elemental_comparison(
    natal_vector: Dict[str, float],
    target_date: str,
) -> Dict[str, Dict[str, float]]:
    """Pro Element {natal, daily, difference} fuer den Ziel-Tag.

    Kein Ascendant fuer das Transit-Feld (global, kein Ort) → Merkur als
    Tag-Chart-Element (Erde); dokumentierte, bewusste Vereinfachung.
    """
    dt = datetime.strptime(target_date, "%Y-%m-%d").replace(hour=12, tzinfo=timezone.utc)
    transit_data = compute_transit_now(dt)
    west_daily = calculate_wuxing_vector_from_planets(
        _transit_bodies(transit_data["planets"]), ascendant=None,
    ).normalize()

    pillar = pillar_from_index60(
        sexagenary_day_index_from_date(dt.year, dt.month, dt.day)
    )
    bazi_daily = calculate_wuxing_from_bazi({
        "day": {"stem": STEMS[pillar.stem_index], "branch": BRANCHES[pillar.branch_index]},
    }).normalize()

    out: Dict[str, Dict[str, float]] = {}
    for elem in WUXING_ORDER:
        w = getattr(west_daily, elem.lower())
        b = getattr(bazi_daily, elem.lower())
        daily = round((w + b) / 2, 3)
        natal = round(float(natal_vector.get(elem, 0.0)), 3)
        out[elem] = {"natal": natal, "daily": daily, "difference": round(natal - daily, 3)}
    return out
```

Prüfe vorab, dass `bazi_engine/bazi.py` `sexagenary_day_index_from_date` und
`pillar_from_index60` exportiert (werden bereits von `services/daily_eastern.py:8` so
importiert — gleiche Importzeile übernehmen).

**b) `bazi_engine/routers/experience.py`:**

Modelle (nach `DailyFusion`, ~Z. 230):

```python
class DailyElementalEntry(BaseModel):
    natal: float
    daily: float
    difference: float
```

`DailyResponse` additiv erweitern (nach `impact`-Feld):

```python
    daily_elemental_comparison: Optional[Dict[str, DailyElementalEntry]] = Field(
        default=None,
        description=(
            "Per-element (Holz/Feuer/Erde/Metall/Wasser): fused natal Wu-Xing vector vs the "
            "target date's daily field (avg of transit-planet and day-pillar vectors). "
            "difference = natal - daily (fusion elemental_comparison convention). "
            "None when the natal profile could not be computed. Additive (Issue #133)."
        ),
    )
```

Import oben ergänzen: `from ..services.daily_elements import compute_daily_elemental_comparison`.

Im Handler `experience_daily` (vor dem `return DailyResponse(...)`, neben dem Impact-Block):

```python
    daily_comparison = None
    if profile_data is not None:
        try:
            daily_comparison = compute_daily_elemental_comparison(
                natal_vector=profile_data["wuxing_vector"],
                target_date=body.target_date,
            )
        except Exception as exc:
            logger.error("daily_elemental_comparison failed: %s", exc)
```

und im Konstruktor: `daily_elemental_comparison=daily_comparison,`.

(`profile_data` ist im normalen Pfad immer gesetzt — `DailyRequest` hat keine
precomputed-Felder, `_daily_profile_context` rechnet daher immer; der `None`-Guard
deckt nur den theoretischen Precomputed-Pfad ab. Graceful degradation wie beim Impact-Block.)

### 2.4 SKIPPABLE Sub-Task 2b — Tages-Signalstufe (Kalibrierung)

Nur wenn 2.1–2.3 + Gates grün und Zeit bleibt; sonst als MISSING in den PR-Body. Additives
Optional-Feld `daily_signal` in `DailyResponse`: `calculate_harmony_index(natal_vec, daily_vec)`
(`wuxing/analysis.py:261`) zwischen fusioniertem Natal-Vektor (als `WuXingVector`) und
Tagesvektor, dann `calibrate_harmony` (`wuxing/calibration.py:135`) mit
`western_bodies=_transit_bodies(...)`, `bazi_pillars=` Natal-Pillars. Ausgeben:
`{h_raw, h_calibrated, interpretation_band, quality}`. Eigener Test + Commit
`feat(daily): calibrated daily_signal level (#133, optional)`. Ehrlichkeits-Hinweis in der
Field-Description: Baselines wurden fuer NATAL-Dichten kalibriert.

### 2.5 Gates + Commit

```bash
uv run pytest -q
uv run python scripts/export_openapi.py && uv run python scripts/export_openapi.py --check
uv run mypy bazi_engine --ignore-missing-imports && uv run ruff check bazi_engine/ \
  && uv run python scripts/check_complexity.py --check

git add bazi_engine/services/daily_elements.py bazi_engine/routers/experience.py \
        tests/test_daily_elemental_comparison.py spec/openapi/openapi.json
git commit -m "feat(daily): daily_elemental_comparison — natal vs target-date element field (#133)"
```

---

## Task 3 — B-012 Dayun

### 3a — Engine-Verifikation (KEIN Engine-Code noetig — nur belegen)

```bash
cd /Users/benjaminpoersch/Projects/FuFirE
uv run pytest -q tests/test_dayun_endpoint.py        # muss grün sein
# Live-Beleg (Key NICHT printen):
KEY=$(grep '^FUFIRE_API_KEY=' /Users/benjaminpoersch/Projects/New_Bazi/.env | cut -d= -f2-)
rtk proxy curl -s -X POST https://api.fufire.space/v1/calculate/bazi/dayun \
  -H "Content-Type: application/json" -H "X-API-Key: $KEY" \
  -d '{"date":"1987-07-04T21:30:00","tz":"Europe/Berlin","lat":52.52,"lon":13.405,"as_of_date":"2026-06-11","direction_method":"explicit","flow_direction":"forward","cycles":8}' \
  | head -c 400
```

Erwartung: HTTP 200, `dayun.cycles[8]`, `dayun.current`, `precision`, `provenance` —
Referenz-Shape: Landingpage-Fixture
`/Users/benjaminpoersch/Projects/SaaS/FuFirEProject/Fufire_API-landingpage/tests/fixtures/responses/post__v1_calculate_bazi_dayun.json`.
Ergebnis in den Report. Engine-seitig ist B-012 damit ERLEDIGT (bis auf Task 4b unten).

### 3b — New_Bazi-Client (SEPARATER Branch + PR im New_Bazi-Repo!)

**Erst NACH Abschluss des Engine-PRs ODER parallel in eigener Session.** Branch-Ritual aus dem
Master-Plan §1 (origin/main hart resetten!):

```bash
cd /Users/benjaminpoersch/Projects/New_Bazi
git checkout main && git fetch origin && git reset --hard origin/main
git checkout -b feat/sprint-p2b-dayun-client
npm run lint && npm test          # Baseline notieren (~223 Tests)
```

**Schritt 1 — Fixture zuerst (Engine-Schemas sind heterogen, NIE Shapes raten):**
`scripts/fufire-dump-fixtures.mts` um einen Dayun-Call erweitern (Muster der bestehenden Calls
kopieren) mit exakt dem Payload aus 3a; Ergebnis nach `src/__fixtures__/fufire/dayun.json`.
Ausfuehren, Fixture committen.

**Schritt 2 — Failing Tests (vitest, Mock-Muster fuer `FuFirEClient` aus `src/server/app.test.ts`):**

- gueltige Birth + `{ flowDirection: "forward" }` → 200; Body: `direction`, `cycles[8]` mit
  `{ sequence, ageStart, ageEnd, dateStart, dateEnd, pillar: { stem, branch, element, polarity }, relationToDayMaster, isCurrent }`,
  `current` (oder `null`), `precision`, `source: "fufire"` — gemockt mit Fixture aus Schritt 1.
- mit `{ sexAtBirth: "female" }` → Upstream-Payload (Mock-Spy) enthaelt
  `direction_method: "year_stem_yinyang_and_sex"` + `sex_at_birth: "female"`.
- OHNE `sexAtBirth` UND ohne `flowDirection` → 400 `{ error: "invalid_dayun_input" }`
  (Laufrichtung wird NICHT stillschweigend erfunden). Fehlende Werte → `null`, nie Defaults.

**Schritt 3 — Implementation (Touch-Points):**

1. `src/utils/fufireClient.ts` — Klasse `FuFirEClient` (Z. 190 ff., neben `postExperienceDaily`
   Z. 232): `static postDayun(payload)` → `request("/v1/calculate/bazi/dayun", payload)`.
2. `src/utils/fufirePayloadMappers.ts` — `buildDayunPayload(birth, opts)`: `date` als LOKALES
   ISO-Datetime (`${birth.date}T${birth.time}`), `tz/lat/lon`, `as_of_date` (heute), `cycles: 8`,
   und entweder `direction_method:"year_stem_yinyang_and_sex", sex_at_birth: opts.sexAtBirth`
   oder `direction_method:"explicit", flow_direction: opts.flowDirection`. Kein Feld erfinden —
   Request-Modell: FuFirE `bazi_engine/routers/dayun.py:49–101`.
3. `src/server/app.ts` — Stub Z. 469–474 ersetzen: `validateBirthInput` →
   `FuFirEClient.postDayun(...)` → `res.json(normalizeDayun(raw))`, Fehler via `sendError`.
   `normalizeDayun` neben `normalizeDaily` (Z. 144): nur Felder mappen, die die Fixture wirklich
   enthaelt (snake_case → camelCase), `semantic_summary` durchreichen, Fehlendes `null`.
4. Capability-Eintrag Z. 287: `upstream: "/v1/calculate/bazi/dayun"`,
   `status: fufire.url && fufire.key ? "server-used" : "missing"`, `source: "fufire"`.

**Schritt 4 — Gates + PR (New_Bazi):** `npm run lint && npm test && npm run build && npx playwright test`;
PR gegen `DYAI2025/New_Bazi` main, Titel `feat(dayun): BFF-Route /api/azodiac/bazi/dayun an FuFirE-Engine (B-012)`,
Body mit ehrlicher MISSING-Liste (z. B. „UI fuer Dayun-Tab folgt in spaeterem Sprint;
sexAtBirth wird noch nicht im Profil erhoben“). Review vor Merge (Master-Plan §6).
Nach Merge Live-Smoke: `rtk proxy curl -s -X POST https://newbazi-production.up.railway.app/api/azodiac/bazi/dayun -H "Content-Type: application/json" -d '{"name":"T","birthDate":"1987-07-04","birthTime":"21:30","birthPlace":"Berlin","lat":52.52,"lon":13.405,"tz":"Europe/Berlin","flowDirection":"forward"}'`
(Feldnamen an `validateBirthInput` anpassen — vorher in app.ts nachlesen!) → erwartet 200 + `cycles`.

---

## Task 4 — Unknown-Time-Contract

### 4.1 Exploration + Live-Fixture-Capture (Pflicht, je Endpoint)

Payloads mit Platzhalterzeit `12:00:00` und `birth_time_known: false`. Outputs unter
`/tmp/ut_*.json` sichern; relevante Ausschnitte kommen ins Contract-Dokument.

```bash
KEY=$(grep '^FUFIRE_API_KEY=' /Users/benjaminpoersch/Projects/New_Bazi/.env | cut -d= -f2-)
B='https://api.fufire.space'
H=(-H "Content-Type: application/json" -H "X-API-Key: $KEY")

# 1-3) bazi/western/fusion (date ist ISO-Datetime, birth_time_known top-level):
P='{"date":"1990-05-23T12:00:00","tz":"Europe/Berlin","lat":52.52,"lon":13.405,"birth_time_known":false}'
for EP in bazi western fusion; do rtk proxy curl -s -X POST $B/v1/calculate/$EP "${H[@]}" -d "$P" > /tmp/ut_$EP.json; done
# 4) bootstrap (experience.py — birth_time_known sitzt IN birth)
rtk proxy curl -s -X POST $B/v1/experience/bootstrap "${H[@]}" -d '{"birth":{"date":"1990-05-23","time":"12:00:00","tz":"Europe/Berlin","lat":52.52,"lon":13.405,"birth_time_known":false}}' > /tmp/ut_bootstrap.json
# 5) daily (wie 4, plus Sektoren + target_date)
rtk proxy curl -s -X POST $B/v1/experience/daily "${H[@]}" -d '{"birth":{"date":"1990-05-23","time":"12:00:00","tz":"Europe/Berlin","lat":52.52,"lon":13.405,"birth_time_known":false},"soulprint_sectors":[0.08,0.09,0.08,0.09,0.08,0.08,0.09,0.08,0.09,0.08,0.08,0.08],"quiz_sectors":[0.08,0.09,0.08,0.09,0.08,0.08,0.09,0.08,0.09,0.08,0.08,0.08],"target_date":"2026-06-14"}' > /tmp/ut_daily.json
# 6) Negativ-Probe: Zeit komplett weggelassen (erwartet 422, Shape dokumentieren)
rtk proxy curl -s -X POST $B/v1/calculate/bazi "${H[@]}" -d '{"date":"1990-05-23","tz":"Europe/Berlin","lat":52.52,"lon":13.405}' > /tmp/ut_bazi_no_time.json
# 7) dayun (HAT kein birth_time_known — Ist-Zustand belegen)
rtk proxy curl -s -X POST $B/v1/calculate/bazi/dayun "${H[@]}" -d '{"date":"1990-05-23T12:00:00","tz":"Europe/Berlin","lat":52.52,"lon":13.405,"direction_method":"explicit","flow_direction":"forward"}' > /tmp/ut_dayun.json
grep -o '"precision":[^}]*}' /tmp/ut_*.json
```

Falls Request-Shapes abweichen (422 wegen fehlender Pflichtfelder): exakte Shapes aus den
Router-Request-Modellen ablesen (`routers/bazi.py:49 ff.`, `routers/western.py:40 ff.`,
`routers/fusion.py:65 ff.`) — NICHT raten, anpassen, neu capturen.

### 4.2 Soll-Kontrakt (aus dem Code, Stand 2026-06-11 — gegen Captures verifizieren)

| Endpoint | `birth_time_known=false` → Verhalten | Quelle |
|---|---|---|
| `/v1/calculate/bazi` | 200; `precision.provisional_fields=["hour"]` | bazi.py:418–419 |
| `/v1/calculate/western` | 200; provisional `["ascendant","houses","mc"]` | western.py:109–110 |
| `/v1/calculate/fusion` | 200; provisional `["signature","hour","ascendant","houses"]` | fusion.py:164–165 |
| `/v1/experience/daily` | 200; `chart_type_quality` + `quality_flags.chart_type_quality` forced `"assumed_day"` | experience.py:665–695 |
| `/v1/experience/bootstrap` | **INKONSISTENZ:** Flag wird ignoriert, kein Quality-Signal trotz `ascendant_sign` | experience.py (kein Verwender) |
| `/v1/calculate/bazi/dayun` | **INKONSISTENZ:** kein Request-Flag; `precision.birth_time_known` hartkodiert `true` | dayun.py:330–338 |
| Zeit fehlt ganz (kein Platzhalter) | 422 Validation Error (Pflichtfeld) — Shape im Capture | Pydantic |

### 4.3 Fix A (TDD): Bootstrap bekommt `chart_type_quality`

RED — neue Datei `tests/test_bootstrap_unknown_time.py` (env/client-Fixtures wie in 2.2):

```python
def _bootstrap_body(known: bool) -> dict:
    return {"birth": {"date": "1990-05-23", "time": "12:00:00", "tz": "Europe/Berlin",
                      "lat": 52.52, "lon": 13.405, "birth_time_known": known}}


def test_bootstrap_unknown_time_flags_assumed_day(client):
    r = client.post("/v1/experience/bootstrap", json=_bootstrap_body(False))
    assert r.status_code == 200
    assert r.json()["chart_type_quality"] == "assumed_day"


def test_bootstrap_known_time_is_exact(client):
    r = client.post("/v1/experience/bootstrap", json=_bootstrap_body(True))
    assert r.status_code == 200
    assert r.json()["chart_type_quality"] == "exact"
```

GREEN — `routers/experience.py`: `BootstrapResponse` additiv erweitern:

```python
    chart_type_quality: Literal["exact", "assumed_day"] = Field(
        default="assumed_day",
        description=(
            "Trust signal for ascendant_sign/houses-dependent values: 'assumed_day' "
            "when birth_time_known=false or no ascendant was computed."
        ),
    )
```

In `experience_bootstrap` (vor dem `return`):

```python
    ledger = (profile_data.get("fusion") or {}).get("contribution_ledger") or {}
    raw_quality = ledger.get("chart_type_quality", "assumed_day")
    chart_type_quality = raw_quality if raw_quality in ("exact", "assumed_day") else "assumed_day"
    if body.birth.birth_time_known is False:
        chart_type_quality = "assumed_day"
```

und `chart_type_quality=chart_type_quality,` in den Konstruktor.

### 4.4 Fix B (TDD): Dayun bekommt `birth_time_known`

RED — an `tests/test_dayun_endpoint.py` anhaengen (vorhandene Fixtures/Helper der Datei nutzen;
erst lesen, dann das dortige Request-Builder-Muster kopieren):

```python
def test_dayun_birth_time_unknown_marks_provisional(client):
    body = {"date": "1990-05-23T12:00:00", "tz": "Europe/Berlin", "lat": 52.52, "lon": 13.405,
            "direction_method": "explicit", "flow_direction": "forward",
            "birth_time_known": False}
    r = client.post("/v1/calculate/bazi/dayun", json=body)
    assert r.status_code == 200
    prec = r.json()["precision"]
    assert prec["birth_time_known"] is False
    assert "start.start_age" in prec["provisional_fields"]
```

GREEN — `routers/dayun.py`:
1. `DayunRequest` + Feld `birth_time_known: bool = Field(True, description="False if birth time is uncertain — start-age/decade boundaries become provisional")`.
2. Precision-Block (Z. 330–338) ersetzen:

```python
            "precision": {
                "birth_time_known": req.birth_time_known,
                "direction_basis": req.direction_method,
                "provisional_fields": [] if req.birth_time_known else [
                    "start.delta", "start.start_age",
                    "cycles[].age_start", "cycles[].age_end",
                    "cycles[].date_start", "cycles[].date_end", "current",
                ],
            },
```

3. **Schema-Gegencheck (Pflicht):** `schemas/calculate/bazi/dayun.request.schema.json` und
   `...response.schema.json` lesen. Falls `provisional_fields` dort enum-beschraenkt ist oder
   `additionalProperties:false` das neue Request-Feld blockt → Schema-Dateien mitziehen
   (gleicher Commit) und `uv run pytest -q tests/test_dayun_endpoint.py` (validiert Response
   gegen das Schema) erneut laufen lassen.

### 4.5 Contract-Dokument

Neue Datei **im FuFirE-Repo**: `docs/contracts/unknown-time.md` mit: (a) der Tabelle aus 4.2
in der NACH-Fix-Fassung (Bootstrap + Dayun korrigiert), (b) Regel „Zeit ist immer Pflichtfeld;
unbekannte Zeit = Platzhalter `12:00:00` + `birth_time_known:false`“, (c) je Endpoint ein
gekuerztes echtes Response-Beispiel aus den Captures (4.1), (d) 422-Beispiel fuer fehlende Zeit,
(e) Konsumenten-Hinweis (New_Bazi P4 baut darauf den UI-Toggle). Keine Versprechen ueber
nicht implementiertes Verhalten.

### 4.6 Gates + Commits

```bash
uv run pytest -q
uv run python scripts/export_openapi.py && uv run python scripts/export_openapi.py --check
uv run mypy bazi_engine --ignore-missing-imports && uv run ruff check bazi_engine/ \
  && uv run python scripts/check_complexity.py --check
```

Drei Commits (jeweils nur die zugehoerigen Dateien stagen):
`fix(experience): bootstrap surfaces chart_type_quality for unknown birth time` —
`feat(dayun): birth_time_known request flag + provisional precision fields` —
`docs: unknown-time contract across bazi/western/fusion/bootstrap/daily/dayun`.

---

## Abschluss — PR, CI, Live-Verify

### PR (Engine)

```bash
cd /Users/benjaminpoersch/Projects/FuFirE
git push -u origin feat/sprint-p2-daily-field-dayun
gh pr create --repo DYAI2025/FuFirE --base main \
  --title "feat(daily): date-sensitive western daily, daily_elemental_comparison (#133), unknown-time contract" \
  --body "$(cat <<'EOF'
## Sprint P2 (Engine-Track)

- B-003: Western-Daily nutzt Fast-Mover-Gewichte + tagesgekeyte Textvarianten; evidence.moon_sector additiv. RED/GREEN-Beweise im Plan-Report.
- #133: DailyResponse additiv um daily_elemental_comparison (natal/daily/difference je Element, German keys, difference = natal - daily wie fusion.elemental_comparison). Closes #133.
- Unknown-Time: bootstrap.chart_type_quality, dayun.birth_time_known + provisional_fields, docs/contracts/unknown-time.md.
- Spec-Snapshot regeneriert (export_openapi.py), alle Aenderungen additiv — BootstrapResponse/DailyResponse rueckwaertskompatibel (Landingpage + New_Bazi konsumieren beide).

## MISSING (ehrlich)
- daily_signal (kalibrierte Tages-Signalstufe, Sub-Task 2b): <umgesetzt|ausgelassen — Grund>
- B-012 Client-Seite laeuft als separater New_Bazi-PR (feat/sprint-p2b-dayun-client).
- Die UI-Beobachtung "byte-identische Tagespuls-Texte" war engine-seitig nur fuer den Western-Teil reproduzierbar; Rest vermutlich New_Bazi-Deploy-Lag (PR #16) — Re-Check in P9.
EOF
)"
gh pr checks --watch    # CI: test (3.10/3.11/3.12) + lint + typecheck + complexity + codegen
```

KEIN Merge ohne Review (Master-Plan §6). Review-Agent prueft Spec-Treue, keine gelockerten
Tests, Anti-Reification in allen neuen Strings, Gates selbst nachgefahren.

### Post-Merge Live-Verify (Railway deployt main automatisch → api.fufire.space)

`/health`-Version beweist KEINE Frische (statischer String!) — Frische ueber neue Felder pruefen.
5–10 Min nach Merge:

```bash
KEY=$(grep '^FUFIRE_API_KEY=' /Users/benjaminpoersch/Projects/New_Bazi/.env | cut -d= -f2-)
B='https://api.fufire.space'; H=(-H "Content-Type: application/json" -H "X-API-Key: $KEY")
DAILY='{"birth":{"date":"1990-05-23","time":"14:30:00","tz":"Europe/Berlin","lat":52.52,"lon":13.405},"soulprint_sectors":[0.08,0.09,0.08,0.09,0.08,0.08,0.09,0.08,0.09,0.08,0.08,0.08],"quiz_sectors":[0.08,0.09,0.08,0.09,0.08,0.08,0.09,0.08,0.09,0.08,0.08,0.08]'

# 1) Neues Feld vorhanden + Tagesvariation (zwei Daten):
rtk proxy curl -s -X POST $B/v1/experience/daily "${H[@]}" -d "${DAILY},\"target_date\":\"2026-06-14\"}" > /tmp/lv_a.json
rtk proxy curl -s -X POST $B/v1/experience/daily "${H[@]}" -d "${DAILY},\"target_date\":\"2026-06-20\"}" > /tmp/lv_b.json
uv run python3 -c "
import json
a=json.load(open('/tmp/lv_a.json')); b=json.load(open('/tmp/lv_b.json'))
assert a['daily_elemental_comparison'] and set(a['daily_elemental_comparison'])=={'Holz','Feuer','Erde','Metall','Wasser'}, 'Feld fehlt -> Deploy alt?'
assert a['western']['summary'] != b['western']['summary'], 'B-003 live NICHT gefixt'
assert a['western']['evidence'] != b['western']['evidence']
assert a['daily_elemental_comparison'] != b['daily_elemental_comparison']
print('LIVE OK: daily variiert, elemental_comparison vorhanden')"

# 2) Bootstrap-Quality-Flag:
rtk proxy curl -s -X POST $B/v1/experience/bootstrap "${H[@]}" -d '{"birth":{"date":"1990-05-23","time":"12:00:00","tz":"Europe/Berlin","lat":52.52,"lon":13.405,"birth_time_known":false}}' | grep -o '"chart_type_quality":"assumed_day"'
# 3) Dayun-Precision:
rtk proxy curl -s -X POST $B/v1/calculate/bazi/dayun "${H[@]}" -d '{"date":"1990-05-23T12:00:00","tz":"Europe/Berlin","lat":52.52,"lon":13.405,"direction_method":"explicit","flow_direction":"forward","birth_time_known":false}' | grep -o '"birth_time_known":false'
# 4) Regression: bestehender Konsument (Landingpage-Proxy) — ein Alt-Feld stichprobenartig:
rtk proxy curl -s -X POST $B/v1/experience/daily "${H[@]}" -d "${DAILY},\"target_date\":\"2026-06-14\"}" | grep -o '"chart_type_quality"' | head -1
```

Alle vier Checks + Railway-Runtime-Logs (Fehlerfreiheit) im Report dokumentieren.
Schlaegt Check 1 fehl („Feld fehlt“): Railway-Deploy pruefen (Master-Plan-Falle: „Online“
zeigt auch den ALTEN Build) — `railway logs`/Dashboard, ggf. Redeploy anstossen.

### Follow-ups (in den Report uebernehmen)

1. **New_Bazi P9 (Daily-Hub) konsumiert `daily_elemental_comparison`** fuer den echten
   Tages-Achsen-Shift des Spannungsnavigators (`deriveTension()` erwartet dieselbe Shape wie
   `elemental_comparison`) — die Shape aus Task 2 ist der Contract.
2. Live-Re-Check der „byte-identischen“ Tagespuls-Texte in der New_Bazi-UI NACH Deploy von
   New_Bazi PR #16 + diesem Engine-PR (P9/B-003-Abschluss).
3. P4 (Unknown-Time-UI) baut auf `docs/contracts/unknown-time.md` auf.
4. Falls Sub-Task 2b ausgelassen: FuFirE-Issue „daily_signal calibration“ anlegen.
