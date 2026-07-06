// Minimal mock of the FuFirE upstream for end-to-end tests.
// Returns a complete /chart (unprefixed — the real engine mounts chart outside /v1) so the BFF reports source=fufire-chart.
import http from "node:http";

const PORT = Number(process.env.MOCK_FUFIRE_PORT || 8799);

const CHART = {
  western: {
    sunSign: "Waage",
    moonSign: "Stier",
    ascendant: "Krebs",
    planets: [
      { name: "Sonne", sign: "Waage", house: 4, degree: 21.3, element: "Luft", retrograde: false },
      { name: "Mond", sign: "Stier", house: 1, degree: 8.7, element: "Erde", retrograde: false },
      { name: "Merkur", sign: "Skorpion", house: 5, degree: 2.1, element: "Wasser", retrograde: true }
    ],
    aspects: [
      { planet1: "Sonne", planet2: "Mond", type: "Quadrat", orb: 1.8, harmony: "spannend", interpretation: "Spannung zwischen Wille und Gefühl." }
    ],
    houses: [
      { number: 1, sign: "Krebs", degree: 12.0, title: "Identität, Vitalität & Selbstbild" },
      { number: 4, sign: "Waage", degree: 21.0, title: "Heimat, Familie & Wurzeln" }
    ]
  },
  bazi: {
    dayMaster: "Holz",
    dayMasterName: "Jiǎ",
    dayMasterChinese: "甲",
    dayMasterPolarity: "Yang",
    pillars: {
      Jahr: { stem: { name: "Bǐng", chinese: "丙", element: "Feuer", yinYang: "Yang" }, branch: { name: "Wǔ", chinese: "午", element: "Feuer", animal: "Pferd", hiddenStems: [], yinYang: "Yang" } },
      Monat: { stem: { name: "Wù", chinese: "戊", element: "Erde", yinYang: "Yang" }, branch: { name: "Xū", chinese: "戌", element: "Erde", animal: "Hund", hiddenStems: [], yinYang: "Yang" } },
      Tag: { stem: { name: "Jiǎ", chinese: "甲", element: "Holz", yinYang: "Yang" }, branch: { name: "Zǐ", chinese: "子", element: "Wasser", animal: "Ratte", hiddenStems: [], yinYang: "Yang" } },
      Stunde: { stem: { name: "Gēng", chinese: "庚", element: "Metall", yinYang: "Yang" }, branch: { name: "Wǔ", chinese: "午", element: "Feuer", animal: "Pferd", hiddenStems: [], yinYang: "Yang" } }
    }
  },
  wuxing: {
    wu_xing_vector: { Holz: 22, Feuer: 28, Erde: 24, Metall: 14, Wasser: 12 }
  },
  // REAL FusionResponse shape (mirrors src/__fixtures__/fufire/fusion.json):
  // harmony_index OBJECT, calibration block (incl. h_baseline/h_sigma),
  // elemental_comparison, fusion_interpretation, cosmic_state. The legacy
  // { coherenceIndex, systemBridge } mock shape is gone — e2e must prove the
  // new calibrated rendering path (61.4% gauge, honest band label,
  // Spannungsfelder, engine interpretation text).
  fusion: {
    harmony_index: {
      harmony_index: 0.908,
      interpretation: "Starke Resonanz - Westliche und östliche Matrix stehen in perfekter Harmonie",
      method: "dot_product",
      western_vector: { Holz: 0.61, Feuer: 0.438, Erde: 0.305, Metall: 0.133, Wasser: 0.57 },
      bazi_vector: { Holz: 0.388, Feuer: 0.539, Erde: 0.431, Metall: 0.431, Wasser: 0.431 }
    },
    calibration: {
      h_raw: 0.908,
      h_calibrated: 0.6144,
      h_baseline: 0.7614,
      h_sigma: 0.1445,
      sigma_above: 1.015,
      quality: "ok",
      interpretation_band: "Überdurchschnittliche Kongruenz",
      n_west: 14,
      n_bazi_contributions: 13
    },
    elemental_comparison: {
      Holz: { western: 0.61, bazi: 0.388, difference: 0.222 },
      Feuer: { western: 0.438, bazi: 0.539, difference: -0.102 },
      Erde: { western: 0.305, bazi: 0.431, difference: -0.126 },
      Metall: { western: 0.133, bazi: 0.431, difference: -0.299 },
      Wasser: { western: 0.57, bazi: 0.431, difference: 0.139 }
    },
    cosmic_state: 0.908,
    fusion_interpretation: "Harmonie-Index: 90.80%\nStarke Resonanz - Westliche und östliche Matrix stehen in perfekter Harmonie\n\nWestliche Dominanz: Holz\nÖstliche Dominanz: Feuer\n\nIhre westliche und östliche Chart stehen in starker Resonanz.\nDie Energien ergänzen sich harmonisch."
  }
};

