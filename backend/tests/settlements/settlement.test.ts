import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../src/app";
import { env } from "../../src/config/env";

const fakeUserId = "507f1f77bcf86cd799439099";
const token = jwt.sign({ sub: fakeUserId, email: "test@example.com" }, env.jwtSecret, {
  expiresIn: "1h"
});

const VALID_GROUP_ID = "507f1f77bcf86cd799439011";
const USER_A = "507f1f77bcf86cd799439012";
const USER_B = "507f1f77bcf86cd799439013";

describe("Settlement routes", () => {
  it("rejects creating a settlement without authentication", async () => {
    const res = await request(app).post("/api/settlements").send({ amount: 500 });
    expect(res.status).toBe(401);
  });

  it("rejects a settlement where fromUser equals toUser", async () => {
    const res = await request(app)
      .post("/api/settlements")
      .set("Authorization", `Bearer ${token}`)
      .send({ groupId: VALID_GROUP_ID, fromUser: USER_A, toUser: USER_A, amount: 500 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a settlement with a zero or negative amount", async () => {
    const res = await request(app)
      .post("/api/settlements")
      .set("Authorization", `Bearer ${token}`)
      .send({ groupId: VALID_GROUP_ID, fromUser: USER_A, toUser: USER_B, amount: 0 });

    expect(res.status).toBe(400);
  });
});
