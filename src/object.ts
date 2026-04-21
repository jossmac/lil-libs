import type { UnknownRecord, Widen } from "./types";

type ObjectEntry<T> = { [K in keyof T]: [K, T[K]] }[keyof T];

/**
 * Checks if value is a plain object, that is, an object created by the Object constructor or one with a [[Prototype]] of null.
 *
 * @note This approach assumes objects created by the Object constructor have no inherited enumerable properties.
 *
 * @param value - The value to check.
 * @return Returns true if value is a plain object, else false.
 */
export function isPlainObject(value: unknown): value is UnknownRecord {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * A handful of "drop-in" replacement `Object` method alternatives that avoid
 * type widening.
 */
export const TObject = {
  keys: typedKeys,
  entries: typedEntries,
  fromEntries: typedFromEntries,
};

/**
 * An alternative to `Object.keys()` that avoids type widening.
 *
 * @example
 * Object.keys({ foo: 1, bar: 2 }) // string[]
 * typedKeys({ foo: 1, bar: 2 }) // ("foo" | "bar")[]
 */
export function typedKeys<T extends object>(value: T) {
  return Object.keys(value) as Array<keyof T>;
}

/**
 * An alternative to `Object.entries()` that avoids type widening.
 *
 * @example
 * Object.entries({ foo: 1, bar: 2 }) // [string, number][]
 * typedEntries({ foo: 1, bar: 2 }) // ["foo" | "bar", number][]
 */
export function typedEntries<T extends object>(value: T) {
  return Object.entries(value) as ObjectEntry<T>[];
}

/**
 * An alternative to `Object.fromEntries()` that avoids type widening. Must be
 * used in conjunction with `typedEntries` or `typedKeys`.
 *
 * @example
 * const entries = [['foo', 1], ['bar', 'hello'], ['baz', true]] as const;
 * const obj1 = Object.fromEntries(entries);
 * //    ^? { [key: string]: any }
 * const obj2 = TObject.fromEntries(entries);
 * //    ^? { foo: number, bar: string, baz: boolean }
 */
export function typedFromEntries<
  const Entries extends ReadonlyArray<readonly [PropertyKey, unknown]>,
>(entries: Entries) {
  return Object.fromEntries(entries) as {
    [E in Entries[number] as E[0]]: Widen<E[1]>;
  };
}
