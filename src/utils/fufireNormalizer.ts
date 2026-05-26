import { ElementType, YinYang } from "../types";
import { ProfileViewModel, HouseMeaning, ElementCardData, ProfileSource } from "../viewmodels/profileViewModel";
import { calculateAstrologyFusion } from "./astrology";

// Standard meanings for 12 Houses to combine with planet details
const HOUSE_TEMPLATES = [
  { number: 1, title: "Identität, Vitalität & Selbstbild", signResonance: "Widder", governs: "Ego, Beginn, Physis", description: "Das erste Haus (Aszendent) beschreibt Ihre physische Erscheinung, Ihre Maske zur Welt, Ihr instinktives Handeln und den Aszendenten. Es manifestiert die Art und Weise, wie Sie neue Lebensphasen betreten." },
  { number: 2, title: "Besitz, Werte & Ressourcen", signResonance: "Stier", governs: "Finanzen, Selbstwert, Talente", description: "Das zweite Haus spiegelt persönliche Ressourcen, Talente, materielle Besitztümer, Geld und Ihr fundamentales Gefühl von innerem Selbstwert wider." },
  { number: 3, title: "Kommunikation, Intellekt & Alltag", signResonance: "Zwillinge", governs: "Lernen, Umfeld, Austausch", description: "Das dritte Haus regiert das alltägliche Denken, das nähere Umfeld, Geschwister, das Schreiben, Reisen auf Kurzdistanz und den Informationsfluss." },
  { number: 4, title: "Heimat, Familie & Wurzeln", signResonance: "Krebs", governs: "Zuhause, Emotionen, Ahnen", description: "Das vierte Haus (Imum Coeli) bildet das emotionale Fundament, Ihre innere Zuflucht, Familie, Wurzeln, Wohnsituation und unbewusste Prägungen." },
  { number: 5, title: "Kreativität, Lust & Erschaffung", signResonance: "Löwe", governs: "Spiel, Liebe, Kinder", description: "Das fünfte Haus entfaltet Ihren kreativen Ausdruck, Liebesbeziehungen, Vergnügungen, Abenteuerlust, Hobbys und das innere Kind." },
  { number: 6, title: "Praxis, Alltag & Gesundheit", signResonance: "Jungfrau", governs: "Routinen, Hygiene, Dienst", description: "Das sechste Haus ordnet Ihre täglichen Routinen, körperliche Gesundheit, Ernährung, den Arbeitsalltag und Ihren bewussten Dienst am Umfeld." },
  { number: 7, title: "Begegnung, Partnerschaft & Du", signResonance: "Waage", governs: "Ehe, Beziehungen, Verträge", description: "Das siebte Haus (Deszendent) führt Sie in Verträge, feste Partnerschaften, enge Kooperationen und spiegelt Ihre unbewussten Wesenszüge im Spiegel der Mitmenschen." },
  { number: 8, title: "Wandel, Tabus & Geteiltes", signResonance: "Skorpion", governs: "Erbe, Transformation, Krise", description: "Das achte Haus thematisiert tiefgreifende Krisen, Transformation, Tabus, das spirituelle Erbe, geteilte Ressourcen und Ihre seelische Erneuerungskraft." },
  { number: 9, title: "Philosophie, Weite & Sinn", signResonance: "Schütze", governs: "Fernreisen, Ethik, Glaube", description: "Das neunte Haus erweitert Ihren Horizont durch höhere Philosophie, Ethik, Fernerkundung, Glaubenssysteme und spirituelle Horizonterweiterung." },
  { number: 10, title: "Ruf, Berufung & Stand", signResonance: "Steinbock", governs: "Karriere, Status, Vermächtnis", description: "Das zehnte Haus (Medium Coeli) verkörpert Ihre Karriere, Autorität, soziale Verantwortung, Ihren gesellschaftlichen Status und Ihre langfristigen Lebensleistungen." },
  { number: 11, title: "Ideale, Kollektiv & Freunde", signResonance: "Wassermann", governs: "Humanismus, Netzwerke, Träume", description: "Das elfte Haus beheimatet Ihre humanitären Netzwerke, Gleichgesinnte, freundschaftliche Zirkel, langfristige Hoffnungen und Visionen für die Kollektivzukunft." },
  { number: 12, title: "Rückzug, Unbewusstes & Auflösung", signResonance: "Fische", governs: "Einsamkeit, Träume, Erlösung", description: "Das zwölfte Haus hütet Ihre einsamen Träume, unbewusste Blockaden, Träume, das Verborgene, karmische Auflösungen und die vollkommene Hingabe an das Ganze." },
];

