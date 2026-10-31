import { formatMonthYear, formatMonthKey, shiftMonth, timeAgo } from "@/lib/formatters/date";

describe("formatMonthYear", () => {
  it("formats a month/year pair", () => {
    expect(formatMonthYear(9, 2026)).toBe("September 2026");
    expect(formatMonthYear(1, 2025)).toBe("January 2025");
  });
});

describe("formatMonthKey", () => {
  it("formats a standard YYYY-MM key into a short month name", () => {
    expect(formatMonthKey("2026-09")).toBe("Sep");
    expect(formatMonthKey("2025-12")).toBe("Dec");
    expect(formatMonthKey("2026-01")).toBe("Jan");
  });

  it("handles unpadded YYYY-M keys", () => {
    expect(formatMonthKey("2026-9")).toBe("Sep");
    expect(formatMonthKey("2026-1")).toBe("Jan");
  });

  it("normalizes numeric month inputs (prevents key.split crash)", () => {
    expect(formatMonthKey(9)).toBe("Sep");
    expect(formatMonthKey(10)).toBe("Oct");
    expect(formatMonthKey(1)).toBe("Jan");
    expect(formatMonthKey(12)).toBe("Dec");
  });

  it("formats Date instances and timestamps", () => {
    expect(formatMonthKey(new Date(Date.UTC(2026, 8, 15)))).toBe("Sep");
    const timestamp = Date.UTC(2026, 8, 15);
    expect(formatMonthKey(timestamp)).toBe("Sep");
  });

  it("extracts month from analytics object structures", () => {
    expect(formatMonthKey({ month: "2026-09" })).toBe("Sep");
    expect(formatMonthKey({ year: 2026, month: 9 })).toBe("Sep");
  });

  it("returns safe intentional fallback '—' on malformed and invalid inputs without throwing", () => {
    expect(formatMonthKey("")).toBe("—");
    expect(formatMonthKey("   ")).toBe("—");
    expect(formatMonthKey("invalid-key")).toBe("—");
    expect(formatMonthKey("2026-15")).toBe("—");
    expect(formatMonthKey("2026-00")).toBe("—");
    expect(formatMonthKey(null)).toBe("—");
    expect(formatMonthKey(undefined)).toBe("—");
    expect(formatMonthKey(NaN)).toBe("—");
    expect(formatMonthKey(0)).toBe("—");
    expect(formatMonthKey(13)).toBe("—");
    expect(formatMonthKey(-5)).toBe("—");
    expect(formatMonthKey({})).toBe("—");
  });
});

describe("shiftMonth", () => {
  it("moves forward within the same year", () => {
    expect(shiftMonth(3, 2026, 2)).toEqual({ month: 5, year: 2026 });
  });

  it("rolls over into the next year", () => {
    expect(shiftMonth(11, 2026, 3)).toEqual({ month: 2, year: 2027 });
  });

  it("rolls back into the previous year", () => {
    expect(shiftMonth(2, 2026, -3)).toEqual({ month: 11, year: 2025 });
  });
});

describe("timeAgo", () => {
  it("reports 'just now' for a very recent timestamp", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
  });

  it("reports minutes ago for a timestamp a few minutes back", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toMatch(/minutes? ago/);
  });

  it("reports days ago for a timestamp several days back", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeDaysAgo)).toMatch(/days? ago/);
  });
});
