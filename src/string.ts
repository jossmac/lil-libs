/**
 * Guard to check if a value is a string.
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Check if a string contains another string, ignoring diacritic marks and case.
 *
 * @example
 * contains('hello world', 'hëlló'); // true
 * contains('hello world', 'WORLD'); // true
 * contains('hello world', 'foo'); // false
 *
 * @param string - The string to search in.
 * @param substring - The substring to search for.
 * @param locale - The locale to use for the comparison. Defaults to `'en'`.
 * @returns `true` if the string contains the substring, `false` otherwise.
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
 * @param count - The number of items.
 * @param terms - The singular, and optionally plural, forms of the term.
 * @param includeCount - Whether to include the count in the result. Defaults to `true`.
 * @returns The appropriate plural or singular form of the given term(s), prefixed with the count if `includeCount` is true.
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
 * @example
 * base64Encode('Hello')                   // 'SGVsbG8='
 * base64Encode('Hello', 'text/plain')     // 'data:text/plain;base64,SGVsbG8='
 * base64Encode('Hello', 'image/svg+xml')  // 'data:image/svg+xml;base64,SGVsbG8='
 *
 * @note When a `mimeType` of `'image/svg+xml'` is provided, unnecessary whitespace will automatically be removed.
 *
 * @param value - The string to encode.
 * @param mimeType - Optionally provide a MIME type to create a data URI.
 * @returns The base64 encoded string, or a data URI if `mimeType` is provided.
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
 * @param value - The string to encode.
 * @returns The base64 encoded string.
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
