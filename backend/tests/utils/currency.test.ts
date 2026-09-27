import { toMinorUnits, fromMinorUnits, formatMoney, sumMinor, assertValidMinorAmount } from "../../src/utils/currency";

describe("toMinorUnits / fromMinorUnits", () => {
  it("converts rupees to paise without floating point drift", () => {
    expect(toMinorUnits(100.5)).toBe(10050);
    expect(toMinorUnits(0.1)).toBe(10);
    expect(toMinorUnits(19.99)).toBe(1999);
  });

  it("round-trips cleanly", () => {
    expect(fromMinorUnits(toMinorUnits(1234.56))).toBeCloseTo(1234.56, 2);
  });

  it("rounds to the nearest minor unit rather than truncating", () => {
    // 100.005 * 100 = 10000.499999999998 in raw floating point -> should round to 10000
    expect(toMinorUnits(100.004)).toBe(10000);
    expect(toMinorUnits(100.006)).toBe(10001);
  });
});

describe("formatMoney", () => {
  it("formats minor units as a currency string", () => {
    const formatted = formatMoney(150000, "INR");
    expect(formatted).toContain("1,500");
  });

  it("falls back gracefully for an unrecognized currency code", () => {
    expect(() => formatMoney(1000, "ZZZ")).not.toThrow();
  });
});

describe("sumMinor", () => {
  it("sums an array of integer minor-unit amounts", () => {
    expect(sumMinor([100, 200, 300])).toBe(600);
    expect(sumMinor([])).toBe(0);
  });
});

describe("assertValidMinorAmount", () => {
  it("accepts safe integers", () => {
    expect(() => assertValidMinorAmount(100)).not.toThrow();
  });

  it("rejects non-integers", () => {
    expect(() => assertValidMinorAmount(100.5)).toThrow();
  });
});
