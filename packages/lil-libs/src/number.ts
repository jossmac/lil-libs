/**
 * Number utilities: guards, clamping, rounding, sequences, and interpolation.
 *
 * @module
 */

import { isPopulatedArray } from "./array";
import { assert } from "./assert";

/**
 * Runtime guard for JavaScript numbers, excluding `NaN`.
 *
 * Does not exclude `Infinity` or `-Infinity`.
 *
 * @example
 * isNumber(42); // true
 * isNumber(Infinity); // true
 * isNumber(NaN); // false
 * isNumber("42"); // false
 *
 * @param value - Unknown value to test.
 * @returns `true` when `value` is a `number` that is not `NaN`; `Infinity` and `-Infinity` pass.
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
 * isFiniteNumber(NaN); // false
 *
 * @param value - Unknown value to test.
 * @returns `true` when {@link isNumber} passes and the value is finite (excludes `Infinity`, `-Infinity`, and `NaN`).
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
 * isAscending([]); // true (0- and 1-element arrays pass)
 *
 * @param items - Array of numbers to compare pairwise.
 * @returns `true` when each element is greater than or equal to the previous; arrays of length 0 or 1 always pass.
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
 * isDescending([42]); // true (single-element arrays pass)
 *
 * @param items - Array of numbers to compare pairwise.
 * @returns `true` when each element is less than or equal to the previous; arrays of length 0 or 1 always pass.
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
 *
 * @param value - Number to constrain.
 * @param min - Lower bound (inclusive).
 * @param max - Upper bound (inclusive).
 * @returns `value` when within `[min, max]`, otherwise the nearest bound.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Rounds a number to a fixed number of decimal places.
 *
 * When `digits <= 0`, rounds to the nearest integer. The `base` parameter
 * defaults to `10`; most callers should leave it unchanged.
 *
 * @example
 * roundToPrecision(3.14159, 2); // 3.14
 * roundToPrecision(3.005, 2); // 3.01
 * roundToPrecision(3.7, 0); // 4
 *
 * @param value - Number to round.
 * @param digits - Fractional digits to keep; values `<= 0` delegate to `Math.round`.
 * @param base - Radix used for scaling (default `10`); most callers should leave this unchanged.
 * @returns `value` rounded to `digits` decimal places at the given `base`.
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
 * @param value - Number to round.
 * @param step - Interval to snap to; must be finite and non-zero.
 * @returns The nearest multiple of `step` to `value`.
 * @throws When `step` is `0`, or fails the {@link isFiniteNumber} guard.
 */
export function roundToStep(value: number, step: number): number {
  assert(step !== 0, "The `step` cannot be zero.");
  assert(isFiniteNumber(step), "The `step` cannot be infinite.");
  return Math.round(value / step) * step;
}

/**
 * Returns the closest value in `items`, with configurable tie-breaking.
 *
 * Bias options: `"first"` / `"last"` keep the earlier or later tied candidate;
 * `"smaller"` / `"larger"` prefer the numerically smaller or larger tied value.
 *
 * @example
 * const items = [9, 7, 5, 3, 1];
 * findNearest(4, items); // 5 (default bias: "first")
 * findNearest(4, items, "last"); // 3
 * findNearest(4, items, "smaller"); // 3
 * findNearest(4, items, "larger"); // 5
 *
 * @param value - Target number to match against.
 * @param items - Non-empty list of candidates; order matters for tie-breaking.
 * @param bias - Which candidate wins when distances are equal. Defaults to `"first"`.
 * @returns The item in `items` closest to `value`, using `bias` to break ties.
 * @throws When `items` is empty (via {@link isPopulatedArray}).
 */
// This is O(n) but it's not like we're computing arrays with millions of items,
// it'll be fine. Intentional design decision to avoid sorting items, which
// should be handled by consumers as required.
export function findNearest(
  value: number,
  items: number[],
  bias: "first" | "last" | "smaller" | "larger" = "first",
): number {
  assert(isPopulatedArray(items), "Items must not be empty.");

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
 * Builds an inclusive numeric array from `start` to `end`.
 *
 * Accepts negative `step` values (the absolute step size is used). Decimal
 * precision is derived from `step`.
 *
 * @example
 * sequence(1, 5); // [1, 2, 3, 4, 5]
 * sequence(5, 1); // [5, 4, 3, 2, 1]
 * sequence(0, 1, 0.33); // [0, 0.33, 0.66, 0.99]
 *
 * @param start - First value in the sequence (inclusive).
 * @param end - Last value in the sequence (inclusive).
 * @param step - Absolute increment between values; sign is ignored. Defaults to `1`.
 * @returns An ascending or descending array from `start` to `end`, rounded to the precision implied by `step`.
 * @throws When `step` is `0`, or fails the {@link isFiniteNumber} guard.
 */
export function sequence(
  start: number,
  end: number,
  step: number = 1,
): number[] {
  assert(step !== 0, "The `step` cannot be zero.");
  assert(isFiniteNumber(step), "The `step` cannot be infinite.");

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
 * lerp(0, 100, 1.5); // 150 (not clamped; extrapolates beyond 0..1)
 *
 * @param from - Value at interpolation factor `0`.
 * @param to - Value at interpolation factor `1`.
 * @param value - Interpolation factor; typically in `0..1` but not clamped.
 * @returns `from + (to - from) * value`.
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
 * @param from - Range start mapped to `0`.
 * @param to - Range end mapped to `1`.
 * @param value - Number to express as a factor within the range.
 * @returns A factor in `0..1` for where `value` falls between `from` and `to`; clamped at the ends. When `from === to`, returns `1` if `value > to`, otherwise `0`.
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
 * Maps a numeric value from one range to another via linear interpolation.
 *
 * Clamps to the output range by default. Supports negative and floating-point
 * ranges. Pass `{ clamp: false }` to allow extrapolation. Degenerate input
 * ranges (`from === to`) map predictably.
 *
 * @example
 * remap(5, [0, 10], [0, 100]); // 50
 * remap(-5, [-10, 0], [0, 100]); // 50
 * remap(7.5, [0, 10], [-20, -10]); // -12.5
 * remap(-5, [0, 10], [0, 100]); // 0 (clamped)
 * remap(15, [0, 10], [0, 100]); // 100 (clamped)
 * remap(15, [0, 10], [0, 100], { clamp: false }); // 150
 *
 * @param value - Input value to map from `inputRange`.
 * @param inputRange - Two-element source range `[from, to]`.
 * @param outputRange - Two-element destination range mapped via linear interpolation.
 * @param options - Optional settings; `clamp` defaults to `true`, constraining the result to `outputRange`.
 * @returns The linearly mapped value in `outputRange`; extrapolates when `clamp` is `false`.
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
