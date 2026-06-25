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
 * @returns `true` if the value is a native `Error` or an object with a string `message`.
 */
export function isErrorLike(
  value: unknown,
): value is { message: string; [key: string]: unknown } {
  return isError(value) || (isPlainObject(value) && isString(value["message"]));
}

/**
 * Returns a human-readable error message from unknown input.
 *
 * @example
 * parseError(new Error("Boom")); // "Boom"
 * parseError("Something went wrong"); // "Something went wrong"
 * parseError({ message: "from object" }); // "from object"
 * parseError(null); // "An unknown error occurred."
 * parseError({ message: 123 }); // "An unknown error occurred."
 * parseError(null, "Custom fallback"); // "Custom fallback"
 *
 * @remarks Returns `error.message` for native `Error` values. Returns
 * `value.message` for error-like objects where `message` is a string. Returns
 * string inputs as-is. Returns a fallback message for all other values.
 *
 * @param value - Any value that may represent an error.
 * @param fallbackMessage - Message to use when no message can be extracted.
 * @returns A safe, display-ready error message.
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
 * @example
 * ensureError(new Error("boom")); // same Error instance
 * ensureError("boom"); // Error("boom")
 * ensureError({ message: "boom", name: "CustomError" }); // Error with copied metadata
 *
 * @remarks Returns the input unchanged when it is already an `Error`. Wraps
 * strings in a new `Error`. For error-like objects, copies `message` and
 * preserves `name`/`stack` when present.
 *
 * @param error - Unknown thrown value.
 * @returns An `Error` instance suitable for logging and rethrowing.
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
