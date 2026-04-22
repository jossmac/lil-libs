import { assert } from "./assert";
import type { Maybe, TupleOf } from "./types";

/**
 * Checks if an array is non-empty.
 */
export function isPopulatedArray<T>(
  items: Maybe<T[] | readonly T[]>,
): items is [T, ...T[]] {
  return items != null && items.length > 0;
}

/**
 * Checks if an array has a specific length, narrowing the type to a tuple of
 * the given length.
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
 * toArray(1); // [1]
 * toArray([1]); // [1]
 * toArray(new Set([1, 2])); // [1, 2]
 *
 * @param value - The value to convert.
 * @returns An array.
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
 * isIterable(new Set([1, 2])); // true
 * isIterable({}); // false
 *
 * @param value - The value to check.
 * @returns `true` if the value has a callable `Symbol.iterator`.
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
 * @note The last chunk may be smaller than the given size if the array does not divide evenly.
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 *
 * @param arr - The array to chunk.
 * @param size - The size of each chunk.
 * @returns An array of chunks.
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
 * @example
 * partition([1, 2, 3, 4], x => x % 2 === 0); // [[2, 4], [1, 3]]
 *
 * @param arr - The array to partition.
 * @param predicate - The function to determine which partition an item belongs to.
 * @returns A tuple of two arrays: the first with items that satisfy the predicate, and the second with items that do not.
 */
export function partition<T>(
  arr: T[],
  predicate: (item: T, index: number, array: T[]) => boolean,
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]!;
    if (predicate(item, i, arr)) truthy.push(item);
    else falsy.push(item);
  }
  return [truthy, falsy];
}

/**
 * Creates a function that returns an item from the provided array for a given
 * string, based on a stable hash of the string.
 *
 * @example
 * const getColor = stableKeyFactory(['red', 'green', 'blue']);
 * getColor('Albert'); // 'blue'
 * getColor('Barbara'); // 'green'
 * getColor('Charlie'); // 'red'
 *
 * @param keys - The keys to use for the function.
 * @returns A function that returns an item from the provided array.
 */
export function stableKeyFactory<const T extends readonly string[]>(keys: T) {
  assert(isPopulatedArray(keys), "Requires at least one key.");

  return function selectKeyFromStableHash(value: string): T[number] {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      // `(hash << 5) - hash` yields an odd prime, which avoids overflow / loss
      // of information when using modulo operation
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % keys.length;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- keys length is guaranteed to be > 0 (isPopulatedArray assertion)
    return keys[index]!;
  };
}
