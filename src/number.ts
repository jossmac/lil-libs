import { isNonEmpty } from "./array";

/**
 * Check if the given value is a _genuine_ JavaScript number.
 *
 * @note Excludes `NaN`. Does not exclude `Infinity | -Infinity`.
 *
 * @example
 * ```ts
 * isNumber(123); // true
 * isNumber('123'); // false
 * ```
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/**
 * A convenience function that asserts a value both {@link isNumber} and is
 * finite in one call.
 */
export function isFiniteNumber(value: unknown): value is number {
  return isNumber(value) && Number.isFinite(value);
}

/**
 * Checks if an array of numbers is in ascending order.
 *
 * @param items - The array of numbers to inspect
 * @returns `true` if the array is in ascending order, `false` otherwise
 */
export function isAscending(items: number[]): boolean {
  // arrays with 0 or 1 elements are trivially sorted
  if (items.length <= 1) return true;
  return items.every((x, i, arr) => i === 0 || arr[i - 1]! <= x);
}

/**
 * Checks if an array of numbers is in descending order.
 *
 * @param items - The array of numbers to inspect
 * @returns `true` if the array is in descending order, `false` otherwise
 */
export function isDescending(items: number[]): boolean {
  // arrays with 0 or 1 elements are trivially sorted
  if (items.length <= 1) return true;
  return items.every((x, i, arr) => i === 0 || arr[i - 1]! >= x);
}

/** Clamps a number between a minimum and maximum value. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Rounds a number to a specified number of fractional digits.
 *
 * @param value - The number to round
 * @param digits - The number of fractional digits to round to
 * @param base - The base to round to (default `10`)
 */
export function roundToPrecision(
  value: number,
  digits: number,
  base: number = 10,
): number {
  if (digits <= 0) return Math.round(value);
  const pow = Math.pow(base, digits);
  return Math.round(value * pow) / pow;
}

/**
 * Rounds a number to a specified step size.
 *
 * @param value - The number to round
 * @param step - The step size to round to
 */
export function roundToStep(value: number, step: number): number {
  if (step === 0) throw new Error("The `step` cannot be zero.");
  if (!isFinite(step)) throw new Error("The `step` cannot be infinite.");
  return Math.round(value / step) * step;
}

/**
 * Finds the nearest number in an array to the given value. Tie-breaking is
 * controlled via `bias`.
 *
 * @note The sort order of the given `items` is important when using a `bias`
 * of `first` or `last`. It will influence tie-breaking if the nearest value is
 * equidistant from multiple values.
 */
// This is O(n) but it's not like we're computing arrays with millions of items,
// it'll be fine. Intentional design decision to avoid sorting items, which
// should be handled by consumers as required.
export function findNearest(
  value: number,
  items: number[],
  bias: "first" | "last" | "smaller" | "larger" = "first",
): number {
  if (!isNonEmpty(items)) {
    throw new Error("Items must not be empty.");
  }

  const [first, ...rest] = items;
  let best = first;
  let bestDiff = Math.abs(first - value);

  for (const item of rest) {
    const diff = Math.abs(item - value);

    if (diff < bestDiff) {
      best = item;
      bestDiff = diff;
    } else if (diff === bestDiff) {
      switch (bias) {
        case "first":
          // keep existing best
          break;
        case "last":
          best = item;
          break;
        case "smaller":
          if (item <= value && (best > value || item > best)) {
            best = item;
          }
          break;
        case "larger":
          if (item >= value && (best < value || item < best)) {
            best = item;
          }
          break;
      }
    }
  }

  return best;
}

/**
 * Generate a sequence of numbers, in ascending or descending order. Floating
 * point precision is inferred from the `step` provided.
 *
 * @example
 * ```ts
 * sequence(0, 1, 0.25) // [0, 0.25, 0.5, 0.75, 1]
 * sequence(10, 0, 3)   // [10, 7, 4, 1]
 * ```
 *
 * @param start The start of the sequence.
 * @param end The end of the sequence.
 * @param step The size of the step. Default is `1`.
 */
export function sequence(
  start: number,
  end: number,
  step: number = 1,
): number[] {
  if (step === 0) throw new Error("The `step` cannot be zero.");
  if (!isFinite(step)) throw new Error("The `step` cannot be infinite.");

  const precision = Math.max(0, (step.toString().split(".")[1] ?? "").length);
  const result: number[] = [];
  let current = start;
  step = Math.abs(step);

  if (start < end) {
    while (current <= end) {
      result.push(roundToPrecision(current, precision));
      current += step;
    }
  } else {
    while (current >= end) {
      result.push(roundToPrecision(current, precision));
      current -= step;
    }
  }

  return result;
}

// Interpolation ---------------------------------------------------------------

/**
 * Linear interpolation is a method for finding a value between two points on a
 * straight line.
 *
 * @example
 * ```ts
 * lerp(100, 200, 0.5) // 150
 * ```
 *
 * @param from - The start of the range
 * @param to - The end of the range
 * @param value - The value to interpolate
 *
 * @returns The interpolated value between `from` and `to`.
 */
export function lerp(from: number, to: number, value: number) {
  return from * (1 - value) + to * value;
}

/**
 * Inverse linear interpolation is a method for finding the interpolation factor
 * (t) between two points on a straight line.
 *
 * @example
 * ```ts
 * unlerp(100, 200, 150) // 0.5
 * ```
 *
 * @param from - The start of the range
 * @param to - The end of the range
 * @param value - The value to interpolate
 *
 * @returns The interpolation factor (0.0-1.0) between `from` and `to`.
 */
export function unlerp(from: number, to: number, value: number) {
  const delta = to - from;

  // zero range (from === to):
  //  0/0 = NaN, clamped to 0
  // -n/0 = -Infinity, clamped to 0
  //  n/0 = Infinity, clamped to 1
  if (delta === 0) return value > to ? 1 : 0;

  const t = (value - from) / delta;
  return clamp(t, 0, 1);
}

/**
 * Map a value from one range to another using linear interpolation.
 *
 * @example
 * ```ts
 * remap(5, [0, 10], [0, 100]) // 50
 * ```
 *
 * @example
 * ```ts
 * const rect = target.getBoundingClientRect()
 * const offset = remap(window.scrollY, [rect.top, rect.bottom], [0, rect.height])
 * target.style.transform = `translateY(${offset}px)`
 * ```
 *
 * @param value - The value to map
 * @param inputRange - A linear series of numbers (ascending or descending)
 * @param outputRange - A numeric array of the same length as the input range
 * @param options.clamp - Whether to clamp the value to the output range. Defaults to `true`.
 *
 * @returns The mapped value between `outputRange[0]` and `outputRange[1]`.
 */
export function remap(
  value: number,
  inputRange: [number, number],
  outputRange: [number, number],
  options: { clamp?: boolean } = {},
) {
  const from = inputRange[0];
  const to = inputRange[1];
  const delta = to - from;

  // handle degenerate range
  const tRaw = delta === 0 ? (value > to ? 1 : 0) : (value - from) / delta;
  const t = options.clamp !== false ? clamp(tRaw, 0, 1) : tRaw;

  return lerp(outputRange[0], outputRange[1], t);
}