// Synastry has NO own mock route: the BFF resolves BOTH profiles via /chart and
// compares locally, serving elementalA/elementalB from the two fusion payloads.
// The partner persona (any birth date other than the primary 1990-05-15) gets a
// DIFFERENT elemental_comparison so the pair tension has a clear top axis:
// Metall person-weights 0.282 (A) vs 0.600 (B) → |diff| 0.318 → Struktur↔Fluss,
// Person-B-Überschuss (Blau).
// P5-T3: unknown-time persona for the ExplanationLayer absence test.
// The BFF /chart body has no birth_time_known field, so the mock keys off the
// dedicated NO_TIME birth date (1985-03-10, used only by explanation-layer.spec.ts):
// it returns western.precision.provisional_fields=["ascendant","houses","mc"]
// (mirrors the CONFIRMED real unknown-time western shape — see
// src/__fixtures__/fufire/unknown-time/README.md F-01) so the normalizer
// short-circuits and honestly nulls the ascendant. ascendant is also nulled at
// source so no 12:00-computed sign can leak.
const NO_TIME_CHART = {
  ...CHART,
  western: {
    ...CHART.western,
    ascendant: null,
    precision: { provisional_fields: ["ascendant", "houses", "mc"] }
  }
};

// Generic partner persona (ANY non-primary, non-NO_TIME date): a CLONE of CHART
// (incl. its BaZi pillars Jiǎ/Zǐ … — relied on by explanation-layer.spec.ts and
// bazi-pillars.spec.ts which use 1990-06-15 as their MAIN profile) plus only a
// variant fusion distribution so the pair tension navigator has a clear top axis.
const PARTNER_CHART = {
  ...CHART,
  fusion: {
    ...CHART.fusion,
    harmony_index: {
      ...CHART.fusion.harmony_index,
      western_vector: { Holz: 0.45, Feuer: 0.4, Erde: 0.32, Metall: 0.61, Wasser: 0.5 },
      bazi_vector: { Holz: 0.41, Feuer: 0.46, Erde: 0.4, Metall: 0.59, Wasser: 0.46 }
    },
    elemental_comparison: {
      Holz: { western: 0.45, bazi: 0.41, difference: 0.04 },
      Feuer: { western: 0.4, bazi: 0.46, difference: -0.06 },
      Erde: { western: 0.32, bazi: 0.4, difference: -0.08 },
      Metall: { western: 0.61, bazi: 0.59, difference: 0.02 },
      Wasser: { western: 0.5, bazi: 0.46, difference: 0.04 }
    }
  }
};

