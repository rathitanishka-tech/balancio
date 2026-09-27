import { formatMoney, formatSignedMoney, minorToMajor, currencySymbol } from "@/lib/formatters/currency";

describe("minorToMajor", () => {
  it("converts paise to rupees", () => {
    expect(minorToMajor(10050)).toBe(100.5);
    expect(minorToMajor(100)).toBe(1);
  });
});

describe("formatMoney", () => {
  it("formats INR minor units with the rupee symbol", () => {
    expect(formatMoney(150000, "INR")).toContain("₹");
    expect(formatMoney(150000, "INR")).toContain("1,500");
  });

  it("formats USD minor units with the dollar symbol", () => {
    expect(formatMoney(150000, "USD")).toContain("$");
  });

  it("formats EUR and GBP correctly", () => {
    expect(formatMoney(100000, "EUR")).toContain("1,000");
    expect(formatMoney(100000, "GBP")).toContain("£");
  });

  it("falls back gracefully for an unknown currency code", () => {
    expect(() => formatMoney(1000, "ZZZ")).not.toThrow();
  });

  it("never receives or produces negative-looking output for a positive amount", () => {
    expect(formatMoney(0, "INR")).not.toContain("-");
  });
});

describe("formatSignedMoney", () => {
  it("prefixes a plus sign for positive amounts", () => {
    expect(formatSignedMoney(50000, "INR")).toMatch(/^\+/);
  });

  it("prefixes a minus sign for negative amounts", () => {
    expect(formatSignedMoney(-50000, "INR")).toMatch(/^-/);
  });

  it("has no sign for zero", () => {
    const formatted = formatSignedMoney(0, "INR");
    expect(formatted.startsWith("+")).toBe(false);
    expect(formatted.startsWith("-")).toBe(false);
  });
});

describe("currencySymbol", () => {
  it("returns known symbols", () => {
    expect(currencySymbol("INR")).toBe("₹");
    expect(currencySymbol("USD")).toBe("$");
    expect(currencySymbol("EUR")).toBe("€");
    expect(currencySymbol("GBP")).toBe("£");
  });

  it("falls back to the currency code itself when unknown", () => {
    expect(currencySymbol("XYZ")).toBe("XYZ");
  });
});
