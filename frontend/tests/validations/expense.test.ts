import { expenseFormSchema } from "@/lib/validations/expense";

const base = {
  title: "Dinner",
  amount: 2400,
  date: "2026-09-14",
  category: "Food",
  groupId: "group-1",
  paidBy: "user-1",
  notes: ""
};

describe("expenseFormSchema - EQUAL split", () => {
  it("accepts any valid participant list for an equal split", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      splitType: "EQUAL",
      participants: [
        { userId: "user-1", included: true },
        { userId: "user-2", included: true }
      ]
    });
    expect(result.success).toBe(true);
  });

  it("rejects when no participants are included", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      splitType: "EQUAL",
      participants: [{ userId: "user-1", included: false }]
    });
    expect(result.success).toBe(false);
  });
});

describe("expenseFormSchema - PERCENTAGE split", () => {
  it("accepts percentages that add up to 100", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      splitType: "PERCENTAGE",
      participants: [
        { userId: "user-1", included: true, percentage: 40 },
        { userId: "user-2", included: true, percentage: 30 },
        { userId: "user-3", included: true, percentage: 30 }
      ]
    });
    expect(result.success).toBe(true);
  });

  it("rejects percentages that do not add up to 100", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      splitType: "PERCENTAGE",
      participants: [
        { userId: "user-1", included: true, percentage: 40 },
        { userId: "user-2", included: true, percentage: 40 }
      ]
    });
    expect(result.success).toBe(false);
  });

  it("only counts included participants toward the percentage total", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      splitType: "PERCENTAGE",
      participants: [
        { userId: "user-1", included: true, percentage: 100 },
        { userId: "user-2", included: false, percentage: 50 }
      ]
    });
    expect(result.success).toBe(true);
  });
});

describe("expenseFormSchema - CUSTOM split", () => {
  it("accepts shares that add up to the total amount", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      amount: 2400,
      splitType: "CUSTOM",
      participants: [
        { userId: "user-1", included: true, shareAmount: 900 },
        { userId: "user-2", included: true, shareAmount: 600 },
        { userId: "user-3", included: true, shareAmount: 500 },
        { userId: "user-4", included: true, shareAmount: 400 }
      ]
    });
    expect(result.success).toBe(true);
  });

  it("rejects shares that do not add up to the total amount", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      amount: 2400,
      splitType: "CUSTOM",
      participants: [
        { userId: "user-1", included: true, shareAmount: 900 },
        { userId: "user-2", included: true, shareAmount: 600 }
      ]
    });
    expect(result.success).toBe(false);
  });
});

describe("expenseFormSchema - general validation", () => {
  it("rejects a non-positive amount", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      amount: 0,
      splitType: "EQUAL",
      participants: [{ userId: "user-1", included: true }]
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing title", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      title: "",
      splitType: "EQUAL",
      participants: [{ userId: "user-1", included: true }]
    });
    expect(result.success).toBe(false);
  });
});
