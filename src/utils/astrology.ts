import {
  ElementType,
  YinYang,
  HeavenlyStem,
  EarthlyBranch,
  BaZiPillar,
  WuXingDistribution,
  WesternPlanet,
  WesternAspect,
  BirthData,
  AstrologyFusionChart,
} from "../types";

// --- HEAVENLY STEMS (Himmlische Stämme) ---
export const HEAVENLY_STEMS: HeavenlyStem[] = [
  { name: "Jiǎ", chinese: "甲", element: ElementType.WOOD, yinYang: "Yang" },
  { name: "Yǐ", chinese: "乙", element: ElementType.WOOD, yinYang: "Yin" },
  { name: "Bǐng", chinese: "丙", element: ElementType.FIRE, yinYang: "Yang" },
  { name: "Dīng", chinese: "丁", element: ElementType.FIRE, yinYang: "Yin" },
  { name: "Wù", chinese: "戊", element: ElementType.EARTH, yinYang: "Yang" },
  { name: "Jǐ", chinese: "己", element: ElementType.EARTH, yinYang: "Yin" },
  { name: "Gēng", chinese: "庚", element: ElementType.METAL, yinYang: "Yang" },
  { name: "Xīn", chinese: "辛", element: ElementType.METAL, yinYang: "Yin" },
  { name: "Rén", chinese: "壬", element: ElementType.WATER, yinYang: "Yang" },
  { name: "Guǐ", chinese: "癸", element: ElementType.WATER, yinYang: "Yin" },
];

// --- EARTHLY BRANCHES (Irdische Zweige) ---
export const EARTHLY_BRANCHES: EarthlyBranch[] = [
  { name: "Zǐ", chinese: "子", element: ElementType.WATER, animal: "Ratte", hiddenStems: ["Guǐ Wasser"], yinYang: "Yang" },
  { name: "Chǒu", chinese: "丑", element: ElementType.EARTH, animal: "Büffel", hiddenStems: ["Jǐ Erde", "Guǐ Wasser", "Xīn Metall"], yinYang: "Yin" },
  { name: "Yǐn", chinese: "寅", element: ElementType.WOOD, animal: "Tiger", hiddenStems: ["Jiǎ Holz", "Bǐng Feuer", "Wù Erde"], yinYang: "Yang" },
  { name: "Mǎo", chinese: "卯", element: ElementType.WOOD, animal: "Hase", hiddenStems: ["Yǐ Holz"], yinYang: "Yin" },
  { name: "Chén", chinese: "辰", element: ElementType.EARTH, animal: "Drache", hiddenStems: ["Wù Erde", "Yǐ Holz", "Guǐ Wasser"], yinYang: "Yang" },
  { name: "Sì", chinese: "巳", element: ElementType.FIRE, animal: "Schlange", hiddenStems: ["Bǐng Feuer", "Gēng Metall", "Wù Erde"], yinYang: "Yin" },
  { name: "Wǔ", chinese: "午", element: ElementType.FIRE, animal: "Pferd", hiddenStems: ["Dīng Feuer", "Jǐ Erde"], yinYang: "Yang" },
  { name: "Wèi", chinese: "未", element: ElementType.EARTH, animal: "Ziege", hiddenStems: ["Jǐ Erde", "Dīng Feuer", "Yǐ Holz"], yinYang: "Yin" },
  { name: "Shēn", chinese: "申", element: ElementType.METAL, animal: "Affe", hiddenStems: ["Gēng Metall", "Rén Wasser", "Wù Erde"], yinYang: "Yang" },
  { name: "Yǒu", chinese: "酉", element: ElementType.METAL, animal: "Hahn", hiddenStems: ["Xīn Metall"], yinYang: "Yin" },
  { name: "Xū", chinese: "戌", element: ElementType.EARTH, animal: "Hund", hiddenStems: ["Wù Erde", "Xīn Metall", "Bǐng Feuer"], yinYang: "Yang" },
  { name: "Hài", chinese: "亥", element: ElementType.WATER, animal: "Schwein", hiddenStems: ["Rén Wasser", "Jiǎ Holz"], yinYang: "Yin" },
];

