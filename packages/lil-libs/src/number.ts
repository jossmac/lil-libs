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

  return items.every((x, i, arr) => {
    if (i === 0) return true;
    const previous = arr[i - 1];
    return previous !== undefined && previous <= x;
  });
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

  return items.every((x, i, arr) => {
    if (i === 0) return true;
    const previous = arr[i - 1];
    return previous !== undefined && previous >= x;
  });
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
 * Rounds by the decimal value as written, so `1.005` rounds to `1.01` even
 * though its binary representation is slightly below `1.005`. Halfway values
 * round away from zero. When `digits <= 0`, rounds to the nearest integer. The
 * `base` parameter defaults to `10`; most callers should leave it unchanged.
 *
 * @example
 * roundToPrecision(3.14159, 2); // 3.14
 * roundToPrecision(1.005, 2); // 1.01
 * roundToPrecision(-2.5, 0); // -3
 * roundToPrecision(3.7, 0); // 4
 *
 * @param value - Number to round.
 * @param digits - Fractional digits to keep; values `<= 0` round to the nearest integer.
 * @param base - Radix used for scaling (default `10`); most callers should leave this unchanged.
 * @returns `value` rounded to `digits` decimal places at the given `base`; values that already fit within `digits` are returned unchanged.
 */
export function roundToPrecision(
  value: number,
  digits: number,
  base: number = 10,
): number {
  if (digits <= 0) {
    return symmetricRound(value);
  }

  if (base !== 10) {
    const pow = Math.pow(base, digits);
    return symmetricRound(value * pow) / pow;
  }

  if (countDecimals(value) <= digits) {
    return value;
  }

  return shiftDecimal(symmetricRound(shiftDecimal(value, digits)), -digits);
}

/**
 * Rounds a number to the nearest step interval.
 *
 * Works on the decimal values as written, so results are free of floating-point
 * noise and halfway values are detected exactly. Halfway values round away from
 * zero.
 *
 * @example
 * roundToStep(5.26, 0.25); // 5.25
 * roundToStep(-5.26, 0.25); // -5.25
 * roundToStep(0.35, 0.1); // 0.4
 *
 * @param value - Number to round.
 * @param step - Interval to snap to; must be finite and non-zero. The sign is ignored.
 * @returns The nearest multiple of `step` to `value`, at the decimal precision of `step`. Values too large to be affected by `step` are returned unchanged.
 * @throws When `step` is `0`, or fails the {@link isFiniteNumber} guard.
 */
export function roundToStep(value: number, step: number): number {
  assert(step !== 0, "The `step` cannot be zero.");
  assert(isFiniteNumber(step), "The `step` cannot be infinite.");

  const digits = countDecimals(step);
  const scaledStep = shiftDecimal(Math.abs(step), digits);

  if (scaledStep >= MAX_EXACT_SCALED) {
    const rounded = symmetricRound(value / step) * step;
    // `toFixed` only accepts 0..100 digits
    return Number(rounded.toFixed(Math.min(digits, 100)));
  }

  const quotient = shiftDecimal(value, digits) / scaledStep;
  // already a whole number of steps at float resolution (or not finite)
  if (!(Math.abs(quotient) < 2 ** 52)) return value;

  return shiftDecimal(symmetricRound(quotient) * scaledStep, -digits);
}

// Integers below this have at most 15 significant digits, which survive a
// round-trip through decimal strings; longer ones are likely computed floats
// (e.g. `1 / 3`) rather than decimal literals.
const MAX_EXACT_SCALED = 1e15;

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
    // distances within a few rounding errors of each other are ties, e.g. 0.3
    // is 0.09999999999999998 from 0.2 but 0.10000000000000003 from 0.4
    const scale = Math.max(Math.abs(value), Math.abs(item), Math.abs(best));
    const tolerance = Number.isFinite(scale) ? 4 * Number.EPSILON * scale : 0;
    const isTie = diff === bestDiff || Math.abs(diff - bestDiff) <= tolerance;

    if (!isTie && diff < bestDiff) {
      best = item;
      bestDiff = diff;
    } else if (isTie) {
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
 * precision is derived from `start` and `step`.
 *
 * @example
 * sequence(1, 5); // [1, 2, 3, 4, 5]
 * sequence(5, 1); // [5, 4, 3, 2, 1]
 * sequence(0, 1, 0.33); // [0, 0.33, 0.66, 0.99]
 * sequence(0, 0.3, 0.1); // [0, 0.1, 0.2, 0.3]
 *
 * @param start - First value in the sequence (inclusive).
 * @param end - Last value in the sequence (inclusive).
 * @param step - Absolute increment between values; sign is ignored. Defaults to `1`.
 * @returns An ascending or descending array from `start` to `end`, rounded to the precision implied by `start` and `step`.
 * @throws When `step` is `0`, or when `step`, `start` or `end` fails the {@link isFiniteNumber} guard.
 */
export function sequence(
  start: number,
  end: number,
  step: number = 1,
): number[] {
  assert(step !== 0, "The `step` cannot be zero.");
  assert(isFiniteNumber(step), "The `step` cannot be infinite.");
  assert(
    isFiniteNumber(start) && isFiniteNumber(end),
    "The `start` and `end` must be finite.",
  );

  step = Math.abs(step);
  const direction = start <= end ? 1 : -1;
  const digits = Math.max(
    countDecimals(start),
    countDecimals(end),
    countDecimals(step),
  );
  const scaledStart = shiftDecimal(start, digits);
  const scaledEnd = shiftDecimal(end, digits);
  const scaledStep = shiftDecimal(step, digits);

  const isExact = [scaledStart, scaledEnd, scaledStep].every(
    (n) => Math.abs(n) < MAX_EXACT_SCALED,
  );

  if (isExact) {
    const count =
      Math.floor(Math.abs(scaledEnd - scaledStart) / scaledStep) + 1;
    return Array.from({ length: count }, (_, i) =>
      shiftDecimal(scaledStart + direction * i * scaledStep, -digits),
    );
  }

  const steps = Number((Math.abs(end - start) / step).toPrecision(15));
  return Array.from({ length: Math.floor(steps) + 1 }, (_, i) =>
    roundToPrecision(start + direction * i * step, digits),
  );
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
 * @returns `from * (1 - value) + to * value`, which is exact at `value` `0` and `1`.
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

// Helpers ---------------------------------------------------------------------

/** Counts the decimal places of a number, including exponent notation (e.g. `1e-7`). */
function countDecimals(value: number): number {
  const [mantissa, exponent] = splitDecimal(value);
  const fractionLength = mantissa.split(".")[1]?.length ?? 0;
  return Math.max(0, fractionLength - Number(exponent));
}

/**
 * Moves the decimal point of a number by `places` (positive is right, negative
 * is left), using its string form so `shiftDecimal(1.005, 2)` is exactly `100.5`.
 */
function shiftDecimal(value: number, places: number): number {
  const [mantissa, exponent] = splitDecimal(value);
  return Number(`${mantissa}e${Number(exponent) + places}`);
}

/** Like `Math.round`, but negative halves round away from zero (`-2.5` → `-3`). */
function symmetricRound(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/**
 * Splits a number into its mantissa and exponent components.
 *
 * @example
 * splitDecimal(1.23); // ["1.23", "0"]
 * splitDecimal(1.23e-4); // ["1.23", "-4"]
 *
 * @param value - Number to split.
 * @returns A tuple of the mantissa and exponent, as strings.
 */
function splitDecimal(value: number): [string, string] {
  const [mantissa = "", exponent = "0"] = value.toString().split("e");
  return [mantissa, exponent];
}
