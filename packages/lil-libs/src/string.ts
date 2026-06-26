/**
 * String utilities: guards, encoding, formatting, and case conversion.
 *
 * @module
 */

import { isFiniteNumber } from "./number";

/**
 * Type guard for string values.
 *
 * @example
 * isString("hello"); // true
 * isString(123); // false
 *
 * @param value - Unknown value to test.
 * @returns `true` when `value` is a string.
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Check if a string contains another string, ignoring diacritic marks and case.
 *
 * Uses `Intl.Collator` for accent-insensitive, case-insensitive matching. Returns
 * `true` for an empty substring.
 *
 * @example
 * contains("café", "cafe"); // true
 * contains("Hello World", "world"); // true
 * contains("hello", ""); // true
 * contains("hello", "bye"); // false
 *
 * @param string - Haystack to search within (normalized to NFC before comparison).
 * @param substring - Needle to find; empty string always matches.
 * @param locale - Locale for accent- and case-insensitive matching via `Intl.Collator`. Defaults to `"en"`.
 * @returns `true` when `substring` appears in `string` per collator rules; `false` otherwise.
 */
export function contains(string: string, substring: string, locale = "en") {
  // normalize both strings to NFC for consistent comparison
  const normalizedA = string.normalize("NFC");
  const normalizedB = substring.normalize("NFC");

  // fast paths (order important)
  if (normalizedB.length === 0) {
    return true;
  }
  if (normalizedA === normalizedB) {
    return true;
  }

  const collator = new Intl.Collator(locale, {
    sensitivity: "base", // ignore case and accents
    usage: "search", // optimize for substring search
  });

  // check substrings using the collator
  for (let i = 0; i <= normalizedA.length - normalizedB.length; i++) {
    const segment = normalizedA.slice(i, i + normalizedB.length);
    if (collator.compare(segment, normalizedB) === 0) {
      return true;
    }
  }

  return false;
}

/**
 * Returns the count and appropriate plural or singular form of a term.
 *
 * @example
 * pluralize(0, 'wallet'); // '0 wallets'
 * pluralize(1, 'wallet'); // '1 wallet'
 * pluralize(2, 'wallet'); // '2 wallets'
 * pluralize(1, ['person', 'people']); // '1 person'
 * pluralize(2, ['person', 'people']); // '2 people'
 * pluralize(1, ['person', 'people'], false); // 'person'
 * pluralize(2, ['person', 'people'], false); // 'people'
 *
 * @param count - Quantity used to pick singular (`1`) vs plural (any other number, including `0`).
 * @param terms - Singular string, or `[singular, plural]` tuple; bare strings get a simple English plural (`wallet` → `wallets`).
 * @param includeCount - When `true` (default), prefixes the result with `"${count} "`; when `false`, returns the word alone.
 * @returns The chosen singular or plural term, optionally prefixed with the count.
 */
export function pluralize(
  count: number,
  terms: string | [singular: string, plural: string],
  includeCount = true,
) {
  const [singular, plural] = Array.isArray(terms)
    ? terms
    : commonEnglishPlural(terms);
  const term = count === 1 ? singular : plural;

  if (includeCount) {
    return `${count} ${term}`;
  }

  return term;
}

/**
 * Don't make consumers provide both terms for common English plural cases,
 * e.g. wallet → wallets, address → addresses
 */
function commonEnglishPlural(term: string): [singular: string, plural: string] {
  if (term.endsWith("s")) {
    return [term, `${term}es`];
  }

  return [term, `${term}s`];
}

/**
 * Encodes a string to base64, optionally creating a data URI.
 *
 * Supports Unicode input. Optimises SVG payload whitespace when `mimeType` is
 * `"image/svg+xml"`.
 *
 * @example
 * base64Encode("hello");
 * // "aGVsbG8="
 *
 * base64Encode("hello", "text/plain");
 * // "data:text/plain;base64,aGVsbG8="
 *
 * @param value - UTF-8 string to encode.
 * @param mimeType - When provided, wraps the payload in a `data:${mimeType};base64,...` URI; SVG payloads are whitespace-minified first.
 * @returns Raw base64 text, or a data URI when `mimeType` is set.
 */
export function base64Encode(value: string): string;
export function base64Encode<M extends MimeType>(
  value: string,
  mimeType: M,
): `data:${M};base64,${string}`;
export function base64Encode(value: string, mimeType?: MimeType) {
  let content = value;

  if (mimeType) {
    // minor optimisation for SVG data URIs
    if (mimeType === "image/svg+xml") {
      content = reduceSvgWhitespace(value);
    }

    return `data:${mimeType};base64,${utf8ToBase64(content)}`;
  }

  return utf8ToBase64(content);
}

/**
 * Removes unnecessary whitespace from SVG strings to reduce data URI size
 * before encoding.
 */
function reduceSvgWhitespace(value: string): string {
  return value
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/>\s</g, "><") // Remove space between tags
    .trim();
}

