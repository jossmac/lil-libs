import { describe, expect, it } from "vitest";

import {
  clamp,
  findNearest,
  isAscending,
  isDescending,
  isFiniteNumber,
  isNumber,
  lerp,
  remap,
  roundToPrecision,
  roundToStep,
  sequence,
  unlerp,
} from "./number";

describe("lil-libs/number", () => {
  describe("isNumber", () => {
    it("returns true if the value is a number", () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-1.23)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(9 / 5 + 32)).toBe(true);
      expect(isNumber(Math.PI)).toBe(true);
      expect(isNumber(Math.sqrt(2))).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
      expect(isNumber(-Infinity)).toBe(true);
    });

    it("returns false if the value is not a number", () => {
      expect(isNumber("123")).toBe(false);
      expect(isNumber(NaN)).toBe(false);

      [null, undefined, "", false, true, new Date(), [], {}, () => {}].forEach(
        (value) => expect(isNumber(value)).toBe(false),
      );
    });
  });

  describe("isFiniteNumber", () => {
    it("returns true if the value is a finite number", () => {
      expect(isFiniteNumber(123)).toBe(true);
      expect(isFiniteNumber(-1.23)).toBe(true);
      expect(isFiniteNumber(0)).toBe(true);
      expect(isFiniteNumber(9 / 5 + 32)).toBe(true);
      expect(isFiniteNumber(Math.PI)).toBe(true);
      expect(isFiniteNumber(Math.sqrt(2))).toBe(true);
    });

    it("returns false if the value is not a finite number", () => {
      expect(isFiniteNumber("123")).toBe(false);
      expect(isFiniteNumber(NaN)).toBe(false);
      expect(isFiniteNumber(Infinity)).toBe(false);
      expect(isFiniteNumber(-Infinity)).toBe(false);

      [null, undefined, "", false, true, new Date(), [], {}, () => {}].forEach(
        (value) => expect(isFiniteNumber(value)).toBe(false),
      );
    });
  });

  describe("isAscending", () => {
    it("returns true if the array is in ascending order", () => {
      expect(isAscending([1, 2, 3, 4, 5])).toBe(true);
      expect(isAscending([1, 1, 2, 3, 4, 5])).toBe(true);
      expect(isAscending([-5, -4, -3, -2, -1])).toBe(true);
    });
    it("handles trivially sorted arrays", () => {
      expect(isAscending([])).toBe(true);
      expect(isAscending([42])).toBe(true);
    });
    it("returns false if the array is not in ascending order", () => {
      expect(isAscending([5, 4, 3, 2, 1])).toBe(false);
      expect(isAscending([4, 5, 4, 3, 2, 1])).toBe(false);
    });
  });
  describe("isDescending", () => {
    it("returns true if the array is in descending order", () => {
      expect(isDescending([5, 4, 3, 2, 1])).toBe(true);
      expect(isDescending([5, 5, 4, 3, 2, 1])).toBe(true);
      expect(isDescending([-1, -2, -3, -4, -5])).toBe(true);
    });
    it("handles trivially sorted arrays", () => {
      expect(isDescending([])).toBe(true);
      expect(isDescending([42])).toBe(true);
    });
    it("returns false if the array is not in descending order", () => {
      expect(isDescending([1, 2, 3, 4, 5])).toBe(false);
      expect(isDescending([2, 1, 2, 3, 4, 5])).toBe(false);
    });
  });

  describe("clamp", () => {
    it("returns the value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0.5, 0, 1)).toBe(0.5);
    });

    it("returns min when value is below min", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-0.5, 0, 1)).toBe(0);
    });

    it("returns max when value is above max", () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(1.5, 0, 1)).toBe(1);
    });

    it("works with negative ranges", () => {
      expect(clamp(-15, -20, -10)).toBe(-15);
      expect(clamp(-25, -20, -10)).toBe(-20);
      expect(clamp(-5, -20, -10)).toBe(-10);
    });
  });

  describe("roundToPrecision", () => {
    it("rounds to specified decimal places", () => {
      expect(roundToPrecision(3.14159, 2)).toBe(3.14);
      expect(roundToPrecision(3.14159, 3)).toBe(3.142);
      expect(roundToPrecision(3.14159, 0)).toBe(3);
    });

    it("handles rounding up correctly", () => {
      // standard rounding behavior (≥ 0.5 rounds up)
      expect(roundToPrecision(3.999, 2)).toBe(4);
      expect(roundToPrecision(3.995, 2)).toBe(4);
      expect(roundToPrecision(3.005, 2)).toBe(3.01);
      expect(roundToPrecision(3.995, 1)).toBe(4);
      expect(roundToPrecision(3.45, 1)).toBe(3.5);
      expect(roundToPrecision(3.449, 1)).toBe(3.4);
    });

    it("handles rounding down correctly", () => {
      // standard rounding behavior (≤ 0.4 rounds down)
      expect(roundToPrecision(3.3333, 2)).toBe(3.33);
      expect(roundToPrecision(3.004, 2)).toBe(3);
      expect(roundToPrecision(3.345, 1)).toBe(3.3);
      expect(roundToPrecision(3.34, 1)).toBe(3.3);
    });

    it("handles negative numbers", () => {
      expect(roundToPrecision(-3.14159, 2)).toBe(-3.14);
      expect(roundToPrecision(-3.999, 2)).toBe(-4);
    });

    it("handles zero decimal places", () => {
      expect(roundToPrecision(3.14159, 0)).toBe(3);
      expect(roundToPrecision(3.9, 0)).toBe(4);
    });

    it("handles large decimal places", () => {
      expect(roundToPrecision(3.14159, 10)).toBe(3.14159);
    });
  });

  describe("roundToStep", () => {
    it("rounds to the nearest multiple of step", () => {
      expect(roundToStep(5.1, 0.5)).toBe(5);
      expect(roundToStep(5.26, 0.25)).toBe(5.25);
      expect(roundToStep(-5.26, 0.25)).toBe(-5.25);
    });

    it("throws when step is zero or non-finite", () => {
      expect(() => roundToStep(1, 0)).toThrow("The `step` cannot be zero.");
      expect(() => roundToStep(1, Infinity)).toThrow(
        "The `step` cannot be infinite.",
      );
      expect(() => roundToStep(1, -Infinity)).toThrow(
        "The `step` cannot be infinite.",
      );
      expect(() => roundToStep(1, NaN)).toThrow(
        "The `step` cannot be infinite.",
      );
    });
  });

  describe("findNearest", () => {
    it("finds the nearest value in a sorted ascending array", () => {
      const items = [1, 3, 5, 7, 9];

      expect(findNearest(2, items)).toBe(1);
      expect(findNearest(4, items)).toBe(3);
      expect(findNearest(6, items)).toBe(5);
      expect(findNearest(8, items)).toBe(7);
    });

    it("finds the nearest value in a sorted descending array", () => {
      const items = [9, 7, 5, 3, 1];

      expect(findNearest(2, items)).toBe(3);
      expect(findNearest(4, items)).toBe(5);
      expect(findNearest(6, items)).toBe(7);
      expect(findNearest(8, items)).toBe(9);
    });

    it("finds the nearest value in an unsorted array", () => {
      const items = [5, 3, 1, 7, 9];
      const result = findNearest(2, items);
      expect(result).toBe(3);
      expect(findNearest(4, items)).toBe(5);
      expect(findNearest(6, items)).toBe(5);
      expect(findNearest(8, items)).toBe(7);
    });

    it("returns exact matches", () => {
      const items = [1, 3, 5, 7, 9];

      expect(findNearest(1, items)).toBe(1);
      expect(findNearest(5, items)).toBe(5);
      expect(findNearest(9, items)).toBe(9);
    });

    it("handles values outside the range", () => {
      const items = [10, 20, 30];

      // Below range
      expect(findNearest(5, items)).toBe(10);
      expect(findNearest(-10, items)).toBe(10);

      // Above range
      expect(findNearest(35, items)).toBe(30);
      expect(findNearest(100, items)).toBe(30);
    });

    it("handles single element arrays", () => {
      const items = [42];

      expect(findNearest(0, items)).toBe(42);
      expect(findNearest(42, items)).toBe(42);
      expect(findNearest(100, items)).toBe(42);
    });

    it("throws error for empty arrays", () => {
      expect(() => findNearest(5, [])).toThrow("Items must not be empty.");
    });

    it("handles negative numbers", () => {
      const items = [-10, -5, 0, 5, 10];

      expect(findNearest(-7, items)).toBe(-5);
      expect(findNearest(-2, items)).toBe(0);
      expect(findNearest(3, items)).toBe(5);
    });

    it("handles floating point values", () => {
      const items = [0.1, 0.3, 0.5, 0.7, 0.9];

      expect(findNearest(0.25, items)).toBe(0.3);
      expect(findNearest(0.45, items)).toBe(0.5);
      expect(findNearest(0.75, items)).toBe(0.7);
    });

    describe("bias options for ties", () => {
      const items = [1, 3, 5, 7, 9];

      it('uses "first" bias by default for equidistant values', () => {
        // 4 is equidistant from 3 and 5, should return 3 (first encountered)
        expect(findNearest(4, items)).toBe(3);
        expect(findNearest(4, items, "first")).toBe(3);
      });

      it('uses "last" bias for equidistant values', () => {
        // 4 is equidistant from 3 and 5, should return 5 (last encountered)
        expect(findNearest(4, items, "last")).toBe(5);
        // 6 is equidistant from 5 and 7, should return 7 (last encountered)
        expect(findNearest(6, items, "last")).toBe(7);
      });

      it('uses "smaller" bias for equidistant values', () => {
        // 4 is equidistant from 3 and 5, should return 3 (smaller)
        expect(findNearest(4, items, "smaller")).toBe(3);
        // 6 is equidistant from 5 and 7, should return 5 (smaller)
        expect(findNearest(6, items, "smaller")).toBe(5);
      });

      it('uses "larger" bias for equidistant values', () => {
        // 4 is equidistant from 3 and 5, should return 5 (larger)
        expect(findNearest(4, items, "larger")).toBe(5);
        // 6 is equidistant from 5 and 7, should return 7 (larger)
        expect(findNearest(6, items, "larger")).toBe(7);
      });

      it("handles bias with descending arrays", () => {
        const descItems = [9, 7, 5, 3, 1];

        // 4 is equidistant from 3 and 5
        expect(findNearest(4, descItems, "first")).toBe(5); // 5 appears first in array
        expect(findNearest(4, descItems, "last")).toBe(3); // 3 appears last in array
        expect(findNearest(4, descItems, "smaller")).toBe(3);
        expect(findNearest(4, descItems, "larger")).toBe(5);
      });

      it("handles bias when multiple values have the same minimum distance", () => {
        const items = [1, 2, 3, 4, 5];

        // Test with value at 2.5, equidistant from 2 and 3
        expect(findNearest(2.5, items, "first")).toBe(2);
        expect(findNearest(2.5, items, "last")).toBe(3);
        expect(findNearest(2.5, items, "smaller")).toBe(2);
        expect(findNearest(2.5, items, "larger")).toBe(3);
      });
    });

    it("handles edge case with identical consecutive values", () => {
      const items = [1, 3, 3, 5, 7];

      // Should find the first 3 when bias is 'first'
      expect(findNearest(3, items, "first")).toBe(3);
      expect(findNearest(3, items, "last")).toBe(3);

      // When looking for something close to 3
      expect(findNearest(2.9, items, "first")).toBe(3);
      expect(findNearest(3.1, items, "first")).toBe(3);
    });
  });

  describe("sequence", () => {
    it("generates ascending and descending integer sequences", () => {
      expect(sequence(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(sequence(5, 1)).toEqual([5, 4, 3, 2, 1]);
      expect(sequence(-1, -5)).toEqual([-1, -2, -3, -4, -5]);
      expect(sequence(-5, -1)).toEqual([-5, -4, -3, -2, -1]);
    });

    it("handles equal start and end", () => {
      expect(sequence(2, 2)).toEqual([2]);
    });

    it("supports negative step", () => {
      // behaves the same as its absolute value
      expect(sequence(0, 3, -1)).toEqual([0, 1, 2, 3]);
      expect(sequence(3, 0, -1)).toEqual([3, 2, 1, 0]);
    });

    it("derives precision from the step", () => {
      expect(sequence(0, 1, 0.33)).toEqual([0, 0.33, 0.66, 0.99]);
      expect(sequence(0, 1, 0.333)).toEqual([0, 0.333, 0.666, 0.999]);
    });

    it("throws on zero or non-finite step", () => {
      expect(() => sequence(0, 1, 0)).toThrow();
      expect(() => sequence(0, 1, Infinity)).toThrow();
      expect(() => sequence(0, 1, NaN)).toThrow();
    });
  });

  // Interpolation -------------------------------------------------------------

  describe("lerp", () => {
    it("interpolates between two values at arbitrary t", () => {
      expect(lerp(0, 100, 0.25)).toBe(25);
      expect(lerp(0, 100, 0.75)).toBe(75);
      expect(lerp(-50, 50, 0.3)).toBe(-20);
      expect(lerp(10, 20, 0.7)).toBe(17);
      // at t=0
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(-5, 5, 0)).toBe(-5);
      expect(lerp(100, 200, 0)).toBe(100);
      // at t=1
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(-5, 5, 1)).toBe(5);
      expect(lerp(100, 200, 1)).toBe(200);
    });

    it("works with negative numbers", () => {
      expect(lerp(-10, -5, 0.5)).toBe(-7.5);
      expect(lerp(-100, -50, 0.25)).toBe(-87.5);
    });
    it("works with floating point values", () => {
      expect(lerp(0.1, 0.9, 0.5)).toBeCloseTo(0.5);
      expect(lerp(1.5, 2.5, 0.3)).toBeCloseTo(1.8);
    });

    it("extrapolates beyond the range when t > 1", () => {
      expect(lerp(0, 10, 1.5)).toBe(15);
      expect(lerp(0, 10, 2)).toBe(20);
    });
    it("extrapolates below the range when t < 0", () => {
      expect(lerp(0, 10, -0.5)).toBe(-5);
      expect(lerp(10, 20, -1)).toBe(0);
    });

    it("handles zero range", () => {
      expect(lerp(5, 5, 0)).toBe(5);
      expect(lerp(5, 5, 0.5)).toBe(5);
      expect(lerp(5, 5, 1)).toBe(5);
    });
  });

  describe("unlerp", () => {
    it("calculates correct interpolation factor for arbitrary values", () => {
      expect(unlerp(0, 100, 25)).toBe(0.25);
      expect(unlerp(0, 100, 75)).toBe(0.75);
      expect(unlerp(-50, 50, -20)).toBe(0.3);
      expect(unlerp(10, 20, 17)).toBe(0.7);
      // value equals `from`
      expect(unlerp(0, 10, 0)).toBe(0);
      expect(unlerp(-5, 5, -5)).toBe(0);
      expect(unlerp(100, 200, 100)).toBe(0);
      // value equals `to`
      expect(unlerp(0, 10, 10)).toBe(1);
      expect(unlerp(-5, 5, 5)).toBe(1);
      expect(unlerp(100, 200, 200)).toBe(1);
    });

    it("works with negative ranges", () => {
      expect(unlerp(-10, -5, -7.5)).toBe(0.5);
      expect(unlerp(-100, -50, -87.5)).toBe(0.25);
    });
    it("works with floating point values", () => {
      expect(unlerp(0.1, 0.9, 0.5)).toBeCloseTo(0.5);
      expect(unlerp(1.5, 2.5, 1.8)).toBeCloseTo(0.3);
    });

    it("clamps values", () => {
      // beyond the upper range to 1
      expect(unlerp(0, 10, 15)).toBe(1);
      expect(unlerp(0, 10, 100)).toBe(1);
      expect(unlerp(-5, 5, 20)).toBe(1);
      // below the lower range to 0
      expect(unlerp(0, 10, -5)).toBe(0);
      expect(unlerp(0, 10, -100)).toBe(0);
      expect(unlerp(5, 15, -10)).toBe(0);
    });

    it("handles zero range by returning clamped result", () => {
      expect(unlerp(5, 5, 5)).toBe(0);
      expect(unlerp(5, 5, 3)).toBe(0);
      expect(unlerp(5, 5, 7)).toBe(1);
    });
  });

  describe("remap", () => {
    it("maps values from input range to output range", () => {
      expect(remap(5, [0, 10], [0, 100])).toBe(50);
      expect(remap(0, [0, 10], [100, 200])).toBe(100);
      expect(remap(10, [0, 10], [100, 200])).toBe(200);
    });

    it("handles negative ranges", () => {
      // negative input ranges
      expect(remap(-5, [-10, 0], [0, 100])).toBe(50);
      expect(remap(-2.5, [-10, 5], [0, 30])).toBe(15);
      // negative output range
      expect(remap(5, [0, 10], [-100, 0])).toBe(-50);
      expect(remap(7.5, [0, 10], [-20, -10])).toBe(-12.5);
    });
    it("works with floating point ranges", () => {
      expect(remap(0.5, [0, 1], [0, 10])).toBe(5);
      expect(remap(1.5, [1, 2], [10, 20])).toBe(15);
    });

    it("clamps values outside input range, by default", () => {
      expect(remap(-5, [0, 10], [0, 100])).toBe(0);
      expect(remap(15, [0, 10], [0, 100])).toBe(100);
    });
    it("handles values outside input range when `options.clamp` is false", () => {
      expect(remap(-5, [0, 10], [0, 100], { clamp: false })).toBe(-50);
      expect(remap(15, [0, 10], [0, 100], { clamp: false })).toBe(150);
    });
  });
});
