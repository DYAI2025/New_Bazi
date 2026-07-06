import { ElementType, YinYang } from "../types";
import { ProfileViewModel, HouseMeaning, ElementCardData, ProfileSource } from "../viewmodels/profileViewModel";
import { calculateAstrologyFusion, HEAVENLY_STEMS, EARTHLY_BRANCHES, WESTERN_ZODIAC } from "./astrology";
import { aspectInterpretation } from "./aspectInterpretation";

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

const DAY_MASTER_TEXTS: Record<ElementType, { coreInterpretation: string; strengths: string; shadow: string }> = {
  [ElementType.WOOD]: {
    coreInterpretation: "Der Holz-Tagesmeister steht im BaZi-Modell für aufstrebende, wachsende Energie — Richtungssinn und Gestaltungswillen prägen dieses Muster.",
    strengths: "Im BaZi-Modell: Wachstumsorientierung, Entscheidungsfreude, Visionskraft. Das Holzelement steht für aufstrebende Energie und Gestaltungswillen.",
    shadow: "Im BaZi-Modell: Ungeduld, Starrheit in Überzeugungen, Schwierigkeiten bei Rückzug und Erneuerung."
  },
  [ElementType.FIRE]: {
    coreInterpretation: "Der Feuer-Tagesmeister steht im BaZi-Modell für strahlende, nach außen gerichtete Energie — Ausdruckskraft und Begeisterung prägen dieses Muster.",
    strengths: "Im BaZi-Modell: Ausdrucksstärke, Begeisterungsfähigkeit, soziale Wärme. Das Feuerelement steht für Sichtbarkeit und emotionale Intensität.",
    shadow: "Im BaZi-Modell: Impulsivität, emotionale Überhitzung, Erschöpfung nach Hochphasen."
  },
  [ElementType.EARTH]: {
    coreInterpretation: "Der Erde-Tagesmeister steht im BaZi-Modell für stabilisierende, vermittelnde Energie — Beständigkeit und Gründlichkeit prägen dieses Muster.",
    strengths: "Im BaZi-Modell: Verlässlichkeit, Durchhaltevermögen, vermittelnde Kraft. Das Erdelement steht für Stabilität und Zentrierung.",
    shadow: "Im BaZi-Modell: Grübeln, Festhalten an Vertrautem, Tendenz zur Überanalyse."
  },
  [ElementType.METAL]: {
    coreInterpretation: "Der Metall-Tagesmeister steht im BaZi-Modell für klärende, präzisierende Energie — Urteilsschärfe und Prinzipientreue prägen dieses Muster.",
    strengths: "Im BaZi-Modell: Klarheit, Prinzipientreue, Fokus auf Qualität. Das Metallelement steht für Präzision und Urteilsvermögen.",
    shadow: "Im BaZi-Modell: Rigidität, Kritikneigung, Schwierigkeiten mit Mehrdeutigkeit."
  },
  [ElementType.WATER]: {
    coreInterpretation: "Der Wasser-Tagesmeister steht im BaZi-Modell für fließende, tiefgründige Energie — Intuition und Anpassungsvermögen prägen dieses Muster.",
    strengths: "Im BaZi-Modell: Anpassungsfähigkeit, Tiefgründigkeit, Intuition. Das Wasserelement steht für Fluss und Reflexionsvermögen.",
    shadow: "Im BaZi-Modell: Überwältigung durch Tiefe, Entscheidungsverzögerung, Tendenz zum Grübeln."
  }
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sonne: "☉", Moon: "☽", Mond: "☽", Merkur: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptun: "♆", Pluto: "♇",
  Aszendent: "Asc", MediumCoeli: "MC", Chiron: "⚷", Lilith: "⚸",
  Mondknoten: "☊"
};

function getPlanetSymbol(name: string): string {
  return PLANET_SYMBOLS[name] || "★";
}

// ---------------------------------------------------------------------------
// REAL FuFirE shape helpers (fixtures: src/__fixtures__/fufire/)
//
// The engine returns:
// - WesternResponse.bodies   OBJECT  name -> { longitude, zodiac_sign,
//                                    degree_in_sign, is_retrograde, ... }
// - WesternResponse.houses   OBJECT  "1".."12" -> cusp longitude (deg)
// - WesternResponse.angles   OBJECT  { Ascendant, MC, Vertex } -> longitude
// - ChartResponse.positions  ARRAY   [{ name, longitude_deg, sign_name_de,
//                                    degree_in_sign, is_retrograde, ... }]
// - BaziSection.pillars      year/month/day/hour with stem_index/branch_index
//                            (+ stem/branch pinyin), day_master = stem name
// - BaziResponse.pillars     year/month/day/hour with GERMAN keys
//                            { stamm, zweig, tier, element }
// - WxResponse.wu_xing_vector OBJECT German element -> 0..1 weight
// - FusionResponse           cosmic_state / harmony_index.harmony_index 0..1
// ---------------------------------------------------------------------------

