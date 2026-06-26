/**
 * Shared constants for UI and text composition.
 *
 * @module
 */

/**
 * Common Unicode characters for composing UI text with explicit control over
 * spacing and line-break behavior.
 *
 * @example
 * `${10}${UNICODE_CHARS.narrowNoBreakSpace}kg`; // tight number–unit spacing, no line break
 * `Page${UNICODE_CHARS.noBreakSpace}1`; // "Page 1" stays on one line
 * `USD${UNICODE_CHARS.wordJoiner}/${UNICODE_CHARS.wordJoiner}EUR`; // keeps "USD/EUR" together
 * `super${UNICODE_CHARS.zeroWidthSpace}long`; // optional wrap point, no visible space
 */
export const UNICODE_CHARS = {
  /**
   * A narrow form of a no-break space, typically the width of a thin or mid
   * space. Use when two tokens should stay together with tighter spacing than a
   * normal space (for example number-unit pairs or compact punctuation spacing).
   *
   * @see https://unicode-explorer.com/c/202F
   */
  narrowNoBreakSpace: "\u202F",
  /**
   * A space character that prevents an automatic line break at its position.
   * Use when two adjacent words or symbols must remain on the same line while
   * keeping normal space width.
   *
   * @see https://unicode-explorer.com/c/00A0
   */
  noBreakSpace: "\u00A0",
  /**
   * An invisible, zero-width character that prevents line breaks between adjacent
   * characters without adding visible spacing.
   *
   * @see https://unicode-explorer.com/c/2060
   */
  wordJoiner: "\u2060",
  /**
   * A zero-width character that marks an optional line-break opportunity without
   * adding visible spacing. Use to allow wrapping in long unbroken strings.
   *
   * @see https://unicode-explorer.com/c/200B
   */
  zeroWidthSpace: "\u200B",
} as const;
