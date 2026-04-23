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

type RelativeOptions = {
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
 * Formats a datetime value to a relative time string (e.g. "5 minutes ago") if
 * within 24 hours, otherwise returns a formatted date string.
 *
 * @param value - Accepts a Date object or ISO 8601 string (e.g. "2026-01-07T12:00:00Z").
 * @param relativeOptions - The relative time formatting options.
 * @param dateOptions - The date formatting options.
 *
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