/**
 * Encodes a UTF-8 string to base64.
 *
 * Uses the fastest available method:
 * 1. `Buffer` (Node.js)
 * 2. `Uint8Array.toBase64` (modern browsers)
 * 3. `TextEncoder` + `btoa` (legacy fallback)
 *
 * @param value - UTF-8 string to encode.
 * @returns Base64 representation; `""` when `value` is empty. Uses `Buffer`, `Uint8Array.toBase64`, or `btoa` in that order.
 */
function utf8ToBase64(value: string): string {
  if (value.length === 0) return "";

  type NodeBufferLike = {
    from: (
      input: string,
      encoding: string,
    ) => {
      toString: (encoding: string) => string;
    };
  };

  // access `Buffer` dynamically to avoid static analysis detection by bundlers
  // like Vite/Rollup which would otherwise try to polyfill it
  const NodeJsBuffer = (globalThis as Record<string, unknown>)["Buffer"] as
    | NodeBufferLike
    | undefined;
  if (NodeJsBuffer) {
    return NodeJsBuffer.from(value, "utf8").toString("base64");
  }

  const bytes = new TextEncoder().encode(value);

  // modern browsers
  if ("toBase64" in bytes) {
    return (bytes as Uint8Array & { toBase64: () => string }).toBase64();
  }

  // legacy fallback
  let binary = "";
  for (const b of Array.from<number>(bytes)) {
    binary += String.fromCharCode(b);
  }

  return btoa(binary);
}

// prettier-ignore
type KnownMimeType = 'text/plain' | 'image/svg+xml' | 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' | 'image/avif';
type MimeType = KnownMimeType | (string & {});

