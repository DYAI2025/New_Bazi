export enum ElementType {
  WOOD = "Holz",
  FIRE = "Feuer",
  EARTH = "Erde",
  METAL = "Metall",
  WATER = "Wasser",
}

export type YinYang = "Yin" | "Yang";

export interface HeavenlyStem {
  name: string;      // e.g., "Jiǎ"
  chinese: string;   // e.g., "甲"
  element: ElementType;
  yinYang: YinYang;
}

export interface EarthlyBranch {
  name: string;      // e.g., "Yǐn"
  chinese: string;   // e.g., "寅"
  element: ElementType; // Chief element
  animal: string;    // Zodiac animal (German)
  hiddenStems: string[]; // List of hidden stems (Chinese + English/Pinyin)
  yinYang: YinYang;
}

export interface BaZiPillar {
  title: string;     // "Jahr", "Monat", "Tag", "Stunde"
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  yinYang: YinYang;
  strength: number;  // calculation strength weight
}

export interface WuXingDistribution {
  [ElementType.WOOD]: number;
  [ElementType.FIRE]: number;
  [ElementType.EARTH]: number;
  [ElementType.METAL]: number;
  [ElementType.WATER]: number;
}

export interface WesternPlanet {
  name: string;      // e.g., "Sonne"
  symbol: string;    // e.g., "☉"
  sign: string;      // e.g., "Widder"
  house: number;     // e.g., 1-12
  degree: number;    // e.g., 14.5
  element: string;   // e.g., "Feuer", "Wasser", "Erde", "Luft"
  retrograde: boolean;
}

export interface WesternAspect {
  planet1: string;
  planet2: string;
  type: string;      // e.g., "Konjunktion", "Opposition", "Quadrat", "Trigon", "Sextil"
  symbol: string;    // e.g., "☌", "☍", "□", "△", "⚹"
  orb: number;       // e.g., 2.5
  harmony: "harmonisch" | "spannend" | "neutral";
  interpretation: string;
}

export interface SynastryResult {
  score: number;       // 0-100%
  westernScore: number;
  baziScore: number;
  harmonyAnalysis: string;
  advice: string;
}

export interface BirthData {
  name: string;
  birthDate: string;        // YYYY-MM-DD
  birthTime: string;        // HH:MM
  birthPlace: string;       // Backward compatibility
  birthPlaceLabel?: string; // e.g. "Berlin, Deutschland"
  placeId?: string;         // Google Place ID
  lat?: number;
  lon?: number;
  tz?: string;              // IANA Timezone ID, e.g. "Europe/Berlin"
  utcOffsetMinutes?: number;
  sexAtBirth?: "Female" | "Male" | "Intersex";
  dayunDirection?: "forward" | "backward";
  gender?: "Weiblich" | "Männlich" | "Divers";
  timezone?: number;        // UTC offset (hours)
  timeKnown?: boolean;      // false = user unknown; 12:00 placeholder used internally, never displayed
}

export interface AstrologyFusionChart {
  birthData: BirthData;
  bazi: {
    year: BaZiPillar;
    month: BaZiPillar;
    day: BaZiPillar;
    hour: BaZiPillar;
    dayMaster: ElementType;
    selfPolarity: YinYang;
    animalSign: string;
    wuXing: WuXingDistribution;
  };
  western: {
    sunSign: string;
    moonSign: string;
    ascendant: string;
    planets: WesternPlanet[];
    aspects: WesternAspect[];
  };
}
