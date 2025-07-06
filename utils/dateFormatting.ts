import { LanguageCode } from "@/context/LanguageContext";

/**
 * Get the appropriate locale string for date formatting based on language
 */
export function getDateLocale(language: LanguageCode): string {
  switch (language) {
    case "th":
      return "th-TH";
    case "en":
    default:
      return "en-US";
  }
}

/**
 * Format a date string with proper localization
 */
export function formatLocalizedDate(
  dateString: string,
  language: LanguageCode,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = new Date(dateString);
  const locale = getDateLocale(language);

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

/**
 * Format a month string (YYYY-MM format) with proper localization
 */
export function formatLocalizedMonth(
  monthString: string,
  language: LanguageCode,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = new Date(monthString + "-01");
  const locale = getDateLocale(language);

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    ...options,
  });
}

/**
 * Get month name using translation keys instead of locale formatting
 * This ensures consistent translation system usage
 */
export function getMonthName(
  monthIndex: number,
  t: (key: string) => string
): string {
  const monthKeys = [
    "month.january",
    "month.february",
    "month.march",
    "month.april",
    "month.may",
    "month.june",
    "month.july",
    "month.august",
    "month.september",
    "month.october",
    "month.november",
    "month.december",
  ];

  return t(monthKeys[monthIndex] || monthKeys[0]);
}

/**
 * Format a date using translation keys for month names
 */
export function formatDateWithTranslations(
  date: Date | string,
  t: (key: string) => string,
  options: {
    includeYear?: boolean;
    shortMonth?: boolean;
    includeDate?: boolean;
  } = {}
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const monthIndex = dateObj.getMonth();
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();

  const monthName = getMonthName(monthIndex, t);
  const displayMonth = options.shortMonth ? monthName.slice(0, 3) : monthName;

  const includeDate =
    options.includeDate !== undefined ? options.includeDate : true;

  if (!includeDate && options.includeYear) {
    return `${displayMonth} ${year}`;
  } else if (!includeDate) {
    return `${displayMonth}`;
  } else if (options.includeYear) {
    return `${day} ${displayMonth} ${year}`;
  }

  return `${day} ${displayMonth}`;
}
