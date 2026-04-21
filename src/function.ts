/**
 * No-operation function. Serves as a placeholder in code where a function is
 * expected but no specific action is currently required.
 */
export function noop() {
  // do nothing
}

/**
 * Creates a function that returns the logical negation of the given predicate.
 */
export function not<T extends unknown[], R>(
  predicate: (...args: T) => R,
): (...args: T) => boolean {
  return (...args: T) => !predicate(...args);
}

/**
 * Narrow a type to exclude `null` and `undefined`.
 *
 * @example
 * const arr = [42, null, undefined, 65].filter(Boolean);
 * //   ^? (number | null | undefined)[]
 * const arr = [42, null, undefined, 65].filter(isDefined);
 * //   ^? number[]
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

/**
 * Resolves a value that may either be a direct value or a unary function
 * producing that value.
 *
 * If `value` is a function, it will be invoked with `arg` and its return
 * value will be returned. Otherwise, `value` itself is returned.
 *
 * @param value - A value or a unary function producing that value.
 * @param arg - Argument forwarded to the function variant.
 *
 * @example
 * resolveMaybeFn(42); // 42
 * resolveMaybeFn((x: number) => x * 2, 21); // 42
 */
export function resolveMaybeFn<V, A>(value: V | ((arg: A) => V), arg?: A): V {
  return typeof value === "function"
    ? (value as (arg: A) => V)(arg as A)
    : value;
}

/**
 * Creates a lazily-evaluated value computed on first access and cached.
 *
 * @example
 * const expensive = lazy(() => computeExpensiveThing());
 * console.log(expensive.value); // computed here
 * console.log(expensive.value); // cached, not recomputed
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

export type Lazy<T> = { readonly value: T };
