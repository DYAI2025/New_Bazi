import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "./app";

// SEC-RATELIMIT-01: prove the limiter actually returns 429 on a billable route, and
// that cheap GET probes (Railway's /api/health healthcheck) are never throttled.
// The main suite runs with the limiter skipped (DISABLE_RATE_LIMIT / NODE_ENV=test);
// here we opt back in with RATE_LIMIT_FORCE and tiny limits read at createApp() time.
// Each test sets its own thresholds BEFORE createApp(), since the limiters read the
// RATE_LIMIT_* env at construction.
describe("rate limiting (SEC-RATELIMIT-01)", () => {
  const saved = {
    force: process.env.RATE_LIMIT_FORCE,
    compute: process.env.RATE_LIMIT_COMPUTE_MAX,
    global: process.env.RATE_LIMIT_GLOBAL_MAX
  };

  beforeAll(() => {
    process.env.RATE_LIMIT_FORCE = "true";
  });

  afterAll(() => {
    // Restore so the active limiter never leaks into other test files in a shared worker.
    saved.force === undefined ? delete process.env.RATE_LIMIT_FORCE : (process.env.RATE_LIMIT_FORCE = saved.force);
    saved.compute === undefined ? delete process.env.RATE_LIMIT_COMPUTE_MAX : (process.env.RATE_LIMIT_COMPUTE_MAX = saved.compute);
    saved.global === undefined ? delete process.env.RATE_LIMIT_GLOBAL_MAX : (process.env.RATE_LIMIT_GLOBAL_MAX = saved.global);
  });

  it("returns 429 on a billable POST route once the compute limit is exceeded", async () => {
    process.env.RATE_LIMIT_COMPUTE_MAX = "2";
    process.env.RATE_LIMIT_GLOBAL_MAX = "1000"; // high → only the compute cap bites
    const app = createApp();
    const post = () => request(app).post("/api/azodiac/profile").send({});

    const r1 = await post(); // counted; handler 400 (invalid body), NOT 429
    const r2 = await post(); // counted; still under the limit
    const r3 = await post(); // over the compute limit → 429 at the limiter

    expect(r1.status).not.toBe(429);
    expect(r2.status).not.toBe(429);
    expect(r3.status).toBe(429);
    expect(r3.body).toMatchObject({ error: "rate_limited" });
  });

  it("never throttles cheap GET probes even at global limit 1 (healthcheck safe)", async () => {
    process.env.RATE_LIMIT_GLOBAL_MAX = "1";
    process.env.RATE_LIMIT_COMPUTE_MAX = "1";
    const app = createApp();

    const h1 = await request(app).get("/api/health");
    const h2 = await request(app).get("/api/health");
    const h3 = await request(app).get("/api/health");

    expect(h1.status).toBe(200);
    expect(h2.status).toBe(200);
    expect(h3.status).toBe(200);
  });
});
