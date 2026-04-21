import { assert } from "./assert";
import type { TupleOf } from "./types";

/**
 * Checks if an array is non-empty.
 */
export function isNonEmpty<T>(items: T[] | readonly T[]): items is [T, ...T[]] {
  return items.length > 0;
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
 * Converts a value to an array, if it is not already an array.
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
 * Creates a function that returns an item from the provided array for a given
 * string, based on a stable hash of the string.
 *
 * @example
 * const getColor = createStableKeySelector(['red', 'green', 'blue']);
 * getColor('Albert'); // 'blue'
 * getColor('Barbara'); // 'green'
 * getColor('Charlie'); // 'red'
 *
 * @param keys - The keys to use for the function.
 * @returns A function that returns an item from the provided array.
 */
export function createStableKeySelector<const T extends readonly string[]>(
  keys: T,
) {
  assert(isNonEmpty(keys), "Requires at least one key.");

  return function selectKeyFromStableHash(value: string): T[number] {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      // `(hash << 5) - hash` yields an odd prime, which avoids overflow / loss
      // of information when using modulo operation
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % keys.length;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- keys length is guaranteed to be > 0 (isNonEmpty assertion)
    return keys[index]!;
  };
}
