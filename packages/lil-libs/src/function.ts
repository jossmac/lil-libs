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
 * @param value - A value or a unary function producing that value.
 * @param arg - Argument forwarded to the function variant.
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
