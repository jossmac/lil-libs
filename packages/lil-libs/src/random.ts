/**
 * Namespace of random utilities.
 *
 * @example
 * import { random } from "@jossmac/lil-libs/random";
 *
 * random.bool(); // true or false
 * random.int(1, 3); // 1, 2, or 3
 */
export const random = {
  bool,
  choice,
  float,
  int,
  sample,
  sampler,
  shuffle,
  shuffler,
};

/**
 * Generates random integers in an inclusive range.
 *
 * @example
 * random.int(1, 3); // 1, 2, or 3
 * random.int(10, 1); // still valid
 *
 * @remarks `random.int(min, max)` is inclusive of both bounds. Reversed bounds are
 * automatically normalised.
 *
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns A random integer between `min` and `max`.
 */
function int(min: number, max: number) {
  if (min > max) [min, max] = [max, min];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates random floating-point numbers in a half-open range.
 *
 * @example
 * random.float(10, 20); // 10 <= n < 20
 * random.float(20, 10); // still valid
 *
 * @remarks `random.float(min, max)` is inclusive of `min` and exclusive of `max`.
 * Reversed bounds are automatically normalised.
 *
 * @param min - The minimum value. Defaults to 0.
 * @param max - The maximum value. Defaults to 1.
 * @returns A random floating-point number between `min` and `max`.
 */
function float(min = 0, max = 1) {
  if (min > max) [min, max] = [max, min];
  return Math.random() * (max - min) + min;
}

/**
 * Returns random boolean values.
 *
 * @example
 * random.bool(); // true or false
 */
function bool() {
  return Math.random() < 0.5;
}

/**
 * Returns one random item from an array.
 *
 * @example
 * random.choice(["a", "b", "c"]); // one item
 *
 * @param items - The list of items to choose from.
 * @returns A random item from the array.
 */
function choice<T>(items: T[]) {
  return items[random.int(0, items.length - 1)];
}

/**
 * Returns a randomly sampled subset without mutating the original array.
 *
 * @example
 * const items = ["a", "b", "c", "d"];
 * random.sample(items, 2); // e.g. ["d", "a"]
 * random.sample(items); // single-item sample
 * random.sample(items, 0); // []
 *
 * @remarks Defaults to `count = 1`. Returns an empty array when `count` is `0`.
 * Returns all items when `count` equals the array length. Never mutates the
 * input array.
 *
 * @param items - The list of items to sample from.
 * @param count - The number of items to sample. Defaults to 1.
 * @returns A random sample of items from the array.
 */
function sample<T>(items: T[], count: number = 1) {
  return random.shuffle(items).slice(0, count);
}

/**
 * Creates a function that returns a random sample on each call.
 *
 * @example
 * const items = [1, 2, 3, 4];
 * const sampleTwo = random.sampler(items, 2);
 * sampleTwo(); // random 2-item sample each call
 *
 * @param items - The list of items to sample from.
 * @param count - The number of items to sample. Defaults to 1.
 * @returns A function that returns a random sample of items from the array.
 */
function sampler<T>(items: T[], count: number = 1) {
  return () => random.sample(items, count);
}

/**
 * Returns a shuffled copy without mutating the original array.
 *
 * @example
 * const items = [1, 2, 3, 4];
 * random.shuffle(items); // shuffled copy
 * items; // unchanged
 *
 * @param items - The array of items to shuffle.
 * @returns A shuffled copy of the array.
 */
function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = random.int(0, i);
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
 * const shuffleNow = random.shuffler(items);
 * shuffleNow(); // shuffled copy each call
 *
 * @param items - The array of items to shuffle.
 * @returns A function that returns a newly shuffled copy of the array on each call.
 */
function shuffler<T>(items: T[]) {
  return () => random.shuffle(items);
}