/** Engine body/aspect names are English — the UI speaks German. */
const PLANET_NAMES_DE: Record<string, string> = {
  Sun: "Sonne", Moon: "Mond", Mercury: "Merkur", Venus: "Venus", Mars: "Mars",
  Jupiter: "Jupiter", Saturn: "Saturn", Uranus: "Uranus", Neptune: "Neptun",
  Pluto: "Pluto", Chiron: "Chiron", Lilith: "Lilith",
  NorthNode: "Mondknoten", TrueNorthNode: "Wahrer Mondknoten",
  Ascendant: "Aszendent", MC: "MediumCoeli"
};

function germanPlanetName(name: string): string {
  return PLANET_NAMES_DE[name] || name;
}

const ANIMALS_DE: Record<string, string> = {
  Rat: "Ratte", Ox: "Büffel", Tiger: "Tiger", Rabbit: "Hase", Dragon: "Drache",
  Snake: "Schlange", Horse: "Pferd", Goat: "Ziege", Monkey: "Affe",
  Rooster: "Hahn", Dog: "Hund", Pig: "Schwein"
};

function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function signNameDeFromIndex(idx: number): string {
  const entry = WESTERN_ZODIAC[((Math.trunc(idx) % 12) + 12) % 12];
  return entry ? entry.name : "Unbekannt";
}

function signNameDeFromLongitude(lon: number): string {
  return signNameDeFromIndex(Math.floor(normalize360(lon) / 30));
}

function signElementDe(signName: string): string {
  const entry = WESTERN_ZODIAC.find((z) => z.name === signName);
  return entry ? entry.element : "Unbekannt";
}

/** Read the real cusp object ("1".."12" -> longitude); null if not that shape. */
function readHouseCusps(rawHouses: any): number[] | null {
  if (!rawHouses || typeof rawHouses !== "object" || Array.isArray(rawHouses)) return null;
  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) {
    const v = rawHouses[String(i)] ?? rawHouses[i];
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    cusps.push(v);
  }
  return cusps;
}

/** Deterministic house placement from server cusps (no fabrication). */
function houseOfLongitude(lon: number, cusps: number[]): number {
  const pos = normalize360(lon);
  for (let h = 0; h < 12; h++) {
    const start = normalize360(cusps[h]);
    const span = normalize360(cusps[(h + 1) % 12] - start) || 30;
    if (normalize360(pos - start) < span) return h + 1;
  }
  return 1;
}

const ASPECT_TYPES_DE: Record<string, { name: string; symbol: string; harmony: "harmonisch" | "spannend" | "neutral" }> = {
  conjunction: { name: "Konjunktion", symbol: "☌", harmony: "neutral" },
  opposition: { name: "Opposition", symbol: "☍", harmony: "spannend" },
  trine: { name: "Trigon", symbol: "△", harmony: "harmonisch" },
  square: { name: "Quadrat", symbol: "□", harmony: "spannend" },
  sextile: { name: "Sextil", symbol: "✶", harmony: "harmonisch" },
  quincunx: { name: "Quincunx", symbol: "⚻", harmony: "spannend" },
  semisextile: { name: "Halbsextil", symbol: "⚺", harmony: "neutral" }
};

