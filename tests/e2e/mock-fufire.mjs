// Minimal mock of the FuFirE upstream for end-to-end tests.
// Returns a complete /v1/chart so the BFF reports source=fufire-chart.
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
  fusion: {
    coherenceIndex: 76,
    systemBridge: "Westliche Waage-Sonne und Holz-Tagesmeister bilden eine kooperative, ausgleichende Brücke."
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

  if (req.method === "POST" && url === "/v1/chart") {
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
