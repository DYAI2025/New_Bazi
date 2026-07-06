# Sprint P11: Voice-Agents Levi & Eve — Anbindung + Sphere-Stub

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **BINDEND:** Master-Roadmap. Fidelity B. **ENTSCHEIDUNGS-GATE E-ELEVEN:** ElevenLabs-Account ist Free-Mode (Hack-Folge) — dieser Sprint baut die VOLLSTÄNDIGE Anbindung (Tool-Endpoints, Memory, UI-Einstieg) so, dass sie mit Free-Mode-Limits funktioniert und bei Account-Upgrade NUR Env-Werte braucht. Kein Fake: nicht verbundene Zustände sind sichtbar „nicht verbunden".
> **ABHÄNGIGKEIT:** P3 (Supabase: `nb_agent_conversations`; requireUserAuth).

**Goal:** Levi (Einzelprofil-Begleiter) und Eve (Paar-/Synastrie-Begleiterin) können als ElevenLabs-Conversational-Agents auf das New_Bazi-Profil, die letzten Konversations-Zusammenfassungen und den Tageszustand zugreifen — serverseitig, ohne dass je Geburtsrohdaten oder Secrets den sicheren Pfad verlassen.

**Architecture:** ElevenLabs-Agents rufen per **Server-Tool-Webhooks** (signiert mit Tool-Secret) den New_Bazi-BFF: der BFF liefert ein KONDENSIERTES Profil-Briefing (abgeleitete Figuren/Elemente/Spannungen — NIE Geburtszeit/Ort roh, Privacy-Muster aus Astro-Noctum übernehmen) und nimmt Conversation-Summaries entgegen. Das UI startet Sessions über das ElevenLabs-Web-SDK (`@elevenlabs/client` — aktuelle Paket-/API-Lage in der Doku verifizieren!) mit signierter Session-URL vom BFF. Die Sphere-UI ist in diesem Sprint ein bewusst einfacher Status-Ball (Puls per CSS) — der „schwebende Sphere-Ausbau" ist per Benjamin-Ansage ein SEPARATER späterer Sprint.

**Branch:** `feat/sprint-p11-voice-agents`

---

## Quell-Karte + Explorations-Pflicht

```
AN=/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
grep -rn "ELEVENLABS" $AN/server.mjs | head -20          ← Tool-Secret-Verifikation, Agent-Routen-Muster
grep -rn "agent_type\|levi\|eve" $AN/server.mjs -i | head -20  ← Profil-Briefing-Shape, eve/levi-Unterscheidung
$AN/knowledge/bazodiaac-brain/bazodiac_rag_docs/partner_match_api_contract.md  ← Eve-Regeln (keine Trennungs-Empfehlung, kein Seelenverwandt, Datenanker-Pflicht)
Engine-Service FuFire (Railway) hat ELEVENLABS_TOOL_SECRET_* Vars — die SUPERGLUE-Routen der Engine (/v1/profile/{user_id} etc.) sind das ALTE Muster; New_Bazi baut sein EIGENES Briefing (Engine-Superglue NICHT verwenden — es hängt an anderen Profilen).
ElevenLabs-Doku: Conversational AI → Agents → Tools (Webhook) + WebSocket/SDK-Session — AKTUELLE Doku lesen (API ändert sich; Stand im Report dokumentieren).
```
Explorations-Output: `docs/contracts/voice-agents.md` — Tool-Webhook-Auth-Mechanik (Header/Signatur), Session-Start-Flow, Free-Mode-Limits (Agents-Anzahl/Minuten — dokumentieren was der Account hergibt).

## Task 1: Profil-Briefing-Endpoint (TDD)

