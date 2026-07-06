import { ElementType } from "../types";

/** Canonical provenance for the whole profile. */
export type ProfileSource = "fufire-chart" | "fufire-orchestrated" | "fallback-local" | "missing";

export interface HouseMeaning {
  number: number;
  title: string;
  signResonance: string;
  governs: string;
  description: string;
  planets: {
    name: string;
    symbol: string;
    sign: string;
    degree: number;
  }[];
}

export interface ElementCardData {
  element: ElementType;
  percentage: number;
  title: string;
  keynote: string;
  foods: string;
  colors: string;
  professions: string;
  status: "Ausgeglichen" | "Überschuss" | "Defizit";
}

/**
 * Signal level: how VISIBLE the West-Ost congruence pattern is — derived from
 * the engine's calibration block (|z-score| of h_raw against the random
 * baseline) when available. This is concept language for pattern visibility,
 * NOT a tension quality: +1σ means MORE harmonic than random. True tension
 * intensity will derive from the per-element differences in the upcoming
 * Spannungsnavigator.
 */
export type SignalLevel = "leise" | "spuerbar" | "dominant";

/** One West-vs-BaZi element row from the engine's elemental_comparison. */
export interface ElementalComparisonEntry {
  element: string;
  western: number;
  bazi: number;
  difference: number;
}

export interface FusionData {
  /** null = weder Kalibrierung noch Legacy-Wert vorhanden — UI zeigt Missing-State. */
  coherenceIndex: number | null;
  /**
   * true  -> coherenceIndex is the engine's calibrated value
   *          (calibration.h_calibrated, structure congruence vs. random baseline)
   * false -> raw harmony/cosmic_state or a legacy value (calibration absent)
   */
  coherenceCalibrated: boolean;
  /** null when the response carries no usable calibration/coherence data. */
  signalLevel: SignalLevel | null;
  coherenceRating: string;
  coherenceExplanation: string;
  systemBridge: string;
  /** Per-element West-vs-BaZi weights straight from elemental_comparison; empty if absent. */
  elementalComparison: ElementalComparisonEntry[];
  /**
   * Derived ONLY from server data (largest |difference| entries of
   * elemental_comparison -> "größte Spannungsfelder") or passed through from
   * a legacy payload — never invented locally.
   */
  topSignals: {
    trigger: string;
    interpretation: string;
  }[];
  label: string;
  explanation: string;
  signalLevelSuffix: string | null;
  westernContributors: string[];
  baziContributors: string[];
  wuxingContributors: string[];
  supports: string[];
  frictions: string[];
  /**
   * The engine's REAL fusion_interpretation text (or a legacy passthrough).
   * null when the engine sent none — the "Fusions-Deutung der Engine"
   * section is then hidden instead of showing an invented local sentence.
   */
  integrationText: string | null;
  source: string;
}

export interface ProfileViewModel {
  timeKnown: boolean;
  identity: {
    name: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    gender: string;
  };
  western: {
    sunSign: string;
    moonSign: string;
    ascendant: string | null;
    /**
     * Absolute ecliptic longitude (0–360) of the ascendant, ONLY from a real
     * source (angles.Ascendant or first house cusp). null when unknown,
     * provisional (unknown birth time), or only a sign name is available — never
     * reconstructed locally from the ascendant sign. P7 inter-aspects use this.
     */
    ascendantLongitude: number | null;
    housesAvailable: boolean;
    planets: {
      name: string;
      symbol: string;
      sign: string;
      house: number;
      degree: number;
      element: string;
      retrograde: boolean;
    }[];
    aspects: {
      planet1: string;
      planet2: string;
      type: string;
      symbol: string;
      orb: number;
      harmony: "harmonisch" | "spannend" | "neutral";
      interpretation: string;
    }[];
    houses: HouseMeaning[];
  };
  bazi: {
    available: boolean;
    hourAvailable: boolean;
    pillars: {
      title: string;
      pillarKey: string;
      stemChinese: string;
      stemPinyin: string;
      stemElement: ElementType;
      stemPolarity: string;
      branchChinese: string;
      branchPinyin: string;
      branchElement: ElementType;
      branchAnimal: string;
      branchPolarity: string;
      hiddenStems: string[];
    }[];
    dayMaster: {
      element: ElementType;
      name: string;
      pinyin: string;
      chinese: string;
      polarity: string;
      coreInterpretation: string;
      strengths: string;
      shadow: string;
    };
    dayun: {
      available: boolean;
      status: string;
      message: string;
      cycles: {
        age: string;
        stem: string;
        branch: string;
        element: ElementType;
      }[];
    };
  };
  wuxing: {
    available: boolean;
    distribution: { [key in ElementType]: number };
    elementCards: ElementCardData[];
    vectorExplanation: string;
  };
  fusion: FusionData;
  source: ProfileSource;
  provenance: {
    uiField: string;
    appEndpoint: string;
    upstreamEndpoint: string;
    status: "server-used" | "fallback-local" | "missing" | "error";
    source: string;
    confidence: string;
  }[];
  warnings: string[];
}
