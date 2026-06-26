import { describe, expect, it } from "vitest";

import {
  randomBoolean,
  randomChoice,
  randomFloat,
  randomInteger,
  randomSample,
  randomSampler,
  randomShuffle,
  randomShuffler,
} from "./random";

describe("lil-libs/random", () => {
  describe("randomBoolean", () => {
    it("returns a boolean value", () => {
      const result = randomBoolean();
      expect(typeof result).toBe("boolean");
    });

    it("returns both true and false over multiple calls", () => {
      const results = new Set();
      // Run enough times to likely get both values
      for (let i = 0; i < 100; i++) {
        results.add(randomBoolean());
      }
      expect(results.has(true)).toBe(true);
      expect(results.has(false)).toBe(true);
    });
  });
  describe("randomChoice", () => {
    it("returns an item from the array", () => {
      const items = ["apple", "banana", "cherry"];
      const result = randomChoice(items);
      expect(items).toContain(result);
    });

    it("returns the only item from a single-item array", () => {
      const items = ["only"];
      expect(randomChoice(items)).toBe("only");
    });

    it("works with different data types", () => {
      const numbers = [1, 2, 3, 4, 5];
      const result = randomChoice(numbers);
      expect(numbers).toContain(result);
      expect(typeof result).toBe("number");
    });

    it("returns all items over multiple calls", () => {
      const items = ["a", "b", "c"];
      const results = new Set();
      // Run enough times to likely get all values
      for (let i = 0; i < 100; i++) {
        results.add(randomChoice(items));
      }
      expect(results.size).toBe(3);
      expect(Array.from(results).sort()).toEqual(["a", "b", "c"]);
    });
  });
  describe("randomFloat", () => {
    it("returns a float within default range [0, 1)", () => {
      const result = randomFloat();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
      expect(typeof result).toBe("number");
    });

    it("returns a float within specified range", () => {
      const result = randomFloat(10, 20);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThan(20);
    });

    it("handles reversed min/max parameters", () => {
      const result = randomFloat(20, 10);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThan(20);
    });

    it("returns min when min equals max", () => {
      expect(randomFloat(5, 5)).toBe(5);
    });

    it("works with negative ranges", () => {
      const result = randomFloat(-5, -1);
      expect(result).toBeGreaterThanOrEqual(-5);
      expect(result).toBeLessThan(-1);
    });

    it("works with fractional boundaries", () => {
      const result = randomFloat(1.5, 2.5);
      expect(result).toBeGreaterThanOrEqual(1.5);
      expect(result).toBeLessThan(2.5);
    });
  });
  describe("randomInteger", () => {
    it("returns an integer within the specified range", () => {
      const result = randomInteger(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    });

    it("returns min when min equals max", () => {
      expect(randomInteger(5, 5)).toBe(5);
    });

    it("works with negative ranges", () => {
      const result = randomInteger(-10, -1);
      expect(result).toBeGreaterThanOrEqual(-10);
      expect(result).toBeLessThanOrEqual(-1);
      expect(Number.isInteger(result)).toBe(true);
    });

    it("handles reversed min/max parameters", () => {
      const result = randomInteger(10, 1);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    it("includes both min and max values over multiple calls", () => {
      const results = new Set();
      for (let i = 0; i < 1000; i++) {
        results.add(randomInteger(1, 3));
      }
      expect(results.has(1)).toBe(true);
      expect(results.has(2)).toBe(true);
      expect(results.has(3)).toBe(true);
    });
  });
  describe("randomSample", () => {
    it("returns an array with the specified count of items", () => {
      const items = ["a", "b", "c", "d", "e"];
      const result = randomSample(items, 3);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it("returns one item by default", () => {
      const items = ["a", "b", "c"];
      const result = randomSample(items);
      expect(result.length).toBe(1);
      expect(items).toContain(result[0]);
    });

    it("returns all items when count equals array length", () => {
      const items = ["a", "b", "c"];
      const result = randomSample(items, 3);
      expect(result.length).toBe(3);
      // Should contain all original items (though order may differ)
      expect(result.sort()).toEqual(["a", "b", "c"]);
    });

    it("does not modify the original array", () => {
      const items = ["a", "b", "c", "d"];
      const original = [...items];
      randomSample(items, 2);
      expect(items).toEqual(original);
    });

    it("returns empty array when count is 0", () => {
      const items = ["a", "b", "c"];
      const result = randomSample(items, 0);
      expect(result).toEqual([]);
    });
  });
  describe("randomSampler", () => {
    it("returns a function", () => {
      const items = ["a", "b", "c"];
      const samplerFn = randomSampler(items, 2);
      expect(typeof samplerFn).toBe("function");
    });

    it("returned function produces samples of specified size", () => {
      const items = ["a", "b", "c", "d", "e"];
      const samplerFn = randomSampler(items, 3);
      const result = samplerFn();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it("returned function uses default count of 1", () => {
      const items = ["a", "b", "c"];
      const samplerFn = randomSampler(items);
      const result = samplerFn();
      expect(result.length).toBe(1);
    });

    it("returned function can be called multiple times", () => {
      const items = ["a", "b", "c", "d"];
      const samplerFn = randomSampler(items, 2);
      const result1 = samplerFn();
      const result2 = samplerFn();
      expect(result1.length).toBe(2);
      expect(result2.length).toBe(2);
      // Results should be arrays but may differ
      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
    });
  });
  describe("randomShuffle", () => {
    it("returns an array of the same length", () => {
      const items = ["a", "b", "c", "d", "e"];
      const result = randomShuffle(items);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(items.length);
    });

    it("contains all original items", () => {
      const items = ["a", "b", "c", "d"];
      const result = randomShuffle(items);
      expect(result.sort()).toEqual(items.sort());
    });

    it("does not modify the original array", () => {
      const items = ["a", "b", "c", "d"];
      const original = [...items];
      randomShuffle(items);
      expect(items).toEqual(original);
    });

    it("handles empty array", () => {
      const result = randomShuffle([]);
      expect(result).toEqual([]);
    });

    it("handles single item array", () => {
      const items = ["only"];
      const result = randomShuffle(items);
      expect(result).toEqual(["only"]);
    });

    it("produces different orders over multiple calls", () => {
      const items = ["a", "b", "c", "d", "e"];
      const results = new Set();
      // Run multiple times to likely get different orderings
      for (let i = 0; i < 50; i++) {
        results.add(JSON.stringify(randomShuffle(items)));
      }
      // Should have multiple different orderings
      expect(results.size).toBeGreaterThan(1);
    });
  });
  describe("randomShuffler", () => {
    it("returns a function", () => {
      const items = ["a", "b", "c"];
      const shufflerFn = randomShuffler(items);
      expect(typeof shufflerFn).toBe("function");
    });

    it("returned function shuffles the array", () => {
      const items = ["a", "b", "c", "d"];
      const shufflerFn = randomShuffler(items);
      const result = shufflerFn();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(items.length);
      expect(result.sort()).toEqual(items.sort());
    });

    it("returned function can be called multiple times", () => {
      const items = ["a", "b", "c", "d"];
      const shufflerFn = randomShuffler(items);
      const result1 = shufflerFn();
      const result2 = shufflerFn();
      expect(result1.length).toBe(4);
      expect(result2.length).toBe(4);
      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
    });

    it("original array remains unchanged", () => {
      const items = ["a", "b", "c"];
      const original = [...items];
      const shufflerFn = randomShuffler(items);
      shufflerFn();
      expect(items).toEqual(original);
    });
  });
});