const ELEMENT_COACHING: Record<ElementType, { title: string; keynote: string; foods: string; colors: string; professions: string }> = {
  [ElementType.WOOD]: {
    title: "Holz (Mù) — Schöpferische Expansion",
    keynote: "Bringen Sie Flexibilität, kreative Ruhe und Dehnübungen (Yoga/QiGong) in Ihr Leben. Schützen Sie sich vor emotionaler Reizbarkeit durch bewusste Pausen im Wald.",
    foods: "Saure Speisen, grünes Blattgemüse, Brokkoli, Matcha, Limettenwasser.",
    colors: "Waldgrün, Flaschengrün, sanfte Jade-Töne.",
    professions: "Kreative Kunst, Verlagswesen, Pädagogik oder Forstbiologie."
  },
  [ElementType.FIRE]: {
    title: "Feuer (Huǒ) — Leidenschaftliche Strahlkraft",
    keynote: "Umfassen Sie Lebensfreude, offenes Reden und Tanz. Dämpfen Sie übermäßige Hitze durch abendliche Meditationen und schirmen Sie sich vor spätabendlichem Blaulicht ab.",
    foods: "Bittere Kräuter, Rucola, Grapefruit, rote Linsen, Chili (in Maßen).",
    colors: "Karmesinrot, Bordeaux, warmes Neon-Ziegelrot.",
    professions: "Bühnenkunst, Marketing, Unternehmertum, Energetik."
  },
  [ElementType.EARTH]: {
    title: "Erde (Tǔ) — Starke Fundamentierung",
    keynote: "Bringen Sie Struktur, festigende Bodenständigkeit und feste Schlafzeiten in Ihren Alltag. Begrenzen Sie unüberlegte Sorgen, indem Sie sich regelmäßig barfuß in der Natur erden.",
    foods: "Süßkartoffeln, Kürbis, Hirse, Karotten, wärmende Ingwer-Eintöpfe.",
    colors: "Ocker, warmes Sandgelb, Terracotta, Tabakbraun.",
    professions: "Immobilien, Landwirtschaft, Beratung, Seelsorge, Handwerk."
  },
  [ElementType.METAL]: {
    title: "Metall (Jīn) — Kristallene Abgrenzung",
    keynote: "Lernen Sie das Loslassen und entschlacken Sie Ihren Geist von Überanspruchung. Stärken Sie Ihre Atemwege (Pranayama) und pflegen Sie klare, aufbauende Grenzen.",
    foods: "Scharfe Radieschen, Ingwer, Blumenkohl, Birnen, weißer Sesam.",
    colors: "Silber-Platin, Reinweiß, strukturiertes Asphaltgrau.",
    professions: "Finanzwesen, Justiz, Chirurgie, Architektur, IT-Strukturen."
  },
  [ElementType.WATER]: {
    title: "Wasser (Shuǐ) — Unendliche seelische Tiefe",
    keynote: "Zulassen des lebendigen Flusses, der Introspektion und des Vertrauens. Halten Sie Ihren Körper mit lauwarmem Wasser hydriert und vermeiden Sie emotionale Kältestrukturen.",
    foods: "Salzige Speisen, schwarze Bohnen, Heidelbeeren, Algen, Algenmiso.",
    colors: "Midnight Blue, Obsidian-Tiefschwarz, Indigoblau.",
    professions: "Forschung, Philosophie, Seefahrt, Psychologie, Kunstschaffen."
  }
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sonne: "☉", Moon: "☽", Mond: "☽", Merkur: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptun: "♆", Pluto: "♇",
  Aszendent: "Asc", MediumCoeli: "MC", Chiron: "⚷", Lilith: "⚸"
};

function getPlanetSymbol(name: string): string {
  return PLANET_SYMBOLS[name] || "★";
}

