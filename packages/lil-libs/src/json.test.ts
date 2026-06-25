import { describe, expect, it } from "vitest";

import { stringifyWithSortedKeys, stringifyWithBigIntAsString } from "./json";

describe("lil-libs/json", () => {
  describe("stringifyWithBigIntAsString", () => {
    it("should convert BigInt values to strings", () => {
      const bigInt = BigInt(123);
      const result = stringifyWithBigIntAsString({ bigInt });
      expect(result).toBe('{"bigInt":"123"}');
    });
    it("should preserve other values as-is", () => {
      const result = stringifyWithBigIntAsString({ foo: "bar" });
      expect(result).toBe('{"foo":"bar"}');
    });

    it("should return undefined for top-level non-serializable values", () => {
      expect(stringifyWithBigIntAsString(undefined)).toBeUndefined();
      expect(stringifyWithBigIntAsString(() => "x")).toBeUndefined();
      expect(stringifyWithBigIntAsString(Symbol("x"))).toBeUndefined();
    });
  });

  describe("stringifyWithSortedKeys", () => {
    it("should sort top-level keys alphabetically", () => {
      expect(stringifyWithSortedKeys({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    });

    it("should sort nested object keys", () => {
      const result = stringifyWithSortedKeys({ z: { b: 2, a: 1 }, a: 1 });
      expect(result).toBe('{"a":1,"z":{"a":1,"b":2}}');
    });

    it("should produce identical output regardless of key insertion order", () => {
      const obj1 = { name: "alice", age: 30, city: "nyc" };
      const obj2 = { city: "nyc", name: "alice", age: 30 };
      expect(stringifyWithSortedKeys(obj1)).toBe(stringifyWithSortedKeys(obj2));
    });

    it("should preserve array element order", () => {
      expect(stringifyWithSortedKeys([3, 1, 2])).toBe("[3,1,2]");
    });

    it("should sort keys inside array elements", () => {
      const result = stringifyWithSortedKeys([{ b: 2, a: 1 }]);
      expect(result).toBe('[{"a":1,"b":2}]');
    });

    it("should handle primitives", () => {
      expect(stringifyWithSortedKeys("hello")).toBe('"hello"');
      expect(stringifyWithSortedKeys(42)).toBe("42");
      expect(stringifyWithSortedKeys(true)).toBe("true");
      expect(stringifyWithSortedKeys(null)).toBe("null");
    });

    it("should handle undefined values in objects (omitted by JSON.stringify)", () => {
      expect(stringifyWithSortedKeys({ a: undefined })).toBe("{}");
    });

    it("should omit function and symbol values in objects", () => {
      expect(
        stringifyWithSortedKeys({ a: () => "x", b: Symbol("x"), c: 1 }),
      ).toBe('{"c":1}');
    });

    it("should serialize undefined, functions and symbols as null in arrays", () => {
      expect(stringifyWithSortedKeys([undefined, () => "x", Symbol("x")])).toBe(
        "[null,null,null]",
      );
    });

    it("should honor toJSON behavior (e.g. Date)", () => {
      const value = { d: new Date("2020-01-01T00:00:00.000Z") };
      expect(stringifyWithSortedKeys(value)).toBe(
        '{"d":"2020-01-01T00:00:00.000Z"}',
      );
    });

    it("should return undefined for top-level non-serializable values", () => {
      expect(stringifyWithSortedKeys(undefined)).toBeUndefined();
      expect(stringifyWithSortedKeys(() => "x")).toBeUndefined();
      expect(stringifyWithSortedKeys(Symbol("x"))).toBeUndefined();
    });

    it("should handle empty objects and arrays", () => {
      expect(stringifyWithSortedKeys({})).toBe("{}");
      expect(stringifyWithSortedKeys([])).toBe("[]");
    });

    it("should handle deeply nested structures", () => {
      const obj = { c: { b: { a: 1 } } };
      expect(stringifyWithSortedKeys(obj)).toBe('{"c":{"b":{"a":1}}}');
    });
  });
});