/** Options for {@link formatInitials}. */
export type InitialsOptions = {
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
 * Returns initials for names with Unicode-aware grapheme support.
 *
 * Defaults to `maxLetters = 2`. Returns `"?"` for empty or whitespace-only input.
 * Throws when `maxLetters` is not finite or is less than `1`.
 *
 * @example
 * formatInitials("John Doe"); // "JD"
 * formatInitials("John Henry Doe"); // "JD"
 * formatInitials("John Henry Doe", { maxLetters: 3 }); // "JHD"
 * formatInitials("John Ronald Reuel Tolkien"); // "JT"
 * formatInitials("John Ronald Reuel Tolkien", { maxLetters: 3 }); // "JRR"
 * formatInitials("Élodie Durand"); // "ÉD"
 * formatInitials("ilker", { locale: "tr" }); // "İL"
 * formatInitials("李小龍"); // "李小"
 *
 * @param name - Full name or phrase to abbreviate; punctuation is stripped and whitespace collapsed.
 * @param options - `maxLetters` (default `2`) and optional `locale` for grapheme segmentation and casing.
 * @returns Uppercased initials via `Intl.Segmenter` when available; `"?"` for empty input after cleaning.
 * @throws When `maxLetters` is not finite or is less than `1`.
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

  const cleaned = alphanumeric(name);

  if (!cleaned) return "?";

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

/**
 * @private
 * Normalizes a string to letters, numbers, and spaces only.
 *
 * - Keeps all Unicode letters (`\p{L}`) and numbers (`\p{N}`)
 * - Replaces punctuation/symbol runs with a single space
 * - Collapses repeated whitespace and trims leading/trailing space
 */
function alphanumeric(value: string) {
  return value
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

/**
 * Options for case conversion functions.
 */
export type CaseOptions = {
  /**
   * The locale to use for character case conversions.
   * @default undefined (system locale)
   */
  locale?: string;
};

/**
 * @private
 * Splits a string into words based on case transitions, whitespace, and punctuation.
 */
function splitWords(value: string): string[] {
  const WORD_REGEX = /\p{Lu}+(?=\p{Lu}\p{Ll})|\p{Lu}?\p{Ll}+|\p{Lu}+|\p{N}+/gu;
  return value.match(WORD_REGEX) || [];
}

/**
 * Converts a string to camelCase.
 *
 * @example
 * camelCase('Foo Bar'); // 'fooBar'
 * camelCase('--foo-bar--'); // 'fooBar'
 * camelCase('HTMLParser'); // 'htmlParser'
 *
 * @param value - Input split on case transitions, whitespace, and punctuation.
 * @param options - Optional `locale` for case mapping (defaults to system locale).
 * @returns Words joined in camelCase (`fooBar`); `""` when no words are detected.
 */
export function camelCase(value: string, options: CaseOptions = {}): string {
  const { locale } = options;
  const words = splitWords(value);
  if (words.length === 0) return "";

  return words
    .map((word, index) => {
      const chars = Array.from(word);
      if (index === 0) {
        return word.toLocaleLowerCase(locale);
      }
      const firstLetter = (chars[0] ?? "").toLocaleUpperCase(locale);
      const rest = chars.slice(1).join("").toLocaleLowerCase(locale);
      return firstLetter + rest;
    })
    .join("");
}

/**
 * Converts a string to kebab-case.
 *
 * @example
 * kebabCase('Foo Bar'); // 'foo-bar'
 * kebabCase('fooBar'); // 'foo-bar'
 * kebabCase('HTMLParser'); // 'html-parser'
 *
 * @param value - Input split on case transitions, whitespace, and punctuation.
 * @param options - Optional `locale` for case mapping (defaults to system locale).
 * @returns Words joined with `-` in lowercase kebab-case; `""` when no words are detected.
 */
export function kebabCase(value: string, options: CaseOptions = {}): string {
  const { locale } = options;
  return splitWords(value)
    .map((word) => word.toLocaleLowerCase(locale))
    .join("-");
}

/**
 * Converts a string to PascalCase.
 *
 * @example
 * pascalCase('Foo Bar'); // 'FooBar'
 * pascalCase('foo-bar'); // 'FooBar'
 * pascalCase('HTMLParser'); // 'HtmlParser'
 *
 * @param value - Input split on case transitions, whitespace, and punctuation.
 * @param options - Optional `locale` for case mapping (defaults to system locale).
 * @returns Words concatenated in PascalCase (`FooBar`); `""` when no words are detected.
 */
export function pascalCase(value: string, options: CaseOptions = {}): string {
  const { locale } = options;
  return splitWords(value)
    .map((word) => {
      const chars = Array.from(word);
      const firstLetter = (chars[0] ?? "").toLocaleUpperCase(locale);
      const rest = chars.slice(1).join("").toLocaleLowerCase(locale);
      return firstLetter + rest;
    })
    .join("");
}

/**
 * Converts a string to sentence case.
 *
 * @example
 * sentenceCase('Foo Bar'); // 'Foo bar'
 * sentenceCase('fooBar'); // 'Foo bar'
 * sentenceCase('HTMLParser'); // 'Html parser'
 *
 * @param value - Input split on case transitions, whitespace, and punctuation.
 * @param options - Optional `locale` for case mapping (defaults to system locale).
 * @returns First word capitalized, remaining words lowercased, space-separated; `""` when no words are detected.
 */
export function sentenceCase(value: string, options: CaseOptions = {}): string {
  const { locale } = options;
  const words = splitWords(value);
  if (words.length === 0) return "";

  return words
    .map((word, index) => {
      const chars = Array.from(word);
      if (index === 0) {
        const firstLetter = (chars[0] ?? "").toLocaleUpperCase(locale);
        const rest = chars.slice(1).join("").toLocaleLowerCase(locale);
        return firstLetter + rest;
      }
      return word.toLocaleLowerCase(locale);
    })
    .join(" ");
}

/**
 * Converts a string to snake_case.
 *
 * @example
 * snakeCase('Foo Bar'); // 'foo_bar'
 * snakeCase('foo-bar'); // 'foo_bar'
 * snakeCase('HTMLParser'); // 'html_parser'
 *
 * @param value - Input split on case transitions, whitespace, and punctuation.
 * @param options - Optional `locale` for case mapping (defaults to system locale).
 * @returns Words joined with `_` in lowercase snake_case; `""` when no words are detected.
 */
export function snakeCase(value: string, options: CaseOptions = {}): string {
  const { locale } = options;
  return splitWords(value)
    .map((word) => word.toLocaleLowerCase(locale))
    .join("_");
}

const MINOR_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "nor",
  "as",
  "at",
  "by",
  "for",
  "in",
  "of",
  "on",
  "per",
  "to",
  "vs",
  "with",
]);

/**
 * Converts a string to Title Case, capitalizing all major words
 * but keeping articles, prepositions, and conjunctions in lowercase
 * unless they are the first or last word.
 *
 * @example
 * titleCase('a comparison of cases'); // 'A Comparison of Cases'
 * titleCase('the wind in the willows'); // 'The Wind in the Willows'
 *
 * @param value - Input split on case transitions, whitespace, and punctuation.
 * @param options - Optional `locale` for case mapping (defaults to system locale).
 * @returns Title-cased phrase; articles, prepositions, and conjunctions stay lowercase except as the first or last word.
 */
export function titleCase(value: string, options: CaseOptions = {}): string {
  const { locale } = options;
  const words = splitWords(value);
  const length = words.length;
  if (length === 0) return "";

  return words
    .map((word, index) => {
      const lower = word.toLocaleLowerCase(locale);
      const isFirst = index === 0;
      const isLast = index === length - 1;

      if (!isFirst && !isLast && MINOR_WORDS.has(lower)) {
        return lower;
      }

      const chars = Array.from(word);
      const firstLetter = (chars[0] ?? "").toLocaleUpperCase(locale);
      const rest = chars.slice(1).join("").toLocaleLowerCase(locale);
      return firstLetter + rest;
    })
    .join(" ");
}