export function normalizeFuFireProfile(raw: any, input: any, source: ProfileSource = "fufire-chart"): ProfileViewModel {
  const warnings: string[] = [];
  const isFallback = source === "fallback-local";

  // Honest per-section provenance: never claim FuFirE for data it did not provide.
  const sectionStatus = (present: boolean): "server-used" | "fallback-local" | "missing" =>
    isFallback ? "fallback-local" : present ? "server-used" : "missing";
  const sectionSource = (present: boolean): string =>
    isFallback ? "fallback-local" : present ? "fufire" : "missing";

  // Check if raw data structures are present, write detailed warnings if missing
  if (!raw.western) warnings.push("Westliche Astrologie-Daten fehlen im Quell-Chart.");
  if (!raw.bazi) warnings.push("BaZi-Daten fehlen im Quell-Chart.");
  if (!raw.wuxing) warnings.push("Wu-Xing Wandlungsphasen fehlen im Quell-Chart.");
  if (!raw.fusion) warnings.push("Synthese- & Fusionswerte fehlen im Quell-Chart.");

  // A. IDENTITY
  const identity = {
    name: input.name || "Unbekannter Sucher",
    birthDate: input.birthDate || "",
    birthTime: input.birthTime || "",
    birthPlace: input.birthPlaceLabel || input.birthPlace || "Unbekannter Ort",
    gender: input.gender || "Divers"
  };

  // B. WESTERN ASTROLOGY
  const rawWest = raw.western || {};
  const sunSign = rawWest.sunSign || rawWest.sun_sign || "Unbekannt";
  const moonSign = rawWest.moonSign || rawWest.moon_sign || "Unbekannt";
  const ascendant = rawWest.ascendant || "Unbekannt";

  // Map Planets / Positions
  // FuFirst could return bodies or positions or planets
  const rawPlanets = rawWest.planets || rawWest.positions || rawWest.bodies || [];
  const planets = rawPlanets.map((p: any) => {
    // If degree is returned as a number or from longitude
    let degree = typeof p.degree === "number" ? p.degree : 0;
    if (typeof p.longitude === "number" && !p.degree) {
      degree = p.longitude % 30;
    }
    return {
      name: p.name || "Unbekannter Planet",
      symbol: p.symbol || getPlanetSymbol(p.name || ""),
      sign: p.sign || "Unbekannt",
      house: typeof p.house === "number" ? p.house : 1,
      degree,
      element: p.element || "Unbekannt",
      retrograde: Boolean(p.retrograde)
    };
  });

  // Map 12 Houses (with actual missing state fallback if there is zero house list)
  const rawHouses = rawWest.houses || [];
  let houses: HouseMeaning[] = [];
  if (rawHouses.length === 0) {
    // Display standard template with missing state or source=missing
    houses = HOUSE_TEMPLATES.map((tmpl) => {
      return {
        ...tmpl,
        signResonance: "missing (source=missing)",
        governs: "missing (source=missing)",
        description: "Daten wurden von FuFirE nicht geliefert. Sektion verbleibt inaktiv.",
        planets: []
      };
    });
  } else {
    houses = HOUSE_TEMPLATES.map((tmpl) => {
      const rawH = rawHouses.find((h: any) => h.number === tmpl.number) || {};
      const cuspSign = rawH.sign || rawH.cuspSign || tmpl.signResonance;
      const cuspDeg = typeof rawH.degree === "number" ? rawH.degree : 0;
      
      // Filter planets allocated to this house number list
      const housePlanets = planets.filter((p: any) => p.house === tmpl.number);

      // Create a dynamic custom interpretation explaining planets in this house
      let explanation = tmpl.description;
      if (housePlanets.length > 0) {
        const pNames = housePlanets.map((p: any) => `${p.name} (${p.sign})`).join(" und ");
        explanation = `In Ihrem ${tmpl.number}. Haus steht die Energie von ${pNames}. ${tmpl.description}`;
      }

      return {
        number: tmpl.number,
        title: rawH.title || tmpl.title,
        signResonance: `${cuspSign} (${cuspDeg.toFixed(1)}°)`,
        governs: rawH.governs || tmpl.governs,
        description: explanation,
        planets: housePlanets.map((p: any) => ({
          name: p.name,
          symbol: p.symbol,
          sign: p.sign,
          degree: p.degree
        }))
      };
    });
  }

  // Aspects
  const rawAspects = rawWest.aspects || [];
  const aspects = rawAspects.map((asp: any) => ({
    planet1: asp.planet1 || asp.sourceKey || "Unbekannt",
    planet2: asp.planet2 || asp.targetKey || "Unbekannt",
    type: asp.type || "Aspekt",
    symbol: asp.symbol || "☌",
    orb: typeof asp.orb === "number" ? asp.orb : 0,
    harmony: asp.harmony || "neutral",
    interpretation: asp.interpretation || "Lokale abgeleitete Deutung"
  }));

  // C. BAZI PILLARS
  const rawBazi = raw.bazi || {};
  let rawPillars = rawBazi.pillars || {};
  
  // Backwards map if pillars are nested or array:
  const getPillarData = (key: string, backup: any) => {
    if (rawPillars[key]) return rawPillars[key];
    const found = Array.isArray(rawPillars) ? rawPillars.find((p: any) => p.title?.toLowerCase() === key.toLowerCase() || p.pillarKey?.toLowerCase() === key.toLowerCase()) : null;
    return found || backup;
  };

  const defaultStem = { name: "Unbekannt", pinyin: "Unbekannt", chinese: "?", element: ElementType.EARTH, yinYang: "Yang" as YinYang };
  const defaultBranch = { name: "Unbekannt", pinyin: "Unbekannt", chinese: "?", element: ElementType.EARTH, animal: "Unbekannt", hiddenStems: [], yinYang: "Yang" as YinYang };

  const pillarsList = [
    { title: "Kopf/Urahnen", pillarKey: "Jahr", data: getPillarData("Jahr", rawBazi.year || { stem: defaultStem, branch: defaultBranch }) },
    { title: "Familie/Monat", pillarKey: "Monat", data: getPillarData("Monat", rawBazi.month || { stem: defaultStem, branch: defaultBranch }) },
    { title: "Partner/Tag", pillarKey: "Tag", data: getPillarData("Tag", rawBazi.day || { stem: defaultStem, branch: defaultBranch }) },
    { title: "Träume/Stunde", pillarKey: "Stunde", data: getPillarData("Stunde", rawBazi.hour || { stem: defaultStem, branch: defaultBranch }) }
  ].map((p) => {
    const stem = p.data.stem || defaultStem;
    const branch = p.data.branch || defaultBranch;
    return {
      title: p.title,
      pillarKey: p.pillarKey,
      stemChinese: stem.chinese || "",
      stemPinyin: stem.name || stem.pinyin || "Unbekannt",
      stemElement: (stem.element as ElementType) || ElementType.EARTH,
      stemPolarity: stem.yinYang || "Yang",
      branchChinese: branch.chinese || "",
      branchPinyin: branch.name || branch.pinyin || "Unbekannt",
      branchElement: (branch.element as ElementType) || ElementType.EARTH,
      branchAnimal: branch.animal || "Unbekannt",
      branchPolarity: branch.yinYang || "Yang",
      hiddenStems: branch.hiddenStems || []
    };
  });

  // Day Master
  const dmElement = (rawBazi.dayMaster || rawBazi.day_master || ElementType.EARTH) as ElementType;
  const dmName = rawBazi.dayMasterName || pillarsList[2].stemPinyin;
  const dmChinese = rawBazi.dayMasterChinese || pillarsList[2].stemChinese;
  const dmPolarity = rawBazi.dayMasterPolarity || pillarsList[2].stemPolarity;

  const baziDayMaster = {
    element: dmElement,
    name: dmName,
    pinyin: dmName,
    chinese: dmChinese,
    polarity: dmPolarity,
    coreInterpretation: rawBazi.coreInterpretation || `Der ${dmElement}-Tagesmeister steuert Ihre innere Energieleitbahn. Seine Natur spiegelt Ihren tiefsten wahren Wesenskern wider.`,
    strengths: rawBazi.strengths || "Ausgewogenheit, Feinfühligkeit",
    shadow: rawBazi.shadow || "Schatten weisen auf harmonisierenden Ergänzungsbedarf hin."
  };

  // D. WU XING DISTRIBUTION
  // Never fabricate a distribution for a real FuFirE source that did not provide one.
  const wuxingAvail = isFallback || Boolean(raw.wuxing);
  const rawWuxing = raw.wuxing || {};
  const originDist = rawWuxing.wu_xing_vector || rawWuxing.distribution || {};

  // Convert percentages safely; absent section stays at zero (rendered as missing-state).
  const distribution: Record<ElementType, number> = {
    [ElementType.WOOD]: originDist[ElementType.WOOD] ?? originDist.Wood ?? 0,
    [ElementType.FIRE]: originDist[ElementType.FIRE] ?? originDist.Fire ?? 0,
    [ElementType.EARTH]: originDist[ElementType.EARTH] ?? originDist.Earth ?? 0,
    [ElementType.METAL]: originDist[ElementType.METAL] ?? originDist.Metal ?? 0,
    [ElementType.WATER]: originDist[ElementType.WATER] ?? originDist.Water ?? 0,
  };

  const sortedWuXing = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const maxElement = sortedWuXing[0][0] as ElementType;
  const minElement = sortedWuXing[sortedWuXing.length - 1][0] as ElementType;

  const elementCards: ElementCardData[] = wuxingAvail
    ? Object.entries(distribution).map(([element, percent]) => {
        const el = element as ElementType;
        const coach = ELEMENT_COACHING[el];
        let status: "Ausgeglichen" | "Überschuss" | "Defizit" = "Ausgeglichen";
        if (percent > 25) status = "Überschuss";
        if (percent < 15) status = "Defizit";

        return {
          element: el,
          percentage: percent,
          title: coach.title,
          keynote: coach.keynote,
          foods: coach.foods,
          colors: coach.colors,
          professions: coach.professions,
          status
        };
      })
    : [];

  const vectorExplanation = wuxingAvail
    ? (rawWuxing.vectorExplanation || `Ihre Elementenverteilung verweist auf dominante ${maxElement}-Frequenzen (${distribution[maxElement]}%), während ${minElement} (${distribution[minElement]}%) Ergänzungsimpulse verträgt.`)
    : "Wu-Xing-Wandlungsphasen wurden von FuFirE nicht geliefert (missing).";

  // E. FUSION MATRIX — never fabricate a coherence index for a missing section.
  const rawFusion = raw.fusion || {};
  const coherenceIndex = typeof rawFusion.coherenceIndex === "number" ? rawFusion.coherenceIndex : (typeof rawFusion.coherence_index === "number" ? rawFusion.coherence_index : 0);
  
  // Custom label rating
  let coherenceRating = "Harmonische Ausgewogenheit";
  if (coherenceIndex > 80) coherenceRating = "Exzellente System-Resonanz";
  else if (coherenceIndex < 60) coherenceRating = "Spannungsgeladene Dynamik";

  const fusion = {
    coherenceIndex,
    coherenceRating: rawFusion.coherenceRating || coherenceRating,
    coherenceExplanation: "Der Kohärenzindex ist kein moralisches Qualitätsurteil (kein Gut-Schlecht-Wert), sondern drückt das mathematische Resonanzmaß zwischen den westlichen Ekliptik-Signalen, der ostasiatischen BaZi-Struktur und der Wu-Xing-Verteilung aus.",
    systemBridge: rawFusion.systemBridge || `Ihre energetische Konfiguration spannt eine Brücke zwischen dem westlichen Tierkreiszeichen ${sunSign} und dem BaZi-Tagesmeister ${baziDayMaster.name} (${dmElement}).`,
    topSignals: rawFusion.topSignals || [
      { trigger: "Sonne-Tagesmeister Interferenz", interpretation: "Ihre westliche Kernpersönlichkeit harmoniert direkt mit der ostasiatischen Stamm-Schwingung." }
    ],
    // New required fields
    label: rawFusion.label || coherenceRating,
    explanation: "Der Kohärenzindex ist kein Gut-Schlecht-Wert, sondern ein Resonanzmaß zwischen westlichen Signalen, BaZi-Struktur und Wu-Xing-Verteilung.",
    westernContributors: rawFusion.westernContributors || [ `Sonne in ${sunSign}`, `Mond in ${moonSign}`, `Aszendent in ${ascendant}` ],
    baziContributors: rawFusion.baziContributors || pillarsList.map(p => `${p.pillarKey}: ${p.stemPinyin}/${p.branchAnimal}`),
    wuxingContributors: rawFusion.wuxingContributors || (wuxingAvail ? sortedWuXing.slice(0, 2).map(([el, pct]) => `${el} (${pct}%)`) : []),
    supports: rawFusion.supports || [ `${maxElement} stärkt Willenskraft`, "Häuser-Trigon-Harmonien" ],
    frictions: rawFusion.frictions || [ `Mangel an ${minElement} drosselt Fluss`, "Quadrat-Aspekte erfordern Reflexion" ],
    integrationText: rawFusion.integrationText || "Durch das Erkennen dieser kosmischen Strömungen verschmelzen beide Philosophien im Alltag.",
    source: sectionSource(Boolean(raw.fusion))
  };

  // F. PROVENANCE MATRIX — honest source per UI field.
  const confidenceFor = (present: boolean, fufireText: string): string =>
    isFallback
      ? "Lokal abgeleitete Deutung (fallback-local)"
      : present
        ? fufireText
        : "Nicht von FuFirE geliefert (missing)";

  const provenance = [
    {
      uiField: "Westliche Triade (Sonne, Mond, Aszendent)",
      appEndpoint: "/api/azodiac/profile",
      upstreamEndpoint: "/v1/chart",
      status: sectionStatus(Boolean(raw.western)),
      source: sectionSource(Boolean(raw.western)),
      confidence: confidenceFor(Boolean(raw.western), "Astronomische Ephemeriden-Rekonstruktion via FuFirE")
    },
    {
      uiField: "BaZi Schicksalssäulen (Stem & Branch)",
      appEndpoint: "/api/azodiac/profile",
      upstreamEndpoint: "/v1/calculate/bazi",
      status: sectionStatus(Boolean(raw.bazi)),
      source: sectionSource(Boolean(raw.bazi)),
      confidence: confidenceFor(Boolean(raw.bazi), "Lunisolarer Vier-Säulen-Kalender via FuFirE")
    },
    {
      uiField: "Wu Xing Wandlungsphasen",
      appEndpoint: "/api/azodiac/profile",
      upstreamEndpoint: "/v1/calculate/wuxing",
      status: sectionStatus(Boolean(raw.wuxing)),
      source: sectionSource(Boolean(raw.wuxing)),
      confidence: confidenceFor(Boolean(raw.wuxing), "Deterministische Elementwichtung (Four Pillars) via FuFirE")
    },
    {
      uiField: "System-Synergie & Kohärenzindex",
      appEndpoint: "/api/azodiac/profile",
      upstreamEndpoint: "/v1/calculate/fusion",
      status: sectionStatus(Boolean(raw.fusion)),
      source: sectionSource(Boolean(raw.fusion)),
      confidence: confidenceFor(Boolean(raw.fusion), "Synthetisierte Deckungsfaktoren (West-Ost-Brücke) via FuFirE")
    }
  ];

  return {
    identity,
    western: {
      sunSign,
      moonSign,
      ascendant,
      planets,
      aspects,
      houses
    },
    bazi: {
      available: isFallback || Boolean(raw.bazi),
      pillars: pillarsList,
      dayMaster: baziDayMaster,
      dayun: {
        available: false,
        status: "missing-capability",
        message: "Da Yun ist nicht berechenbar, weil FuFirE aktuell keinen stabilen Dayun-Endpunkt liefert.",
        cycles: []
      }
    },
    wuxing: {
      available: wuxingAvail,
      distribution,
      elementCards,
      vectorExplanation
    },
    fusion,
    source,
    provenance,
    warnings
  };
}

