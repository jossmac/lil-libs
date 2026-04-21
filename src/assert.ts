/**
 * Asserts that a value is "truthy".
 *
 * @throws If the value is `false`, `null`, or `undefined`.
 *
 * @note Be cautious with values like `0`, `''`, as they will not throw an error. Resolve the value to `boolean` before asserting against falsy values e.g.
 * ```
 * assert(value !== 0, "Value cannot be zero");
 * assert(value !== '', "Value cannot be an empty string");
 * ```
 */
export function assert(value: boolean, message?: string): asserts value;
export function assert<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T;
export function assert(value: unknown, message?: string) {
  if (value === false || value === null || typeof value === "undefined") {
    throw new Error(message || "Assertion failed");
  }
}

/**
 * A helper function for exhaustive checks of discriminated unions. Asserts that
 * allegedly unreachable code has been executed.
 *
 * @throws Always.
 */
export function assertNever(arg: never): never {
  throw new Error(
    "Expected never to be called, but received: " + JSON.stringify(arg),
  );
}

/**
 * A convenience wrapper around {@link assert} that returns the value if the assertion passes.
 *
 * @returns The original value if it is truthy.
 * @throws If the value is `false`, `null`, or `undefined`.
 */

export function ensure<T>(
  value: T | false | null | undefined,
  message?: string,
): T;
export function ensure(value: unknown, message?: string) {
  assert(value, message);
  return value;
}