// P7 synastry-completion partner persona (date 1988-08-08 ONLY): PARTNER_CHART
// fusion (so the pair tension/axes are unchanged) + VARIANT BaZi branches so the
// pillar comparison vs the primary CHART is non-degenerate. Scoped to this single
// date so it does NOT affect the generic partner persona other specs depend on.
// Primary CHART branches: Jahr Pferd, Monat Hund, Tag Ratte, Stunde Pferd.
//   Jahr   Hund  vs Pferd → San-He (Tiger/Pferd/Hund Dreieck)
//   Monat  Hund  vs Hund  → gleich
//   Tag    Pferd vs Ratte → Chong (Ratte–Pferd Gegenüber)
//   Stunde Pferd vs Pferd → gleich
const PARTNER_VARIANT = {
  ...PARTNER_CHART,
  bazi: {
    ...CHART.bazi,
    pillars: {
      Jahr:   { stem: { name: "Bǐng", chinese: "丙", element: "Feuer", yinYang: "Yang" }, branch: { name: "Xū", chinese: "戌", element: "Erde", animal: "Hund", hiddenStems: [], yinYang: "Yang" } },
      Monat:  { stem: { name: "Wù", chinese: "戊", element: "Erde", yinYang: "Yang" }, branch: { name: "Xū", chinese: "戌", element: "Erde", animal: "Hund", hiddenStems: [], yinYang: "Yang" } },
      Tag:    { stem: { name: "Jiǎ", chinese: "甲", element: "Holz", yinYang: "Yang" }, branch: { name: "Wǔ", chinese: "午", element: "Feuer", animal: "Pferd", hiddenStems: [], yinYang: "Yang" } },
      Stunde: { stem: { name: "Gēng", chinese: "庚", element: "Metall", yinYang: "Yang" }, branch: { name: "Wǔ", chinese: "午", element: "Feuer", animal: "Pferd", hiddenStems: [], yinYang: "Yang" } }
    }
  }
};

// REAL BootstrapResponse essentials: the BFF refuses to call /v1/experience/daily
// without a valid 12-sector soulprint ring from bootstrap (mirrors
// src/__fixtures__/fufire/bootstrap.json).
const BOOTSTRAP = {
  soulprint_sectors: [0.0697, 0.101788, 0.243949, 0.043493, 0.086053, 0.04256, 0.129119, 0.032088, 0.043641, 0.024569, 0, 0.18304]
};

