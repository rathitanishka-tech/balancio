/** Small, dependency-free date helpers (deliberately no date-fns - see README "avoid unnecessary dependencies"). */

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = new Date(iso);
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
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export function formatMonthKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
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
