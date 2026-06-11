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

const DAILY = {
  qiResonance: 64,
  dominantPhase: "Wasser",
  coachingKeyword: "Fluss",
  description: "Heute trägt eine Wasser-Resonanz Ihre Vorhaben. Bewegen Sie sich anpassungsfähig und hören Sie nach innen."
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

  await readBody(req);

  if (req.method === "POST" && url === "/chart") {
    res.writeHead(200);
    res.end(JSON.stringify(CHART));
    return;
  }
  if (req.method === "POST" && url === "/v1/calculate/western") { res.writeHead(200); res.end(JSON.stringify({ western: CHART.western })); return; }
  if (req.method === "POST" && url === "/v1/calculate/bazi") { res.writeHead(200); res.end(JSON.stringify({ bazi: CHART.bazi })); return; }
  if (req.method === "POST" && url === "/v1/calculate/wuxing") { res.writeHead(200); res.end(JSON.stringify({ wuxing: CHART.wuxing })); return; }
  if (req.method === "POST" && url === "/v1/calculate/fusion") { res.writeHead(200); res.end(JSON.stringify({ fusion: CHART.fusion })); return; }
  if (req.method === "POST" && url === "/v1/experience/bootstrap") { res.writeHead(200); res.end(JSON.stringify({ ok: true })); return; }
  if (req.method === "POST" && url === "/v1/experience/daily") { res.writeHead(200); res.end(JSON.stringify(DAILY)); return; }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(PORT, () => {
  console.log(`[mock-fufire] listening on http://localhost:${PORT}`);
});
