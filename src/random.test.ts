import { describe, expect, it } from "vitest";

import { random } from "./random";

describe("lil-libs/random", () => {
  describe("bool", () => {
    it("returns a boolean value", () => {
      const result = random.bool();
      expect(typeof result).toBe("boolean");
    });

    it("returns both true and false over multiple calls", () => {
      const results = new Set();
      // Run enough times to likely get both values
      for (let i = 0; i < 100; i++) {
        results.add(random.bool());
      }
      expect(results.has(true)).toBe(true);
      expect(results.has(false)).toBe(true);
    });
  });
  describe("choice", () => {
    it("returns an item from the array", () => {
      const items = ["apple", "banana", "cherry"];
      const result = random.choice(items);
      expect(items).toContain(result);
    });

    it("returns the only item from a single-item array", () => {
      const items = ["only"];
      expect(random.choice(items)).toBe("only");
    });

    it("works with different data types", () => {
      const numbers = [1, 2, 3, 4, 5];
      const result = random.choice(numbers);
      expect(numbers).toContain(result);
      expect(typeof result).toBe("number");
    });

    it("returns all items over multiple calls", () => {
      const items = ["a", "b", "c"];
      const results = new Set();
      // Run enough times to likely get all values
      for (let i = 0; i < 100; i++) {
        results.add(random.choice(items));
      }
      expect(results.size).toBe(3);
      expect(Array.from(results).sort()).toEqual(["a", "b", "c"]);
    });
  });
  describe("float", () => {
    it("returns a float within default range [0, 1)", () => {
      const result = random.float();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
      expect(typeof result).toBe("number");
    });

    it("returns a float within specified range", () => {
      const result = random.float(10, 20);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThan(20);
    });

    it("handles reversed min/max parameters", () => {
      const result = random.float(20, 10);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThan(20);
    });

    it("returns min when min equals max", () => {
      expect(random.float(5, 5)).toBe(5);
    });

    it("works with negative ranges", () => {
      const result = random.float(-5, -1);
      expect(result).toBeGreaterThanOrEqual(-5);
      expect(result).toBeLessThan(-1);
    });

    it("works with fractional boundaries", () => {
      const result = random.float(1.5, 2.5);
      expect(result).toBeGreaterThanOrEqual(1.5);
      expect(result).toBeLessThan(2.5);
    });
  });
  describe("int", () => {
    it("returns an integer within the specified range", () => {
      const result = random.int(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    });

    it("returns min when min equals max", () => {
      expect(random.int(5, 5)).toBe(5);
    });

    it("works with negative ranges", () => {
      const result = random.int(-10, -1);
      expect(result).toBeGreaterThanOrEqual(-10);
      expect(result).toBeLessThanOrEqual(-1);
      expect(Number.isInteger(result)).toBe(true);
    });

    it("handles reversed min/max parameters", () => {
      const result = random.int(10, 1);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    it("includes both min and max values over multiple calls", () => {
      const results = new Set();
      for (let i = 0; i < 1000; i++) {
        results.add(random.int(1, 3));
      }
      expect(results.has(1)).toBe(true);
      expect(results.has(2)).toBe(true);
      expect(results.has(3)).toBe(true);
    });
  });
  describe("sample", () => {
    it("returns an array with the specified count of items", () => {
      const items = ["a", "b", "c", "d", "e"];
      const result = random.sample(items, 3);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it("returns one item by default", () => {
      const items = ["a", "b", "c"];
      const result = random.sample(items);
      expect(result.length).toBe(1);
      expect(items).toContain(result[0]);
    });

    it("returns all items when count equals array length", () => {
      const items = ["a", "b", "c"];
      const result = random.sample(items, 3);
      expect(result.length).toBe(3);
      // Should contain all original items (though order may differ)
      expect(result.sort()).toEqual(["a", "b", "c"]);
    });

    it("does not modify the original array", () => {
      const items = ["a", "b", "c", "d"];
      const original = [...items];
      random.sample(items, 2);
      expect(items).toEqual(original);
    });

    it("returns empty array when count is 0", () => {
      const items = ["a", "b", "c"];
      const result = random.sample(items, 0);
      expect(result).toEqual([]);
    });
  });
  describe("sampler", () => {
    it("returns a function", () => {
      const items = ["a", "b", "c"];
      const samplerFn = random.sampler(items, 2);
      expect(typeof samplerFn).toBe("function");
    });

    it("returned function produces samples of specified size", () => {
      const items = ["a", "b", "c", "d", "e"];
      const samplerFn = random.sampler(items, 3);
      const result = samplerFn();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it("returned function uses default count of 1", () => {
      const items = ["a", "b", "c"];
      const samplerFn = random.sampler(items);
      const result = samplerFn();
      expect(result.length).toBe(1);
    });

    it("returned function can be called multiple times", () => {
      const items = ["a", "b", "c", "d"];
      const samplerFn = random.sampler(items, 2);
      const result1 = samplerFn();
      const result2 = samplerFn();
      expect(result1.length).toBe(2);
      expect(result2.length).toBe(2);
      // Results should be arrays but may differ
      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
    });
  });
  describe("shuffle", () => {
    it("returns an array of the same length", () => {
      const items = ["a", "b", "c", "d", "e"];
      const result = random.shuffle(items);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(items.length);
    });

    it("contains all original items", () => {
      const items = ["a", "b", "c", "d"];
      const result = random.shuffle(items);
      expect(result.sort()).toEqual(items.sort());
    });

    it("does not modify the original array", () => {
      const items = ["a", "b", "c", "d"];
      const original = [...items];
      random.shuffle(items);
      expect(items).toEqual(original);
    });

    it("handles empty array", () => {
      const result = random.shuffle([]);
      expect(result).toEqual([]);
    });

    it("handles single item array", () => {
      const items = ["only"];
      const result = random.shuffle(items);
      expect(result).toEqual(["only"]);
    });

    it("produces different orders over multiple calls", () => {
      const items = ["a", "b", "c", "d", "e"];
      const results = new Set();
      // Run multiple times to likely get different orderings
      for (let i = 0; i < 50; i++) {
        results.add(JSON.stringify(random.shuffle(items)));
      }
      // Should have multiple different orderings
      expect(results.size).toBeGreaterThan(1);
    });
  });
  describe("shuffler", () => {
    it("returns a function", () => {
      const items = ["a", "b", "c"];
      const shufflerFn = random.shuffler(items);
      expect(typeof shufflerFn).toBe("function");
    });

    it("returned function shuffles the array", () => {
      const items = ["a", "b", "c", "d"];
      const shufflerFn = random.shuffler(items);
      const result = shufflerFn();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(items.length);
      expect(result.sort()).toEqual(items.sort());
    });

    it("returned function can be called multiple times", () => {
      const items = ["a", "b", "c", "d"];
      const shufflerFn = random.shuffler(items);
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
      const shufflerFn = random.shuffler(items);
      shufflerFn();
      expect(items).toEqual(original);
    });
  });
});
