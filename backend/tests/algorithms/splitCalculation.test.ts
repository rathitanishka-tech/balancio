import {
  calculateEqualSplit,
  calculatePercentageSplit,
  calculateCustomSplit,
  calculateSplit
} from "../../src/algorithms/splitCalculation";
import { InvalidSplitError } from "../../src/utils/errors";

describe("calculateEqualSplit", () => {
  it("splits evenly when the amount divides cleanly", () => {
    const result = calculateEqualSplit(100000, ["A", "B", "C", "D"]); // ₹1000 across 4
    expect(result).toEqual([
      { userId: "A", shareAmount: 25000 },
      { userId: "B", shareAmount: 25000 },
      { userId: "C", shareAmount: 25000 },
      { userId: "D", shareAmount: 25000 }
    ]);
  });

  it("distributes the remainder deterministically when it does not divide evenly", () => {
    // ₹1000 (100000 paise) across 3 people => 33333.33 each
    const result = calculateEqualSplit(100000, ["A", "B", "C"]);
    const total = result.reduce((sum, r) => sum + r.shareAmount, 0);
    expect(total).toBe(100000);
    // first participant(s) absorb the extra paise
    expect(result[0].shareAmount).toBe(33334);
    expect(result[1].shareAmount).toBe(33333);
    expect(result[2].shareAmount).toBe(33333);
  });

  it("is deterministic across repeated calls", () => {
    const r1 = calculateEqualSplit(1000, ["A", "B", "C"]);
    const r2 = calculateEqualSplit(1000, ["A", "B", "C"]);
    expect(r1).toEqual(r2);
  });

  it("throws when there are no participants", () => {
    expect(() => calculateEqualSplit(1000, [])).toThrow(InvalidSplitError);
  });

  it("throws on duplicate participants", () => {
    expect(() => calculateEqualSplit(1000, ["A", "A"])).toThrow(InvalidSplitError);
  });
});

describe("calculatePercentageSplit", () => {
  it("splits according to given percentages", () => {
    const result = calculatePercentageSplit(100000, [
      { userId: "A", percentage: 50 },
      { userId: "B", percentage: 30 },
      { userId: "C", percentage: 20 }
    ]);
    const total = result.reduce((sum, r) => sum + r.shareAmount, 0);
    expect(total).toBe(100000);
    expect(result.find((r) => r.userId === "A")!.shareAmount).toBe(50000);
    expect(result.find((r) => r.userId === "B")!.shareAmount).toBe(30000);
    expect(result.find((r) => r.userId === "C")!.shareAmount).toBe(20000);
  });

  it("handles percentages that do not divide evenly and still sums exactly", () => {
    // 1000 paise split 33.33 / 33.33 / 33.34
    const result = calculatePercentageSplit(1000, [
      { userId: "A", percentage: 33.33 },
      { userId: "B", percentage: 33.33 },
      { userId: "C", percentage: 33.34 }
    ]);
    const total = result.reduce((sum, r) => sum + r.shareAmount, 0);
    expect(total).toBe(1000);
  });

  it("rejects percentages that do not add up to 100", () => {
    expect(() =>
      calculatePercentageSplit(1000, [
        { userId: "A", percentage: 50 },
        { userId: "B", percentage: 40 }
      ])
    ).toThrow(InvalidSplitError);
  });

  it("rejects negative percentages", () => {
    expect(() =>
      calculatePercentageSplit(1000, [
        { userId: "A", percentage: 120 },
        { userId: "B", percentage: -20 }
      ])
    ).toThrow(InvalidSplitError);
  });

  it("tolerates tiny floating point drift in the total (e.g. 99.999999)", () => {
    expect(() =>
      calculatePercentageSplit(1000, [
        { userId: "A", percentage: 33.333333 },
        { userId: "B", percentage: 33.333333 },
        { userId: "C", percentage: 33.333334 }
      ])
    ).not.toThrow();
  });
});

describe("calculateCustomSplit", () => {
  it("accepts shares that sum exactly to the expense amount", () => {
    const result = calculateCustomSplit(1000, [
      { userId: "A", shareAmount: 500 },
      { userId: "B", shareAmount: 300 },
      { userId: "C", shareAmount: 200 }
    ]);
    expect(result).toEqual([
      { userId: "A", shareAmount: 500 },
      { userId: "B", shareAmount: 300 },
      { userId: "C", shareAmount: 200 }
    ]);
  });

  it("rejects totals that do not match the expense amount", () => {
    expect(() =>
      calculateCustomSplit(1000, [
        { userId: "A", shareAmount: 500 },
        { userId: "B", shareAmount: 300 }
      ])
    ).toThrow(InvalidSplitError);
  });

  it("rejects negative or non-integer shares", () => {
    expect(() =>
      calculateCustomSplit(1000, [
        { userId: "A", shareAmount: -100 },
        { userId: "B", shareAmount: 1100 }
      ])
    ).toThrow(InvalidSplitError);

    expect(() =>
      calculateCustomSplit(1000, [
        { userId: "A", shareAmount: 500.5 },
        { userId: "B", shareAmount: 499.5 }
      ])
    ).toThrow(InvalidSplitError);
  });
});

describe("calculateSplit dispatcher", () => {
  it("rejects non-positive or non-integer amounts", () => {
    expect(() => calculateSplit("EQUAL", 0, [{ userId: "A" }])).toThrow(InvalidSplitError);
    expect(() => calculateSplit("EQUAL", -100, [{ userId: "A" }])).toThrow(InvalidSplitError);
    expect(() => calculateSplit("EQUAL", 100.5, [{ userId: "A" }])).toThrow(InvalidSplitError);
  });

  it("dispatches to the correct strategy", () => {
    const equal = calculateSplit("EQUAL", 200, [{ userId: "A" }, { userId: "B" }]);
    expect(equal.every((s) => s.shareAmount === 100)).toBe(true);

    const percentage = calculateSplit("PERCENTAGE", 200, [
      { userId: "A", percentage: 50 },
      { userId: "B", percentage: 50 }
    ]);
    expect(percentage.every((s) => s.shareAmount === 100)).toBe(true);

    const custom = calculateSplit("CUSTOM", 200, [
      { userId: "A", shareAmount: 120 },
      { userId: "B", shareAmount: 80 }
    ]);
    expect(custom.find((s) => s.userId === "A")!.shareAmount).toBe(120);
  });
});
