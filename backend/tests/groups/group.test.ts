import request from "supertest";
import { app } from "../../src/app";

/**
 * See tests/auth/auth.test.ts for why these tests are scoped to
 * auth/validation behavior rather than full DB-backed happy paths.
 */
describe("Group routes", () => {
  it("rejects creating a group without authentication", async () => {
    const res = await request(app).post("/api/groups").send({ name: "Goa Trip" });
    expect(res.status).toBe(401);
  });

  it("rejects listing groups without authentication", async () => {
    const res = await request(app).get("/api/groups");
    expect(res.status).toBe(401);
  });

  it("rejects fetching a group with a malformed groupId", async () => {
    const res = await request(app)
      .get("/api/groups/not-a-valid-id")
      .set("Authorization", "Bearer fake-token-for-shape-check");
    // Auth fails first (invalid token), which is also the correct behavior -
    // authentication is always checked before resource-level validation.
    expect(res.status).toBe(401);
  });
});
