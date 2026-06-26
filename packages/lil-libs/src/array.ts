/**
 * Array utilities: type guards, chunking, partitioning, and deterministic key selection.
 *
 * @module
 */

import { assert } from "./assert";
import type { Maybe, TupleOf } from "./types";

/**
 * Type guard that narrows an array to a non-empty tuple-like type.
 *
 * @example
 * const values: number[] = [1, 2, 3];
 * if (isPopulatedArray(values)) {
 *   // values: [number, ...number[]]
 * }
 *
 * @param items - Array to test. `null` and `undefined` are treated as empty.
 * @returns `true` when `items` is non-null and has at least one element; narrows the type to a non-empty tuple.
 */
export function isPopulatedArray<T>(
  items: Maybe<T[] | readonly T[]>,
): items is [T, ...T[]] {
  return items != null && items.length > 0;
}

/**
 * Checks if an array has a specific length, narrowing the type to a tuple of
 * the given length.
 *
 * @example
 * const values: number[] = [1, 2, 3];
 * if (isLength(values, 3)) {
 *   // values: [number, number, number]
 * }
 *
 * @param arr - Array whose length is compared.
 * @param length - Exact length to match; when equal, narrows `arr` to a fixed-length tuple type.
 * @returns `true` when `arr.length` equals `length` exactly.
 */
export function isLength<T, N extends number>(
  arr: readonly T[],
  length: N,
): arr is TupleOf<T, N> {
  return arr.length === length;
}

/**
 * Converts a value to `Array`, if it is not already.
 *
 * @example
 * toArray(null); // []
 * toArray(1); // [1]
 * toArray(new Set([1, 2])); // [1, 2]
 *
 * @param value - Value to normalize. `null` and `undefined` become `[]`; arrays are returned as-is; iterables become `Array.from(value)`; anything else is wrapped in a one-element array.
 * @returns An array representation of `value`.
 */
export function toArray<T>(value: T | T[]): T[] {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  // handle e.g. Set, Map, etc. that implement the iterable protocol
  if (isIterable(value)) {
    return Array.from(value);
  }

  return [value];
}

/**
 * Checks whether a value implements the iterable protocol.
 *
 * @example
 * isIterable(new Map()); // true
 * isIterable(new Set()); // true
 * isIterable([]); // true
 * isIterable({}); // false
 *
 * @param value - Any value to test for iterable protocol support.
 * @returns `true` when `value` is a non-null object with a callable `Symbol.iterator` (e.g. arrays, `Map`, `Set`); `false` for `null`, primitives, and plain objects.
 */
export function isIterable<T>(value: T | Iterable<T>): value is Iterable<T>;
export function isIterable(value: unknown): value is Iterable<unknown>;
export function isIterable(value: unknown): value is Iterable<unknown> {
  return (
    value != null &&
    typeof value === "object" &&
    Symbol.iterator in value &&
    typeof (value as Record<PropertyKey, unknown>)[Symbol.iterator] ===
      "function"
  );
}

/**
 * Splits an array into chunks of the given size.
 *
 * The last chunk may be smaller than the given size if the array does not
 * divide evenly.
 *
 * @example
 * chunk([1, 2, 3, 4], 2); // [[1, 2], [3, 4]]
 * chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 * chunk([], 2); // []
 *
 * @param arr - Array to split into consecutive segments.
 * @param size - Maximum number of elements per chunk; the final chunk may contain fewer.
 * @returns Consecutive slices of `arr`, each up to `size` elements long. Returns `[]` when `arr` is empty.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

/**
 * Splits an array into two arrays: one with items that satisfy a predicate, and
 * one with items that do not.
 *
 * Returns a 2-item tuple `[matched, unmatched]`. Preserves the original item
 * order within both output arrays. Passes `(item, index, array)` to the
 * predicate.
 *
 * @example
 * partition([1, 2, 3, 4], (n) => n % 2 === 0);
 * // [[2, 4], [1, 3]]
 *
 * partition(["a", "bb", "ccc"], (s) => s.length > 1);
 * // [["bb", "ccc"], ["a"]]
 *
 * @param arr - Array to split into two groups.
 * @param predicate - Called as `(item, index, array)`; items for which this returns `true` go into the first group.
 * @returns A two-element tuple `[matched, unmatched]`, preserving original order within each group.
 */
export function partition<T>(
  arr: T[],
  predicate: (item: T, index: number, array: T[]) => boolean,
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  for (const [i, item] of arr.entries()) {
    if (predicate(item, i, arr)) truthy.push(item);
    else falsy.push(item);
  }
  return [truthy, falsy];
}

/**
 * Creates a function that returns an item from the provided array for a given
 * string, based on a stable hash of the string.
 *
 * Returns the same key for the same input every time. Preserves literal key
 * types (for as const arrays). Supports empty input strings.
 *
 * @example
 * const colors = ["red", "green", "blue"] as const;
 * const getColor = createDeterministicKeySelector(colors);
 *
 * getColor("Albert"); // 'blue'
 * getColor("Barbara"); // 'green'
 * getColor("Charlie"); // 'red'
 *
 * @param keys - Non-empty list of string keys to choose from. The same input string always maps to the same key via a stable hash.
 * @returns A function `(value: string) => T[number]` that picks a key from `keys` deterministically.
 * @throws If called with an empty `keys` array.
 */
export function createDeterministicKeySelector<
  const T extends readonly string[],
>(keys: T) {
  assert(isPopulatedArray(keys), "Requires at least one key.");

  return function selectKeyFromStableHash(value: string): T[number] {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      // `(hash << 5) - hash` yields an odd prime, which avoids overflow / loss
      // of information when using modulo operation
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % keys.length;
    const selected = keys[index];
    if (selected === undefined) {
      throw new Error(
        "Unreachable: createDeterministicKeySelector received an empty keys array",
      );
    }
    return selected;
  };
}