export const WESTERN_ZODIAC = [
  { name: "Widder", startMonth: 3, startDay: 21, endMonth: 4, endDay: 19, element: "Feuer" },
  { name: "Stier", startMonth: 4, startDay: 20, endMonth: 5, endDay: 20, element: "Erde" },
  { name: "Zwillinge", startMonth: 5, startDay: 21, endMonth: 6, endDay: 21, element: "Luft" },
  { name: "Krebs", startMonth: 6, startDay: 22, endMonth: 7, endDay: 22, element: "Wasser" },
  { name: "Löwe", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22, element: "Feuer" },
  { name: "Jungfrau", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22, element: "Erde" },
  { name: "Waage", startMonth: 9, startDay: 23, endMonth: 10, endDay: 23, element: "Luft" },
  { name: "Skorpion", startMonth: 10, startDay: 24, endMonth: 11, endDay: 21, element: "Wasser" },
  { name: "Schütze", startMonth: 11, startDay: 22, endMonth: 12, endDay: 21, element: "Feuer" },
  { name: "Steinbock", startMonth: 12, startDay: 22, endMonth: 1, endDay: 19, element: "Erde" },
  { name: "Wassermann", startMonth: 1, startDay: 20, endMonth: 2, endDay: 18, element: "Luft" },
  { name: "Fische", startMonth: 2, startDay: 19, endMonth: 3, endDay: 20, element: "Wasser" },
];

// Calculate Julian Day
export function getJulianDay(dateStr: string, timeStr: string, timezone: number): number {
  const d = new Date(`${dateStr}T${timeStr}:00Z`);
  const adjustedMs = d.getTime() - timezone * 60 * 60 * 1000;
  const utcDate = new Date(adjustedMs);

  let year = utcDate.getUTCFullYear();
  let month = utcDate.getUTCMonth() + 1;
  const day = utcDate.getUTCDate();
  const hour = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60;

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5 + hour / 24;
  return JD;
}

