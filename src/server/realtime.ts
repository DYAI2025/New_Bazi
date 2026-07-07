import { Request, Response } from "express";

export type RealtimeAgentId = "levi" | "eve";

const REALTIME_CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets";
const DEFAULT_REALTIME_MODEL = "gpt-realtime";

const AGENTS: Record<RealtimeAgentId, { label: string; voiceEnv: string; defaultVoice: string; style: string }> = {
  levi: {
    label: "Levi Bazi",
    voiceEnv: "OPENAI_REALTIME_VOICE_LEVI",
    defaultVoice: "marin",
    style:
      "ruhig, warm, mentorisch, mit kurzen Bildern und einer sanften Frage pro Antwort. Levi entschleunigt und verankert jede Deutung in konkreten Profildaten."
  },
  eve: {
    label: "Eve",
    voiceEnv: "OPENAI_REALTIME_VOICE_EVE",
    defaultVoice: "cedar",
    style:
      "direkt, verspielt, frech und auf den Punkt, ohne verletzend zu werden. Eve darf necken, aber sie bleibt brand-safe, respektvoll und datenverankert."
  }
};

function cleanText(value: unknown, maxLength = 160): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function cleanNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value * 1000) / 1000;
}

function pickObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function sanitizeDistribution(value: unknown): Record<string, number> {
  const source = pickObject(value);
  return Object.fromEntries(
    Object.entries(source)
      .map(([key, raw]) => [cleanText(key, 24), cleanNumber(raw)] as const)
      .filter((entry): entry is [string, number] => Boolean(entry[0]) && entry[1] !== null)
      .slice(0, 8)
  );
}

export interface RealtimeProfileBrief {
  name: string | null;
  sunSign: string | null;
  moonSign: string | null;
  ascendant: string | null;
  dayMaster: {
    element: string | null;
    name: string | null;
    polarity: string | null;
  };
  dominantElement: string | null;
  wuxingDistribution: Record<string, number>;
  coherence: {
    index: number | null;
    rating: string | null;
    signalLevel: string | null;
  };
  activeSignals: string[];
  warnings: string[];
}

export function sanitizeRealtimeProfileSnapshot(raw: unknown): RealtimeProfileBrief {
  const snapshot = pickObject(raw);
  const dayMaster = pickObject(snapshot.dayMaster);
  const coherence = pickObject(snapshot.coherence);
  const activeSignals = Array.isArray(snapshot.activeSignals)
    ? snapshot.activeSignals.map((item) => cleanText(item, 120)).filter((item): item is string => Boolean(item)).slice(0, 5)
    : [];
  const warnings = Array.isArray(snapshot.warnings)
    ? snapshot.warnings.map((item) => cleanText(item, 120)).filter((item): item is string => Boolean(item)).slice(0, 4)
    : [];

  return {
    name: cleanText(snapshot.name, 80),
    sunSign: cleanText(snapshot.sunSign, 40),
    moonSign: cleanText(snapshot.moonSign, 40),
    ascendant: cleanText(snapshot.ascendant, 40),
    dayMaster: {
      element: cleanText(dayMaster.element, 40),
      name: cleanText(dayMaster.name, 80),
      polarity: cleanText(dayMaster.polarity, 20)
    },
    dominantElement: cleanText(snapshot.dominantElement, 40),
    wuxingDistribution: sanitizeDistribution(snapshot.wuxingDistribution),
    coherence: {
      index: cleanNumber(coherence.index),
      rating: cleanText(coherence.rating, 80),
      signalLevel: cleanText(coherence.signalLevel, 40)
    },
    activeSignals,
    warnings
  };
}

function briefLine(label: string, value: string | number | null): string | null {
  return value === null || value === "" ? null : `- ${label}: ${value}`;
}

