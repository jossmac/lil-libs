/**
 * Datetime formatting utilities.
 *
 * @module
 */

// relativeTime ----------------------------------------------------------------

const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
  { unit: "second", ms: 1000 },
];

export type RelativeOptions = {
  /**
   * Controls whether relative time is always numeric or may use idiomatic phrasing.
   *
   * With `"auto"`, output may use forms such as `"yesterday"` or `"now"` instead of `"1 day ago"`.
   *
   * @default 'always'
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat#numeric
   */
  numeric?: Intl.RelativeTimeFormatNumeric;
  /**
   * The style of the formatted relative time.
   *
   * Possible values are:
   * - "long" E.g., "1 minute ago"
   * - "short" E.g., "1 min. ago"
   * - "narrow" E.g., "1m ago"
   *
   * @default 'long'
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat#style
   */
  style?: Intl.RelativeTimeFormatStyle;
};

/**
 * Formats a date as relative time when it is within `relativeFormatThreshold`
 * of now, otherwise as a locale-aware date string.
 *
 * @example
 * relativeTime(new Date(Date.now() - 1_000 * 60)); // "1 minute ago"
 * relativeTime(new Date(Date.now() + 1_000 * 60 * 5)); // "in 5 minutes"
 * relativeTime(new Date(Date.now() - 1_000), undefined, { numeric: "auto" }); // e.g. "now" (locale-dependent)
 * relativeTime(new Date(Date.now() - 1_000 * 60), undefined, { style: "short" }); // "1 min. ago"
 *
 * @param value - The date to format, as a `Date` or ISO 8601 string. Invalid values throw `TypeError`.
 * @param relativeFormatThreshold - Maximum distance from now, in milliseconds, for relative formatting. When the date is closer than this (e.g. within 24 hours), the result is relative ("5 minutes ago"); at or beyond it, a locale date string is used instead. Defaults to 24 hours. Pass `Infinity` to always use relative formatting.
 * @param relativeOptions - Options for `Intl.RelativeTimeFormat` (`numeric`, `style`). Controls phrasing (e.g. "yesterday" vs "1 day ago") and output length (e.g. "1 minute ago" vs "1 min. ago"). Defaults to `{ numeric: "always", style: "long" }`.
 * @param dateOptions - Options for `Intl.DateTimeFormat` when the date falls outside `relativeFormatThreshold`. Defaults to numeric year, month, and day — avoiding two-digit years produced by `dateStyle: "short"` in locales such as en-US.
 * @returns A locale-aware string: relative time when within `relativeFormatThreshold`, otherwise a formatted date from `toLocaleDateString`.
 * @throws If the value is not a `Date` object or ISO 8601 string.
 */
export function relativeTime(
  value: Date | string,
  relativeFormatThreshold: number = 24 * 60 * 60 * 1000,
  relativeOptions: RelativeOptions = { numeric: "always", style: "long" },
  // NOTE: default value avoids the shortcut style `{dateStyle: 'short'}`
  // because it collapses the year to 2 digits when the locale is 'en-US' e.g.
  // "1/6/26" instead of "1/6/2026", which is too informal.
  dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  },
  /** @private Used for testing. */
  __locale?: string,
): string {
  const date = new Date(value);
  const timestamp = date.getTime();

  if (isNaN(timestamp)) {
    throw new TypeError(
      `Invalid date value: ${JSON.stringify(value)}. Expected a Date object or ISO 8601 string.`,
    );
  }

  const diff = timestamp - Date.now();
  const absDiff = Math.abs(diff);

  if (absDiff < relativeFormatThreshold) {
    const rtf = new Intl.RelativeTimeFormat(__locale, relativeOptions);

    for (const { unit, ms } of UNITS) {
      if (absDiff >= ms || unit === "second") {
        const value = Math.round(diff / ms);
        return rtf.format(value, unit);
      }
    }
  }

  return date.toLocaleDateString(__locale, dateOptions);
}