// Calculate BaZi Chart
export function calculateBaZi(birthDate: string, birthTime: string, timezone: number): {
  year: BaZiPillar;
  month: BaZiPillar;
  day: BaZiPillar;
  hour: BaZiPillar;
  animalSign: string;
  wuXing: WuXingDistribution;
} {
  const dParts = birthDate.split("-");
  const origYear = parseInt(dParts[0]) || 1990;
  const origMonth = parseInt(dParts[1]) || 1;
  const origDay = parseInt(dParts[2]) || 1;

  const tParts = birthTime.split(":");
  const origHour = parseInt(tParts[0]) || 12;
  const origMinute = parseInt(tParts[1]) || 0;

  const JD = getJulianDay(birthDate, birthTime, timezone);

  // 1. YEAR PILLAR
  // Year Pillar starts on Feb 4 (Li Chun) approx.
  let isSolarNewYear = true;
  if (origMonth === 1 || (origMonth === 2 && origDay < 4)) {
    isSolarNewYear = false;
  }
  const solarYear = isSolarNewYear ? origYear : origYear - 1;

  const yearStemIdx = (solarYear - 4) % 10 < 0 ? ((solarYear - 4) % 10) + 10 : (solarYear - 4) % 10;
  const yearBranchIdx = (solarYear - 4) % 12 < 0 ? ((solarYear - 4) % 12) + 12 : (solarYear - 4) % 12;

  const yearPillar: BaZiPillar = {
    title: "Jahr (Urahnen)",
    stem: HEAVENLY_STEMS[yearStemIdx],
    branch: EARTHLY_BRANCHES[yearBranchIdx],
    yinYang: HEAVENLY_STEMS[yearStemIdx].yinYang,
    strength: 1.0,
  };

  // 2. MONTH PILLAR
  // Get Month Branch based on Solar Month (Approx boundaries of Solar terms starting from Yin Tiger in Feb)
  let solarMonth = origMonth - 2; // Dec=10, Jan=11, Feb=0, Mar=1 etc.
  if (origDay < 5) {
    solarMonth -= 1; // belongs to previous solar month
  }
  if (solarMonth < 0) solarMonth += 12;

  const monthBranchIdx = (solarMonth + 2) % 12;

  // Five Tigers Rule to find Month Stem depending on Year Stem
  const month1StemStart = (yearPillar.stem.element === ElementType.WOOD || yearPillar.stem.element === ElementType.EARTH) ? 2 // Bing
    : (yearPillar.stem.element === ElementType.FIRE || yearPillar.stem.element === ElementType.METAL) ? 4 // Wu
    : 8; // Ren (if Water Year)

  const monthStemIdx = (month1StemStart + (monthBranchIdx >= 2 ? monthBranchIdx - 2 : monthBranchIdx + 10)) % 10;

  const monthPillar: BaZiPillar = {
    title: "Monat (Eltern & Karriere)",
    stem: HEAVENLY_STEMS[monthStemIdx],
    branch: EARTHLY_BRANCHES[monthBranchIdx],
    yinYang: HEAVENLY_STEMS[monthStemIdx].yinYang,
    strength: 1.2,
  };

  // 3. DAY PILLAR
  // JD anchor. July 1, 2020 was JD 2459031.5 (Geng-Zi, Stem 6, Branch 0)
  const jdOffset = Math.floor(JD - 0.5) - Math.floor(2459031.5);
  let dayStemIdx = (6 + jdOffset) % 10;
  if (dayStemIdx < 0) dayStemIdx += 10;
  let dayBranchIdx = (0 + jdOffset) % 12;
  if (dayBranchIdx < 0) dayBranchIdx += 12;

  const dayPillar: BaZiPillar = {
    title: "Tag (Selbst / Partner)",
    stem: HEAVENLY_STEMS[dayStemIdx],
    branch: EARTHLY_BRANCHES[dayBranchIdx],
    yinYang: HEAVENLY_STEMS[dayStemIdx].yinYang,
    strength: 1.5,
  };

  // 4. HOUR PILLAR
  // Hour Branch idx:
  // Zi (0): 23:00 - 00:59, Chou(1): 01:00-02:59, etc.
  let hourBranchIdx = 0;
  const decimalHour = origHour + origMinute / 60;
  if (decimalHour >= 23 || decimalHour < 1) hourBranchIdx = 0;
  else hourBranchIdx = Math.floor((decimalHour - 1) / 2) + 1;

  // Five Rats Rule to find Hour Stem depending on Day Stem
  const hour0StemStartIdx = (dayPillar.stem.element === ElementType.WOOD || dayPillar.stem.element === ElementType.EARTH) ? 0 // Jia
    : (dayPillar.stem.element === ElementType.FIRE || dayPillar.stem.element === ElementType.METAL) ? 2 // Bing
    : 4; // Wu (Water days style template)
  
  // Actually, formula for hour stem:
  // Day Master Stem Code = (dayStemIdx % 5)
  // Zi Hour Stem Code = (Day Master Stem Code * 2) % 10
  const hour0Stem = (dayStemIdx % 5) * 2;
  const hourStemIdx = (hour0Stem + hourBranchIdx) % 10;

  const hourPillar: BaZiPillar = {
    title: "Stunde (Kinder & Träume)",
    stem: HEAVENLY_STEMS[hourStemIdx],
    branch: EARTHLY_BRANCHES[hourBranchIdx],
    yinYang: HEAVENLY_STEMS[hourStemIdx].yinYang,
    strength: 0.8,
  };

  // 5. FIVE ELEMENTS DISTRIBUTION
  // Calculate element scores based on Heavenly Stems & Earthly Branches inside Four Pillars weighted by pillar strength.
  const weights = {
    year: yearPillar.strength,
    month: monthPillar.strength,
    day: dayPillar.strength,
    hour: hourPillar.strength,
  };

  const distribution: WuXingDistribution = {
    [ElementType.WOOD]: 0,
    [ElementType.FIRE]: 0,
    [ElementType.EARTH]: 0,
    [ElementType.METAL]: 0,
    [ElementType.WATER]: 0,
  };

  // We have 8 elements in total (4 stems, 4 branches chief elements)
  // Let's add weight points
  const pillarsList = [
    { p: yearPillar, w: weights.year },
    { p: monthPillar, w: weights.month },
    { p: dayPillar, w: weights.day },
    { p: hourPillar, w: weights.hour },
  ];

  pillarsList.forEach(({ p, w }) => {
    // Add Heavenly Stem element
    distribution[p.stem.element] += 10 * w;

    // Add Earthly Branch chief element
    distribution[p.branch.element] += 10 * w;

    // Add hidden stems weight conceptually
    p.branch.hiddenStems.forEach((h) => {
      if (h.includes("Holz")) distribution[ElementType.WOOD] += 2 * w;
      if (h.includes("Feuer")) distribution[ElementType.FIRE] += 2 * w;
      if (h.includes("Erde")) distribution[ElementType.EARTH] += 2 * w;
      if (h.includes("Metall")) distribution[ElementType.METAL] += 2 * w;
      if (h.includes("Wasser")) distribution[ElementType.WATER] += 2 * w;
    });
  });

  // Calculate percentages
  const totalPoints = Object.values(distribution).reduce((sum, v) => sum + v, 0);
  Object.keys(distribution).forEach((key) => {
    const k = key as ElementType;
    distribution[k] = Math.max(5, Math.round((distribution[k] / totalPoints) * 100)); // ensure min 5% for visuals
  });

  // Re-normalize to total exactly 100%
  const currentSum = Object.values(distribution).reduce((sum, v) => sum + v, 0);
  const diff = 100 - currentSum;
  distribution[ElementType.EARTH] += diff; // Adjust Earth as earth is the grid transition element

  const animalSign = yearPillar.branch.animal;

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    animalSign,
    wuXing: distribution,
  };
}

