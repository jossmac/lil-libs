/**
 * Shared constants for UI and text composition.
 *
 * @module
 */

/**
 * Common unicode characters used to compose UI text content. Use when you need
 * explicit control over spacing and line-break behavior in UI copy.
 *
 * @example
 * `${10}${UNICODE_CHARS.narrowNoBreakSpace}kg`; // "10 kg"
 * `Page${UNICODE_CHARS.noBreakSpace}1`; // stays on one line
 * `USD${UNICODE_CHARS.wordJoiner}/${UNICODE_CHARS.wordJoiner}EUR`; // keeps the token together
 * `super${UNICODE_CHARS.zeroWidthSpace}long`; // invisible optional wrap point
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
   * A non-breaking form of the zero-width space. Use when you must prevent a
   * line break between characters without introducing any visible spacing.
   *
   * @see https://unicode-explorer.com/c/2060
   */
  wordJoiner: "\u2060",
  /**
   * Intended for invisible word separation and for line-break control; it has
   * no width. Use when you want to add optional wrap points in long unbroken
   * text without adding visible spaces.
   *
   * @see https://unicode-explorer.com/c/200B
   */
  zeroWidthSpace: "\u200B",
} as const;
