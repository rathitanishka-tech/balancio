import request from "supertest";
import { app } from "../../src/app";

/**
 * These tests exercise the real Express app (middleware, validation,
 * error handling) end-to-end via supertest WITHOUT requiring a live
 * MongoDB connection - they only cover request paths that fail before
 * ever reaching the database (validation errors, missing auth).
 *
 * Full happy-path integration tests (register -> login -> me) need a
 * reachable MONGO_URL and are intentionally not run in this sandboxed
 * build environment. See README.md "Testing" section for how to run
 * them locally against a real MongoDB instance.
 */
describe("Auth routes", () => {
  it("GET /api/health responds without requiring auth or a live database", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(["connected", "connecting", "disconnected", "disconnecting"]).toContain(res.body.database);
  });

  it("rejects registration with an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Tanu", email: "not-an-email", password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects registration with a short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Tanu", email: "tanu@example.com", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects login with a missing password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "tanu@example.com" });
    expect(res.status).toBe(400);
  });

  it("rejects GET /api/auth/me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects a malformed bearer token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("returns a standard 404 shape for unknown routes", async () => {
    const res = await request(app).get("/api/this-route-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
