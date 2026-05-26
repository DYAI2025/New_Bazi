import dotenv from "dotenv";

dotenv.config();

/**
 * Chart payload sent to FuFirE /v1/chart. Field names match the FuFirE
 * contract (geo_lat_deg etc.). Unknown shapes are passed through verbatim
 * for the calculate/* and experience/* endpoints.
 */
export interface FuFirePayload {
  local_datetime: string; // YYYY-MM-DDTHH:mm:ss
  tz_id: string; // IANA, e.g. Europe/Berlin
  geo_lat_deg: number;
  geo_lon_deg: number;
  time_standard?: string;
  day_boundary?: string;
  include_validation?: boolean;
  [key: string]: unknown;
}

export type FuFirEErrorCode =
  | "missing_fufire_url"
  | "missing_fufire_key"
  | "fufire_auth_failed"
  | "invalid_fufire_payload"
  | "fufire_rate_limited"
  | "fufire_unavailable";

const ERROR_HTTP_STATUS: Record<FuFirEErrorCode, number> = {
  missing_fufire_url: 503,
  missing_fufire_key: 503,
  fufire_auth_failed: 502,
  invalid_fufire_payload: 502,
  fufire_rate_limited: 503,
  fufire_unavailable: 502
};

const SAFE_MESSAGES: Record<FuFirEErrorCode, string> = {
  missing_fufire_url: "FuFirE-Basis-URL ist serverseitig nicht konfiguriert.",
  missing_fufire_key: "FuFirE-API-Schluessel ist serverseitig nicht konfiguriert.",
  fufire_auth_failed: "FuFirE-Authentifizierung fehlgeschlagen.",
  invalid_fufire_payload: "FuFirE hat die uebermittelten Geburtsdaten abgelehnt.",
  fufire_rate_limited: "FuFirE ist aktuell ratenbegrenzt. Bitte spaeter erneut versuchen.",
  fufire_unavailable: "FuFirE ist derzeit nicht erreichbar."
};

/**
 * Typed upstream error. Never embeds secrets or upstream stack traces in the
 * message; carries a stable `code` plus an `httpStatus` for the route layer.
 */
export class FuFirEError extends Error {
  code: FuFirEErrorCode;
  httpStatus: number;

  constructor(code: FuFirEErrorCode) {
    super(SAFE_MESSAGES[code]);
    this.name = "FuFirEError";
    this.code = code;
    this.httpStatus = ERROR_HTTP_STATUS[code];
  }
}

const PLACEHOLDER_VALUES = new Set(["", "YOUR_FUFIRE_API_URL", "replace_me", "MY_FUFIRE_API_KEY"]);

function getBaseUrl(): string {
  const url = (process.env.FUFIRE_API_URL || "").trim();
  if (!url || PLACEHOLDER_VALUES.has(url)) {
    throw new FuFirEError("missing_fufire_url");
  }
  return url.replace(/\/$/, "");
}

function getApiKey(): string {
  const key = (process.env.FUFIRE_API_KEY || "").trim();
  if (!key || PLACEHOLDER_VALUES.has(key)) {
    throw new FuFirEError("missing_fufire_key");
  }
  return key;
}

function getVersionPrefix(): string {
  const version = (process.env.FUFIRE_API_VERSION || "v1").trim().replace(/^\/|\/$/g, "");
  return `/${version}`;
}

function getTimeoutMs(): number {
  const raw = Number(process.env.REQUEST_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 12000;
}

function mapStatusToError(status: number): FuFirEError {
  if (status === 401 || status === 403) return new FuFirEError("fufire_auth_failed");
  if (status === 422) return new FuFirEError("invalid_fufire_payload");
  if (status === 429) return new FuFirEError("fufire_rate_limited");
  return new FuFirEError("fufire_unavailable");
}

async function request(method: "GET" | "POST", endpoint: string, payload?: unknown): Promise<any> {
  // Resolve config first — throws missing_fufire_* before any network access.
  const baseUrl = getBaseUrl();
  const apiKey = getApiKey();
  const url = `${baseUrl}${getVersionPrefix()}${endpoint}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getTimeoutMs());

  let res: { ok: boolean; status: number; json: () => Promise<any> };
  try {
    res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: method === "POST" ? JSON.stringify(payload ?? {}) : undefined,
      signal: controller.signal
    });
  } catch {
    // Network failure, DNS, or AbortError (timeout) — never expose details.
    throw new FuFirEError("fufire_unavailable");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw mapStatusToError(res.status);
  }

  try {
    return await res.json();
  } catch {
    throw new FuFirEError("fufire_unavailable");
  }
}

export class FuFirEClient {
  static getHealth(): Promise<any> {
    return request("GET", "/health");
  }

  static getWuxingMapping(): Promise<any> {
    return request("GET", "/info/wuxing-mapping");
  }

  static postChart(payload: FuFirePayload): Promise<any> {
    return request("POST", "/chart", payload);
  }

  static postWestern(payload: FuFirePayload): Promise<any> {
    return request("POST", "/calculate/western", payload);
  }

  static postBazi(payload: FuFirePayload): Promise<any> {
    return request("POST", "/calculate/bazi", payload);
  }

  static postWuxing(payload: FuFirePayload): Promise<any> {
    return request("POST", "/calculate/wuxing", payload);
  }

  static postFusion(payload: FuFirePayload): Promise<any> {
    return request("POST", "/calculate/fusion", payload);
  }

  static postTst(payload: FuFirePayload): Promise<any> {
    return request("POST", "/calculate/tst", payload);
  }

  static postExperienceBootstrap(payload: FuFirePayload): Promise<any> {
    return request("POST", "/experience/bootstrap", payload);
  }

  static postExperienceDaily(payload: FuFirePayload): Promise<any> {
    return request("POST", "/experience/daily", payload);
  }

  /** Best-effort health probe: never throws, returns ok|error|unknown. */
  static async probeHealth(): Promise<"ok" | "error" | "unknown"> {
    try {
      getBaseUrl();
      getApiKey();
    } catch {
      return "unknown";
    }
    try {
      await request("GET", "/health");
      return "ok";
    } catch {
      return "error";
    }
  }

  static isConfigured(): { url: boolean; key: boolean } {
    let url = false;
    let key = false;
    try {
      getBaseUrl();
      url = true;
    } catch {
      url = false;
    }
    try {
      getApiKey();
      key = true;
    } catch {
      key = false;
    }
    return { url, key };
  }
}
