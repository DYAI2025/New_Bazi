import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("./supabase", () => ({
  isSupabaseConfigured: vi.fn(),
  getServerSupabase: vi.fn(),
}));

import { isSupabaseConfigured, getServerSupabase } from "./supabase";
import { requireUserAuth } from "./requireUserAuth";

function makeReq(authHeader?: string): Request {
  return { headers: authHeader ? { authorization: authHeader } : {} } as unknown as Request;
}

function makeRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json, _json: json, _status: status } as unknown as Response & { _json: typeof json; _status: typeof status };
}

describe("requireUserAuth", () => {
  const next: NextFunction = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("503 PERSISTENCE_DISABLED wenn Supabase nicht konfiguriert", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    const req = makeReq();
    const res = makeRes();
    await requireUserAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect((res.status as any)().json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "PERSISTENCE_DISABLED" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("401 AUTH_REQUIRED ohne Authorization-Header", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const req = makeReq();
    const res = makeRes();
    await requireUserAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect((res.status as any)().json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "AUTH_REQUIRED" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("401 AUTH_REQUIRED bei ungültigem Token", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(getServerSupabase).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "invalid" } }) },
    } as any);
    const req = makeReq("Bearer bad-token");
    const res = makeRes();
    await requireUserAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("ruft next() und setzt req.userId bei gültigem Token", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(getServerSupabase).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }) },
    } as any);
    const req = makeReq("Bearer valid-token") as any;
    const res = makeRes();
    await requireUserAuth(req, res, next);
    expect(req.userId).toBe("user-123");
    expect(next).toHaveBeenCalled();
  });
});
