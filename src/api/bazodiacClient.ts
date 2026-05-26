import { BirthData } from "../types";
import { ProfileViewModel } from "../viewmodels/profileViewModel";

export interface SynastryResponse {
  score: number;
  westernScore: number;
  baziScore: number;
  harmonyAnalysis: string;
  advice: string;
  source: string;
  userRef: { name: string; sunSign: string; dayMaster: string };
  partnerRef: { name: string; sunSign: string; dayMaster: string };
}

export interface DailyPulseResponse {
  date: string;
  qiResonance: number | null;
  dominantPhase: string | null;
  coachingKeyword: string | null;
  description: string | null;
  source: "fufire" | "missing";
  available: boolean;
}

export interface PlacePrediction {
  description: string;
  placeId: string;
}

export interface ResolvedPlace {
  placeId: string;
  label: string;
  lat: number;
  lon: number;
  tz: string;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.message || err.error || `HTTP error ${res.status}`;
    const e = new Error(message) as Error & { code?: string; status?: number };
    e.code = err.error;
    e.status = res.status;
    throw e;
  }
  return res.json();
}

export class BazodiacClient {
  static fetchProfile(birthData: BirthData): Promise<ProfileViewModel> {
    return postJson<ProfileViewModel>("/api/azodiac/profile", birthData);
  }

  static fetchSynastry(userBirthData: BirthData, partnerBirthData: BirthData): Promise<SynastryResponse> {
    return postJson<SynastryResponse>("/api/azodiac/synastry", { userBirthData, partnerBirthData });
  }

  static fetchDailyPulse(birthData: BirthData): Promise<DailyPulseResponse> {
    return postJson<DailyPulseResponse>("/api/azodiac/daily", birthData);
  }

  static async searchPlaces(input: string): Promise<PlacePrediction[]> {
    if (!input || input.trim().length < 2) return [];
    return postJson<PlacePrediction[]>("/api/places/autocomplete", { input });
  }

  /** Server-side resolution of a placeId into coordinates + IANA timezone. */
  static async resolvePlace(placeId: string, label: string): Promise<ResolvedPlace> {
    const geo = await postJson<{ latitude: number; longitude: number; tz: string; place: string }>(
      "/api/geocode",
      { placeId }
    );
    return { placeId, label: label || geo.place, lat: geo.latitude, lon: geo.longitude, tz: geo.tz };
  }

  static async fetchConfig(): Promise<any> {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  }
}
