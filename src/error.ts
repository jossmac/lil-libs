import { isPlainObject } from "./object";
import { isString } from "./string";

export const UNKNOWN_ERROR_MESSAGE = "An unknown error occurred.";

/**
 * Type guard for native Error instances.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard for Error-like values.
 *
 * @returns `true` if the value is either; a native `Error` instance, or an object that exposes a `"message"` property.
 */
export function isErrorLike(
  value: unknown,
): value is { message: string; [key: string]: unknown } {
  return isError(value) || (isPlainObject(value) && isString(value["message"]));
}

/**
 * Extracts a human-readable message from an unknown error input.
 *
 * Behavior:
 * - returns value.message for Error or error-like objects
 * - returns the input directly when it is a string
 * - otherwise returns fallbackMessage
 *
 * @param value Any value that may represent an error.
 * @param fallbackMessage Message to use when no message can be extracted.
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
 * Converts an unknown input into a real Error instance.
 *
 * Behavior:
 * - returns the input unchanged when it is already an Error
 * - wraps strings in a new Error (empty strings use UNKNOWN_ERROR_MESSAGE)
 * - for error-like objects, copies message and preserves name/stack when present
 * - for all other values, attempts JSON serialization and falls back to String()
 *
 * @param error Unknown thrown value.
 * @returns An Error instance suitable for logging and rethrowing.
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
