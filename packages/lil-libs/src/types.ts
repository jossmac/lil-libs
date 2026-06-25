/* v8 ignore file -- type-only module with no runtime code */

/**
 * Utility and convenience TypeScript types.
 *
 * @module
 */

/**
 * Constrains `T` to be assignable to `Base` while preserving `T`'s full detail.
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
 * Represents a maybe-present value for app-level checks.
 *
 * @example
 * type MaybeName = Maybe<string>;
 * //   ^? string | null | undefined
 */
export type Maybe<T> = T | undefined | null;

/**
 * Flattens intersections and mapped types into a cleaner displayed shape.
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
 * Removes `null` and `undefined` from each property value type.
 *
 * @example
 * type Input = { id: string | null; age?: number | undefined };
 * type Output = NonNullableValues<Input>;
 * //   ^? { id: string; age?: number }
 */
export type NonNullableValues<T> = {
  [P in keyof T]-?: Exclude<T[P], null | undefined>;
};

/**
 * Makes a subset of keys required while leaving all other keys unchanged.
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
 * Makes a subset of keys optional while leaving all other keys unchanged.
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
 * Builds a fixed-length tuple of `N` elements of type `T`.
 *
 * @typeParam T - The element type for each tuple slot.
 * @typeParam N - The tuple length.
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
 * Widens literals to their broader primitive types.
 *
 * @example
 * type A = Widen<"hello">;
 * //   ^? string
 * type B = Widen<42>;
 * //   ^? number
 */
export type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T;

/**
 * Alias for a generic object map with unknown values.
 *
 * @example
 * type Payload = UnknownRecord;
 * //   ^? Record<string, unknown>
 */
export type UnknownRecord = Record<string, unknown>;
