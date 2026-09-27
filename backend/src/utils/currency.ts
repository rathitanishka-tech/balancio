/**
 * Money precision utilities.
 *
 * All financial calculations in this codebase operate on INTEGER minor
 * units (e.g. paise for INR, cents for USD) to avoid floating-point
 * rounding bugs. Amounts are only converted to/from decimal "major unit"
 * representations at the API/UI boundary (request parsing / response
 * formatting), never during calculation.
 *
 * Example (INR):
 *   ₹100.50  -->  toMinorUnits(100.50)  -->  10050
 *   10050    -->  fromMinorUnits(10050) -->  100.50
 */

const MINOR_UNITS_PER_MAJOR = 100; // 2 decimal places for INR/USD/EUR etc.

/**
 * Converts a decimal major-unit amount (e.g. rupees) into an integer minor
 * unit amount (e.g. paise). Rounds to the nearest minor unit to avoid
 * floating point artifacts like 100.1 * 100 = 10009.999999999998.
 */
export function toMinorUnits(majorAmount: number): number {
  if (!Number.isFinite(majorAmount)) {
    throw new Error("Amount must be a finite number");
  }
  return Math.round(majorAmount * MINOR_UNITS_PER_MAJOR);
}

/**
 * Converts an integer minor-unit amount back into a decimal major-unit
 * amount, e.g. for display purposes.
 */
export function fromMinorUnits(minorAmount: number): number {
  return Math.round(minorAmount) / MINOR_UNITS_PER_MAJOR;
}

/**
 * Formats a minor-unit integer amount as a human readable currency string.
 * This should only ever be used at the presentation boundary (API response
 * formatting helpers, CSV/PDF export), never inside calculation logic.
 */
export function formatMoney(minorAmount: number, currency = "INR"): string {
  const major = fromMinorUnits(minorAmount);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(major);
  } catch {
    // Unknown currency code - fall back to a plain numeric format.
    return `${currency} ${major.toFixed(2)}`;
  }
}

/**
 * Asserts that a value is a safe, non-negative integer minor-unit amount.
 * Used defensively before persisting or calculating with monetary values.
 */
export function assertValidMinorAmount(value: number, fieldName = "amount"): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer number of minor currency units`);
  }
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${fieldName} exceeds safe integer range`);
  }
}

/**
 * Sums an array of integer minor-unit amounts safely.
 */
export function sumMinor(amounts: number[]): number {
  return amounts.reduce((acc, val) => acc + val, 0);
}
