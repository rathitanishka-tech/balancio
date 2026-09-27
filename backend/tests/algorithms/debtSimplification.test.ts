import { simplifyDebts, verifySimplification } from "../../src/algorithms/debtSimplification";
import { RawBalance } from "../../src/types/balance.types";

function sumBalances(balances: RawBalance[]): number {
  return balances.reduce((sum, b) => sum + b.balance, 0);
}

describe("simplifyDebts", () => {
  it("handles the basic example from the spec (A owes 500, B is owed 300, C is owed 200)", () => {
    const balances: RawBalance[] = [
      { userId: "A", balance: -500 },
      { userId: "B", balance: 300 },
      { userId: "C", balance: 200 }
    ];
    const result = simplifyDebts(balances);
    expect(result).toEqual([
      { from: "A", to: "B", amount: 300 },
      { from: "A", to: "C", amount: 200 }
    ]);
  });

  it("returns no transactions when everyone is already settled", () => {
    const balances: RawBalance[] = [
      { userId: "A", balance: 0 },
      { userId: "B", balance: 0 }
    ];
    expect(simplifyDebts(balances)).toEqual([]);
  });

  it("ignores negligible zero balances and produces no transactions for them", () => {
    const balances: RawBalance[] = [
      { userId: "A", balance: 0 },
      { userId: "B", balance: 500 },
      { userId: "C", balance: -500 }
    ];
    const result = simplifyDebts(balances);
    expect(result.every((t) => t.from !== "A" && t.to !== "A")).toBe(true);
  });

  it("handles a simple three-way cycle (A owes B, B owes C, C owes A) by reducing to net balances first", () => {
    // A owes B 100, B owes C 100, C owes A 100 -> nets to everyone at 0.
    // The caller is expected to pass NET balances (already reduced), which
    // in this case is all zeros.
    const balances: RawBalance[] = [
      { userId: "A", balance: 0 },
      { userId: "B", balance: 0 },
      { userId: "C", balance: 0 }
    ];
    expect(simplifyDebts(balances)).toEqual([]);
  });

  it("handles multiple creditors and multiple debtors with unequal amounts", () => {
    const balances: RawBalance[] = [
      { userId: "A", balance: -300 },
      { userId: "B", balance: -200 },
      { userId: "C", balance: 400 },
      { userId: "D", balance: 100 }
    ];
    const result = simplifyDebts(balances);

    // Conservation: nothing created or destroyed.
    expect(verifySimplification(balances, result)).toBe(true);

    // No more than n-1 transactions for n non-zero balances.
    expect(result.length).toBeLessThanOrEqual(3);

    // No zero-amount transactions.
    expect(result.every((t) => t.amount > 0)).toBe(true);
  });

  it("keeps sum(balances) before === sum(balances) after (both zero)", () => {
    const balances: RawBalance[] = [
      { userId: "A", balance: -700 },
      { userId: "B", balance: -300 },
      { userId: "C", balance: 500 },
      { userId: "D", balance: 500 }
    ];
    const before = sumBalances(balances);
    const result = simplifyDebts(balances);
    expect(before).toBe(0);
    expect(verifySimplification(balances, result)).toBe(true);
  });

  it("handles a large group with many debtors and creditors without losing or creating money", () => {
    const balances: RawBalance[] = [
      { userId: "A", balance: -1200 },
      { userId: "B", balance: -800 },
      { userId: "C", balance: -50 },
      { userId: "D", balance: 900 },
      { userId: "E", balance: 700 },
      { userId: "F", balance: 450 }
    ];
    const result = simplifyDebts(balances);
    expect(verifySimplification(balances, result)).toBe(true);
    expect(result.every((t) => t.amount > 0)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(balances.length - 1);
  });

  it("throws if the input balances do not sum to zero (invalid upstream state)", () => {
    const balances: RawBalance[] = [
      { userId: "A", balance: -500 },
      { userId: "B", balance: 300 }
    ];
    expect(() => simplifyDebts(balances)).toThrow();
  });

  it("produces a single transaction for a simple two-person debt", () => {
    const balances: RawBalance[] = [
      { userId: "A", balance: -500 },
      { userId: "B", balance: 500 }
    ];
    const result = simplifyDebts(balances);
    expect(result).toEqual([{ from: "A", to: "B", amount: 500 }]);
  });
});
