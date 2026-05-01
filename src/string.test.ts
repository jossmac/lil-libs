import { afterEach, describe, expect, expectTypeOf, it } from "vitest";

import { base64Encode, contains, formatInitials, pluralize } from "./string";

describe("lil-libs/string", () => {
  const originalBuffer = (globalThis as { Buffer?: unknown }).Buffer;
  const originalToBase64 = (Uint8Array.prototype as { toBase64?: unknown })
    .toBase64;

  afterEach(() => {
    (globalThis as { Buffer?: unknown }).Buffer = originalBuffer;

    if (originalToBase64 === undefined) {
      delete (Uint8Array.prototype as { toBase64?: unknown }).toBase64;
    } else {
      (Uint8Array.prototype as { toBase64?: unknown }).toBase64 =
        originalToBase64;
    }
  });
  describe("base64Encode", () => {
    it("encodes a UTF-8 string to base64", () => {
      expect(base64Encode("hello")).toBe("aGVsbG8=");
      expect("hello").toBe(atob("aGVsbG8="));
    });
    it("returns a data URI if a mime type is provided", () => {
      ["text/plain", "image/png", "image/svg+xml"].forEach((mimeType) => {
        expect(base64Encode("hello", mimeType)).toBe(
          `data:${mimeType};base64,aGVsbG8=`,
        );
      });
    });
    it("handles empty strings", () => {
      expect(() => base64Encode("")).not.toThrow();
      expect(base64Encode("")).toBe("");
    });
    it("handles long strings", () => {
      const longString = "foobar".repeat(100_000);
      expect(() => base64Encode(longString)).not.toThrow();
      expect(base64Encode(longString)).toBe(base64Encode(longString));
    });
    it("handles diacritic marks", () => {
      expect(base64Encode("café")).toBe("Y2Fmw6k=");
      expect(base64Encode("naïve")).toBe("bmHDr3Zl");
    });
    it("maintains the MIME type for TS type inference", () => {
      expectTypeOf(base64Encode("hello")).toEqualTypeOf<string>();
      expectTypeOf(
        base64Encode("hello", "text/plain"),
      ).toEqualTypeOf<`data:text/plain;base64,${string}`>();
      expectTypeOf(
        base64Encode("hello", "image/png"),
      ).toEqualTypeOf<`data:image/png;base64,${string}`>();
      expectTypeOf(
        base64Encode("hello", "video/mp4"),
      ).toEqualTypeOf<`data:video/mp4;base64,${string}`>();
    });

    it("reduces SVG whitespace when creating an SVG data URI", () => {
      const svg = `<svg>\n  <g>\n    <text>Hi</text>\n  </g>\n</svg>`;
      const encoded = base64Encode(svg, "image/svg+xml");
      expect(encoded).toContain("data:image/svg+xml;base64,");
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(atob(encoded.split(",")[1]!)).toBe(
        "<svg><g><text>Hi</text></g></svg>",
      );
    });

    it("uses Uint8Array.toBase64 when Buffer is unavailable", () => {
      (globalThis as { Buffer?: unknown }).Buffer = undefined;
      (Uint8Array.prototype as unknown as { toBase64: () => string }).toBase64 =
        function toBase64() {
          return "stubbed-base64";
        };

      expect(base64Encode("hello")).toBe("stubbed-base64");
    });

    it("falls back to btoa when Buffer and toBase64 are unavailable", () => {
      (globalThis as { Buffer?: unknown }).Buffer = undefined;
      delete (Uint8Array.prototype as { toBase64?: unknown }).toBase64;

      expect(base64Encode("hello")).toBe("aGVsbG8=");
    });
  });
  describe("contains", () => {
    it("returns true if the value contains the substring", () => {
      expect(contains("hello world", "world")).toBe(true);
      expect(contains("hello world", "hello")).toBe(true);
      expect(contains("hello world", "hello world")).toBe(true);
    });
    it("returns false if the value does not contain the substring", () => {
      expect(contains("hello world", "foo")).toBe(false);
      expect(contains("hello world", "bar")).toBe(false);
      expect(contains("hello world", "hello world foo")).toBe(false);
    });
    it("handles empty strings", () => {
      expect(contains("hello world", "")).toBe(true);
      expect(contains("", "hello")).toBe(false);
      expect(contains("", "")).toBe(true);
    });
    it("handles diacritic marks and case", () => {
      expect(contains("café", "café")).toBe(true);
      expect(contains("café", "cafe")).toBe(true);
      expect(contains("café", "CAFE")).toBe(true);
      expect(contains("café", "cafE")).toBe(true);
      expect(contains("café", "caffe")).toBe(false);
    });
  });
  describe("formatInitials", () => {
    it("should return the initials for a name", () => {
      expect(formatInitials("John Doe")).toBe("JD");
      expect(formatInitials("John Henry Doe")).toBe("JD");
      expect(formatInitials("John Ronald Reuel Tolkien")).toBe("JT");
    });

    it("supports custom max letters", () => {
      expect(formatInitials("John Doe", { maxLetters: 1 })).toBe("J");
      expect(formatInitials("John Henry Doe", { maxLetters: 4 })).toBe("JHD");
      expect(
        formatInitials("John Ronald Reuel Tolkien", { maxLetters: 3 }),
      ).toBe("JRR");
    });

    it("supports single word", () => {
      expect(formatInitials("Infinex")).toBe("IN");
      expect(formatInitials("Prince")).toBe("PR");
    });

    it('returns "?" for an empty string', () => {
      expect(formatInitials("")).toBe("?");
      expect(formatInitials(" ")).toBe("?");
      expect(formatInitials("   ")).toBe("?");
    });

    it("ignores punctuation and symbols", () => {
      expect(formatInitials("John (Admin) Doe")).toBe("JD");
      expect(formatInitials("John (Admin) Doe", { maxLetters: 3 })).toBe("JAD");
      expect(formatInitials("!!John!!")).toBe("JO");
      expect(formatInitials("!@#*")).toBe("?");
    });

    it("throws an error for invalid max letters", () => {
      expect(() => formatInitials("John Doe", { maxLetters: 0 })).toThrow(
        "maxLetters must be a finite number greater than or equal to 1.",
      );
      expect(() =>
        formatInitials("John Doe", { maxLetters: Number.NaN }),
      ).toThrow(
        "maxLetters must be a finite number greater than or equal to 1.",
      );
      expect(() =>
        formatInitials("John Doe", { maxLetters: Number.POSITIVE_INFINITY }),
      ).toThrow(
        "maxLetters must be a finite number greater than or equal to 1.",
      );
    });

    it("maintains diacritics", () => {
      expect(formatInitials("Élodie Durand")).toBe("ÉD");
    });

    it("supports logographic languages", () => {
      expect(formatInitials("李小龍")).toBe("李小");
      expect(formatInitials("宮崎 駿")).toBe("宮駿");
    });

    it("honours locale-aware uppercasing", () => {
      expect(formatInitials("ilker", { locale: "tr" })).toBe("İL");
      expect(formatInitials("ilker", { locale: "en" })).toBe("IL");
    });
  });
  describe("pluralize", () => {
    it("returns the common English plural forms for a single string term", () => {
      expect(pluralize(0, "wallet")).toBe("0 wallets");
      expect(pluralize(1, "wallet")).toBe("1 wallet");
      expect(pluralize(2, "wallet")).toBe("2 wallets");
      expect(pluralize(0, "address")).toBe("0 addresses");
      expect(pluralize(1, "address")).toBe("1 address");
      expect(pluralize(2, "address")).toBe("2 addresses");
    });
    it("supports a tuple, with singular and plural terms", () => {
      expect(pluralize(0, ["person", "people"])).toBe("0 people");
      expect(pluralize(1, ["person", "people"])).toBe("1 person");
      expect(pluralize(2, ["person", "people"])).toBe("2 people");
    });
    it("supports the includeCount option", () => {
      expect(pluralize(0, "wallet", false)).toBe("wallets");
      expect(pluralize(1, "wallet", false)).toBe("wallet");
      expect(pluralize(2, "wallet", false)).toBe("wallets");
      expect(pluralize(0, ["person", "people"], false)).toBe("people");
      expect(pluralize(1, ["person", "people"], false)).toBe("person");
      expect(pluralize(2, ["person", "people"], false)).toBe("people");
    });
  });
});
