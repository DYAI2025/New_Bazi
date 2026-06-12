# Product Vision: BaZi Sprint P3 — Supabase Foundation

**Feature-Slug:** `bazi-sprint-p3-supabase-foundation`
**Status:** user-confirmed (2026-06-12)
**Erstellt:** 2026-06-12
**Canvas:** [docs/canvas/bazi-sprint-p3-supabase-foundation.canvas.md](../canvas/bazi-sprint-p3-supabase-foundation.canvas.md)
**PRD:** [docs/prd/bazi-sprint-p3-supabase-foundation.prd.md](../prd/bazi-sprint-p3-supabase-foundation.prd.md)

---

## Vision Statement

New_Bazi soll Nutzerinnen, die wiederkehren, das Gefühl geben: „Ich bin hier zu Hause — mein Profil ist da." Wer einmalig Magic Link nutzt, muss Geburtsdaten nie wieder eingeben. Wer anonym bleibt, merkt keinen Unterschied — keine Registrierungs-Gate, kein Druck. Persistenz ist ein stilles Upgrade für die, die es wollen, und unsichtbar für alle anderen.

---

## Ziel (Sprint P3)

Serverseitige Supabase-Infrastruktur + minimales UI: Magic-Link-Login, `profiles`- und `partner_profiles`-Speicherung, Profil laden/speichern im bestehenden Flow. Alles dahinter ist sicher (RLS, BFF Service-Role, kein Secret im Browser). Alles davor bleibt unverändert (anonymer Flow, alle bestehenden Routen).

---

## Kundenwert

| Für wen | Was verbessert sich | Warum jetzt |
|---------|---------------------|-------------|
| Wiederkehrende Nutzerinnen | Profil einmal anlegen, nie mehr neu eingeben | Grundlage für P8 (Quiz), P9 (Daily), P11 (Voice) |
| Anonyme Nutzerinnen | Kein Unterschied — gleicher Flow wie bisher | Opt-in schützt Non-User vor Registrierungs-Friction |
| Entwickler | Saubere Auth-Schicht mit ehrlichem Disabled-State | Alle künftigen personalisierten Features setzen darauf auf |

---

## Was diese Vision NICHT ist

- Kein vollständiges User-Management (kein Passwort, kein Profil-Edit, kein Account-Deletion-Flow in P3).
- Kein Personalisierungs-Feature — Persistenz ist Infrastruktur, keine UX-Funktion.
- Kein Ersatz für anonyme Nutzung — die bleibt gleichwertig.
- Kein Commitment für `contribution_events`, `daily_reactions`, `agent_conversations` — erst wenn die Features real sind (P8/P9/P11).

---

## Erfüllt wenn

1. Eine Nutzerin kann sich per Magic Link anmelden und ihr Profil speichern.
2. Beim nächsten Besuch lädt sie das Profil mit einem Klick — Geburtsdaten vorausgefüllt, Berechnung startet.
3. Eine nicht angemeldete Nutzerin sieht exakt denselben Flow wie heute.
4. Ohne konfigurierte Supabase-Env-Vars zeigt die App einen ehrlichen „nicht verfügbar"-Hinweis — keine Crashes, keine kaputten Buttons.
5. Kein Service-Role-Key landet im Browser-Bundle oder in Logs.
6. Gated-Live-Spec läuft PASS auf dem lokalen Server mit echten Credentials.

---

## Plumbline-Wächter-Check

- **Kundennutzen**: Direkt — Profil einmal eingeben, dauerhaft nutzen. Kein Umweg über hypothetische Features.
- **Anti-Reification**: Persistenz speichert Geburtsdaten, keine Urteile. Kein „Du bist…"-State wird gespeichert.
- **Ehrlichkeit**: Disabled-State ist explizit. Kein Silent-Fail.
- **Widerspruch zur Canvas**: Keiner — Scope B ist canvas-konform.
- **Risiko für anonymen Flow**: Keines — `requireUserAuth` nur auf `/api/me/*`, alle anderen Routen unverändert.
