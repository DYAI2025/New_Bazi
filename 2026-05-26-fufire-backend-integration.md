# FuFirE Backend Integration Dev Brief

GPT: AstroAPP LiveAgent Project and Astro Precision Analyst

26.05.2026 / 00:00 Uhr

Topic: Vollstaendige FuFirE-Backend-Anbindung an Bazodiac Frontend

## Kurzbefund

Das aktuelle `new_bazodiac-1-main (2)` ist **teilweise vorbereitet**, aber noch nicht sauber produktionsfaehig integriert.

Wesentliche Gaps:

BereichIstSoll

FuFirE Clientvorhanden, aber ohne `X-API-Key`, ohne `/v1`, ohne sauberes Error Mappingserverseitiger Auth-Client mit `/v1/*`, Timeout, API-Key, Fehlerklassifikation

Profil`/api/azodiac/profile` nutzt FuFirE nur optional, sonst lokale SimulationFuFirE ist Produktdatenquelle; lokaler Fallback nur explizit als Dev-Fallback

GeocodingPlaces vorhanden, aber Mock-Fallbacks und `/api/geocode` kann weiter Muenchen liefernechte Places/Details/Timezone oder klarer Missing-State

Secrets`.env.example` enthaelt nur Gemini/App URLRailway-ready Secrets fuer FuFirE, Google, Timeouts, Feature Flags

