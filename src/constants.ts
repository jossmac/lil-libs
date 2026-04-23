/** Common unicode characters used to compose UI text content. */
export const UNICODE_CHARS = {
  /** A narrow form of a no-break space, typically the width of a thin or mid space. */
  narrowNoBreakSpace: "\u202F",
  /** A space character that prevents an automatic line break at its position. */
  noBreakSpace: "\u00A0",
  /** A non-breaking form of the zero-width space. */
  wordJoiner: "\u2060",
  /** Intended for invisible word separation and for line-break control; it has no width. */
  zeroWidthSpace: "\u200B",
} as const;
