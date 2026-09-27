import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../src/app";
import { env } from "../../src/config/env";

/**
 * See tests/auth/auth.test.ts for why these tests are scoped to
 * auth/validation behavior rather than full DB-backed happy paths.
 *
 * We sign a real JWT here (using the same secret the running app uses)
 * so that requests pass the `requireAuth` middleware and reach the Zod
 * validation layer, which is what these tests actually exercise -
 * without ever needing a live MongoDB connection.
 */
const fakeUserId = "507f1f77bcf86cd799439099";
const token = jwt.sign({ sub: fakeUserId, email: "test@example.com" }, env.jwtSecret, {
  expiresIn: "1h"
});

const VALID_GROUP_ID = "507f1f77bcf86cd799439011";
const USER_A = "507f1f77bcf86cd799439012";

describe("Expense routes", () => {
  it("rejects creating an expense without authentication", async () => {
    const res = await request(app).post("/api/expenses").send({ title: "Dinner" });
    expect(res.status).toBe(401);
  });

  it("rejects an expense with an unsupported splitType once authenticated", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        groupId: VALID_GROUP_ID,
        title: "Dinner",
        amount: 1000,
        paidBy: USER_A,
        splitType: "WEIRD_TYPE",
        participants: [{ userId: USER_A }]
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an expense with a non-integer amount once authenticated", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        groupId: VALID_GROUP_ID,
        title: "Dinner",
        amount: 99.99,
        paidBy: USER_A,
        splitType: "EQUAL",
        participants: [{ userId: USER_A }]
      });

    expect(res.status).toBe(400);
  });

  it("rejects listing expenses with an invalid groupId query filter", async () => {
    const res = await request(app)
      .get("/api/expenses?group=not-an-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
