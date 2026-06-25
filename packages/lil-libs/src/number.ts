/**
 * Number utilities: guards, clamping, rounding, sequences, and interpolation.
 *
 * @module
 */

import { isPopulatedArray } from "./array";

/**
 * Runtime guard for JavaScript numbers, excluding `NaN`.
 *
 * @example
 * isNumber(42); // true
 * isNumber(Infinity); // true
 * isNumber(NaN); // false
 * isNumber("foo"); // false
 *
 * @remarks Does not exclude `Infinity` or `-Infinity`.
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/**
 * A convenience wrapper around {@link isNumber} that also checks whether the
 * value is finite.
 *
 * @example
 * isFiniteNumber(42); // true
 * isFiniteNumber(Infinity); // false
 */
export function isFiniteNumber(value: unknown): value is number {
  return isNumber(value) && Number.isFinite(value);
}

/**
 * Checks whether an array is in ascending order (allowing equal neighbouring values).
 *
 * @example
 * isAscending([1, 1, 2, 3]); // true
 * isAscending([3, 2, 1]); // false
 *
 * @param items - The array of numbers to inspect.
 */
export function isAscending(items: number[]): boolean {
  // arrays with 0 or 1 elements are trivially sorted
  if (items.length <= 1) return true;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- indices are guaranteed to be valid
  return items.every((x, i, arr) => i === 0 || arr[i - 1]! <= x);
}

/**
 * Checks whether an array is in descending order (allowing equal neighbouring values).
 *
 * @example
 * isDescending([3, 3, 2, 1]); // true
 * isDescending([1, 2, 3]); // false
 *
 * @param items - The array of numbers to inspect.
 */
export function isDescending(items: number[]): boolean {
  // arrays with 0 or 1 elements are trivially sorted
  if (items.length <= 1) return true;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- indices are guaranteed to be valid
  return items.every((x, i, arr) => i === 0 || arr[i - 1]! >= x);
}

/**
 * Constrains a number to an inclusive range.
 *
 * @example
 * clamp(5, 0, 10); // 5
 * clamp(-5, 0, 10); // 0
 * clamp(15, 0, 10); // 10
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Rounds a number to a specified number of fractional digits.
 *
 * @example
 * roundToPrecision(3.14159, 2); // 3.14
 * roundToPrecision(3.005, 2); // 3.01
 *
 * @remarks `digits <= 0` behaves like `Math.round()`. `base` defaults to `10`;
 * most callers should leave it unchanged.
 *
 * @param value - The number to round.
 * @param digits - The number of fractional digits to round to.
 * @param base - The base to round to (default `10`).
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
 * Rounds a number to the nearest step interval.
 *
 * @example
 * roundToStep(5.26, 0.25); // 5.25
 * roundToStep(-5.26, 0.25); // -5.25
 *
 * @remarks Throws for `step = 0` or non-finite step values like `Infinity` and `NaN`.
 *
 * @param value - The number to round.
 * @param step - The step size to round to.
 */
export function roundToStep(value: number, step: number): number {
  if (step === 0) throw new Error("The `step` cannot be zero.");
  if (!isFinite(step)) throw new Error("The `step` cannot be infinite.");
  return Math.round(value / step) * step;
}

/**
 * Returns the closest value from a list, with configurable tie-breaking.
 *
 * @example
 * const items = [1, 3, 5, 7, 9];
 *
 * findNearest(4, items); // 3 (default bias: "first")
 * findNearest(4, items, "last"); // 5
 * findNearest(4, items, "smaller"); // 3
 * findNearest(4, items, "larger"); // 5
 *
 * @remarks Bias options: `"first"` / `"last"` prefer the item that appears earlier
 * or later in the array; `"smaller"` / `"larger"` prefer the numerically smaller
 * or larger tied value. Throws if `items` is empty.
 */
// This is O(n) but it's not like we're computing arrays with millions of items,
// it'll be fine. Intentional design decision to avoid sorting items, which
// should be handled by consumers as required.
export function findNearest(
  value: number,
  items: number[],
  bias: "first" | "last" | "smaller" | "larger" = "first",
): number {
  if (!isPopulatedArray(items)) {
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
 * Generates inclusive numeric sequences in ascending or descending order.
 *
 * @example
 * sequence(1, 5); // [1, 2, 3, 4, 5]
 * sequence(5, 1); // [5, 4, 3, 2, 1]
 * sequence(0, 1, 0.33); // [0, 0.33, 0.66, 0.99]
 *
 * @remarks Includes both start and end when reachable by step increments. Supports
 * negative step input (uses absolute step size). Derives decimal precision from
 * the provided step. Throws for `step = 0` or non-finite step values.
 *
 * @param start - The start of the sequence.
 * @param end - The end of the sequence.
 * @param step - The size of the step. Default is `1`.
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

/**
 * Linear interpolation between two values.
 *
 * @example
 * lerp(0, 100, 0.25); // 25
 *
 * @param from - The start of the range.
 * @param to - The end of the range.
 * @param value - The interpolation factor (0–1).
 */
export function lerp(from: number, to: number, value: number) {
  return from * (1 - value) + to * value;
}

/**
 * Inverse interpolation that returns a clamped factor in the `0..1` range.
 *
 * @example
 * unlerp(0, 100, 25); // 0.25
 * unlerp(0, 10, -5); // 0 (clamped)
 * unlerp(0, 10, 15); // 1 (clamped)
 *
 * @param from - The start of the range.
 * @param to - The end of the range.
 * @param value - The value to unlerp.
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
 * Maps a value from one numeric range to another using linear interpolation.
 *
 * @example
 * remap(5, [0, 10], [0, 100]); // 50
 * remap(-5, [-10, 0], [0, 100]); // 50
 * remap(7.5, [0, 10], [-20, -10]); // -12.5
 * remap(-5, [0, 10], [0, 100]); // 0 (clamped)
 * remap(15, [0, 10], [0, 100]); // 100 (clamped)
 * remap(15, [0, 10], [0, 100], { clamp: false }); // 150
 *
 * @remarks Clamps to the output range by default. Supports negative and
 * floating-point ranges. Allows extrapolation with `{ clamp: false }`.
 * Handles degenerate input ranges (`from === to`) predictably.
 *
 * @param value - The value to map.
 * @param inputRange - A two-element numeric range.
 * @param outputRange - A numeric range of the same length as the input range.
 * @param options.clamp - Whether to clamp the value to the output range. Defaults to `true`.
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
