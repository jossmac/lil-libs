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
// NOTE: cannot use the shortcut style `{dateStyle: 'short'}` because it
// collapses the year to 2 digits when the locale is 'en-US' e.g.
// "1/6/26" instead of "1/6/2026", which is too informal
const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
};
const ONE_DAY = 24 * 60 * 60 * 1000;
const TEN_SECONDS = 10 * 1000;

export type RelativeOptions = {
  /**
   * The format of output message.
   *
   * When set to "auto", the output may use more idiomatic phrasing such as "yesterday" instead of "1 day ago".
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
 * Formats a date as relative time for nearby past or future values and falls
 * back to a date string once the value is 24 hours away or more.
 *
 * @example
 * relativeTime(new Date(Date.now() - 1_000 * 60)); // "1 minute ago"
 * relativeTime(new Date(Date.now() + 1_000 * 60 * 5)); // "in 5 minutes"
 * relativeTime(new Date(Date.now() - 1_000), { numeric: "auto" }); // "Just now"
 * relativeTime(new Date(Date.now() - 1_000 * 60), { style: "short" }); // "1 min. ago"
 *
 * @remarks Accepts a `Date` or ISO 8601 string. Returns relative output within 24
 * hours. With `numeric: "auto"`, values within 10 seconds return `"Just now"`.
 * Throws a `TypeError` for invalid date input.
 *
 * @param value - A `Date` object or ISO 8601 string.
 * @param relativeOptions - Relative time formatting options.
 * @param dateOptions - `Intl.DateTimeFormat` options for the date fallback.
 * @returns The formatted relative time string or date string.
 */
export function relativeTime(
  value: Date | string,
  relativeOptions: RelativeOptions = { numeric: "always", style: "long" },
  dateOptions: Intl.DateTimeFormatOptions = DEFAULT_FORMAT,
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

  if (relativeOptions.numeric === "auto" && absDiff < TEN_SECONDS) {
    return "Just now";
  }

  if (absDiff < ONE_DAY) {
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
