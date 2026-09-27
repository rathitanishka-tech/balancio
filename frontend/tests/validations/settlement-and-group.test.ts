import { settlementFormSchema } from "@/lib/validations/settlement";
import { createGroupSchema } from "@/lib/validations/group";

describe("settlementFormSchema", () => {
  it("accepts a valid settlement", () => {
    const result = settlementFormSchema.safeParse({
      toUser: "user-2",
      amount: 500,
      paymentMethod: "UPI",
      note: "Dinner split"
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero or negative amount", () => {
    expect(settlementFormSchema.safeParse({ toUser: "user-2", amount: 0, paymentMethod: "CASH" }).success).toBe(false);
    expect(settlementFormSchema.safeParse({ toUser: "user-2", amount: -10, paymentMethod: "CASH" }).success).toBe(false);
  });

  it("rejects an invalid payment method", () => {
    const result = settlementFormSchema.safeParse({ toUser: "user-2", amount: 500, paymentMethod: "CRYPTO" });
    expect(result.success).toBe(false);
  });
});

describe("createGroupSchema", () => {
  it("accepts a valid group", () => {
    expect(createGroupSchema.safeParse({ name: "Goa Trip", currency: "INR" }).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(createGroupSchema.safeParse({ name: "", currency: "INR" }).success).toBe(false);
  });

  it("rejects an unsupported currency", () => {
    expect(createGroupSchema.safeParse({ name: "Goa Trip", currency: "JPY" }).success).toBe(false);
  });
});