// Calculate Western Zodiac Planets & Degrees (Formulaic and mathematically responsive to birth info)
export function calculateWesternAstrology(birthDate: string, birthTime: string, timezone: number): {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  planets: WesternPlanet[];
  aspects: WesternAspect[];
} {
  const dParts = birthDate.split("-");
  const year = parseInt(dParts[0]) || 1990;
  const month = parseInt(dParts[1]) || 1;
  const day = parseInt(dParts[2]) || 1;

  const tParts = birthTime.split(":");
  const hour = parseInt(tParts[0]) || 12;
  const minute = parseInt(tParts[1]) || 0;

  const JD = getJulianDay(birthDate, birthTime, timezone);

  // Define Western Zodiac Longitudes (Aries starts at 0°...)
  const ZODIAC_SIGNS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau",
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
  ];

  const getSignFromLongitude = (long: number): string => {
    const l = (long % 360 + 360) % 360;
    const idx = Math.floor(l / 30);
    return ZODIAC_SIGNS[idx];
  };

  const getElementFromSign = (sign: string): string => {
    if (["Widder", "Löwe", "Schütze"].includes(sign)) return "Feuer";
    if (["Stier", "Jungfrau", "Steinbock"].includes(sign)) return "Erde";
    if (["Zwillinge", "Waage", "Wassermann"].includes(sign)) return "Luft";
    return "Wasser"; // Cancer, Scorpio, Pisces
  };

  const getDegreeInSign = (long: number): number => {
    return Math.round((long % 30) * 10) / 10;
  };

  // 1. CALCULATE PLANETARY MEAN LONGITUDES
  const daysSinceJ2000 = JD - 2451545.0;

  // SUN MEAN LONGITUDE
  let sunLong = 280.466 + 36000.769 * (daysSinceJ2000 / 36525) + 0.9856 * daysSinceJ2000;
  sunLong = (sunLong % 360 + 360) % 360;
  const sunSign = getSignFromLongitude(sunLong);

  // MOON MEAN LONGITUDE
  let moonLong = 218.316 + 13.176396 * daysSinceJ2000 + 6.289 * Math.sin((134.963 + 13.064993 * daysSinceJ2000) * Math.PI / 180);
  moonLong = (moonLong % 360 + 360) % 360;
  const moonSign = getSignFromLongitude(moonLong);

  // MERCURY MEAN LONGITUDE
  let mercLong = sunLong + 25 * Math.sin((daysSinceJ2000 / 87.97) * Math.PI / 180);
  mercLong = (mercLong % 360 + 360) % 360;

  // VENUS MEAN LONGITUDE
  let venLong = sunLong + 15 * Math.sin((daysSinceJ2000 / 224.7) * Math.PI / 180);
  venLong = (venLong % 360 + 360) % 360;

  // MARS MEAN LONGITUDE
  let marsLong = sunLong - 18 + 0.524 * daysSinceJ2000;
  marsLong = (marsLong % 360 + 360) % 360;

  // JUPITER MEAN LONGITUDE
  let jupLong = 34.35 + 0.083 * daysSinceJ2000;
  jupLong = (jupLong % 360 + 360) % 360;

  // SATURN MEAN LONGITUDE
  let satLong = 50.08 + 0.033 * daysSinceJ2000;
  satLong = (satLong % 360 + 360) % 360;

  // URANUS MEAN LONGITUDE
  let uraLong = 244.5 + 0.0117 * daysSinceJ2000;
  uraLong = (uraLong % 360 + 360) % 360;

  // NEPTUNE MEAN LONGITUDE
  let nepLong = 270.4 + 0.0059 * daysSinceJ2000;
  nepLong = (nepLong % 360 + 360) % 360;

  // PLUTO MEAN LONGITUDE
  let pluLong = 180.1 + 0.0039 * daysSinceJ2000;
  pluLong = (pluLong % 360 + 360) % 360;

  // 2. ASCENDANT LONGITUDE (Aszendent)
  // Approx based on Sun longitude and local time. Sunrise (approx 6:00 local) Ascendant is near Sun sign.
  // Successive hours add 15 degrees per hour.
  const hourDiffFrom6AMByLocalSol = (hour + minute / 60) - 6;
  let ascLong = sunLong + (hourDiffFrom6AMByLocalSol * 15);
  ascLong = (ascLong % 360 + 360) % 360;
  const ascName = getSignFromLongitude(ascLong);

  // Define Planets list
  const planetsData = [
    { name: "Sonne", symbol: "☉", long: sunLong },
    { name: "Mond", symbol: "☽", long: moonLong },
    { name: "Merkur", symbol: "☿", long: mercLong },
    { name: "Venus", symbol: "♀", long: venLong },
    { name: "Mars", symbol: "♂", long: marsLong },
    { name: "Jupiter", symbol: "♃", long: jupLong },
    { name: "Saturn", symbol: "♄", long: satLong },
    { name: "Uranus", symbol: "♅", long: uraLong },
    { name: "Neptun", symbol: "♆", long: nepLong },
    { name: "Pluto", symbol: "♇", long: pluLong },
  ];

  // Map into Houses conceptually
  const planetsParsed: WesternPlanet[] = planetsData.map((p, idx) => {
    // Houses are determined with respect to Ascendant (House 1 starts at Ascendant L)
    const relativePos = (p.long - ascLong + 360) % 360;
    const house = Math.floor(relativePos / 30) + 1;
    const sign = getSignFromLongitude(p.long);
    return {
      name: p.name,
      symbol: p.symbol,
      sign,
      house,
      degree: getDegreeInSign(p.long),
      element: getElementFromSign(sign),
      retrograde: (p.name !== "Sonne" && p.name !== "Mond") && (Math.sin(daysSinceJ2000 / 100 + idx) < -0.6), // retrograde simulation
    };
  });

  // 3. ASPECTS CALCULATION
  const aspectsList: WesternAspect[] = [];
  const ASPECT_TYPES = [
    { name: "Konjunktion", symbol: "☌", angle: 0, maxOrb: 8, harmony: "neutral" as const, desc: "Bündelung der planetaren Energien" },
    { name: "Opposition", symbol: "☍", angle: 180, maxOrb: 8, harmony: "spannend" as const, desc: "Spannungsgeladene Polarität und Reibung" },
    { name: "Quadrat", symbol: "□", angle: 90, maxOrb: 7, harmony: "spannend" as const, desc: "Herausforderung, die nach Wachstum verlangt" },
    { name: "Trigon", symbol: "△", angle: 120, maxOrb: 8, harmony: "harmonisch" as const, desc: "Fließende Harmonie und natürliche Talente" },
    { name: "Sextil", symbol: "⚹", angle: 60, maxOrb: 6, harmony: "harmonisch" as const, desc: "Unterstützende Kooperation und neue Chancen" },
  ];

  for (let i = 0; i < planetsParsed.length; i++) {
    for (let j = i + 1; j < planetsParsed.length; j++) {
      const p1 = planetsParsed[i];
      const p2 = planetsParsed[j];
      const l1 = planetsData[i].long;
      const l2 = planetsData[j].long;

      const rawDiff = Math.abs(l1 - l2);
      const angleDiff = rawDiff > 180 ? 360 - rawDiff : rawDiff;

      for (const asp of ASPECT_TYPES) {
        const orb = Math.abs(angleDiff - asp.angle);
        if (orb <= asp.maxOrb) {
          aspectsList.push({
            planet1: p1.name,
            planet2: p2.name,
            type: asp.name,
            symbol: asp.symbol,
            orb: Math.round(orb * 10) / 10,
            harmony: asp.harmony,
            interpretation: `${p1.name} im ${asp.name} zu ${p2.name} (${asp.desc}). Effektiv auf ${Math.round(orb * 10) / 10}° Orb genau.`
          });
        }
      }
    }
  }

  // Slice to avoid overwhelming visual list
  const filteredAspects = aspectsList
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 10);

  return {
    sunSign,
    moonSign,
    ascendant: ascName,
    planets: planetsParsed,
    aspects: filteredAspects,
  };
}

