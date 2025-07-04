/**
 * Currency Utility Functions for THB (Thai Baht)
 *
 * Centralized currency formatting and conversion utilities
 * for consistent THB display throughout the application.
 */

/**
 * Format amount as Thai Baht currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format amount as Thai Baht currency with compact notation for large numbers
 */
export function formatCurrencyCompact(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return formatCurrency(amount);
}

/**
 * Parse currency string back to number (removes THB symbol and formatting)
 */
export function parseCurrency(currencyString: string): number {
  // Remove THB symbol, spaces, and commas, then parse
  const cleanString = currencyString
    .replace(/[฿,\s]/g, "")
    .replace(/[^\d.-]/g, "");

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format number as THB without currency symbol (for input fields)
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate if a string is a valid currency amount
 */
export function isValidCurrencyAmount(value: string): boolean {
  const cleaned = value.replace(/[฿,\s]/g, "");
  const number = parseFloat(cleaned);
  return !isNaN(number) && number >= 0;
}

/**
 * Currency constants
 */
export const CURRENCY_SYMBOL = "฿";
export const CURRENCY_CODE = "THB";
export const CURRENCY_NAME = "Thai Baht";

/**
 * Default currency formatting options
 */
export const DEFAULT_CURRENCY_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
};
