/**
 * Assertion helpers for runtime checks and exhaustive union handling.
 *
 * @module
 */

/**
 * Asserts that a value is present (or that a boolean is `true`).
 *
 * @example
 * function getName(id: number): string | undefined;
 *
 * const maybeName = getName(123);
 * assert(maybeName, "Name is required");
 * const name = maybeName;
 * //    ^? string
 *
 * @remarks Throws for `false`, `null`, and `undefined`. Does not throw for other
 * falsy values like `0` and `""`. Narrows types after the assertion.
 *
 * @throws If the value is `false`, `null`, or `undefined`.
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
 * @throws Always.
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
