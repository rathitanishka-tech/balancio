/**
 * Small date helpers used by analytics and filtering. Kept dependency-free
 * (no moment/dayjs) since the needs here are minimal.
 */

export function startOfMonth(year: number, month1to12: number): Date {
  return new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0, 0));
}

export function startOfNextMonth(year: number, month1to12: number): Date {
  return new Date(Date.UTC(year, month1to12, 1, 0, 0, 0, 0));
}

export function parseDateOrUndefined(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
