/**
 * Typed object helpers that avoid key/value widening.
 *
 * @module
 */

import { isPopulatedArray } from "./array";
import { assert } from "./assert";
import type { UnknownRecord, Widen } from "./types";

type ObjectEntry<T> = { [K in keyof T]: [K, T[K]] }[keyof T];

/**
 * Checks whether a value is a plain object (including `Object.create(null)`).
 *
 * @example
 * isPlainObject({}); // true
 * isPlainObject(Object.create(null)); // true
 * isPlainObject([]); // false
 * isPlainObject(new Date()); // false
 *
 * @param value - Unknown value to test.
 * @returns `true` for objects whose prototype is `Object.prototype` or `null` (including `Object.create(null)`); `false` for arrays, class instances, and non-objects.
 */
export function isPlainObject(value: unknown): value is UnknownRecord {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Namespace-like wrapper around the typed object helpers.
 *
 * @example
 * const keys = TObject.keys({ foo: 1, bar: "hello" });
 * //    ^? ("foo" | "bar")[]
 */
export const TObject = {
  keys: typedKeys,
  entries: typedEntries,
  fromEntries: typedFromEntries,
};

/**
 * Typed alternative to `Object.keys()` that preserves key inference.
 *
 * @example
 * const obj = { foo: 1, bar: "hello" };
 * const keys = typedKeys(obj);
 * //    ^? ("foo" | "bar")[]
 *
 * @param value - Object whose own enumerable string keys to collect.
 * @returns An array typed as `(keyof T)[]` rather than `string[]`.
 */
export function typedKeys<T extends object>(value: T) {
  return Object.keys(value) as Array<keyof T>;
}

/**
 * Like {@link typedKeys}, but narrows the return type to a non-empty tuple.
 * Throws if the object has no own enumerable keys.
 *
 * @example
 * const obj = { foo: 1, bar: "hello" };
 * const keys = populatedKeys(obj);
 * //    ^? ["foo" | "bar", ...("foo" | "bar")[]]
 *
 * populatedKeys({}); // throws "Object has no keys."
 *
 * @param value - Object that must have at least one own enumerable key.
 * @returns Same keys as {@link typedKeys}, narrowed to a non-empty tuple type.
 * @throws When `value` has no own enumerable keys.
 */
export function populatedKeys<T extends object>(
  value: T,
): [keyof T, ...(keyof T)[]] {
  const keys = typedKeys(value);
  assert(isPopulatedArray(keys), "Object has no keys.");
  return keys;
}

/**
 * Typed alternative to `Object.entries()` that preserves key/value tuples.
 *
 * @example
 * const obj = { foo: 1, bar: "hello" };
 * const entries = typedEntries(obj);
 * //    ^? (["foo", number] | ["bar", string])[]
 *
 * @param value - Object whose own enumerable entries to collect.
 * @returns `[key, value]` tuples with preserved keyof/value types instead of `[string, any][]`.
 */
export function typedEntries<T extends object>(value: T) {
  return Object.entries(value) as ObjectEntry<T>[];
}

/**
 * Typed alternative to `Object.fromEntries()` that preserves output shape.
 *
 * @example
 * const entries = [
 *   ["foo", 1],
 *   ["bar", "hello"],
 * ] as const;
 * const rebuilt = typedFromEntries(entries);
 * //    ^? { foo: number; bar: string }
 *
 * @param entries - Key-value pairs to assemble into an object.
 * @returns An object whose keys and value types are inferred from the `entries` tuple.
 */
export function typedFromEntries<
  const Entries extends ReadonlyArray<readonly [PropertyKey, unknown]>,
>(entries: Entries) {
  return Object.fromEntries(entries) as {
    [E in Entries[number] as E[0]]: Widen<E[1]>;
  };
}
