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
 * isPopulatedArray([]); // false
 * isPopulatedArray(null); // false
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
 * Checks whether an array has an exact length, narrowing the type to a fixed-length tuple.
 *
 * @example
 * const values: number[] = [1, 2, 3];
 * if (isLength(values, 3)) {
 *   // values: [number, number, number]
 * }
 * isLength(values, 2); // false
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
 * Normalizes a value into an array.
 *
 * @example
 * toArray(null); // []
 * toArray(undefined); // []
 * toArray([1, 2]); // [1, 2] (same array instance)
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
 * Checks whether a value implements the iterable protocol, preserving the
 * element type when the input is already typed as `Iterable<T>`.
 *
 * @param value - Value or iterable to test.
 * @returns Type predicate narrowing `value` to `Iterable<T>`.
 */
export function isIterable<T>(value: T | Iterable<T>): value is Iterable<T>;

/**
 * Checks whether a value implements the iterable protocol.
 *
 * @example
 * isIterable(new Map()); // true
 * isIterable(new Set()); // true
 * isIterable([]); // true
 * isIterable(null); // false
 * isIterable({}); // false
 *
 * @param value - Any value to test for iterable protocol support.
 * @returns `true` when `value` is a non-null object with a callable `Symbol.iterator` (e.g. arrays, `Map`, `Set`); `false` for `null`, primitives, and plain objects.
 */
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
 * Splits an array into consecutive chunks of at most `size` elements.
 *
 * The final chunk may be smaller when the array length is not evenly divisible.
 *
 * @example
 * chunk([1, 2, 3, 4], 2); // [[1, 2], [3, 4]]
 * chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 * chunk([1, 2, 3], 10); // [[1, 2, 3]] (size larger than array)
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
 * Partitions an array into matched and unmatched groups by predicate result.
 *
 * Returns `[matched, unmatched]` as a two-element tuple. Preserves original item
 * order within each group. The predicate receives `(item, index, array)`.
 *
 * @example
 * const [evens, odds] = partition([1, 2, 3, 4], (n) => n % 2 === 0);
 * evens; // [2, 4]
 * odds; // [1, 3]
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
 * Creates a function that maps each input string to a key from `keys` using a
 * stable hash, so the same input always selects the same key.
 *
 * Preserves literal key types (for `as const` arrays). Empty input strings are
 * supported.
 *
 * @example
 * const colors = ["red", "green", "blue"] as const;
 * const getColor = createDeterministicKeySelector(colors);
 *
 * getColor("Albert"); // "blue"
 * getColor("Barbara"); // "green"
 * getColor("Charlie"); // "red"
 * getColor("Albert"); // "blue" (stable across calls)
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
