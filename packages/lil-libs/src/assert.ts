/**
 * Assertion helpers for runtime checks and exhaustive union handling.
 *
 * @module
 */

/**
 * Asserts that a value is present (or that a boolean is `true`). Narrows types
 * after the assertion.
 *
 * @example
 * function getName(id: number): string | undefined;
 *
 * const maybeName = getName(123);
 * assert(maybeName, "Name is required");
 * const name = maybeName;
 * //    ^? string
 *
 * @param value - Value to assert. For booleans, must be `true`; for other types, must not be `null` or `undefined`. Other falsy values such as `0` and `""` pass.
 * @param message - Optional error message when the assertion fails. Defaults to `"Assertion failed"`.
 * @throws If `value` is `false`, `null`, or `undefined`. Does not throw for other falsy values like `0` and `""`.
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
 * Throws for unreachable branches in discriminated unions.
 *
 * @example
 * switch (status.kind) {
 *   case "idle":
 *   case "loading":
 *   case "done":
 *     break;
 *   default:
 *     assertNever(status.kind);
 * }
 *
 * @param arg - Exhaustiveness-check value that should be typed `never` when all union cases are handled.
 * @returns Never — always throws.
 * @throws Always, with a message that includes the unexpected value.
 */
export function assertNever(arg: never): never {
  throw new Error(
    "Expected never to be called, but received: " + JSON.stringify(arg),
  );
}

/**
 * A convenience wrapper around {@link assert} that returns the value if the
 * assertion passes.
 *
 * @example
 * function findUser(id: number): User | null;
 *
 * const user = ensure(findUser(123), "User is required");
 * //    ^? User
 *
 * @param value - Value to assert present or true. Same rules as {@link assert}.
 * @param message - Optional error message when the assertion fails. Defaults to `"Assertion failed"`.
 * @returns The asserted `value`, narrowed to `T`.
 * @throws If `value` is `false`, `null`, or `undefined`.
 */
export function ensure<T>(
  value: T | false | null | undefined,
  message?: string,
): T;
export function ensure(value: unknown, message?: string) {
  assert(value, message);
  return value;
}
