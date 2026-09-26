/**
 * The backend is the source of truth for every amount and always returns
 * integers in minor currency units (paise for INR, cents for USD, etc.).
 * This is the one place that turns those into a display string - nothing
 * else in the app should manually concatenate a currency symbol.
 */

const SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£"
};

const LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE", // English-formatted Euro (comma thousands, symbol prefixed) - matches the spec's "€1,240" example
  GBP: "en-GB"
};

export function minorToMajor(amountMinor: number): number {
  return amountMinor / 100;
}

export function formatMoney(amountMinor: number, currency = "INR"): string {
  const major = minorToMajor(amountMinor);
  const locale = LOCALES[currency] ?? "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: major % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    }).format(major);
  } catch {
    const symbol = SYMBOLS[currency] ?? `${currency} `;
    return `${symbol}${major.toLocaleString(locale, { maximumFractionDigits: 2 })}`;
  }
}

/** Same as formatMoney but always shows the sign (+/-), used for balance deltas. */
export function formatSignedMoney(amountMinor: number, currency = "INR"): string {
  const formatted = formatMoney(Math.abs(amountMinor), currency);
  if (amountMinor > 0) return `+${formatted}`;
  if (amountMinor < 0) return `-${formatted}`;
  return formatted;
}

export function currencySymbol(currency: string): string {
  return SYMBOLS[currency] ?? currency;
}
