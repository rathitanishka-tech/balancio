import { createExpenseSchema } from "../../src/validators/expense.validator";
import { createSettlementSchema } from "../../src/validators/settlement.validator";

const VALID_GROUP_ID = "507f1f77bcf86cd799439011";
const USER_A = "507f1f77bcf86cd799439012";
const USER_B = "507f1f77bcf86cd799439013";

describe("createExpenseSchema", () => {
  it("accepts a valid EQUAL split payload", () => {
    const result = createExpenseSchema.safeParse({
      body: {
        groupId: VALID_GROUP_ID,
        title: "Dinner",
        amount: 1000,
        paidBy: USER_A,
        splitType: "EQUAL",
        participants: [{ userId: USER_A }, { userId: USER_B }]
      }
    });
    expect(result.success).toBe(true);
  });

  it("rejects a PERCENTAGE split missing percentages", () => {
    const result = createExpenseSchema.safeParse({
      body: {
        groupId: VALID_GROUP_ID,
        title: "Dinner",
        amount: 1000,
        paidBy: USER_A,
        splitType: "PERCENTAGE",
        participants: [{ userId: USER_A }, { userId: USER_B }]
      }
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    const result = createExpenseSchema.safeParse({
      body: {
        groupId: VALID_GROUP_ID,
        title: "Dinner",
        amount: 0,
        paidBy: USER_A,
        splitType: "EQUAL",
        participants: [{ userId: USER_A }]
      }
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate participants", () => {
    const result = createExpenseSchema.safeParse({
      body: {
        groupId: VALID_GROUP_ID,
        title: "Dinner",
        amount: 1000,
        paidBy: USER_A,
        splitType: "EQUAL",
        participants: [{ userId: USER_A }, { userId: USER_A }]
      }
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid ObjectId", () => {
    const result = createExpenseSchema.safeParse({
      body: {
        groupId: "not-an-id",
        title: "Dinner",
        amount: 1000,
        paidBy: USER_A,
        splitType: "EQUAL",
        participants: [{ userId: USER_A }]
      }
    });
    expect(result.success).toBe(false);
  });
});

describe("createSettlementSchema", () => {
  it("accepts a valid settlement", () => {
    const result = createSettlementSchema.safeParse({
      body: {
        groupId: VALID_GROUP_ID,
        fromUser: USER_A,
        toUser: USER_B,
        amount: 500
      }
    });
    expect(result.success).toBe(true);
  });

  it("rejects fromUser === toUser", () => {
    const result = createSettlementSchema.safeParse({
      body: {
        groupId: VALID_GROUP_ID,
        fromUser: USER_A,
        toUser: USER_A,
        amount: 500
      }
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = createSettlementSchema.safeParse({
      body: {
        groupId: VALID_GROUP_ID,
        fromUser: USER_A,
        toUser: USER_B,
        amount: -500
      }
    });
    expect(result.success).toBe(false);
  });
});
