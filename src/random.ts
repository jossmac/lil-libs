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
 * Generate a random integer between `min` and `max`.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns A random integer between `min` and `max`.
 */
function int(min: number, max: number) {
  if (min > max) [min, max] = [max, min];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between `min` and `max`.
 * @param min - The minimum value. Defaults to 0.
 * @param max - The maximum value. Defaults to 1.
 * @returns A random float between `min` and `max`.
 */
function float(min = 0, max = 1) {
  if (min > max) [min, max] = [max, min];
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random boolean.
 * @returns A random boolean.
 */
function bool() {
  return Math.random() < 0.5;
}

/**
 * Choose a random item from a list of items.
 * @param items - The list of items to choose from.
 * @returns A random choice from the list of items.
 */
function choice<T>(items: T[]) {
  return items[random.int(0, items.length - 1)];
}

/**
 * Generate a random sample of items from a list.
 * @param items - The list of items to sample from.
 * @param count - The number of items to sample. Defaults to 1.
 * @returns A new array with the items sampled.
 */
function sample<T>(items: T[], count: number = 1) {
  return random.shuffle(items).slice(0, count);
}

/**
 * Create a function that returns a random sample of items from a list.
 * @param items - The list of items to sample from.
 * @param count - The number of items to sample. Defaults to 1.
 * @returns A function that returns a random sample of items from the list.
 */
function sampler<T>(items: T[], count: number = 1) {
  return () => random.sample(items, count);
}

/**
 * Shuffle an array of items using the Fisher-Yates algorithm.
 *
 * @param items - The array of items to shuffle.
 * @returns A new array with the items shuffled.
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
 * Create a function that returns a shuffled array of items.
 * @param items - The array of items to shuffle.
 * @returns A function that returns a shuffled array of items.
 */
function shuffler<T>(items: T[]) {
  return () => random.shuffle(items);
}