// Full Fusion Astrology calculation
export function calculateAstrologyFusion(data: BirthData): AstrologyFusionChart {
  const bazi = calculateBaZi(data.birthDate, data.birthTime, data.timezone);
  const western = calculateWesternAstrology(data.birthDate, data.birthTime, data.timezone);

  return {
    birthData: data,
    bazi: {
      year: bazi.year,
      month: bazi.month,
      day: bazi.day,
      hour: bazi.hour,
      dayMaster: bazi.day.stem.element,
      selfPolarity: bazi.day.stem.yinYang,
      animalSign: bazi.animalSign,
      wuXing: bazi.wuXing,
    },
    western,
  };
}

// Synastry compatibility calculation (Western-Eastern Fusion)
export function calculateSynastry(c1: AstrologyFusionChart, c2: AstrologyFusionChart): {
  score: number;
  westernScore: number;
  baziScore: number;
  harmonyAnalysis: string;
  advice: string;
} {
  // calculate BaZi stem-stem match and element match
  // and Western zodiac elements match
  let westernPoints = 50;
  let baziPoints = 50;

  // Western Analysis: element compatibility
  const w1SunSign = c1.western.sunSign;
  const w2SunSign = c2.western.sunSign;
  const w1SunEl = calculateWesternAstrology(c1.birthData.birthDate, c1.birthData.birthTime, c1.birthData.timezone).planets[0].element;
  const w2SunEl = calculateWesternAstrology(c2.birthData.birthDate, c2.birthData.birthTime, c2.birthData.timezone).planets[0].element;

  if (w1SunEl === w2SunEl) {
    westernPoints += 30; // same element
  } else if (
    (w1SunEl === "Feuer" && w2SunEl === "Luft") || (w1SunEl === "Luft" && w2SunEl === "Feuer") ||
    (w1SunEl === "Erde" && w2SunEl === "Wasser") || (w1SunEl === "Wasser" && w2SunEl === "Erde")
  ) {
    westernPoints += 25; // highly compatible
  } else if (
    (w1SunEl === "Feuer" && w2SunEl === "Wasser") || (w1SunEl === "Wasser" && w2SunEl === "Feuer")
  ) {
    westernPoints -= 15; // conflicting
  }

  // BaZi Analysis: Daymaster (Tagesmeister) matching
  const el1 = c1.bazi.dayMaster;
  const el2 = c2.bazi.dayMaster;

  // Productive and destructive cycles
  // Holz nährt Feuer, Feuer schmilzt Metall (nah, Feuer nährt Erde, Erde gebiert Metall, Metall hält Wasser, Wasser nährt Holz)
  // Schwächung / Kontrolle:
  const productive = [
    { src: ElementType.WOOD, dst: ElementType.FIRE },
    { src: ElementType.FIRE, dst: ElementType.EARTH },
    { src: ElementType.EARTH, dst: ElementType.METAL },
    { src: ElementType.METAL, dst: ElementType.WATER },
    { src: ElementType.WATER, dst: ElementType.WOOD },
  ];

  const destructive = [
    { src: ElementType.WOOD, dst: ElementType.EARTH },
    { src: ElementType.EARTH, dst: ElementType.WATER },
    { src: ElementType.WATER, dst: ElementType.FIRE },
    { src: ElementType.FIRE, dst: ElementType.METAL },
    { src: ElementType.METAL, dst: ElementType.WOOD },
  ];

  if (el1 === el2) {
    baziPoints += 15; // friendly peer support
  } else if (productive.some(p => (p.src === el1 && p.dst === el2) || (p.src === el2 && p.dst === el1))) {
    baziPoints += 35; // nurturing relationship
  } else if (destructive.some(d => (d.src === el1 && d.dst === el2) || (d.src === el2 && d.dst === el1))) {
    baziPoints -= 15; // potential friction / training relationship
  }

  // animal compatibility
  const animal1 = c1.bazi.animalSign;
  const animal2 = c2.bazi.animalSign;

  // Harmonische Tierpaare (Six Harmonies)
  const animHarmonies: { [key: string]: string } = {
    "Ratte": "Ochse", "Ochse": "Ratte",
    "Tiger": "Schwein", "Schwein": "Tiger",
    "Hase": "Hund", "Hund": "Hase",
    "Drache": "Hahn", "Hahn": "Drache",
    "Schlange": "Affe", "Affe": "Schlange",
    "Pferd": "Ziege", "Ziege": "Pferd"
  };

  if (animHarmonies[animal1] === animal2) {
    baziPoints += 15;
  }

  // bounds
  const finalWestern = Math.min(100, Math.max(30, westernPoints));
  const finalBazi = Math.min(100, Math.max(30, baziPoints));
  const totalScore = Math.round((finalWestern + finalBazi) / 2);

  let harmonyAnalysis = "";
  let advice = "";

  if (totalScore >= 75) {
    harmonyAnalysis = "Außergewöhnliche elementare Übereinstimmung. Eure Elemente nähren und stärken sich gegenseitig. Sowohl euer westlicher Teil (Zodiak) als auch eure östliche BaZi-Struktur greifen wie Zahnräder ineinander.";
    advice = "Nutzt diese tiefe Harmonie, um gemeinsame kreative Visionen zu manifestieren. Achtet darauf, einander Freiräume zu geben, da die gegenseitige Anziehung sehr intensiv sein kann.";
  } else if (totalScore >= 55) {
    harmonyAnalysis = "Eine ausgewogene, gesunde Dynamik mit komplementären Kräften. Es gibt anregende Unterschiede, die für eine lebendige Anziehung sorgen, ohne das Fundament der Beziehung zu gefährden.";
    advice = "Kommuniziert offen über eure Naturkräfte. Die Reibungspunkte dienen hier als kraftvolle Katalysatoren für persönliches Wachstum – fordert euch heraus, aber stützt euch stets gegenseitig.";
  } else {
    harmonyAnalysis = "Eine hochgradig spannungsreiche Element-Konstellation. Eure Elementkräfte befinden sich im Kontrollzyklus (z.B. Feuer gegen Metall). Dies führt zu intensiven Lektionen und hoher Anziehungskraft durch Polarität.";
    advice = "Achtet auf bewusste Pausen und lernt, die Andersartigkeit des Partners nicht als Angriff zu werten. Wu-Xing-Ausgleichsmethoden (z.B. das Element Erde vermittelt zwischen Feuer und Metall) können euch im Alltag enorm entlasten.";
  }

  return {
    score: totalScore,
    westernScore: finalWestern,
    baziScore: finalBazi,
    harmonyAnalysis,
    advice,
  };
}
