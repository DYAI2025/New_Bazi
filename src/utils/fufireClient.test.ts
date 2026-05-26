import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FuFirEClient, FuFirEError } from "./fufireClient";

const ORIGINAL_ENV = { ...process.env };

function mockFetchOnce(status: number, body: any = {}) {
  const fn = vi.fn(async (..._args: any[]) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body)
  }));
  global.fetch = fn as any;
  return fn;
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  process.env.FUFIRE_API_URL = "https://fufire.example.com";
  process.env.FUFIRE_API_KEY = "secret-key-123";
  process.env.FUFIRE_API_VERSION = "v1";
  process.env.REQUEST_TIMEOUT_MS = "12000";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("FuFirEClient configuration", () => {
  it("throws missing_fufire_url when FUFIRE_API_URL is absent", async () => {
    delete process.env.FUFIRE_API_URL;
    mockFetchOnce(200, {});
    await expect(FuFirEClient.postChart({} as any)).rejects.toMatchObject({ code: "missing_fufire_url" });
  });

  it("throws missing_fufire_key when FUFIRE_API_KEY is absent", async () => {
    delete process.env.FUFIRE_API_KEY;
    mockFetchOnce(200, {});
    await expect(FuFirEClient.postChart({} as any)).rejects.toMatchObject({ code: "missing_fufire_key" });
  });

  it("treats placeholder url/key as missing", async () => {
    process.env.FUFIRE_API_URL = "YOUR_FUFIRE_API_URL";
    await expect(FuFirEClient.postChart({} as any)).rejects.toMatchObject({ code: "missing_fufire_url" });
  });
});

describe("FuFirEClient request shape", () => {
  it("posts to versioned /v1/chart with X-API-Key header and JSON body", async () => {
    const fetchMock = mockFetchOnce(200, { ok: true });
    const payload = { local_datetime: "1990-01-01T12:00:00", tz_id: "Europe/Berlin", geo_lat_deg: 52.5, geo_lon_deg: 13.4 };
    await FuFirEClient.postChart(payload as any);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://fufire.example.com/v1/chart");
    expect(opts.method).toBe("POST");
    expect(opts.headers["X-API-Key"]).toBe("secret-key-123");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opts.body)).toEqual(payload);
  });

  it("uses configurable version prefix", async () => {
    process.env.FUFIRE_API_VERSION = "v2";
    const fetchMock = mockFetchOnce(200, {});
    await FuFirEClient.postBazi({} as any);
    expect(fetchMock.mock.calls[0][0]).toBe("https://fufire.example.com/v2/calculate/bazi");
  });

  it("does NOT leak the api key into thrown error messages", async () => {
    mockFetchOnce(500, {});
    const err = await FuFirEClient.postChart({} as any).catch((e) => e);
    expect(String(err.message)).not.toContain("secret-key-123");
  });

  it("getHealth performs GET on /v1/health", async () => {
    const fetchMock = mockFetchOnce(200, { status: "ok" });
    await FuFirEClient.getHealth();
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://fufire.example.com/v1/health");
    expect(opts.method).toBe("GET");
    expect(opts.headers["X-API-Key"]).toBe("secret-key-123");
  });

  it("strips trailing slash from base url", async () => {
    process.env.FUFIRE_API_URL = "https://fufire.example.com/";
    const fetchMock = mockFetchOnce(200, {});
    await FuFirEClient.postWuxing({} as any);
    expect(fetchMock.mock.calls[0][0]).toBe("https://fufire.example.com/v1/calculate/wuxing");
  });
});

describe("FuFirEClient error mapping", () => {
  it("maps 401 to fufire_auth_failed", async () => {
    mockFetchOnce(401, {});
    await expect(FuFirEClient.postChart({} as any)).rejects.toMatchObject({ code: "fufire_auth_failed" });
  });

  it("maps 403 to fufire_auth_failed", async () => {
    mockFetchOnce(403, {});
    await expect(FuFirEClient.postChart({} as any)).rejects.toMatchObject({ code: "fufire_auth_failed" });
  });

  it("maps 422 to invalid_fufire_payload", async () => {
    mockFetchOnce(422, {});
    await expect(FuFirEClient.postChart({} as any)).rejects.toMatchObject({ code: "invalid_fufire_payload" });
  });

  it("maps 429 to fufire_rate_limited", async () => {
    mockFetchOnce(429, {});
    await expect(FuFirEClient.postChart({} as any)).rejects.toMatchObject({ code: "fufire_rate_limited" });
  });

  it("maps 500 to fufire_unavailable", async () => {
    mockFetchOnce(503, {});
    await expect(FuFirEClient.postChart({} as any)).rejects.toMatchObject({ code: "fufire_unavailable" });
  });

  it("maps network/timeout failures to fufire_unavailable", async () => {
    global.fetch = vi.fn(async () => { throw new Error("AbortError"); }) as any;
    await expect(FuFirEClient.postChart({} as any)).rejects.toMatchObject({ code: "fufire_unavailable" });
  });

  it("aborts after REQUEST_TIMEOUT_MS and maps to fufire_unavailable", async () => {
    vi.useFakeTimers();
    process.env.REQUEST_TIMEOUT_MS = "50";
    // fetch never resolves on its own; it only rejects when the abort signal fires.
    global.fetch = vi.fn((_url: any, opts: any) => new Promise((_resolve, reject) => {
      opts.signal.addEventListener("abort", () => {
        const e = new Error("aborted");
        (e as any).name = "AbortError";
        reject(e);
      });
    })) as any;
    const p = FuFirEClient.postChart({} as any);
    const assertion = expect(p).rejects.toMatchObject({ code: "fufire_unavailable" });
    await vi.advanceTimersByTimeAsync(60);
    await assertion;
    vi.useRealTimers();
  });

  it("FuFirEError carries an httpStatus for the route layer", async () => {
    mockFetchOnce(401, {});
    const err = (await FuFirEClient.postChart({} as any).catch((e) => e)) as FuFirEError;
    expect(err).toBeInstanceOf(FuFirEError);
    expect(typeof err.httpStatus).toBe("number");
    expect(err.httpStatus).toBeGreaterThanOrEqual(500);
  });
});
