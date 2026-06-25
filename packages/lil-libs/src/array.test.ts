import { describe, expect, expectTypeOf, it } from "vitest";

import {
  chunk,
  createDeterministicKeySelector,
  isIterable,
  isLength,
  isPopulatedArray,
  partition,
  toArray,
} from "./array";

describe("lil-libs/array", () => {
  describe("chunk", () => {
    it("splits an array into chunks of the given size (evenly divisible)", () => {
      expect(chunk([1, 2, 3, 4], 2)).toEqual([
        [1, 2],
        [3, 4],
      ]);
      expect(chunk([1, 2, 3, 4, 5, 6], 3)).toEqual([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });
    it("puts the remainder in the last chunk when not evenly divisible", () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3, 4, 5], 3)).toEqual([
        [1, 2, 3],
        [4, 5],
      ]);
    });
    it("returns a single chunk when size is larger than the array", () => {
      expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
    });
    it("returns an empty array when given an empty array", () => {
      expect(chunk([], 2)).toEqual([]);
    });
    it("returns the correct type", () => {
      expectTypeOf(chunk([1, 2, 3], 2)).toEqualTypeOf<number[][]>();
      expectTypeOf(chunk(["a", "b", "c"], 2)).toEqualTypeOf<string[][]>();
    });
  });

  describe("partition", () => {
    it("splits items into truthy and falsy partitions", () => {
      expect(partition([1, 2, 3, 4, 5], (n) => n % 2 === 0)).toEqual([
        [2, 4],
        [1, 3, 5],
      ]);
      expect(partition(["a", "bb", "ccc"], (s) => s.length > 1)).toEqual([
        ["bb", "ccc"],
        ["a"],
      ]);
    });

    it("returns two empty arrays when input is empty", () => {
      expect(partition([], () => true)).toEqual([[], []]);
    });

    it("passes item, index, and array to predicate", () => {
      const input = [10, 20, 30];
      const calls: Array<[number, number, number[]]> = [];

      partition(input, (item, index, array) => {
        calls.push([item, index, array]);
        return index % 2 === 0;
      });

      expect(calls).toEqual([
        [10, 0, input],
        [20, 1, input],
        [30, 2, input],
      ]);
    });

    it("returns the correct type", () => {
      expectTypeOf(partition([1, 2, 3], (n) => n > 1)).toEqualTypeOf<
        [number[], number[]]
      >();
      expectTypeOf(partition(["a", "bb"], (s) => s.length > 1)).toEqualTypeOf<
        [string[], string[]]
      >();
    });
  });

  describe("isLength", () => {
    it("returns true for arrays matching the specified length", () => {
      expect(isLength([1, 2, 3], 3)).toBe(true);
      expect(isLength(["a", "b", "c"], 3)).toBe(true);
    });
    it("returns false for arrays not matching the specified length", () => {
      expect(isLength([1, 2, 3], 4)).toBe(false);
      expect(isLength(["a", "b", "c"], 4)).toBe(false);
    });
    it("narrows the type of the array to a tuple of the given length", () => {
      const numbers = [1, 2, 3];
      if (isLength(numbers, 3)) {
        expectTypeOf(numbers).toEqualTypeOf<[number, number, number]>();
      }
    });
  });

  describe("isPopulatedArray", () => {
    it("returns false for nullish values", () => {
      expect(isPopulatedArray(null)).toBe(false);
      expect(isPopulatedArray(undefined)).toBe(false);
    });
    it("returns true for non-empty arrays", () => {
      expect(isPopulatedArray([1])).toBe(true);
      expect(isPopulatedArray([1, 2, 3])).toBe(true);
      expect(isPopulatedArray(["a", "b"])).toBe(true);
    });
    it("returns false for empty arrays", () => {
      expect(isPopulatedArray([])).toBe(false);
    });
    it("narrows the type of the array", () => {
      const maybeEmpty = [1, 2, 3];
      if (isPopulatedArray(maybeEmpty)) {
        expectTypeOf(maybeEmpty).toEqualTypeOf<[number, ...number[]]>();
      }
    });
  });

  describe("createDeterministicKeySelector", () => {
    const colors = ["red", "green", "blue"] as const;
    const getColor = createDeterministicKeySelector(colors);

    it("returns a stable item from the array, for the given string", () => {
      // check twice for stability
      Array.from({ length: 2 }).forEach(() => {
        expect(getColor("Albert")).toBe("blue");
        expect(getColor("Barbara")).toBe("green");
        expect(getColor("Charlie")).toBe("red");
        expect(getColor("David")).toBe("blue");
        expect(getColor("Evan")).toBe("green");
        expect(getColor("Frank")).toBe("red");
      });
    });
    it("handles empty strings", () => {
      expect(getColor("")).toBe("red");
    });
    it("returns a signature that adheres to the type of the provided array", () => {
      expectTypeOf(getColor("Albert")).toEqualTypeOf<
        "red" | "green" | "blue"
      >();
    });
    it("throws an error if the array is empty", () => {
      expect(() => createDeterministicKeySelector([])).toThrow(
        "Requires at least one key.",
      );
    });
  });

  describe("toArray", () => {
    it("returns an empty array for nullish values", () => {
      expect(toArray(null)).toEqual([]);
      expect(toArray(undefined)).toEqual([]);
    });

    it("returns the same array instance for arrays", () => {
      const items = [1, 2, 3];
      expect(toArray(items)).toBe(items);
    });

    it("converts iterable values using Array.from", () => {
      expect(toArray(new Set([1, 2, 3]))).toEqual([1, 2, 3]);
      expect(toArray("abc")).toEqual(["abc"]);
    });

    it("wraps non-iterable values", () => {
      const value = { hello: "world" };
      expect(toArray(value)).toEqual([value]);
    });
  });

  describe("isIterable", () => {
    it("returns true for iterable objects", () => {
      expect(isIterable(new Set([1]))).toBe(true);
      expect(isIterable(new Map([["a", 1]]))).toBe(true);
    });

    it("returns false for non-iterables", () => {
      expect(isIterable(null)).toBe(false);
      expect(isIterable(undefined)).toBe(false);
      expect(isIterable(123)).toBe(false);
      expect(isIterable({})).toBe(false);
      expect(isIterable({ [Symbol.iterator]: 123 })).toBe(false);
    });
  });
});
