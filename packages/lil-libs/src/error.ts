/**
 * Error parsing, normalization, and type guards.
 *
 * @module
 */

import { isPlainObject } from "./object";
import { isString } from "./string";

/** Fallback message used when no error message can be extracted. */
export const UNKNOWN_ERROR_MESSAGE = "An unknown error occurred.";

/**
 * Guard for native `Error` instances.
 *
 * @example
 * isError(new Error("boom")); // true
 * isError("boom"); // false
 *
 * @param value - Unknown value to test.
 * @returns `true` when `value` is an `Error` instance.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Guard for error-like objects exposing a string `message` property.
 *
 * @example
 * isErrorLike({ message: "boom" }); // true
 * isErrorLike({ message: 123 }); // false
 *
 * @param value - Unknown value to test.
 * @returns `true` for native `Error` instances or plain objects with a string `message` property.
 */
export function isErrorLike(
  value: unknown,
): value is { message: string; [key: string]: unknown } {
  return isError(value) || (isPlainObject(value) && isString(value["message"]));
}

/**
 * Returns a human-readable error message from unknown input.
 *
 * For native `Error` values, uses `error.message`. For error-like objects with a
 * string `message`, uses `value.message`. String inputs are returned as-is. All other
 * values receive the fallback message.
 *
 * @example
 * parseError(new Error("Boom")); // "Boom"
 * parseError("Something went wrong"); // "Something went wrong"
 * parseError({ message: "from object" }); // "from object"
 * parseError(null); // "An unknown error occurred."
 * parseError({ message: 123 }); // "An unknown error occurred."
 * parseError(null, "Custom fallback"); // "Custom fallback"
 *
 * @param value - Thrown value or error payload: native `Error`, error-like object, string, or anything else.
 * @param fallbackMessage - Message returned when `value` has no extractable message. Defaults to {@link UNKNOWN_ERROR_MESSAGE}.
 * @returns `value.message` for errors and error-like objects; strings as-is; otherwise `fallbackMessage`.
 */
export function parseError(
  value: unknown,
  fallbackMessage = UNKNOWN_ERROR_MESSAGE,
): string {
  if (isErrorLike(value)) return value.message;
  if (isString(value)) return value;

  return fallbackMessage;
}

/**
 * Returns an `Error` instance from unknown thrown input.
 *
 * Returns the input unchanged when it is already an `Error`. Wraps strings in a new
 * `Error`. For error-like objects, copies `message` and preserves `name`/`stack` when
 * present.
 *
 * @example
 * ensureError(new Error("boom")); // same Error instance
 * ensureError("boom"); // Error("boom")
 * ensureError({ message: "boom", name: "CustomError" }); // Error with copied metadata
 *
 * @param error - Unknown thrown value from a `catch` block or Promise rejection.
 * @returns The same `Error` when already an instance; a new `Error` for strings and error-like objects (copying `name`/`stack` when present); a serialized fallback for other values.
 */
export function ensureError(error: unknown): Error {
  if (isError(error)) return error;

  if (isString(error)) {
    return new Error(error || UNKNOWN_ERROR_MESSAGE);
  }

  if (isErrorLike(error)) {
    const err = new Error(error.message);

    if (isString(error["stack"])) {
      err.stack = error["stack"];
    }

    if (isString(error["name"])) {
      err.name = error["name"];
    }

    return err;
  }

  try {
    return new Error(`Error: ${JSON.stringify(error)}`);
  } catch {
    return new Error(`Error: ${String(error)}`);
  }
}