export function getRawSimulatedProfileFromLocal(birthData: any) {
  const legacyData = {
    ...birthData,
    birthPlace: birthData.birthPlaceLabel || birthData.birthPlace || "Unbekannt",
    gender: birthData.gender || "Divers",
    timezone: typeof birthData.timezone === "number" ? birthData.timezone : (birthData.utcOffsetMinutes ? birthData.utcOffsetMinutes / 60 : 1)
  };
  const chart = calculateAstrologyFusion(legacyData);
  return {
    source: "Lokal abgeleitete Deutung",
    western: {
      sunSign: chart.western.sunSign,
      moonSign: chart.western.moonSign,
      ascendant: chart.western.ascendant,
      planets: chart.western.planets,
      aspects: chart.western.aspects,
      houses: [] // Shows Missing state for houses!
    },
    bazi: {
      dayMaster: chart.bazi.dayMaster,
      dayMasterName: chart.bazi.day.stem.name,
      dayMasterChinese: chart.bazi.day.stem.chinese,
      dayMasterPolarity: chart.bazi.day.yinYang,
      animalSign: chart.bazi.animalSign,
      pillars: {
        Jahr: chart.bazi.year,
        Monat: chart.bazi.month,
        Tag: chart.bazi.day,
        Stunde: chart.bazi.hour
      }
    },
    wuxing: {
      wu_xing_vector: chart.bazi.wuXing
    },
    fusion: {
      coherenceIndex: 75
    }
  };
}