// REAL DailyResponse shape (mirrors src/__fixtures__/fufire/daily.json):
// western.* / eastern.* sections with evidence, fusion.{summary,synthesis,action},
// push_text/pushworthy and jieqi/weekday notes. The legacy
// { qiResonance, dominantPhase, coachingKeyword } mock shape is gone — e2e must
// prove the full three-card + Impuls rendering path.
const DAILY = {
  date: "2026-06-10",
  western: {
    summary: "Fuer dich als Gemini stehen heute Kommunikation, Identitaet im Fokus. Die Planetenkonstellation aktiviert deine Sektoren 3 und 1.",
    themes: ["Kommunikation", "Identitaet"],
    caution: "Achte in Sektor 1 auf Ueberanstrengung -- hier liegt heute Spannung.",
    opportunity: "Sektor 3 bietet dir heute besonderes Potenzial. Nutze die Energie aktiv.",
    evidence: {
      transit_sectors: [2, 0],
      natal_focus: ["sun", "ascendant"],
      day_master: null,
      daily_pillar: null,
      relation_to_day_master: null,
      jieqi: null,
      weekday: "Mittwoch"
    },
    jieqi_note: null,
    weekday_note: "Mittwoch (Merkur): Kommunikation und Austausch stehen im Vordergrund."
  },
  eastern: {
    summary: "Dein Day Master Xin erobert heute Holz-Terrain. Dosiere deine Kraefte bewusst. Solarterm: Mangzhong.",
    themes: ["Ressourcen", "Chancen", "Taktung"],
    caution: "Achte auf Grenzen -- Ueberausgabe (Energie oder Mittel) liegt heute nah.",
    opportunity: "Wealth-Tage bringen materielle und immaterielle Chancen. Augen offen halten.",
    evidence: {
      transit_sectors: null,
      natal_focus: null,
      day_master: "Xin",
      daily_pillar: { stem: "Yi", branch: "Mao" },
      relation_to_day_master: "wealth",
      jieqi: "Mangzhong",
      weekday: "Mittwoch"
    },
    jieqi_note: "Feuer-Energie steigt: Sichtbarkeit und Aktivitaet nehmen zu.",
    weekday_note: "Mittwoch (Merkur): Kommunikation und Austausch stehen im Vordergrund."
  },
  fusion: {
    summary: "Dein Fusionstag verbindet Kommunikation aus beiden Systemen. Westlich staerkt dein Transitfeld, oestlich arbeitet dein Day Master Xin in wealth-Dynamik.",
    synthesis: "Beide Systeme zeigen heute einen gemeinsamen Impuls: Kommunikation. Gleichzeitig entsteht Spannung im Bereich Ressourcen, Chancen. Die Synthese liegt darin, beides bewusst zu halten — den Kommunikation-Impuls aktiv zu nutzen und den Spannungsbereich nicht zu verdraengen.",
    action: "Nutze heute gezielt den Bereich Kommunikation. Plane eine bewusste Handlung, die beide Energien verbindet.",
    pushworthy: true,
    push_text: "Dein Wealth-Tag: Kommunikation ruft.",
    jieqi_note: "Solarterm Mangzhong faerbt beide Systeme.",
    weekday_note: "Mittwoch-Energie verbindet die Impulse."
  },
  chart_type_quality: "exact",
  quality_flags: {
    house_system_fallback: false,
    house_system_requested: "placidus",
    house_system_used: "placidus",
    ephemeris_mode: "SWIEPH",
    chart_type_quality: "exact"
  },
  meta: { engine_version: "1.0.0-rc1-20260220", generated_at: "2026-06-10T22:16:24Z" },
  impact: null
};

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url || "";
  res.setHeader("Content-Type", "application/json");

  // Health is unauthenticated for simplicity.
  if (req.method === "GET" && url === "/v1/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // Everything else requires the X-API-Key the BFF must inject.
  if (!req.headers["x-api-key"]) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  const rawBody = await readBody(req);

  if (req.method === "POST" && url === "/chart") {
    // Persona routing by birth date (local_datetime):
    //   1985-03-10 → NO_TIME persona: provisional ascendant → normalizer nulls it
    //                (P5-T3 ExplanationLayer absence test).
    //   1988-08-08 → P7 synastry-completion partner: variant BaZi (San-He/Chong).
    //   any other non-1990-05-15 → generic partner persona: CHART clone + variant
    //                fusion so synastry pair tension is non-degenerate (relied on by
    //                explanation-layer/bazi-pillars specs that use 1990-06-15).
    //   1990-05-15 (primary) → unchanged CHART.
    let chartVariant = CHART;
    try {
      const parsed = JSON.parse(rawBody || "{}");
      const dt = typeof parsed.local_datetime === "string" ? parsed.local_datetime : "";
      if (dt.startsWith("1985-03-10")) {
        chartVariant = NO_TIME_CHART;
      } else if (dt.startsWith("1988-08-08")) {
        chartVariant = PARTNER_VARIANT;
      } else if (dt && !dt.startsWith("1990-05-15")) {
        chartVariant = PARTNER_CHART;
      }
    } catch {
      // keep primary chart
    }
    res.writeHead(200);
    res.end(JSON.stringify(chartVariant));
    return;
  }
  if (req.method === "POST" && url === "/v1/calculate/western") { res.writeHead(200); res.end(JSON.stringify({ western: CHART.western })); return; }
  if (req.method === "POST" && url === "/v1/calculate/bazi") { res.writeHead(200); res.end(JSON.stringify({ bazi: CHART.bazi })); return; }
  if (req.method === "POST" && url === "/v1/calculate/wuxing") { res.writeHead(200); res.end(JSON.stringify({ wuxing: CHART.wuxing })); return; }
  if (req.method === "POST" && url === "/v1/calculate/fusion") { res.writeHead(200); res.end(JSON.stringify({ fusion: CHART.fusion })); return; }
  if (req.method === "POST" && url === "/v1/experience/bootstrap") { res.writeHead(200); res.end(JSON.stringify(BOOTSTRAP)); return; }
  if (req.method === "POST" && url === "/v1/experience/daily") {
    // Echo the requested target_date (like the real engine) so the e2e
    // Tagesnavigation can assert prev/next day requests round-trip.
    let targetDate = DAILY.date;
    try {
      const parsed = JSON.parse(rawBody || "{}");
      if (typeof parsed.target_date === "string" && parsed.target_date) targetDate = parsed.target_date;
    } catch {
      // keep fixture date
    }
    res.writeHead(200);
    res.end(JSON.stringify({ ...DAILY, date: targetDate }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(PORT, () => {
  console.log(`[mock-fufire] listening on http://localhost:${PORT}`);
});
