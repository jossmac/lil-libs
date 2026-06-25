import { describe, expect, it } from "vitest";

import {
  ensureError,
  isError,
  isErrorLike,
  parseError,
  UNKNOWN_ERROR_MESSAGE,
} from "./error";

describe("lil-libs/error", () => {
  describe("isError", () => {
    it("should return true for native Error instances", () => {
      expect(isError(new Error("Test"))).toBe(true);
    });
    it("should return false for non-Error values", () => {
      [null, undefined, 42, "error", {}].forEach((value) =>
        expect(isError(value)).toBe(false),
      );
    });
  });

  describe("ensureError", () => {
    it("should return the same error instance when given an Error", () => {
      const err = new Error("keep me");
      expect(ensureError(err)).toBe(err);
    });
    it("should wrap strings into Error with same message", () => {
      const wrapped = ensureError("stringy");
      expect(wrapped).toBeInstanceOf(Error);
      expect(wrapped.message).toBe("stringy");
    });
    it("should coerce empty string into a generic error message", () => {
      const wrapped = ensureError("");
      expect(wrapped).toBeInstanceOf(Error);
      expect(wrapped.message).toBe(UNKNOWN_ERROR_MESSAGE);
    });
    it.each([
      ["object", { test: "value" }],
      ["number", 42],
      ["array", [1, 2, 3]],
      ["set", new Set()],
      ["undefined", undefined],
      ["null", null],
    ])(`should coerce %s into a JSON representation`, (_desc, value) => {
      const wrapped = ensureError(value);
      expect(wrapped).toBeInstanceOf(Error);
      expect(wrapped.message).toBe(`Error: ${JSON.stringify(value)}`);
    });
    it("should fallback to string if JSON.stringify fails", () => {
      const bigInt = BigInt(1);
      const wrapped = ensureError(bigInt);
      expect(wrapped).toBeInstanceOf(Error);
      expect(wrapped.message).toBe(`Error: ${String(bigInt)}`);
    });

    it("should preserve name and stack for error-like objects", () => {
      const wrapped = ensureError({
        message: "boom",
        name: "CustomError",
        stack: "custom-stack",
      });

      expect(wrapped).toBeInstanceOf(Error);
      expect(wrapped.message).toBe("boom");
      expect(wrapped.name).toBe("CustomError");
      expect(wrapped.stack).toBe("custom-stack");
    });

    it("should ignore non-string name and stack on error-like objects", () => {
      const wrapped = ensureError({
        message: "boom",
        name: 123,
        stack: { frame: 1 },
      });

      expect(wrapped).toBeInstanceOf(Error);
      expect(wrapped.message).toBe("boom");
      expect(wrapped.name).toBe("Error");
      expect(wrapped.stack).toContain("Error: boom");
    });
  });

  describe("isErrorLike", () => {
    it("should return true for an object with a string message", () => {
      expect(isErrorLike({ message: "Something went wrong" })).toBe(true);
      expect(isErrorLike(new Error("Boom"))).toBe(true);
    });
    it("should return false for non-objects or missing/non-string message", () => {
      [null, undefined, 42, "message", { message: 123 }].forEach((value) =>
        expect(isErrorLike(value)).toBe(false),
      );
    });
  });

  describe("parseError", () => {
    it("should handle `Error` objects", () => {
      const error = new Error("Test error message");
      expect(parseError(error)).toBe("Test error message");
    });
    it("should handle strings", () => {
      expect(parseError("Error string")).toBe("Error string");
    });
    it("should handle error-like objects with a message", () => {
      expect(parseError({ message: "from object" })).toBe("from object");
    });
    it("should ignore objects with non-string message", () => {
      expect(parseError({ message: 123 })).toBe(UNKNOWN_ERROR_MESSAGE);
    });
    it("should return a generic error message for anything else", () => {
      expect(parseError(null)).toBe(UNKNOWN_ERROR_MESSAGE);
      expect(parseError(undefined)).toBe(UNKNOWN_ERROR_MESSAGE);
      expect(parseError(["a", "b"])).toBe(UNKNOWN_ERROR_MESSAGE);
      expect(parseError({ a: 1 })).toBe(UNKNOWN_ERROR_MESSAGE);
    });
  });
});
