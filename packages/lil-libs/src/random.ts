/**
 * Generates random integers in an inclusive range.
 *
 * Both bounds are inclusive. Reversed bounds are automatically normalised.
 *
 * @example
 * randomInteger(1, 3); // 1, 2, or 3
 * randomInteger(3, 1); // same as randomInteger(1, 3)
 *
 * @param min - Lower bound (inclusive); swapped with `max` when out of order.
 * @param max - Upper bound (inclusive); swapped with `min` when out of order.
 * @returns A uniformly random integer in `[min, max]`.
 */
export function randomInteger(min: number, max: number) {
  if (min > max) [min, max] = [max, min];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates random floating-point numbers in a half-open range.
 *
 * Reversed bounds are automatically normalised.
 *
 * @example
 * randomFloat(10, 20); // 10 <= n < 20
 * randomFloat(20, 10); // same as randomFloat(10, 20)
 * randomFloat(); // 0 <= n < 1 (default range)
 *
 * @param min - Lower bound (inclusive). Defaults to `0`; swapped with `max` when out of order.
 * @param max - Upper bound (exclusive). Defaults to `1`; swapped with `min` when out of order.
 * @returns A uniformly random float in `[min, max)`.
 */
export function randomFloat(min = 0, max = 1) {
  if (min > max) [min, max] = [max, min];
  return Math.random() * (max - min) + min;
}

/**
 * Returns random boolean values.
 *
 * @example
 * randomBool(); // true or false
 *
 * @returns `true` or `false` with equal probability (~50/50).
 */
export function randomBoolean() {
  return Math.random() < 0.5;
}

/**
 * Returns one random item from an array.
 *
 * @example
 * randomChoice(["a", "b", "c"]); // "a", "b", or "c"
 *
 * @param items - Array to pick from.
 * @returns One uniformly random element from `items`.
 */
export function randomChoice<T>(items: T[]) {
  return items[randomInteger(0, items.length - 1)];
}

/**
 * Returns a random subset of `items` without mutating the source array.
 *
 * Defaults to `count = 1`. Returns `[]` when `count` is `0`, and all items when
 * `count` equals the array length.
 *
 * @example
 * const items = ["a", "b", "c", "d"];
 * randomSample(items, 2); // e.g. ["d", "a"]
 * randomSample(items); // e.g. ["b"] (default count: 1)
 * randomSample(items, 0); // []
 * randomSample(items, items.length); // all items, shuffled
 *
 * @param items - Source array; not mutated.
 * @param count - Number of items to take after shuffling. Defaults to `1`; `0` returns `[]`, and values equal to `items.length` return all items.
 * @returns A new array of up to `count` items in random order (via {@link shuffle}).
 */
export function randomSample<T>(items: T[], count: number = 1) {
  return randomShuffle(items).slice(0, count);
}

/**
 * Creates a function that returns a random sample on each call.
 *
 * @example
 * const items = [1, 2, 3, 4];
 * const sampleTwo = randomSampler(items, 2);
 * sampleTwo(); // random 2-item sample each call
 *
 * @param items - Source array; captured by the returned function and not mutated.
 * @param count - Sample size passed to {@link sample} on each call. Defaults to `1`.
 * @returns A zero-argument function that returns a fresh random sample each time it is called.
 */
export function randomSampler<T>(items: T[], count: number = 1) {
  return () => randomSample(items, count);
}

/**
 * Returns a randomly shuffled copy of `items` without mutating the source array.
 *
 * @example
 * const items = [1, 2, 3, 4];
 * const shuffled = randomShuffle(items);
 * shuffled; // e.g. [3, 1, 4, 2]
 * items; // [1, 2, 3, 4] (unchanged)
 *
 * @param items - Array to copy and shuffle; the original is not modified.
 * @returns A Fisher–Yates shuffled copy of `items`.
 */
export function randomShuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInteger(0, i);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- indices are guaranteed to be valid
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/**
 * Creates a function that returns a newly shuffled copy on each call.
 *
 * @example
 * const items = [1, 2, 3, 4];
 * const shuffleNow = randomShuffler(items);
 * shuffleNow(); // shuffled copy each call
 *
 * @param items - Source array; captured by the returned function and not mutated.
 * @returns A zero-argument function that returns a fresh shuffled copy on each call.
 */
export function randomShuffler<T>(items: T[]) {
  return () => randomShuffle(items);
}
