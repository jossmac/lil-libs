/* v8 ignore file -- type-only module with no runtime code */

// Utility types -------------------------------------------------------------

export type Satisfies<T extends Base, Base> = T;

/**
 * Qualify a type with "falsy" values that may be `null` or `undefined`.
 */
export type Maybe<T> = T | undefined | null;

/**
 * Takes a type as its only argument and returns it without intersections,
 * making properties easier to read and understand.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Takes a type and returns a new type with all nullable values removed.
 */
export type NonNullableValues<T> = {
  [P in keyof T]-?: Exclude<T[P], null | undefined>;
};

/**
 * Takes a type and a list of keys, and returns a new type that is the same as
 * the original type, but with the specified keys required.
 */
export type SomeRequired<T, K extends keyof T> = Prettify<
  Omit<T, K> & NonNullableValues<Pick<T, K>>
>;

/**
 * Takes a type and a list of keys, and returns a new type that is the same as
 * the original type, but with the specified keys optional.
 */
export type SomeOptional<T, K extends keyof T> = Prettify<
  Partial<Pick<T, K>> & Omit<T, K>
>;

/**
 * Build a fixed-length tuple of `N` elements, where each element is of type `T`.
 *
 * @typeParam T - The element type for each tuple slot.
 * @typeParam N - The tuple length.
 *
 * @example
 * type ThreeNumbers = TupleOf<number, 3>;
 * //   ^? [number, number, number]
 */
export type TupleOf<
  T,
  N extends number,
  R extends unknown[] = [],
> = R["length"] extends N ? R : TupleOf<T, N, [T, ...R]>;

/**
 * Intentionally widen a literal type to its primitive type.
 *
 * @example
 * type Foo = Widen<'foo' | 'bar' | 1 | 2>;
 * //   ^? string | number
 */
export type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T;

// Convenience types -----------------------------------------------------------

/**
 * A “plain” object type. Use in cases where you might otherwise reach for the
 * `object` type.
 */
export type UnknownRecord = Record<string, unknown>;
