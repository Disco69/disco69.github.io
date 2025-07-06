/**
 * Currency Utility Functions
 *
 * Legacy currency utilities for backward compatibility.
 * For new code, use useCurrency() hook from CurrencyContext.
 */

/**
 * @deprecated Use useCurrency().formatCurrency() instead
 * Legacy format function that defaults to USD for backward compatibility
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * @deprecated Use useCurrency().formatCurrency(amount, true) instead
 * Legacy compact format function that defaults to USD
 */
export function formatCurrencyCompact(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return formatCurrency(amount);
}

/**
 * @deprecated Use useCurrency().parseCurrency() instead
 * Legacy parse function for backward compatibility
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols, spaces, and commas, then parse
  const cleanString = currencyString
    .replace(/[฿$€£¥₹₩Fr,\s]/g, "")
    .replace(/[A-Z]/g, "") // Remove currency codes like A$, C$, S$
    .replace(/[^\d.-]/g, "");

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * @deprecated Use useCurrency().formatNumber() instead
 * Legacy number format function that defaults to USD locale
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate if a string is a valid currency amount
 */
export function isValidCurrencyAmount(value: string): boolean {
  const cleaned = value.replace(/[฿$€£¥₹₩Fr,\s]/g, "").replace(/[A-Z]/g, "");
  const number = parseFloat(cleaned);
  return !isNaN(number) && number >= 0;
}

/**
 * @deprecated Legacy constants - use SUPPORTED_CURRENCIES from CurrencyContext instead
 */
export const CURRENCY_SYMBOL = "$";
export const CURRENCY_CODE = "USD";
export const CURRENCY_NAME = "US Dollar";

/**
 * @deprecated Legacy options - use useCurrency() hook instead
 */
export const DEFAULT_CURRENCY_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
};
