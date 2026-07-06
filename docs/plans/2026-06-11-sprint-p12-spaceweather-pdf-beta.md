# Sprint P12: Space Weather + PDF-Report + Fusion-Narrativ + Beta-Cut + Prod-Hardening

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **BINDEND:** Master-Roadmap. Fidelity B. Vier UNABHÄNGIGE Teilstränge — je eigener Branch/PR; Reihenfolge frei AUSSER Beta-Cut (braucht alle gewünschten Features gemerged).

---

## Strang A — Space Weather Layer (FR-017) · Branch `feat/sprint-p12a-space-weather`

**Sprach-Leitplanke (BINDEND):** „möglicher Kontext", „symbolischer Modulator" — NIEMALS biologische Wirkbehauptung. Jede UI-Stelle trägt Quelle+Zeitstempel.

1. **Quell-Exploration:** `grep -rn "NOAA\|DONKI\|APOD\|space.weather\|swpc" $AN/server.mjs $AN/src -il | head` (AN=Astro-Noctum-Pfad) → vorhandene Endpoints/Parsing portierbar? NASA-Keys: Benjamin sagt, sie liegen in der New_Bazi-`.env` — Namen prüfen (`grep -oE "^[A-Z_]*NASA[A-Z_]*|^[A-Z_]*NOAA[A-Z_]*" .env`, Werte nie printen) + auf Railway setzen.
2. **Server** `GET /api/space-weather`: NOAA-SWPC Kp-Index (JSON-Feed, keyfrei: services.swpc.noaa.gov — Feed-URL in Exploration verifizieren) + optional NASA DONKI-Events (Key). 30-min-Server-Cache (in-memory reicht), Antwort `{kp, kpBand: ruhig|bewegt|stürmisch (Kp<4/<6/≥6), events?, source, fetchedAt, stale}`. TDD mit gemocktem fetch + echtem Fixture-Capture.
3. **UI:** kompakte Karte im Hub („Heute"): „Kosmischer Kontext: Kp {x} — {Band}. Quelle NOAA, {Zeit}." + Info-Layer (ExplanationLayer-Muster) mit dem ehrlichen Theorie-Text (Möglichkeits-Sprache, 1 kuratierter Absatz, Anti-Claim-Regex-Test: /beeinflusst dich|wirkt auf deinen Körper|verursacht/i verboten).
4. **Optional-Andockpunkt** (nur Doku, kein Code): Signatur-Modulation `spaceWeather` als weiteres modulation-Feld (P10-Schema) — Folge-Entscheidung.
5. Gates/PR/Live-Smoke (echter NOAA-Fetch auf Production).

## Strang B — PDF-Report 2.0 (B-005/FR-008) · Branch `feat/sprint-p12b-pdf-report`

1. **Tech-Entscheidung (im Plan getroffen, YAGNI):** clientseitig `@react-pdf/renderer` — kein Server-Headless-Chrome (Railway-Gewicht), kein window.print. Exploration: Paket-Eignung mit Umlauten/Symbolen (辛/♊) prüfen — 30-min-Spike, bei Font-Problemen Fallback `pdfmake`; Ergebnis im Report.
2. **Report-Template** `src/report/ProfileReport.tsx`: Deckblatt (Name-Label, Datum, Bazodiac-Branding, Disclaimer „Entertainment/Reflexion — keine Lebens-, Gesundheits- oder Rechtsberatung"), Kapitel: Western (Triade + Planeten-Tabelle + Häuser falls timeKnown), BaZi (4 Säulen-Grafik als einfache Tabelle mit 辛/亥-Glyphen + Tagesmeister-Text aus P1/A14-Tabelle), WuXing (Anteils-Balken + aktive Impulse), Fusion (kalibrierter Index MIT Label + Band + aktive Spannungsfrage), Quellen/Methodik-Seite (Engine-Version aus ViewModel, „kalibriert gegen Zufallsbaseline"-Erklärung 3 Sätze). Inhalte NUR aus dem ViewModel + Content-Registry (P5) — keine neuen Texte.
3. **Button** ersetzt window.print in Overview: „Bericht als PDF" → generiert client-seitig, Dateiname `bazodiac-profil-{datum}.pdf`. Loading-State (Generierung dauert Sekunden).
4. Tests: Render-Smoke des Templates (react-pdf rendert in vitest via renderToBuffer? — Exploration; sonst e2e-Download-Assertion: Datei >50KB, Playwright download-Event), Anti-Claim-Regex über alle Report-Strings.
5. Gates/PR + MISSING (Paar-Report, Tages-Kapitel, Druck-Layout-Feinschliff).

## Strang C — Fusion-Narrativ + Onboarding (B-014/FR-018) · Branch `feat/sprint-p12c-fusion-narrative`

1. **Die Story (kuratiert, BINDEND als Copy-Grundlage):** (1) „Der westliche Himmel zeigt, WO die Planeten standen." → (2) „BaZi zeigt, wie der MOMENT selbst gebaut ist — Zeit als Architektur aus Stämmen und Zweigen." → (3) „Beide sprechen eine gemeinsame Sprache: die fünf Elemente." → (4) „Wo sie sich unterscheiden, entsteht keine Schwäche, sondern eine FRAGE — deine Spannungsachse." → (5) „Der Tag bewegt das Feld; deine Antwort bewegt die Lesart." (Anti-Reification geprüft; Feinschliff durch Benjamin im PR-Review.)
2. **Onboarding-Sequenz** `src/components/FusionIntro.tsx`: 5 Schritte als horizontale Mini-Sequenz (je Icon/Mikro-Visual: Planeten-Punkte → Säulen-Glyphen → 5-Element-Ring → Spannungsbogen → Cyan-Punkt), erscheint EINMAL beim ersten Profil (sessionStorage-Flag; mit P3-Login: nb-User-Setting — kleines `user_settings`-Feld? NEIN, YAGNI: localStorage-Flag `nb_intro_seen`, jetzt erlaubt da P3 localStorage-Tabu aufhebt) + jederzeit über „Methodik"-Tab-Link erreichbar.
3. **Tab-Reihenfolge/Brücken:** PageShell-Reihenfolge prüfen: Geburtsdaten → Übersicht → Heute (Hub) → Western → BaZi → WuXing → Fusion → Synastrie → Quizzes → Methodik. Jeder Detail-Tab bekommt oben EINE Brücken-Zeile („Western fließt als {x}% Gold-Anteil ins Fusionsfeld" — Datenanker aus elementalComparison-Mittelung).
4. e2e: Intro erscheint einmal, Brücken-Zeilen mit echten Werten.
5. Gates/PR.

## Strang D — Beta-Cut + Prod-Hardening (FR-019/S20) · Branch `feat/sprint-p12d-beta-cut` · NACH allen gewünschten Features

1. **Feature-Flag-System** `src/lib/featureFlags.ts` (AN hat ein Muster — ansehen): env-getriebene Flags `VITE_FF_QUIZZES`, `VITE_FF_VOICE`, `VITE_FF_SPACE_WEATHER`, `VITE_FF_SIGNATUR`, `VITE_FF_PDF`, `VITE_FF_ACCOUNTS` + Server-Pendants. Default Production: ALLES an; Beta-Env setzt gewünschte aus. Tabs/Sektionen verschwinden sauber (kein toter Button). Dockerfile: ARG-Zeilen für alle VITE_FF_* (Build-Args-Lektion!). Tests: Flag aus → Tab fehlt, Routen 404n ehrlich.
2. **Beta-Umgebung:** zweiter Railway-Service `New_Bazi-Beta` im selben Projekt (Branch `beta` oder main mit Beta-Env) — Schritte dokumentieren; Beta-Scope-Matrix als `docs/contracts/beta-scope.md` (Benjamin füllt die An/Aus-Spalte!).
3. **Feedback-Kanal:** simpler `POST /api/feedback` (Text + Tab-Kontext + optional E-Mail) → `nb_feedback`-Tabelle (Migration additiv) + Mini-UI (Footer-Link „Feedback"). Kein Tracking-SDK.
4. **Prod-Hardening-Checkliste** (abarbeiten + je Punkt Beweis im Report): Rate-Limits auf alle POST-Routen (Muster existiert), Error-Logging strukturiert (request-id-Muster aus Landingpage übernehmen falls fehlt), Secrets-Audit (`git log -S` Stichproben + .env-Scan), Impressum/Datenschutz-Seiten (Inhalte von Benjamin/bazodiac.space — Platzhalter VERBOTEN: ohne Inhalte bleibt der Punkt offen in der MISSING-Liste), Lighthouse-Pass (Performance>70, A11y>90 — Messwerte dokumentieren), e2e-Suite vollständig grün, README-Aktualisierung.
5. Gates/PR + finale Live-Verifikation beider Umgebungen.

## Gesamt-MISSING nach P12: 3D-Signatur, Sphere-Ausbau, Remote-Paar-Invite, Premium-Gating/Stripe, conversation-analysis, Aphorismen-Pool-Ausbau, house×sign-Matrix.