`GET /api/agent/briefing/:profileId?agent=levi|eve` — Auth: `X-Tool-Secret`-Header gegen `ELEVENLABS_TOOL_SECRET` Env (timing-safe compare!), NICHT requireUserAuth (der Agent ruft serverseitig). Antwort (kondensiert, PRIVACY-Regel testen: Response enthält NIE birthTime/birthDate/lat/lon/placeId — Honesty-Test mit `not.toHaveProperty`-Sweep):
```ts
{ profileLabel, sunSign, moonSign, ascendant /* | null + hint */, dayMaster: {stem, element, polarity},
  yearAnimal, dominantElement, wuxingShares, coherence: {calibrated, band, signalLevel},
  activeTension: {axis, poleA, poleB, lean, question}, council: [...6 Figuren aus P9 council.ts],
  todayReaction: {figure} | null, recentConversations: [{summary, created_at}] /* letzte 3, agent-getrennt */,
  rules: ["Keine Schicksalsaussagen", "Keine Diagnose/Coaching", "Jede Aussage mit Datenanker", ...] }
```
(`rules` mitschicken = Prompt-Leitplanke im Tool-Result; eve zusätzlich `partner`-Block + partner_match-Regeln.) Profil-Quelle: `nb_profiles` (P3) — der Endpoint rechnet das ViewModel serverseitig (bestehende resolveProfile-Logik wiederverwenden — im Code suchen, wie die Synastry-Route Profile auflöst).

## Task 2: Conversation-Memory (TDD)

`POST /api/agent/conversation-summary` (Tool-Secret-Auth): `{profileId, agent: levi|eve, summary}` → Insert `nb_agent_conversations` (cap: pro user×agent die letzten 20 behalten, ältere löschen — Test). Briefing (Task 1) liest die letzten 3. Keine Roh-Transkripte speichern (nur Summaries — Datenschutz-Entscheidung, im Contract dokumentieren).

## Task 3: Session-Start + Client-Anbindung

`POST /api/me/agent-session` (requireUserAuth!): erzeugt via ElevenLabs-API eine signierte Session (Agent-ID je nach levi/eve aus Env `ELEVENLABS_AGENT_ID_LEVI/_EVE`) und gibt die Session-URL/Token ans Frontend. Ohne Env: 503 `VOICE_NOT_CONNECTED` mit ehrlicher Message. Client `src/lib/voiceSession.ts`: SDK-Wrapper mit Status-Callback (idle/connecting/listening/speaking/error/unavailable).

## Task 4: UI — Status-Ball-Stub (bewusst minimal)

`src/components/AgentOrb.tsx`: runder Gradient-Ball (Levi: Gold-Töne, Eve: Blau-Töne), CSS-Puls je Status, Klick startet/beendet Session; `unavailable`-Status: ausgegraut + Tooltip „Voice derzeit nicht verbunden". Platzierung: Levi schwebend unten rechts auf Profil-Tabs (fixed, dezent); Eve NUR auf dem Synastrie-Tab. reduced-motion: statisch. **Der ausgebaute „pulsing hovering Sphere" mit Sprach-Visualisierung = separater Folge-Sprint (MISSING-Liste) — dieser Stub definiert nur Position + Status-Contract.**

## Task 5: ElevenLabs-Konfiguration (dokumentierte Hand-Arbeit)

Schritt-für-Schritt-Doku in `docs/contracts/voice-agents.md`: Agent „Levi" + „Eve" im ElevenLabs-Dashboard anlegen (System-Prompts: aus den `rules` + Persona-Kurzbeschreibung — Entwürfe im Plan-Report liefern, Benjamin reviewt), Tool-Webhooks auf die Briefing-/Summary-Endpoints (Production-URL) mit Secret, Free-Mode-Einschränkungen notieren. Dieser Task endet mit EINEM echten Test-Gespräch (Benjamin oder Executor mit Mikro) ODER, falls Free-Mode es blockiert, dem dokumentierten Blocker + curl-Beweis, dass Briefing+Summary-Endpoints korrekt antworten.

## Abschluss
Gates + PR `feat: Voice-Agents Levi/Eve — Tool-Endpoints, Memory, Session, Status-Orb` + MISSING (Sphere-Ausbau, Transkript-Features, Eve-Phase-2-Paar-Memory, conversation-analysis-Quiz-Anbindung) + Live-Smoke: Briefing-Endpoint auf Production mit Test-Secret (Privacy-Sweep im Response nachweisen).

## Risiken
- ElevenLabs-API-Drift: SDK/Endpoints ändern sich — Exploration MUSS aktuelle Doku lesen, nichts aus diesem Plan-Gedächtnis übernehmen außer der Architektur.
- Tool-Secret-Auth ist die Sicherheitskante: timing-safe compare + Rate-Limit auf die Tool-Routen (bestehende rate-limit-Middleware) + kein CORS für Tool-Routen.
- Free-Mode: ggf. nur 1 Agent möglich → dann Levi zuerst, Eve als zweite Agent-ID dokumentiert vorbereitet (Flag).
