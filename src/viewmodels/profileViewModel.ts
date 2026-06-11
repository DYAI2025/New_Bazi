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
 * Tension level between the western and the BaZi structure — groundwork for
 * the upcoming Spannungsnavigator. Derived from the engine's calibration
 * block (z-score against the random baseline) when available.
 */
export type TensionLevel = "leise" | "spuerbar" | "dominant";

export interface FusionData {
  coherenceIndex: number;
  /**
   * true  -> coherenceIndex is the engine's calibrated value
   *          (calibration.h_calibrated, structure congruence vs. random baseline)
   * false -> raw harmony/cosmic_state or a legacy value (calibration absent)
   */
  coherenceCalibrated: boolean;
  /** null when the response carries no usable calibration/coherence data. */
  tensionLevel: TensionLevel | null;
  coherenceRating: string;
  coherenceExplanation: string;
  systemBridge: string;
  topSignals: {
    trigger: string;
    interpretation: string;
  }[];
  label: string;
  explanation: string;
  westernContributors: string[];
  baziContributors: string[];
  wuxingContributors: string[];
  supports: string[];
  frictions: string[];
  integrationText: string;
  source: string;
}

export interface ProfileViewModel {
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
    ascendant: string;
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
