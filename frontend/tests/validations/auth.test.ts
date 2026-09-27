import { loginSchema, registerSchema, forgotPasswordSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("accepts a valid email/password", () => {
    const result = loginSchema.safeParse({ email: "tanu@example.com", password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "tanu@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = { name: "Tanu", email: "tanu@example.com", password: "password123", confirmPassword: "password123" };

  it("accepts matching passwords", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: "different" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("confirmPassword");
    }
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({ ...base, password: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing name", () => {
    const result = registerSchema.safeParse({ ...base, name: "" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "tanu@example.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});
