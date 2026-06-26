/**
 * Function utilities: predicates, lazy evaluation, and no-ops.
 *
 * @module
 */

/**
 * Does nothing and returns `undefined`.
 *
 * @example
 * button.addEventListener("click", noop);
 *
 * @returns `undefined`.
 */
export function noop() {
  // do nothing
}

/**
 * Inverts a predicate.
 *
 * @example
 * const isEven = (n: number) => n % 2 === 0;
 * const isOdd = not(isEven);
 *
 * isOdd(3); // true
 * isOdd(4); // false
 *
 * @param predicate - Function whose result is inverted with `!`.
 * @returns A function with the same arity that returns `!predicate(...args)`.
 */
export function not<T extends unknown[], R>(
  predicate: (...args: T) => R,
): (...args: T) => boolean {
  return (...args: T) => !predicate(...args);
}

/**
 * Type guard for filtering out `null` and `undefined` without losing type precision.
 *
 * @example
 * const bad = [1, null, 2, undefined, 3].filter(Boolean);
 * //    ^? (number | null | undefined)[]
 *
 * const good = [1, null, 2, undefined, 3].filter(isDefined);
 * //    ^? number[]
 *
 * @param value - Value that may be `null` or `undefined`.
 * @returns `true` when `value` is neither `null` nor `undefined`; narrows the type to exclude both.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

/**
 * Returns a value directly or by invoking a unary function.
 *
 * @example
 * resolveMaybeFn(42); // 42
 * resolveMaybeFn((x: number) => x * 2, 21); // 42
 *
 * @param value - Literal value to return as-is, or a unary function to invoke.
 * @param arg - Argument passed when `value` is a function; ignored otherwise.
 * @returns `value` directly, or the result of `value(arg)` when `value` is a function.
 */
export function resolveMaybeFn<V, A>(value: V | ((arg: A) => V), arg?: A): V {
  return typeof value === "function"
    ? (value as (arg: A) => V)(arg as A)
    : value;
}

/**
 * Returns a lazily computed value that is cached after first access. Access the
 * result via `.value`.
 *
 * @example
 * const settings = lazy(() => loadSettings());
 *
 * settings.value; // computes once
 * settings.value; // cached
 *
 * @param factory - Zero-argument function called on first access to `.value`.
 * @returns A {@link Lazy} handle whose `.value` is computed once on first read and cached thereafter.
 */
export function lazy<T>(factory: () => T): Lazy<T> {
  let cached: T | typeof UNSET = UNSET;

  return {
    get value(): T {
      if (cached === UNSET) {
        cached = factory();
      }
      return cached;
    },
  };
}

const UNSET = Symbol("lazy-unset");

/** A lazily evaluated, cached value accessed via `.value`. */
export type Lazy<T> = { readonly value: T };
