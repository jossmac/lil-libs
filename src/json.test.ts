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
