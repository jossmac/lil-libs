import { assertType, describe, test, expect } from "vitest";

import { assert, assertNever, ensure } from "./assert";

type EnumType = "A" | "B" | "C";

describe("lil-libs/assert", () => {
  describe("assert", () => {
    test("does not throw for true and common truthy values", () => {
      expect(() => assert(true)).not.toThrow();
      expect(() => assert(1)).not.toThrow();
      expect(() => assert("hello")).not.toThrow();
    });

    test("does not throw for 0 or empty string", () => {
      expect(() => assert(0)).not.toThrow();
      expect(() => assert("")).not.toThrow();
    });

    test("throws for false, null, and undefined", () => {
      expect(() => assert(false)).toThrowError("Assertion failed");
      expect(() => assert(null)).toThrowError("Assertion failed");
      expect(() => assert(undefined)).toThrowError("Assertion failed");
    });

    test("uses custom error message when provided", () => {
      expect(() => assert(false, "Bad boolean")).toThrowError("Bad boolean");
      expect(() => assert(undefined, "Missing value")).toThrowError(
        "Missing value",
      );
    });

    test("narrows nullable values", () => {
      const value = "ok" as string | undefined;
      assert(value);
      assertType<string>(value);
    });

    test("narrows booleans to true", () => {
      const value = true as boolean;
      assert(value);
      assertType<true>(value);
    });
  });

  describe("ensure", () => {
    test("returns the same value when assertion passes", () => {
      const input = { id: 1, label: "item" };
      expect(ensure(input)).toBe(input);
      expect(ensure(0)).toBe(0);
      expect(ensure("")).toBe("");
    });

    test("throws for false, null, and undefined", () => {
      expect(() => ensure(false)).toThrowError("Assertion failed");
      expect(() => ensure(null)).toThrowError("Assertion failed");
      expect(() => ensure(undefined)).toThrowError("Assertion failed");
    });

    test("uses custom message when assertion fails", () => {
      expect(() => ensure(null, "Value required")).toThrowError(
        "Value required",
      );
    });

    test("returns a non-nullable type", () => {
      const maybeValue = "ok" as string | null | undefined;
      const value = ensure(maybeValue);
      assertType<string>(value);
    });

    test("removes false from unions", () => {
      const maybeCount = 1 as number | false | undefined;
      const count = ensure(maybeCount);
      assertType<number>(count);
    });
  });

  describe("assertNever", () => {
    test("correct code", () => {
      const value = "A" as EnumType;
      switch (value) {
        case "A":
        case "B":
        case "C":
          break;
        default:
          assertNever(value);
      }
    });

    test("incorrect code", () => {
      const value = "C" as EnumType;

      expect(() => {
        switch (value) {
          case "A":
          case "B":
            break;
          default:
            // @ts-expect-error Argument of type '"C"' is not assignable to parameter of type 'never'
            assertNever(value);
        }
      }).toThrowError('Expected never to be called, but received: "C"');
    });
  });
});
