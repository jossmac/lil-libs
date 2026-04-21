import { describe, expect, expectTypeOf, it } from "vitest";

import {
  isPlainObject,
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
