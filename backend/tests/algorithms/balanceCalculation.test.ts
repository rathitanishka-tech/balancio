import {
  computeMemberBalances,
  computeDirectDebts,
  assertBalancesSumToZero,
  MemberAggregate
} from "../../src/algorithms/balanceCalculation";

describe("computeMemberBalances", () => {
  it("gives a positive balance to someone who paid more than their share", () => {
    const members: MemberAggregate[] = [
      { userId: "A", name: "A", totalPaid: 1000, totalOwed: 500, settlementsPaid: 0, settlementsReceived: 0 }
    ];
    const [balance] = computeMemberBalances(members);
    expect(balance.netBalance).toBe(500);
  });

  it("gives a negative balance to someone who owes more than they paid", () => {
    const members: MemberAggregate[] = [
      { userId: "A", name: "A", totalPaid: 200, totalOwed: 500, settlementsPaid: 0, settlementsReceived: 0 }
    ];
    const [balance] = computeMemberBalances(members);
    expect(balance.netBalance).toBe(-300);
  });

  it("returns exactly zero for a fully settled member", () => {
    const members: MemberAggregate[] = [
      { userId: "A", name: "A", totalPaid: 500, totalOwed: 500, settlementsPaid: 0, settlementsReceived: 0 }
    ];
    const [balance] = computeMemberBalances(members);
    expect(balance.netBalance).toBe(0);
  });

  it("a settlement payment moves a debtor's balance towards zero, not away from it", () => {
    // A owes 500 from expenses. A then pays a 500 settlement to clear it.
    const members: MemberAggregate[] = [
      { userId: "A", name: "A", totalPaid: 0, totalOwed: 500, settlementsPaid: 500, settlementsReceived: 0 }
    ];
    const [balance] = computeMemberBalances(members);
    expect(balance.netBalance).toBe(0);
  });

  it("a settlement receipt moves a creditor's balance towards zero, not away from it", () => {
    // B is owed 500 from expenses. B then receives a 500 settlement.
    const members: MemberAggregate[] = [
      { userId: "B", name: "B", totalPaid: 500, totalOwed: 0, settlementsPaid: 0, settlementsReceived: 500 }
    ];
    const [balance] = computeMemberBalances(members);
    expect(balance.netBalance).toBe(0);
  });

  it("keeps the group-wide sum of balances at zero after a settlement between two members", () => {
    const members: MemberAggregate[] = [
      { userId: "A", name: "A", totalPaid: 0, totalOwed: 500, settlementsPaid: 500, settlementsReceived: 0 },
      { userId: "B", name: "B", totalPaid: 500, totalOwed: 0, settlementsPaid: 0, settlementsReceived: 500 }
    ];
    const balances = computeMemberBalances(members);
    expect(() => assertBalancesSumToZero(balances)).not.toThrow();
  });

  it("throws assertBalancesSumToZero when balances are inconsistent", () => {
    const members: MemberAggregate[] = [
      { userId: "A", name: "A", totalPaid: 100, totalOwed: 0, settlementsPaid: 0, settlementsReceived: 0 }
    ];
    const balances = computeMemberBalances(members);
    expect(() => assertBalancesSumToZero(balances)).toThrow();
  });
});

describe("computeDirectDebts", () => {
  it("computes a simple two-person debt", () => {
    const debts = computeDirectDebts([
      { paidBy: "B", participantUserId: "A", shareAmount: 500 },
      { paidBy: "B", participantUserId: "B", shareAmount: 500 }
    ]);
    expect(debts).toEqual([{ from: "A", to: "B", amount: 500 }]);
  });

  it("nets multiple expenses between the same pair", () => {
    const debts = computeDirectDebts([
      { paidBy: "B", participantUserId: "A", shareAmount: 500 }, // A owes B 500
      { paidBy: "A", participantUserId: "B", shareAmount: 200 } // B owes A 200
    ]);
    expect(debts).toEqual([{ from: "A", to: "B", amount: 300 }]);
  });

  it("produces no debt entry once amounts fully cancel out", () => {
    const debts = computeDirectDebts([
      { paidBy: "B", participantUserId: "A", shareAmount: 500 },
      { paidBy: "A", participantUserId: "B", shareAmount: 500 }
    ]);
    expect(debts).toEqual([]);
  });

  it("ignores a payer's own share", () => {
    const debts = computeDirectDebts([{ paidBy: "A", participantUserId: "A", shareAmount: 500 }]);
    expect(debts).toEqual([]);
  });
});
