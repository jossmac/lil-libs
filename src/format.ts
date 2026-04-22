import { isFiniteNumber } from "./number";

type InitialsOptions = {
  /**
   * The maximum number of letters to return.
   * @default 2
   */
  maxLetters?: number;
  /**
   * The locale to use for the initials.
   * @default undefined (system locale)
   */
  locale?: string;
};

/**
 * Returns the appropriate initials for a name.
 *
 * @example
 * formatInitials('John') // "JO"
 * formatInitials('John Doe') // "JD"
 * formatInitials('John Ronald Reuel Tolkien') // "JT"
 * formatInitials('John Ronald Reuel Tolkien', { maxLetters: 3 }) // "JRR"
 */
export function formatInitials(name: string, options: InitialsOptions = {}) {
  const { maxLetters = 2, locale } = options;

  if (!isFiniteNumber(maxLetters) || maxLetters < 1) {
    throw new TypeError(
      "maxLetters must be a finite number greater than or equal to 1.",
    );
  }

  name = name.trim();

  if (!name) return "?";

  const cleaned = name.replace(/\s+/gu, " ");
  const words = cleaned.split(/\s+/u).filter(Boolean);

  const segmenter =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter(locale, { granularity: "grapheme" })
      : null;

  const getGraphemes = (value: string): string[] => {
    if (!segmenter) return Array.from(value); // fallback
    return Array.from(segmenter.segment(value), (s) => s.segment);
  };

  const toUpper = (value: string) =>
    locale ? value.toLocaleUpperCase(locale) : value.toUpperCase();

  // single word: grab the first N letters
  // "John" -> "JO"
  if (words.length === 1) {
    const graphemes = getGraphemes(words[0] ?? "");
    return toUpper(graphemes.slice(0, maxLetters).join(""));
  }

  // max 2: use first and last words
  // "John Henry Doe" -> "JD"
  if (maxLetters === 2) {
    const first = getGraphemes(words[0] ?? "")[0] ?? "";
    const last = getGraphemes(words[words.length - 1] ?? "")[0] ?? "";
    return toUpper((first + last).slice(0, maxLetters));
  }

  // max 3+: first letter of each word, from first to last
  // "John Henry Doe" -> "JHD"
  return Array.from({ length: maxLetters })
    .map((_, index) => {
      const graphemes = getGraphemes(words[index] ?? "");
      return toUpper(graphemes[0] ?? "");
    })
    .join("");
}

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