/** Pinyin lookup tolerant of missing diacritics ("Geng" matches "Gēng"). */
function normalizePinyin(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const STEM_BY_NAME = new Map(HEAVENLY_STEMS.map((s) => [normalizePinyin(s.name), s]));
const BRANCH_BY_NAME = new Map(EARTHLY_BRANCHES.map((b) => [normalizePinyin(b.name), b]));

function lookupStem(value: unknown) {
  return typeof value === "string" ? STEM_BY_NAME.get(normalizePinyin(value)) : undefined;
}

function lookupBranch(value: unknown) {
  return typeof value === "string" ? BRANCH_BY_NAME.get(normalizePinyin(value)) : undefined;
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

  // P4: provisional_fields per endpoint — response-driven degradation
  const timeKnown: boolean = input.timeKnown !== false;
  const westernProvisionalFields: string[] = Array.isArray(raw.western?.precision?.provisional_fields) ? raw.western.precision.provisional_fields : [];
  const fusionProvisionalFields: string[] = Array.isArray(raw.fusion?.precision?.provisional_fields) ? raw.fusion.precision.provisional_fields : [];
  // Honesty invariant (BIRTH-TIME-01): no user-given birth time → time-dependent
  // fields are ALWAYS provisional. The engine's provisional_fields is an ADDITIONAL
  // trigger, never the sole one — a response without precision.provisional_fields
  // (engine version skew / an endpoint ignoring birth_time_known) must not leak a
  // 12:00-computed ascendant or houses as fact.
  const ascendantProvisional = !timeKnown || westernProvisionalFields.includes("ascendant");
  const housesProvisional = !timeKnown || westernProvisionalFields.includes("houses");

  // B. WESTERN ASTROLOGY
  const rawWest = raw.western && typeof raw.western === "object" ? raw.western : {};

  // House cusps: REAL WesternResponse/ChartResponse deliver an OBJECT
  // ("1".."12" -> cusp longitude). Legacy/mock shapes deliver an array.
  const houseCusps = readHouseCusps(rawWest.houses);
  const legacyHouses: any[] = Array.isArray(rawWest.houses) ? rawWest.houses : [];

  // Planets. Three known shapes, real shapes take precedence over guesses:
  // 1. REAL WesternResponse.bodies: OBJECT name -> WesternBodyResponse
  // 2. REAL ChartResponse.positions: ARRAY of Position (sign_name_de etc.)
  // 3. Legacy/mock/fallback-local: ARRAY of { name, sign, house, degree, ... }
  let planets: ProfileViewModel["western"]["planets"] = [];
  if (rawWest.bodies && typeof rawWest.bodies === "object" && !Array.isArray(rawWest.bodies)) {
    planets = Object.entries(rawWest.bodies)
      .filter(([, body]) => body && typeof body === "object")
      .map(([engineName, body]: [string, any]) => {
        const lon = typeof body.longitude === "number" ? body.longitude : null;
        const signIndex = typeof body.zodiac_sign === "number"
          ? body.zodiac_sign
          : lon !== null ? Math.floor(normalize360(lon) / 30) : null;
        const sign = signIndex !== null ? signNameDeFromIndex(signIndex) : "Unbekannt";
        const degree = typeof body.degree_in_sign === "number"
          ? body.degree_in_sign
          : lon !== null ? normalize360(lon) % 30 : 0;
        const name = germanPlanetName(engineName);
        return {
          name,
          symbol: getPlanetSymbol(name),
          sign,
          // House placement is derived deterministically from the server's
          // own cusps; 0 = unknown (never a fabricated "house 1").
          house: lon !== null && houseCusps ? houseOfLongitude(lon, houseCusps) : 0,
          degree,
          element: signElementDe(sign),
          retrograde: Boolean(body.is_retrograde)
        };
      });
  } else {
    const rawPlanets: any[] = Array.isArray(rawWest.planets)
      ? rawWest.planets
      : Array.isArray(rawWest.positions)
        ? rawWest.positions
        : [];
    planets = rawPlanets
      .filter((p: any) => p && typeof p === "object")
      .map((p: any) => {
        // REAL ChartResponse Position shape
        if (typeof p.sign_name_de === "string" || typeof p.longitude_deg === "number") {
          const lon = typeof p.longitude_deg === "number" ? p.longitude_deg : null;
          const sign = p.sign_name_de
            || (typeof p.sign_index === "number" ? signNameDeFromIndex(p.sign_index) : "Unbekannt");
          const name = germanPlanetName(p.name || "Unbekannter Planet");
          return {
            name,
            symbol: getPlanetSymbol(name),
            sign,
            house: lon !== null && houseCusps ? houseOfLongitude(lon, houseCusps) : 0,
            degree: typeof p.degree_in_sign === "number" ? p.degree_in_sign : lon !== null ? normalize360(lon) % 30 : 0,
            element: signElementDe(sign),
            retrograde: Boolean(p.is_retrograde)
          };
        }
        // Legacy/mock shape
        let degree = typeof p.degree === "number" ? p.degree : 0;
        if (typeof p.longitude === "number" && !p.degree) {
          degree = normalize360(p.longitude) % 30;
        }
        return {
          name: p.name || "Unbekannter Planet",
          symbol: p.symbol || getPlanetSymbol(p.name || ""),
          sign: p.sign || "Unbekannt",
          house: typeof p.house === "number" ? p.house : 1,
          degree,
          element: p.element || "Unbekannt",
          retrograde: Boolean(p.retrograde ?? p.is_retrograde)
        };
      });
  }

  // Triad: explicit fields (legacy/mock) win, otherwise derived from the
  // REAL angles/bodies the engine delivered.
  const angles = rawWest.angles && typeof rawWest.angles === "object" ? rawWest.angles : {};
  const planetSign = (name: string): string | null =>
    planets.find((p) => p.name === name)?.sign || null;
  const sunSign = rawWest.sunSign || rawWest.sun_sign || planetSign("Sonne") || "Unbekannt";
  const moonSign = rawWest.moonSign || rawWest.moon_sign || planetSign("Mond") || "Unbekannt";
  // F-01: if ascendant is in provisional_fields, short-circuit the ENTIRE fallback chain.
  // The engine may return angles.Ascendant with a 12:00-computed value — never use it.
  const ascendant: string | null = ascendantProvisional
    ? null
    : (rawWest.ascendant
        || (typeof angles.Ascendant === "number" ? signNameDeFromLongitude(angles.Ascendant) : null)
        || (houseCusps ? signNameDeFromLongitude(houseCusps[0]) : null)
        || "Unbekannt");

  // P7-T1: absolute ascendant longitude — ONLY from a real source, never from
  // the sign name. Provisional (unknown birth time) short-circuits to null,
  // same F-01 rule as `ascendant` above (never use a 12:00-computed angle).
  const ascendantLongitude: number | null = ascendantProvisional
    ? null
    : (typeof angles.Ascendant === "number" && Number.isFinite(angles.Ascendant)
        ? normalize360(angles.Ascendant)
        : houseCusps && Number.isFinite(houseCusps[0])
          ? normalize360(houseCusps[0])
          : null);

  // Map 12 Houses (with actual missing state fallback if there is zero house data)
  // When houses are provisional (birth_time_known:false), return empty array — no 12:00-computed houses displayed.
  let houses: HouseMeaning[] = [];
  if (housesProvisional) {
    houses = [];
  } else if (houseCusps) {
    // REAL cusp object: sign resonance straight from the server's cusp longitudes.
    houses = HOUSE_TEMPLATES.map((tmpl) => {
      const cusp = houseCusps[tmpl.number - 1];
      const cuspSign = signNameDeFromLongitude(cusp);
      const cuspDeg = normalize360(cusp) % 30;
      const housePlanets = planets.filter((p) => p.house === tmpl.number);
      let explanation = tmpl.description;
      if (housePlanets.length > 0) {
        const pNames = housePlanets.map((p) => `${p.name} (${p.sign})`).join(" und ");
        explanation = `In Ihrem ${tmpl.number}. Haus steht die Energie von ${pNames}. ${tmpl.description}`;
      }
      return {
        number: tmpl.number,
        title: tmpl.title,
        signResonance: `${cuspSign} (${cuspDeg.toFixed(1)}°)`,
        governs: tmpl.governs,
        description: explanation,
        planets: housePlanets.map((p) => ({ name: p.name, symbol: p.symbol, sign: p.sign, degree: p.degree }))
      };
    });
  } else if (legacyHouses.length === 0) {
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
      const rawH = legacyHouses.find((h: any) => h.number === tmpl.number) || {};
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

  // Aspects. REAL AspectResponse: { planet1, planet2, type, angle, orb,
  // exact_angle } with English names/types — translate and derive harmony
  // from the aspect type. Legacy entries keep their own fields.
  const rawAspects: any[] = Array.isArray(rawWest.aspects) ? rawWest.aspects : [];
  const aspects = rawAspects
    .filter((asp: any) => asp && typeof asp === "object")
    .map((asp: any) => {
      const typeInfo = typeof asp.type === "string" ? ASPECT_TYPES_DE[asp.type.toLowerCase()] : undefined;
      const planet1 = germanPlanetName(asp.planet1 || asp.sourceKey || "Unbekannt");
      const planet2 = germanPlanetName(asp.planet2 || asp.targetKey || "Unbekannt");
      const typeDe = typeInfo ? typeInfo.name : asp.type || "Aspekt";
      return {
        planet1,
        planet2,
        type: typeDe,
        symbol: asp.symbol || (typeInfo ? typeInfo.symbol : "☌"),
        orb: typeof asp.orb === "number" ? asp.orb : 0,
        harmony: asp.harmony || (typeInfo ? typeInfo.harmony : "neutral"),
        // REAL aspects carry no interpretation field — compose a local,
        // deterministic sentence (aspect-type template x planet keywords)
        // instead of the former literal placeholder.
        interpretation: asp.interpretation || aspectInterpretation(planet1, planet2, typeDe)
      };
    });

  // C. BAZI PILLARS
  const rawBazi = raw.bazi && typeof raw.bazi === "object" ? raw.bazi : {};
  const rawPillars: any = rawBazi.pillars && typeof rawBazi.pillars === "object" ? rawBazi.pillars : {};
  const baziProvisionalFields: string[] = Array.isArray(rawBazi.precision?.provisional_fields) ? rawBazi.precision.provisional_fields : [];
  // BIRTH-TIME-01: same local backstop — unknown birth time always suppresses the hour pillar.
  const hourProvisional = !timeKnown || baziProvisionalFields.includes("hour");

  // REAL shapes use English pillar keys (BaziPillarsResponse/BaziSection:
  // year/month/day/hour); legacy mocks use German keys (Jahr/Monat/...).
  const PILLAR_KEY_EN: Record<string, string> = { Jahr: "year", Monat: "month", Tag: "day", Stunde: "hour" };
  const getPillarData = (key: string, backup: any) => {
    if (rawPillars[key]) return rawPillars[key];
    if (rawPillars[PILLAR_KEY_EN[key]]) return rawPillars[PILLAR_KEY_EN[key]];
    const found = Array.isArray(rawPillars) ? rawPillars.find((p: any) => p.title?.toLowerCase() === key.toLowerCase() || p.pillarKey?.toLowerCase() === key.toLowerCase()) : null;
    return found || backup;
  };

  const defaultStem = { name: "Unbekannt", pinyin: "Unbekannt", chinese: "?", element: ElementType.EARTH, yinYang: "Yang" as YinYang };
  const defaultBranch = { name: "Unbekannt", pinyin: "Unbekannt", chinese: "?", element: ElementType.EARTH, animal: "Unbekannt", hiddenStems: [] as string[], yinYang: "Yang" as YinYang };

  /**
   * Resolve a REAL flat pillar against the canonical stem/branch tables.
   * Handles BaziSection ({ stem_index, branch_index, stem, branch, animal })
   * and BaziResponse ({ stamm, zweig, tier, element }). Returns null for the
   * legacy nested { stem: {...}, branch: {...} } shape.
   */
  type NormalizedStem = { name: string; chinese: string; element: ElementType; yinYang: YinYang; pinyin?: string };
  type NormalizedBranch = NormalizedStem & { animal: string; hiddenStems: string[] };
  const resolveRealPillar = (data: any): { stem: NormalizedStem; branch: NormalizedBranch } | null => {
    if (!data || typeof data !== "object") return null;
    if (data.stem && typeof data.stem === "object") return null; // legacy nested shape
    const stem = (typeof data.stem_index === "number" ? HEAVENLY_STEMS[data.stem_index] : undefined)
      || lookupStem(data.stamm)
      || lookupStem(data.stem);
    const branch = (typeof data.branch_index === "number" ? EARTHLY_BRANCHES[data.branch_index] : undefined)
      || lookupBranch(data.zweig)
      || lookupBranch(data.branch);
    if (!stem && !branch) return null;
    const animalDe = typeof data.tier === "string" ? data.tier
      : typeof data.animal === "string" ? (ANIMALS_DE[data.animal] || data.animal) : undefined;
    return {
      stem: stem || defaultStem,
      branch: branch ? { ...branch, animal: animalDe || branch.animal } : { ...defaultBranch, animal: animalDe || defaultBranch.animal }
    };
  };

  const pillarsList = [
    { title: "Kopf/Urahnen", pillarKey: "Jahr", data: getPillarData("Jahr", rawBazi.year || { stem: defaultStem, branch: defaultBranch }) },
    { title: "Familie/Monat", pillarKey: "Monat", data: getPillarData("Monat", rawBazi.month || { stem: defaultStem, branch: defaultBranch }) },
    { title: "Partner/Tag", pillarKey: "Tag", data: getPillarData("Tag", rawBazi.day || { stem: defaultStem, branch: defaultBranch }) },
    // F-02: if hour is in provisional_fields, pass null — do NOT fall through to rawPillars["hour"] (12:00-computed)
    { title: "Träume/Stunde", pillarKey: "Stunde", data: hourProvisional ? null : getPillarData("Stunde", rawBazi.hour ?? null) }
  ].map((p) => {
    const real = resolveRealPillar(p.data);
    const stem = real ? real.stem : (p.data && typeof p.data === "object" && p.data.stem) || defaultStem;
    const branch = real ? real.branch : (p.data && typeof p.data === "object" && p.data.branch) || defaultBranch;
    return {
      title: p.title,
      pillarKey: p.pillarKey,
      stemChinese: stem.chinese || "",
      stemPinyin: stem.name || (stem as any).pinyin || "Unbekannt",
      stemElement: (stem.element as ElementType) || ElementType.EARTH,
      stemPolarity: stem.yinYang || "Yang",
      branchChinese: branch.chinese || "",
      branchPinyin: branch.name || (branch as any).pinyin || "Unbekannt",
      branchElement: (branch.element as ElementType) || ElementType.EARTH,
      branchAnimal: branch.animal || "Unbekannt",
      branchPolarity: branch.yinYang || "Yang",
      hiddenStems: branch.hiddenStems || []
    };
  });

  // Day Master. REAL responses deliver a STEM NAME ("Xin" — BaziSection
  // .day_master / BaziResponse .chinese.day_master), legacy mocks an element.
  const dmRaw = rawBazi.dayMaster || rawBazi.day_master || rawBazi.chinese?.day_master;
  const dmStem = lookupStem(dmRaw);
  const dmIsElement = typeof dmRaw === "string" && (Object.values(ElementType) as string[]).includes(dmRaw);
  const dmElement = (dmIsElement ? dmRaw : dmStem?.element || pillarsList[2].stemElement || ElementType.EARTH) as ElementType;
  const dmName = rawBazi.dayMasterName || dmStem?.name || pillarsList[2].stemPinyin;
  const dmChinese = rawBazi.dayMasterChinese || dmStem?.chinese || pillarsList[2].stemChinese;
  const dmPolarity = rawBazi.dayMasterPolarity || dmStem?.yinYang || pillarsList[2].stemPolarity;

  const baziDayMaster = {
    element: dmElement,
    name: dmName,
    pinyin: dmName,
    chinese: dmChinese,
    polarity: dmPolarity,
    coreInterpretation: rawBazi.coreInterpretation || DAY_MASTER_TEXTS[dmElement].coreInterpretation,
    strengths: rawBazi.strengths || DAY_MASTER_TEXTS[dmElement].strengths,
    shadow: rawBazi.shadow || DAY_MASTER_TEXTS[dmElement].shadow
  };

  // D. WU XING DISTRIBUTION
  // Never fabricate a distribution for a real FuFirE source that did not provide
  // a usable positive vector. A present-but-empty `{}` is an error/missing state,
  // not five real 0% "Defizit" bars.
  const rawWuxing = raw.wuxing && typeof raw.wuxing === "object" ? raw.wuxing : {};
  // REAL shapes: WxResponse.wu_xing_vector (German keys, 0..1 weights) or the
  // chart's WuXingSection.from_planets (raw weights). Legacy: distribution
  // already in percent. All are normalized to percentage SHARES below — for
  // an already-percentual vector (sum 100) that is the identity.
  const pickVector = (candidate: any): any =>
    candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : null;
  const originDist = pickVector(rawWuxing.wu_xing_vector)
    || pickVector(rawWuxing.distribution)
    || pickVector(rawWuxing.from_planets)
    || {};

  const rawWeights: Record<ElementType, number> = {
    [ElementType.WOOD]: originDist[ElementType.WOOD] ?? originDist.Wood ?? 0,
    [ElementType.FIRE]: originDist[ElementType.FIRE] ?? originDist.Fire ?? 0,
    [ElementType.EARTH]: originDist[ElementType.EARTH] ?? originDist.Earth ?? 0,
    [ElementType.METAL]: originDist[ElementType.METAL] ?? originDist.Metal ?? 0,
    [ElementType.WATER]: originDist[ElementType.WATER] ?? originDist.Water ?? 0,
  };
  const weightTotal = Object.values(rawWeights).reduce(
    (acc, v) => acc + (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0), 0);
  const wuxingAvail = Boolean(raw.wuxing) && weightTotal > 0;
  if (raw.wuxing && weightTotal === 0) {
    warnings.push("Wu-Xing-Daten wurden ohne nutzbaren Elementvektor geliefert.");
  }

  // Percentage shares; absent section stays at zero (rendered as missing-state).
  const distribution: Record<ElementType, number> = Object.fromEntries(
    Object.entries(rawWeights).map(([el, v]) => {
      const safe = typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
      return [el, weightTotal > 0 ? Math.round((safe / weightTotal) * 1000) / 10 : 0];
    })
  ) as Record<ElementType, number>;

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
    : raw.wuxing
      ? "Wu-Xing-Wandlungsphasen wurden ohne nutzbaren Elementvektor geliefert (error)."
      : "Wu-Xing-Wandlungsphasen wurden von FuFirE nicht geliefert (missing).";

  // E. FUSION MATRIX — never fabricate a coherence index for a missing section.
  const rawFusion = raw.fusion && typeof raw.fusion === "object" ? raw.fusion : {};
  // REAL FusionResponse: cosmic_state (0..1), harmony_index = OBJECT
  // { harmony_index: 0..1, interpretation, ... } AND a calibration block
  // { h_raw, h_calibrated, h_baseline, h_sigma, sigma_above, quality,
  //   interpretation_band, n_west, n_bazi_contributions }.
  // Legacy mocks: coherenceIndex 0..100.
  const harmonyObj = rawFusion.harmony_index && typeof rawFusion.harmony_index === "object"
    ? rawFusion.harmony_index : null;
  const calibration = rawFusion.calibration && typeof rawFusion.calibration === "object"
    ? rawFusion.calibration : null;
  const hCalibrated = calibration && typeof calibration.h_calibrated === "number" && Number.isFinite(calibration.h_calibrated)
    ? calibration.h_calibrated : null;
  const realCoherence01 = typeof rawFusion.cosmic_state === "number" ? rawFusion.cosmic_state
    : harmonyObj && typeof harmonyObj.harmony_index === "number" ? harmonyObj.harmony_index
    : typeof rawFusion.harmony_index === "number" ? rawFusion.harmony_index
    : null;
  // The CALIBRATED value (structure congruence vs. random baseline) is the
  // honest headline number. The raw dot-product (0.908 -> "91%") flatters
  // every chart and is only used when the engine sent no calibration block —
  // and then it is explicitly flagged via coherenceCalibrated=false.
  const coherenceCalibrated = hCalibrated !== null;
  const coherenceIndex = hCalibrated !== null ? Math.round(hCalibrated * 100 * 10) / 10
    : typeof rawFusion.coherenceIndex === "number" ? rawFusion.coherenceIndex
    : typeof rawFusion.coherence_index === "number" ? rawFusion.coherence_index
    : realCoherence01 !== null ? Math.round((realCoherence01 <= 1 ? realCoherence01 * 100 : realCoherence01) * 10) / 10
    : null;

  // Signal level: how VISIBLE the West-Ost congruence pattern is, i.e. how
  // far the raw harmony sits from the engine's random baseline, in baseline
  // sigmas. z = (h_raw - h_baseline) / h_sigma; the |z| buckets pin >=
  // semantics: |z| < 1 -> leise, 1 <= |z| < 2 -> spuerbar, |z| >= 2 ->
  // dominant. This is NOT a tension quality — +1σ means MORE harmonic than
  // random, not "more tense". True tension intensity will derive from the
  // per-element differences in the upcoming Spannungsnavigator.
  let signalLevel: "leise" | "spuerbar" | "dominant" | null = null;
  const hRaw = calibration && typeof calibration.h_raw === "number" ? calibration.h_raw : realCoherence01;
  const hBaseline = calibration && typeof calibration.h_baseline === "number" ? calibration.h_baseline : null;
  const hSigma = calibration && typeof calibration.h_sigma === "number" && calibration.h_sigma > 0 ? calibration.h_sigma : null;
  if (hRaw !== null && hBaseline !== null && hSigma !== null) {
    const z = Math.abs((hRaw - hBaseline) / hSigma);
    signalLevel = z < 1 ? "leise" : z < 2 ? "spuerbar" : "dominant";
  } else if (hCalibrated !== null) {
    // HONEST APPROXIMATION: the response carried h_calibrated but no usable
    // baseline std (h_sigma), so no z-score is computable. We derive the
    // level from h_calibrated thirds instead (<0.33 leise, <0.66 spuerbar,
    // else dominant) — a coarse bucketing, not a statistical statement.
    signalLevel = hCalibrated < 0.33 ? "leise" : hCalibrated < 0.66 ? "spuerbar" : "dominant";
  }
  if (coherenceIndex === null) {
    signalLevel = null;
  }

  // Custom label rating — NIE aus einem fehlenden Wert ableiten (null < 60 wäre sonst true).
  let coherenceRating = "Harmonische Ausgewogenheit";
  if (coherenceIndex === null) coherenceRating = "Keine Kohärenz-Daten verfügbar";
  else if (coherenceIndex > 80) coherenceRating = "Exzellente System-Resonanz";
  else if (coherenceIndex < 60) coherenceRating = "Spannungsgeladene Dynamik";
  // The engine's own interpretation beats any locally derived label.
  if (harmonyObj && typeof harmonyObj.interpretation === "string" && harmonyObj.interpretation) {
    coherenceRating = harmonyObj.interpretation;
  }
  // The engine's calibrated interpretation_band beats the raw-harmony
  // interpretation — it belongs to the value we actually display.
  if (calibration && typeof calibration.interpretation_band === "string" && calibration.interpretation_band) {
    coherenceRating = calibration.interpretation_band;
  }

  // REAL elemental_comparison: { Holz: { western, bazi, difference }, ... } —
  // the per-element West-vs-BaZi weights the harmony is computed from.
  const ELEMENT_ORDER = [ElementType.WOOD, ElementType.FIRE, ElementType.EARTH, ElementType.METAL, ElementType.WATER];
  const rawComparison = rawFusion.elemental_comparison && typeof rawFusion.elemental_comparison === "object" && !Array.isArray(rawFusion.elemental_comparison)
    ? rawFusion.elemental_comparison : null;
  const elementalComparison = rawComparison
    ? ELEMENT_ORDER.flatMap((el) => {
        const entry = rawComparison[el];
        if (!entry || typeof entry !== "object") return [];
        const western = typeof entry.western === "number" && Number.isFinite(entry.western) ? entry.western : null;
        const bazi = typeof entry.bazi === "number" && Number.isFinite(entry.bazi) ? entry.bazi : null;
        if (western === null || bazi === null) return [];
        const difference = typeof entry.difference === "number" && Number.isFinite(entry.difference)
          ? entry.difference
          : Math.round((western - bazi) * 1000) / 1000;
        return [{ element: el as string, western, bazi, difference }];
      })
    : [];

  // Top signals are DERIVED from server data only (the two largest West/Ost
  // differences = "größte Spannungsfelder"), or passed through from a legacy
  // payload. The previous hardcoded default reading every user saw the same
  // invented "Sonne-Tagesmeister Interferenz" is gone for good.
  const derivedTopSignals = [...elementalComparison]
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, 2)
    .map((c) => ({
      trigger: `${c.element}: West ${c.western.toFixed(2)} vs. BaZi ${c.bazi.toFixed(2)}`,
      interpretation: c.difference >= 0
        ? `Größtes Spannungsfeld im Element ${c.element}: Die westliche Chart gewichtet ${c.element} um ${Math.abs(c.difference).toFixed(2)} stärker als die BaZi-Struktur.`
        : `Größtes Spannungsfeld im Element ${c.element}: Die BaZi-Struktur gewichtet ${c.element} um ${Math.abs(c.difference).toFixed(2)} stärker als die westliche Chart.`
    }));

  const fusion = {
    coherenceIndex,
    coherenceCalibrated,
    signalLevel,
    coherenceRating: rawFusion.coherenceRating || coherenceRating,
    coherenceExplanation: coherenceCalibrated
      ? "Kalibrierte Strukturkongruenz: Der rohe Resonanzwert wird gegen eine Zufallsbaseline kalibriert — angezeigt wird, wie deutlich Ihre West-Ost-Struktur über zufälliger Übereinstimmung liegt. Kein moralisches Qualitätsurteil (kein Gut-Schlecht-Wert)."
      : "Der Kohärenzindex ist kein moralisches Qualitätsurteil (kein Gut-Schlecht-Wert), sondern drückt das mathematische Resonanzmaß zwischen den westlichen Ekliptik-Signalen, der ostasiatischen BaZi-Struktur und der Wu-Xing-Verteilung aus.",
    systemBridge: rawFusion.systemBridge || `Ihre energetische Konfiguration spannt eine Brücke zwischen dem westlichen Tierkreiszeichen ${sunSign} und dem BaZi-Tagesmeister ${baziDayMaster.name} (${dmElement}).`,
    elementalComparison,
    topSignals: Array.isArray(rawFusion.topSignals) ? rawFusion.topSignals : derivedTopSignals,
    // New required fields
    label: rawFusion.label || coherenceRating,
    explanation: "Der Kohärenzindex ist kein Gut-Schlecht-Wert, sondern ein Resonanzmaß zwischen westlichen Signalen, BaZi-Struktur und Wu-Xing-Verteilung.",
    signalLevelSuffix: (!timeKnown || fusionProvisionalFields.includes("hour") || fusionProvisionalFields.includes("signature")) ? "(ohne Stundensäule)" : null,
    westernContributors: rawFusion.westernContributors || [
      `Sonne in ${sunSign}`,
      `Mond in ${moonSign}`,
      ...(ascendant !== null ? [`Aszendent in ${ascendant}`] : [])
    ],
    baziContributors: rawFusion.baziContributors || pillarsList.map(p => `${p.pillarKey}: ${p.stemPinyin}/${p.branchAnimal}`),
    wuxingContributors: rawFusion.wuxingContributors || (wuxingAvail ? sortedWuXing.slice(0, 2).map(([el, pct]) => `${el} (${pct}%)`) : []),
    supports: rawFusion.supports || [ `${maxElement} stärkt Willenskraft`, "Häuser-Trigon-Harmonien" ],
    frictions: rawFusion.frictions || [ `Mangel an ${minElement} drosselt Fluss`, "Quadrat-Aspekte erfordern Reflexion" ],
    // The "Fusions-Deutung der Engine" section shows ONLY real engine text
    // (fusion_interpretation) or a legacy passthrough. Absent text -> null ->
    // the section stays hidden. NO invented fallback sentence — that would be
    // local copy masquerading as engine output.
    integrationText: typeof rawFusion.integrationText === "string" && rawFusion.integrationText
      ? rawFusion.integrationText
      : typeof rawFusion.fusion_interpretation === "string" && rawFusion.fusion_interpretation
        ? rawFusion.fusion_interpretation
        : null,
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
      upstreamEndpoint: "/chart",
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
    timeKnown,
    identity,
    western: {
      sunSign,
      moonSign,
      ascendant,
      ascendantLongitude,
      housesAvailable: !housesProvisional,
      planets,
      aspects,
      houses
    },
    bazi: {
      available: isFallback || Boolean(raw.bazi),
      hourAvailable: !hourProvisional,
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
    fusion: {}
  };
}
