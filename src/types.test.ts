import { describe, expectTypeOf, it } from "vitest";

import type {
  Maybe,
  NonNullableValues,
  Prettify,
  Satisfies,
  SomeOptional,
  SomeRequired,
  TupleOf,
  UnknownRecord,
  Widen,
} from "./types";

describe("lil-libs/types", () => {
  describe("Satisfies", () => {
    it("preserves the original type when it extends the base type", () => {
      type Result = Satisfies<"a" | "b", string>;
      expectTypeOf<Result>().toEqualTypeOf<"a" | "b">();
    });
  });

  describe("Maybe", () => {
    it("adds undefined, null, and false to a type", () => {
      expectTypeOf<Maybe<number>>().toEqualTypeOf<
        number | undefined | null | false
      >();
    });
  });

  describe("Prettify", () => {
    it("flattens intersections into an equivalent readable object type", () => {
      type Intersected = { a: string } & { b: number };

      expectTypeOf<Prettify<Intersected>>().toEqualTypeOf<{
        a: string;
        b: number;
      }>();
    });
  });

  describe("NonNullableValues", () => {
    it("removes null and undefined from each property and marks them required", () => {
      type Input = {
        foo?: string | null;
        bar: number | undefined;
      };

      expectTypeOf<NonNullableValues<Input>>().toEqualTypeOf<{
        foo: string;
        bar: number;
      }>();
    });
  });

  describe("SomeRequired", () => {
    it("makes selected keys required and non-nullable", () => {
      type Input = {
        id?: string | null;
        label?: string;
        count?: number;
      };

      expectTypeOf<SomeRequired<Input, "id" | "count">>().toEqualTypeOf<{
        id: string;
        label?: string;
        count: number;
      }>();
    });
  });

  describe("SomeOptional", () => {
    it("makes selected keys optional while keeping other keys as-is", () => {
      type Input = {
        id: string;
        label: string;
        count: number;
      };

      expectTypeOf<SomeOptional<Input, "label" | "count">>().toEqualTypeOf<{
        id: string;
        label?: string;
        count?: number;
      }>();
    });
  });

  describe("TupleOf", () => {
    it("builds a fixed-length tuple", () => {
      expectTypeOf<TupleOf<number, 3>>().toEqualTypeOf<
        [number, number, number]
      >();
    });

    it("returns an empty tuple for zero length", () => {
      expectTypeOf<TupleOf<string, 0>>().toEqualTypeOf<[]>();
    });
  });

  describe("Widen", () => {
    it("widens literal primitives to their base primitive types", () => {
      expectTypeOf<Widen<"foo" | "bar">>().toEqualTypeOf<string>();
      expectTypeOf<Widen<1 | 2>>().toEqualTypeOf<number>();
      expectTypeOf<Widen<true | false>>().toEqualTypeOf<boolean>();
    });

    it("preserves non-primitive literals and object types", () => {
      expectTypeOf<Widen<{ a: 1 }>>().toEqualTypeOf<{ a: 1 }>();
    });
  });

  describe("UnknownRecord", () => {
    it("is an alias of Record<string, unknown>", () => {
      expectTypeOf<UnknownRecord>().toEqualTypeOf<Record<string, unknown>>();
    });
  });
});
