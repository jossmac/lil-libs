import { describe, expect, expectTypeOf, it } from "vitest";

import {
  hasKey,
  isPlainObject,
  populatedKeys,
  typedEntries,
  typedKeys,
  typedFromEntries,
} from "./object";

describe("lil-libs/object", () => {
  describe("isPlainObject", () => {
    it("should return true for plain objects", () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ foo: "bar" })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
    });

    it("should return false for non-plain values", () => {
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class Example {}

      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(new Map())).toBe(false);
      expect(isPlainObject(new Set())).toBe(false);
      expect(isPlainObject(/test/)).toBe(false);
      expect(isPlainObject(new Example())).toBe(false);
    });
  });

  describe("hasKey", () => {
    it("should return true for own properties", () => {
      const symbolKey = Symbol("symbolKey");
      const obj = { foo: 1, 2: "two", [symbolKey]: true };

      expect(hasKey(obj, "foo")).toBe(true);
      expect(hasKey(obj, 2)).toBe(true);
      expect(hasKey(obj, symbolKey)).toBe(true);
    });

    it("should return true for own properties of null-prototype objects", () => {
      const obj: Record<string, unknown> = Object.create(null);
      obj.foo = 1;

      expect(hasKey(obj, "foo")).toBe(true);
    });

    it("should return false for absent keys", () => {
      expect(hasKey({}, "foo")).toBe(false);
      expect(hasKey({ foo: 1 }, "bar")).toBe(false);
      expect(hasKey({ foo: 1 }, Symbol("bar"))).toBe(false);
    });

    it("should return false for inherited properties", () => {
      class Example {
        method() {}
      }

      expect(hasKey({}, "toString")).toBe(false);
      expect(hasKey(new Example(), "method")).toBe(false);
    });

    it("should return true for own properties explicitly set to undefined", () => {
      expect(hasKey({ foo: undefined }, "foo")).toBe(true);
    });

    it("should match `Object.hasOwn` runtime behavior exactly", () => {
      const obj = { foo: 1, bar: "hello", baz: true };

      for (const key of ["foo", "bar", "baz", "qux", "toString"]) {
        expect(hasKey(obj, key)).toBe(Object.hasOwn(obj, key));
      }
    });

    it("should narrow an unknown key to a key of the object", () => {
      const obj = { foo: 1, bar: "hello" };
      const key = "foo" as string;

      if (hasKey(obj, key)) {
        expectTypeOf(key).toEqualTypeOf<"foo" | "bar">();
        expectTypeOf(obj[key]).toEqualTypeOf<number | string>();
      }
    });
  });

  describe("typedKeys", () => {
    it("should match `Object.keys` runtime behavior exactly", () => {
      const obj = { foo: 1, bar: "hello", baz: true };
      expect(typedKeys(obj)).toEqual(Object.keys(obj));
    });

    it("should preserves specific key literal types", () => {
      const obj = { foo: 1, bar: "hello", baz: true };
      expectTypeOf(typedKeys(obj)).toEqualTypeOf<
        Array<"foo" | "bar" | "baz">
      >();
    });
  });

  describe("populatedKeys", () => {
    it("should match `Object.keys` runtime behavior exactly", () => {
      const obj = { foo: 1, bar: "hello", baz: true };
      expect(populatedKeys(obj)).toEqual(Object.keys(obj));
    });

    it("should preserve specific key literal types as a non-empty tuple", () => {
      const obj = { foo: 1, bar: "hello", baz: true };
      expectTypeOf(populatedKeys(obj)).toEqualTypeOf<
        ["foo" | "bar" | "baz", ...("foo" | "bar" | "baz")[]]
      >();
    });

    it("should allow safe access to the first key", () => {
      const keys = populatedKeys({ foo: 1 });
      expectTypeOf(keys[0]).toEqualTypeOf<"foo">();
    });

    it("should throw an error if the object has no keys", () => {
      expect(() => populatedKeys({})).toThrow("Object has no keys.");
    });
  });

  describe("typedEntries", () => {
    it("should match `Object.entries` runtime behavior exactly", () => {
      const obj = { foo: 1, bar: "hello", baz: true };
      expect(typedEntries(obj)).toEqual(Object.entries(obj));
    });

    it("should preserves specific key literal types", () => {
      const obj = { foo: 1, bar: "hello", baz: true };

      expectTypeOf(typedEntries(obj)).toEqualTypeOf<
        Array<["foo", number] | ["bar", string] | ["baz", boolean]>
      >();
    });

    it("should simplify the return type when value types match", () => {
      const obj = { foo: 1, bar: 2, baz: 3 };

      expectTypeOf(typedEntries(obj)).branded.toEqualTypeOf<
        Array<["foo" | "bar" | "baz", number]>
      >();
    });
  });

  describe("typedFromEntries", () => {
    it("should match `Object.fromEntries` runtime behavior exactly", () => {
      const entries = [
        ["foo", 1],
        ["bar", "hello"],
        ["baz", true],
      ] as const;

      expect(typedFromEntries(entries)).toEqual(Object.fromEntries(entries));
    });

    it("should preserve specific object shape types", () => {
      expectTypeOf(
        typedFromEntries([
          ["foo", 1],
          ["bar", "hello"],
          ["baz", true],
        ]),
      ).toEqualTypeOf<{
        foo: number;
        bar: string;
        baz: boolean;
      }>();
    });
  });
});