export function buildRealtimeInstructions(agentId: RealtimeAgentId, brief: RealtimeProfileBrief): string {
  const agent = AGENTS[agentId];
  const distribution = Object.keys(brief.wuxingDistribution).length > 0
    ? Object.entries(brief.wuxingDistribution).map(([key, value]) => `${key} ${value}`).join(", ")
    : null;
  const lines = [
    briefLine("Name", brief.name),
    briefLine("Sonne", brief.sunSign),
    briefLine("Mond", brief.moonSign),
    briefLine("Aszendent", brief.ascendant),
    briefLine("Tagesmeister", [brief.dayMaster.name, brief.dayMaster.element, brief.dayMaster.polarity].filter(Boolean).join(" / ") || null),
    briefLine("Dominantes Wu-Xing-Element", brief.dominantElement),
    briefLine("Wu-Xing-Verteilung", distribution),
    briefLine("Fusionskohärenz", [brief.coherence.index, brief.coherence.rating, brief.coherence.signalLevel].filter((value) => value !== null && value !== "").join(" / ") || null),
    brief.activeSignals.length ? `- Aktive Signale: ${brief.activeSignals.join("; ")}` : null,
    brief.warnings.length ? `- Hinweise: ${brief.warnings.join("; ")}` : null
  ].filter(Boolean).join("\n");

  return [
    `Du bist ${agent.label}, ein live gesprochener Bazodiac-Astro-Agent.`,
    `Stil: ${agent.style}`,
    "",
    "Gesprächsregeln:",
    "- Antworte in Deutsch, außer der Nutzer wechselt klar die Sprache.",
    "- Audio zuerst: kurze gesprochene Turns, niedrige Latenz, natürliche Unterbrechungen erlauben.",
    "- Stelle maximal eine Frage pro Antwort und warte dann.",
    "- Verankere astrologische Aussagen sichtbar in den Profildaten. Wenn Daten fehlen, sag es klar.",
    "- Keine Schicksalsaussagen, keine Diagnosen, keine Therapie, keine Trennungs- oder Lebensentscheidungsbefehle.",
    "- Sprich spielerisch, aber nicht esoterisch-absolut. Nutze Formulierungen wie 'dein Profil zeigt' oder 'das Muster legt nahe'.",
    "",
    "Aktuelles Profil-Briefing:",
    lines || "- Kein berechnetes Profil im Session-Kontext. Lade den Nutzer ein, zuerst ein Profil zu berechnen."
  ].join("\n");
}

function parseAgentId(value: unknown): RealtimeAgentId | null {
  return value === "levi" || value === "eve" ? value : null;
}

export async function createRealtimeSession(req: Request, res: Response): Promise<void> {
  const agentId = parseAgentId(req.body?.agent);
  if (!agentId) {
    res.status(400).json({ error: "invalid_agent", message: "agent muss 'levi' oder 'eve' sein." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: "openai_realtime_not_configured",
      message: "OPENAI_API_KEY fehlt auf dem Server. Realtime Audio ist noch nicht verbunden."
    });
    return;
  }

  const model = process.env.OPENAI_REALTIME_MODEL || DEFAULT_REALTIME_MODEL;
  const voice = process.env[AGENTS[agentId].voiceEnv] || AGENTS[agentId].defaultVoice;
  const brief = sanitizeRealtimeProfileSnapshot(req.body?.profileSnapshot);
  const instructions = buildRealtimeInstructions(agentId, brief);

  const upstream = await fetch(REALTIME_CLIENT_SECRETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model,
        instructions,
        audio: {
          input: {
            transcription: { model: process.env.OPENAI_REALTIME_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe" },
            turn_detection: {
              type: "server_vad",
              threshold: 0.55,
              prefix_padding_ms: 300,
              silence_duration_ms: 420,
              create_response: true,
              interrupt_response: true
            }
          },
          output: { voice }
        }
      }
    })
  });

  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    console.error("OpenAI Realtime session error", {
      status: upstream.status,
      error: payload?.error?.code || payload?.error || "unknown"
    });
    res.status(502).json({
      error: "openai_realtime_session_failed",
      message: "OpenAI Realtime-Session konnte nicht gestartet werden."
    });
    return;
  }

  const clientSecret = payload?.value || payload?.client_secret?.value || payload?.clientSecret?.value;
  const expiresAt = payload?.expires_at || payload?.client_secret?.expires_at || payload?.clientSecret?.expires_at || null;
  if (!clientSecret) {
    res.status(502).json({
      error: "openai_realtime_secret_missing",
      message: "OpenAI lieferte keinen nutzbaren Realtime Client Secret."
    });
    return;
  }

  res.json({
    agent: agentId,
    model,
    voice,
    clientSecret,
    expiresAt,
    webrtcUrl: `https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(model)}`,
    instructionsVersion: "bazodiac-agents-v1"
  });
}