Railway`PORT = 3000` hardcoded`process.env.PORT

Dailylokal generiertFuFirE `/v1/experience/bootstrap` + `/v1/experience/daily`

Synastrylokal generiertmindestens zwei FuFirE-Profile + klar markierter lokaler Vergleich, bis FuFirE-Synastry existiert

DayunPlaceholder`missing-capability` oder echter Endpunkt, sobald FuFirE ihn liefert

Provenienzteils poetisch/irrefuehrendklare Source: `fufire`, `fufire-orchestrated`, `fallback-local`, `missing`

---

# Goal

<!-- GOAL_START -->

Goal: FuFirE als produktive Datenquelle fuer Bazodiac anbinden

Ziel. Das Bazodiac Frontend soll seine Western-, BaZi-, Wu-Xing-, Fusion-, Tagespuls- und Provenienz-Daten ueber eine sichere Backend-for-Frontend-Schicht aus FuFirE beziehen. Lokale Demo-/Fallback-Berechnungen duerfen nicht mehr als Produktwahrheit erscheinen. Eingaben werden validiert, Orte serverseitig aufgeloest und alle UI-Bereiche erhalten ein stabiles ProfileViewModel mit klarer Source- und Missing-State-Logik.

Scope. Branch: `feat/fufire-backend-integration`. Betroffen: `server.ts`, `src/utils/fufireClient.ts`, `src/utils/fufireNormalizer.ts`, `src/utils/mapsService.ts`, `src/api/bazodiacClient.ts`, `src/types.ts`, `src/viewmodels/profileViewModel.ts`, Eingabeformular, Methode-/Fusion-/Haeuser-/Daily-Komponenten, `.env.example`, Tests und QA-Doku. Backend bleibt Same-Origin BFF; Browser ruft FuFirE nie direkt.

Bedingungen (hart).

TDD-first fuer Client, Validator, Normalizer und API-Routen.

Keine Secrets im Browser, keine `VITE_*`-Secrets.

Kein Mock-Muenchen, keine Demo-Namen, keine Fake-0-Grad-Werte, keine lokale Produktberechnung ohne sichtbares `fallback-local`.

Jede Iteration endet mit `npm test`, `npm run lint`, `npm run build`, Playwright-Live-Test, Screenshots und Code Review; Review-Fix-Review bis 0 Critical/Major Findings.

Akzeptanzkriterien.

`/api/azodiac/profile` ruft FuFirE `/v1/chart` oder dokumentiert orchestriert `/v1/calculate/*` und liefert ein normalisiertes ProfileViewModel.

`FuFirEClient` nutzt `FUFIRE_API_URL`, `FUFIRE_API_KEY`, `/v1/*`, Timeout und sicheres Error Mapping.

Places/Timezone laufen serverseitig; Chart-Submit ist ohne validierte `lat`, `lon`, `tz` blockiert.

Methode zeigt echte Endpoint-Capabilities, Source und Fallback-Status ohne Secrets.

Fusion erklaert Kohärenzindex und fuehrt Western, BaZi und Wu-Xing zusammen.

Explizit out-of-scope.

Keine FuFirE-Engine-Neuberechnung im Frontend.

Keine DB-Migration.

Keine neue LLM-Deutung als Kernlogik.

Keine echte Dayun-Berechnung, solange FuFirE keinen stabilen Endpunkt liefert.

Keine direkte Browser-FuFirE-Anbindung.

Done-Definition. Abgeschlossen ist die Integration nur mit gruenen Tests, Railway-kompatibler Env-Doku, Playwright-Screenshots, sicherem Secret Handling, echter FuFirE-Provenienz und Code Review ohne Critical/Major Findings.

Reference-Doc: `docs/plans/2026-05-26-fufire-backend-integration.md`

<!-- GOAL_END -->

---

# Integrations-Dev-Brief fuer Coding Agent

## 1. Evidence Boundary

Gepruefter Stand aus `new_bazodiac-1-main (2).zip`:

React/Vite/Express-App.

`server.ts` enthaelt App-Endpunkte.

`src/utils/fufireClient.ts` existiert, ist aber unvollstaendig.

`src/utils/fufireNormalizer.ts` existiert und normalisiert lokale/Raw-Daten.

`src/utils/mapsService.ts` existiert mit Google-API plus Mock-Fallback.

`src/App.tsx` startet noch mit `Benjamin Poersch` als Default-Profil.

`server.ts` nutzt `PORT = 3000`.

`.env.example` enthaelt keine FuFirE-/Google-/Railway-Integration.

Nicht live geprueft:

echte FuFirE-Deployment-URL,

echte FuFirE-Response-Shapes,

echte API-Key-Policy im laufenden FuFirE-Service,

Railway Preview Runtime.

---

## 2. Zielarchitektur

`React Frontend
  -> BazodiacClient
    -> Same-Origin Express API
      -> Validation Layer
      -> Places/Timezone Layer
      -> FuFirEClient
        -> FuFirE /v1/chart
        -> FuFirE /v1/calculate/western
        -> FuFirE /v1/calculate/bazi
        -> FuFirE /v1/calculate/wuxing
        -> FuFirE /v1/calculate/fusion
        -> FuFirE /v1/calculate/tst
        -> FuFirE /v1/experience/bootstrap
        -> FuFirE /v1/experience/daily
      -> normalizeFuFireProfile()
        -> ProfileViewModel
          -> Overview / Western / BaZi / Wu-Xing / Fusion / Daily / Synastry / Methode`

## 3. Harte Architekturregeln

Browser ruft **nur** `/api/*` im eigenen Backend.

FuFirE API-Key liegt **nur** in Railway Server Env.

Google Maps Key liegt **nur** in Railway Server Env.

Lokale Astrology Engine ist kein Produktpfad.

Fehlende Daten werden als `missing` markiert.

Fallbacks muessen sichtbar sein.

Keine stillen Default-Orte, keine stillen Default-Zeitzonen.

---

# 4. Endpunkt-Gap-Analyse

## 4.1 Bestehende App-Endpunkte

App-EndpunktIstGapZiel

`GET /api/config`statisch, `fufireConnected` booleankeine echte Capability-Matrixzeigt Secrets als Booleans, FuFirE Health, Provider-Status, Upstream-Mapping

`GET /api/health`nur App okFuFirE nicht geprueftApp Health + FuFirE Health getrennt

`POST /api/places/autocomplete`vorhandenMock-Fallback erlaubt ProduktillusionProvider strikt oder klarer Dev-Mock-Status

`POST /api/places/details`vorhandenMock-Fallback erlaubt Produktillusionechte Details oder 503 `missing_places_key`

`POST /api/timezone`vorhandenMock-Zeitzoneechte Timezone oder 503

`POST /api/geocode`kann weiter Muenchen liefernkritischer Altpfadentfernen oder echte Delegation; kein Default-Muenchen

`POST /api/azodiac/profile`optional FuFirE, sonst localProduktquelle unklarFuFirE-first, local nur explizit dev fallback

`POST /api/azodiac/fusion`optional FuFirE chart, sonst localnicht gezielt `/fusion`eigene FuFirE-Fusion-Route oder Chart-Fusiondaten

`POST /api/azodiac/synastry`lokalkeine FuFirE-Profilezwei FuFirE-Profile + lokaler Vergleich klar markiert

`POST /api/azodiac/daily`lokalkeine FuFirE Experience`/experience/bootstrap` + `/experience/daily`

`POST /api/azodiac/bazi/dayun`Placeholderfalsches Erwartungsmanagement`missing-capability` bis FuFirE Dayun liefert

---

## 4.2 Zu implementierende bzw. zu korrigierende Endpunkte

RouteZweckUpstream

`GET /api/fufire/health`FuFirE-Verfuegbarkeit pruefen`GET {FUFIRE_API_URL}/v1/health`

`GET /api/fufire/capabilities`BFF-Capability-Matrixlokale Config + optionale Probes

`POST /api/azodiac/profile`Hauptprofilbevorzugt `/v1/chart`

`POST /api/azodiac/western`Western Details`/v1/calculate/western`

`POST /api/azodiac/bazi`BaZi Details`/v1/calculate/bazi`

`POST /api/azodiac/wuxing`Wu-Xing Details`/v1/calculate/wuxing`, `/v1/info/wuxing-mapping`

`POST /api/azodiac/fusion`Fusion Reiter`/v1/calculate/fusion` oder `/v1/chart.fusion`

`POST /api/azodiac/daily`Tagespuls`/v1/experience/bootstrap`, `/v1/experience/daily`

`POST /api/azodiac/synastry`Beziehungzwei FuFirE-Profile + lokaler Vergleich, Source sichtbar

`POST /api/azodiac/bazi/dayun`Da Yun`missing-capability`, bis FuFirE-Endpunkt belegt ist

---

# 5. Railway Secrets und Env

## 5.1 `.env.example` erweitern

env

`NODE_ENV=development
APP_URL=http://localhost:3000

FUFIRE_API_URL=http://localhost:8000
FUFIRE_API_KEY=replace_me
FUFIRE_API_VERSION=v1
REQUEST_TIMEOUT_MS=12000
ENABLE_LOCAL_ASTROLOGY_FALLBACK=false
ENABLE_DEMO_PROFILES=false

GOOGLE_MAPS_API_KEY=replace_me

GEMINI_API_KEY=replace_me_optional`

## 5.2 Railway Variables

`NODE_ENV=production
APP_URL=https://<bazodiac-railway-domain>
FUFIRE_API_URL=https://<fufire-railway-domain>
FUFIRE_API_KEY=<secret>
FUFIRE_API_VERSION=v1
REQUEST_TIMEOUT_MS=12000
ENABLE_LOCAL_ASTROLOGY_FALLBACK=false
ENABLE_DEMO_PROFILES=false
GOOGLE_MAPS_API_KEY=<secret>
GEMINI_API_KEY=<optional-secret>`

## 5.3 Verboten

`VITE_FUFIRE_API_KEY
VITE_GOOGLE_MAPS_API_KEY
VITE_GEMINI_API_KEY`

Alles mit `VITE_*` ist fuer Browser-Bundles sichtbar.

---

# 6. Technische Umsetzung

## TASK-001: Railway-Port und Env-Basis korrigieren

**Objective:** Deployment faehig machen.

**Files/modules:**

Modify: `server.ts`

Modify: `.env.example`

**Steps:**

Test oder Build-Check fuer `process.env.PORT` vorbereiten.

Ersetze `const PORT = 3000` durch:

TypeScript

`const PORT = Number(process.env.PORT || 3000);`

`.env.example` um FuFirE/Google/Railway-Variablen erweitern.

Keine echten Secrets eintragen.

**Acceptance Criteria:**

Server nutzt Railway Port.

`.env.example` dokumentiert alle benoetigten Variablen.

Keine Secrets im Repo.

**Validation:**

Bash

`npm run build
npm run lint`

---

## TASK-002: FuFirEClient produktionsfaehig machen

**Objective:** FuFirE-Aufrufe sicher, authentifiziert und versioniert ausfuehren.

**Files/modules:**

Modify: `src/utils/fufireClient.ts`

Test: `src/utils/fufireClient.test.ts`

**TDD Steps:**

Test: fehlende `FUFIRE_API_URL` blockiert mit `missing_fufire_url`.

Test: fehlende `FUFIRE_API_KEY` blockiert mit `missing_fufire_key`.

Test: Request nutzt `/v1/*`.

Test: Header enthaelt `X-API-Key`.

Test: 401/403/422/429/5xx werden sicher gemappt.

Implementiere Client.

**Required API methods:**

TypeScript

`getHealth()
postChart(payload)
postWestern(payload)
postBazi(payload)
postWuxing(payload)
postFusion(payload)
postTst(payload)
getWuxingMapping()
postExperienceBootstrap(payload)
postExperienceDaily(payload)`

**Error Mapping:**

UpstreamApp Error

missing URL`missing_fufire_url`

missing key`missing_fufire_key`

401/403`fufire_auth_failed`

422`invalid_fufire_payload`

429`fufire_rate_limited`

5xx/timeout`fufire_unavailable`

---

## TASK-003: BirthInput serverseitig validieren

**Objective:** Keine FuFirE-Calls mit unvollstaendigen Daten.

**Files/modules:**

Create: `src/utils/birthInputValidation.ts`

Modify: `server.ts`

Test: `src/utils/birthInputValidation.test.ts`

**Acceptance Criteria:**

Name: 2-80 Zeichen, keine Demo-Namen.

Datum: gueltig, nicht Zukunft.

Zeit: `HH:mm`.

Ort: `placeId`, `lat`, `lon`, `tz` vorhanden.

`lat/lon` in gueltigem Bereich.

Fehler als HTTP 400 mit Feldhinweisen.

---

## TASK-004: Places/Timezone strict machen

**Objective:** Kein Mock-Ort im Produktpfad.

**Files/modules:**

Modify: `src/utils/mapsService.ts`

Modify: `server.ts`

Test: `src/utils/mapsService.test.ts`

**Acceptance Criteria:**

Ohne `GOOGLE_MAPS_API_KEY`:

Production: 503 `missing_places_key`.

Test/Dev nur mit explizitem `ENABLE_DEMO_PROFILES=true` oder Test-Mock.

`/api/geocode` liefert nie Default-Muenchen.

Timezone nutzt Geburtsdatum-Zeit als Timestamp, nicht zwingend aktuelle Zeit.

`tz` ist IANA-ID.

---

## TASK-005: `/api/azodiac/profile` auf FuFirE umstellen

**Objective:** Hauptprofil kommt aus FuFirE.

**Files/modules:**

Modify: `server.ts`

Modify: `src/utils/fufireNormalizer.ts`

Test: `src/utils/fufireNormalizer.test.ts`

Test: API route tests, falls Harness vorhanden; sonst Vitest mit mocked client.

**Implementation:**

Mappe BirthData zu FuFirE Chart Payload:

TypeScript

`{
  local_datetime: `${birthDate}T${birthTime}:00`,
  tz_id: birthData.tz,
  geo_lat_deg: birthData.lat,
  geo_lon_deg: birthData.lon,
  time_standard: "CIVIL",
  day_boundary: "midnight",
  include_validation: true
}`

Rufe `FuFirEClient.postChart()`.

Wenn `/v1/chart` unvollstaendig:

orchestriere `postWestern`, `postBazi`, `postWuxing`, `postFusion`, `postTst`.

Normalisiere zu `ProfileViewModel`.

Setze Source:

`fufire-chart`

`fufire-orchestrated`

`missing`

`fallback-local` nur wenn explizit erlaubt.

**Acceptance Criteria:**

Ohne FuFirE Config keine lokale Produktberechnung.

Bei Config-Fehler klare 503.

Bei FuFirE-Fehler klare 502/503.

ViewModel enthaelt `provenance`.

---

## TASK-006: Detail-Endpunkte anbinden

**Objective:** Frontend kann gezielte Detaildaten abrufen.

**Routes:**

`POST /api/azodiac/western`

`POST /api/azodiac/bazi`

`POST /api/azodiac/wuxing`

`POST /api/azodiac/fusion`

**Acceptance Criteria:**

Jede Route validiert BirthInput.

Jede Route ruft passenden FuFirE-Endpunkt.

Jede Route gibt normalisiertes Teil-ViewModel zurueck.

Keine lokale Berechnung ohne Source-Label.

---

## TASK-007: Tagespuls an FuFirE Experience anbinden

**Objective:** Daily Pulse nicht lokal generieren.

**Files/modules:**

Modify: `server.ts`

Modify: `src/api/bazodiacClient.ts`

Test: daily endpoint test

**Flow:**

`POST /api/azodiac/daily
  -> validate BirthInput
  -> FuFirE /v1/experience/bootstrap
  -> FuFirE /v1/experience/daily
  -> DailyPulseViewModel`

**Acceptance Criteria:**

`qiResonance`, `dominantPhase`, `description` kommen nicht aus lokalem Satzbau.

Fehlende FuFirE Experience erzeugt Missing-State.

---

## TASK-008: Synastry ehrlich integrieren

**Objective:** Beziehung ohne Fake-FuFirE behaupten.

**Flow:**

`POST /api/azodiac/synastry
  -> validate both profiles
  -> fetch/normalize FuFirE profile A
  -> fetch/normalize FuFirE profile B
  -> local synastry adapter uses normalized profiles
  -> source: "fufire-profiles-local-comparison"`

**Acceptance Criteria:**

Keine `getRawSimulatedProfileFromLocal` im Produktpfad.

UI zeigt: Profile aus FuFirE, Vergleich lokal abgeleitet.

Wenn FuFirE-Synastry spaeter existiert, Capability kann umgestellt werden.

---

## TASK-009: Dayun Missing-Capability korrigieren

**Objective:** Kein falscher Placeholder.

**Acceptance Criteria:**

Response:

JSON

`{
  "available": false,
  "status": "missing-capability",
  "source": "missing",
  "message": "Da Yun ist nicht berechenbar, weil FuFirE aktuell keinen stabilen Dayun-Endpunkt liefert."
}`

Keine Formulierung wie `kaiserliches Kalendersystem` oder `kommende Version`.

---

## TASK-010: Config, Health und Methode-Capability-Matrix

**Objective:** Transparente Endpoint-Steuerung.

`GET /api/config`** soll liefern:**

JSON

`{
  "status": "operational",
  "fufire": {
    "baseUrlConfigured": true,
    "apiKeyConfigured": true,
    "versionPrefix": "v1",
    "health": "ok|error|unknown"
  },
  "places": {
    "provider": "google",
    "apiKeyConfigured": true
  },
  "capabilities": [
    {
      "feature": "profile",
      "appEndpoint": "/api/azodiac/profile",
      "upstream": "/v1/chart",
      "status": "server-used",
      "source": "fufire"
    }
  ]
}`

**Acceptance Criteria:**

Keine Secrets.

Keine irrefuehrenden `unused`.

`fallback-local` nur wenn wirklich aktiv.

---

# 7. Validation Strategy

## Pflichtbefehle

Bash

`npm test
npm run lint
npm run build`

## Playwright Pflicht

Falls Playwright nicht vorhanden ist, zuerst einrichten.

Szenarien:

App startet ohne Benjamin/default Profile.

Input blockiert Submit ohne validen Ort.

Places Flow mit Mock Provider im Test.

Profilberechnung ruft `/api/azodiac/profile`.

Mocked FuFirE Response wird zu Overview gerendert.

Fusion-Reiter zeigt Kohärenzindex-Erklaerung.

Haeuserdaten erscheinen oder Missing-State.

Methode zeigt Capability Matrix.

Missing `FUFIRE_API_KEY` zeigt sicheren Fehler.

Light/Dark lesbar.

Screenshots:

`docs/qa/screenshots/fufire-backend-integration/
  input-empty.png
  input-place-selected.png
  overview-fufire-source.png
  fusion-tab.png
  houses-section.png
  methodology-capabilities.png
  missing-fufire-secret.png`

---

# 8. One-Shot Prompt fuer Coding Agent

`Du arbeitest im Repo new_bazodiac-1-main. Ziel: Vollstaendige Backend-for-Frontend-Anbindung der FuFirE API an das Bazodiac Frontend. Entferne lokale Produktberechnung, Mock-Geocoding und Demo-Daten als Produktpfade. Browser ruft niemals FuFirE direkt; alle FuFirE- und Google-Secrets bleiben serverseitig.

Erster Schritt: Repo pruefen, Tests laufen lassen, dann TDD-first arbeiten. Keine Direktcommits auf main, keine Secrets, keine hardcodierten astrologischen Werte.

Implementiere:

1) Railway/Env
- server.ts: const PORT = Number(process.env.PORT || 3000)
- .env.example erweitern:
  NODE_ENV, APP_URL, FUFIRE_API_URL, FUFIRE_API_KEY, FUFIRE_API_VERSION=v1, REQUEST_TIMEOUT_MS=12000, ENABLE_LOCAL_ASTROLOGY_FALLBACK=false, ENABLE_DEMO_PROFILES=false, GOOGLE_MAPS_API_KEY, optional GEMINI_API_KEY.
- Keine VITE_* Secrets.

2) FuFirEClient
- src/utils/fufireClient.ts neu haerten.
- Nutze FUFIRE_API_URL + /v1 Prefix und Header X-API-Key.
- Implementiere getHealth, postChart, postWestern, postBazi, postWuxing, postFusion, postTst, getWuxingMapping, postExperienceBootstrap, postExperienceDaily.
- Error Mapping: missing URL/key = 503, 401/403 auth failed, 422 invalid payload, 429 rate limited, timeout/5xx unavailable.
- Schreibe Tests fuer Header, /v1 Pfad, Missing Secret, 401/422/5xx.

3) Input Validation
- BirthData muss name, birthDate, birthTime, birthPlaceLabel/placeId, lat, lon, tz enthalten.
- Validiere serverseitig: Name 2-80, keine Demo-Namen, Datum gueltig/nicht Zukunft, Zeit HH:mm, lat/lon Range, tz IANA vorhanden.
- Ohne valide Daten kein FuFirE Call.

4) Places/Timezone
- /api/places/autocomplete, /api/places/details, /api/timezone serverseitig.
- Ohne GOOGLE_MAPS_API_KEY in Production 503 missing_places_key.
- /api/geocode darf kein Default-Muenchen mehr liefern; entfernen oder echte Delegation.

5) Profil
- /api/azodiac/profile validiert BirthInput.
- Primaer FuFirE /v1/chart.
- Wenn /v1/chart unvollstaendig: orchestriere /v1/calculate/western, /v1/calculate/bazi, /v1/calculate/wuxing, /v1/calculate/fusion, /v1/calculate/tst, /v1/info/wuxing-mapping.
- normalizeFuFireProfile erstellt ProfileViewModel mit source/provenance/warnings.
- Lokaler Fallback nur wenn ENABLE_LOCAL_ASTROLOGY_FALLBACK=true; dann UI source=fallback-local.

6) Detail-Endpunkte
- Baue /api/azodiac/western, /api/azodiac/bazi, /api/azodiac/wuxing, /api/azodiac/fusion.
- Jede Route validiert Input, ruft passenden FuFirE-Endpunkt und gibt normalisiertes Teil-ViewModel.

7) Daily
- /api/azodiac/daily nutzt /v1/experience/bootstrap und /v1/experience/daily.
- Keine lokale generische Tagesbeschreibung im Produktpfad.

8) Synastry
- Hole beide Profile via FuFirE.
- Lokaler Vergleich darf bleiben, aber source=fufire-profiles-local-comparison.
- Kein getRawSimulatedProfileFromLocal im Produktpfad.

9) Dayun
- /api/azodiac/bazi/dayun gibt missing-capability, solange kein stabiler FuFirE Dayun-Endpunkt belegt ist.
- Kein Fake-Wert, kein "kommende Version", keine mystische Placeholder-Sprache.

10) Config/Health/Methodik
- /api/health zeigt App Health + FuFirE Health.
- /api/config zeigt baseUrlConfigured, apiKeyConfigured, versionPrefix, places configured, capabilities.
- Methode-Seite zeigt Capability Matrix: Feature, App-Endpunkt, FuFirE-Upstream, Status, Source, Fallback.

Validierung:
- npm test
- npm run lint
- npm run build
- Playwright Live-Test mit Screenshots fuer Eingabe, Places Flow, Overview, Fusion, Haeuser, Methode, Missing Secret.
- Code Review: keine Secrets, keine Fake-Daten, keine lokalen Produktberechnungen, keine 0-Grad-Fallbacks, keine irrefuehrende Provenienz.
- Iteration erst abschliessen bei 0 Critical/Major Findings.`

---

# 9. Rollback und Sicherheit

Feature-Flag `ENABLE_LOCAL_ASTROLOGY_FALLBACK=false` default.

FuFirE-Ausfall darf App nicht mit Fake-Daten fuellen.

Fehler muessen sichtbar und sicher sein.

Keine Stacktraces an Browser.

Keine Keys in Logs.

Kein `VITE_*` fuer Secrets.

Bei unklarem FuFirE-Response-Shape zuerst Contract Fixture speichern und Normalizer anpassen.

---

# 10. Plausibility and Truth Self-Check

**Nicht erfunden:** Dateinamen und Scripts stammen aus der geprueften ZIP.

**Unsicher:** Exakte FuFirE-Live-Response-Shapes sind nicht verifiziert; deshalb Contract Fixtures als erste Integrationspflicht.

**Staerkstes Risiko:** Lokaler Fallback bleibt heimlich aktiv und erzeugt falsche Produktwahrheit. Gegenmassnahme: Source-Labels, Tests, `ENABLE_LOCAL_ASTROLOGY_FALLBACK=false`.

**Bias-Risiko:** Zu schneller Fokus auf UI-Politur statt Datenwahrheit. Gegenmassnahme: erst FuFirEClient, Validierung, Normalizer, Provenienz.

**Final Readiness:** Plan ist umsetzungsreif, solange FuFirE API URL, API-Key und Google Maps Key fuer Railway bereitgestellt werden.
