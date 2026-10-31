/** Small, dependency-free date helpers (deliberately no date-fns - see README "avoid unnecessary dependencies"). */

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts
  }).format(date);
}

export function formatDateShort(iso: string): string {
  return formatDate(iso, { year: undefined });
}

export function formatMonthYear(month: number, year: number): string {
  if (typeof month !== "number" || typeof year !== "number" || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    return "—";
  }
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export function formatMonthKey(key: unknown): string {
  if (key == null) return "—";

  // 1. If key is already a Date object
  if (key instanceof Date) {
    if (isNaN(key.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(key);
  }

  // 2. If key is a number
  if (typeof key === "number") {
    if (isNaN(key)) return "—";
    // Month number 1-12 (boundary normalization)
    if (Number.isInteger(key) && key >= 1 && key <= 12) {
      const date = new Date(Date.UTC(2000, key - 1, 1));
      return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
    }
    // Millisecond timestamp
    if (key > 100000000) {
      const date = new Date(key);
      if (isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
    }
    return "—";
  }

  // 3. If key is a string
  if (typeof key === "string") {
    const trimmed = key.trim();
    if (!trimmed) return "—";

    // Standard "YYYY-MM" or "YYYY-M" key (e.g. "2026-09", "2026-9")
    const ymMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
    if (ymMatch) {
      const year = parseInt(ymMatch[1], 10);
      const month = parseInt(ymMatch[2], 10);
      if (month >= 1 && month <= 12 && year >= 1000 && year <= 9999) {
        const date = new Date(Date.UTC(year, month - 1, 1));
        return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
      }
      return "—";
    }

    // Try parsing as ISO date string
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
    }

    return "—";
  }

  // 4. If key is an object with { year, month } or { month }
  if (typeof key === "object") {
    const obj = key as Record<string, unknown>;
    if (typeof obj.month === "number" && typeof obj.year === "number") {
      const month = obj.month;
      const year = obj.year;
      if (month >= 1 && month <= 12) {
        const date = new Date(Date.UTC(year, month - 1, 1));
        return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
      }
    } else if (typeof obj.month === "string") {
      return formatMonthKey(obj.month);
    }
    return "—";
  }

  return "—";
}

export function timeAgo(iso: string): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "—";
  const now = Date.now();
  const seconds = Math.max(0, Math.floor((now - then) / 1000));

  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"]
  ];

  let value = seconds;
  for (const [divisor, unit] of units) {
    if (value < divisor) {
      const rounded = Math.floor(value);
      if (rounded <= 1 && unit === "second") return "just now";
      return `${rounded} ${unit}${rounded === 1 ? "" : "s"} ago`;
    }
    value = value / divisor;
  }
  return formatDate(iso);
}

/** Returns { month, year } for "n months before the given month/year", clamping year rollover. */
export function shiftMonth(month: number, year: number, delta: number): { month: number; year: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}
