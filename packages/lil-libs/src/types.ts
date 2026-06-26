/* v8 ignore file -- type-only module with no runtime code */

/**
 * Utility and convenience TypeScript types.
 *
 * @module
 */

/**
 * Constrains `T` to extend `Base` at compile time while preserving `T`'s exact inferred shape in tooltips and assignability checks.
 *
 * @typeParam T - Concrete type being validated.
 * @typeParam Base - Constraint that `T` must extend.
 *
 * @example
 * type Endpoint = Satisfies<
 *   { method: "GET"; path: "/users" },
 *   { method: "GET" | "POST"; path: string }
 * >;
 * //   ^? { method: "GET"; path: "/users" }
 */
export type Satisfies<T extends Base, Base> = T;

/**
 * Union of `T` with `null` and `undefined` for values that may be absent.
 *
 * @typeParam T - Underlying type when the value is present.
 *
 * @example
 * type MaybeName = Maybe<string>;
 * //   ^? string | null | undefined
 */
export type Maybe<T> = T | undefined | null;

/**
 * Expands intersections and mapped types into a single object shape for clearer editor display.
 *
 * @typeParam T - Type to flatten for display; runtime values are unchanged.
 *
 * @example
 * type Raw = { id: string } & { name: string };
 * type User = Prettify<Raw>;
 * //   ^? { id: string; name: string }
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Maps each property of `T`, removing `null` and `undefined` from its value type; all keys become required.
 *
 * @typeParam T - Object type whose property value types are stripped of nullishness.
 *
 * @example
 * type Input = { id: string | null; age?: number | undefined };
 * type Output = NonNullableValues<Input>;
 * //   ^? { id: string; age: number }
 */
export type NonNullableValues<T> = {
  [P in keyof T]-?: Exclude<T[P], null | undefined>;
};

/**
 * Makes the keys in `K` required with non-nullish value types; all other keys keep their original optionality.
 *
 * @typeParam T - Source object type.
 * @typeParam K - Keys to require (values become non-nullish).
 *
 * @example
 * type Input = { id?: string; name?: string; active?: boolean };
 * type Output = SomeRequired<Input, "id">;
 * //   ^? { id: string; name?: string; active?: boolean }
 */
export type SomeRequired<T, K extends keyof T> = Prettify<
  Omit<T, K> & NonNullableValues<Pick<T, K>>
>;

/**
 * Makes the keys in `K` optional; all other keys keep their original optionality and value types.
 *
 * @typeParam T - Source object type.
 * @typeParam K - Keys to make optional.
 *
 * @example
 * type Input = { id: string; name: string; active: boolean };
 * type Output = SomeOptional<Input, "active">;
 * //   ^? { id: string; name: string; active?: boolean }
 */
export type SomeOptional<T, K extends keyof T> = Prettify<
  Partial<Pick<T, K>> & Omit<T, K>
>;

/**
 * Builds a fixed-length tuple of `N` elements of type `T` via recursive conditional types.
 *
 * @typeParam T - Element type repeated in each slot.
 * @typeParam N - Exact tuple length (must be a numeric literal type).
 * @typeParam R - Internal accumulator used during recursion; callers should omit this.
 *
 * @example
 * type Triple = TupleOf<number, 3>;
 * //   ^? [number, number, number]
 */
export type TupleOf<
  T,
  N extends number,
  R extends unknown[] = [],
> = R["length"] extends N ? R : TupleOf<T, N, [T, ...R]>;

/**
 * Widens string, number, and boolean literal types to their primitive base; all other types pass through unchanged.
 *
 * @typeParam T - Literal or narrow type to widen.
 *
 * @example
 * type A = Widen<"hello">;
 * //   ^? string
 * type B = Widen<42>;
 * //   ^? number
 * type C = Widen<true>;
 * //   ^? boolean
 */
export type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T;

/**
 * String-keyed object map with `unknown` values — a safer default than `Record<string, any>`.
 *
 * @example
 * type Payload = UnknownRecord;
 * //   ^? Record<string, unknown>
 */
export type UnknownRecord = Record<string, unknown>;
