import { describe, expect, it, vi } from "vitest";

import { isDefined, lazy, noop, not, resolveMaybeFn } from "./function";

describe("lil-libs/function", () => {
  describe("noop", () => {
    it("does nothing and returns undefined", () => {
      expect(noop()).toBeUndefined();
    });
  });

  describe("isDefined", () => {
    it("returns true for non-nullish values", () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined("")).toBe(true);
    });

    it("returns false for nullish values", () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe("lazy", () => {
    it("should return a lazy value", () => {
      const result = lazy(() => 42);
      expect(result.value).toBe(42);
    });

    it("should only call the factory once", () => {
      const factory = vi.fn(() => "computed");
      const result = lazy(factory);

      expect(factory).not.toHaveBeenCalled();

      expect(result.value).toBe("computed");
      expect(factory).toHaveBeenCalledTimes(1);

      expect(result.value).toBe("computed");
      expect(result.value).toBe("computed");
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("should cache undefined as a valid value", () => {
      const factory = vi.fn(() => undefined);
      const result = lazy(factory);

      expect(result.value).toBeUndefined();
      expect(result.value).toBeUndefined();
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("should work with object values", () => {
      const obj = { foo: "bar" };
      const factory = vi.fn(() => obj);
      const result = lazy(factory);

      expect(result.value).toBe(obj);
      expect(result.value).toBe(obj);
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });
  describe("not", () => {
    it("should return the logical negation of the given predicate", () => {
      const mockFn = vi.fn();
      const notFn = not(mockFn);
      expect(notFn()).toBe(true);
    });

    it("should work as expected for non-boolean arguments", () => {
      const numericPredicate = (value: number) => value > 0;
      const stringPredicate = (value: string) => value.length > 0;
      const objectPredicate = (value: object) => Object.keys(value).length > 0;

      const notNumericPredicate = not(numericPredicate);
      expect(notNumericPredicate(1)).toBe(false);
      expect(notNumericPredicate(0)).toBe(true);

      const notStringPredicate = not(stringPredicate);
      expect(notStringPredicate("")).toBe(true);
      expect(notStringPredicate("test")).toBe(false);

      const notObjectPredicate = not(objectPredicate);
      expect(notObjectPredicate({})).toBe(true);
      expect(notObjectPredicate({ a: 1 })).toBe(false);
    });
  });

  describe("resolveMaybeFn", () => {
    it("should return non-function values as-is", () => {
      expect(resolveMaybeFn(42)).toBe(42);
      expect(resolveMaybeFn("hello")).toBe("hello");
      expect(resolveMaybeFn(true)).toBe(true);
      expect(resolveMaybeFn(false)).toBe(false);

      expect(resolveMaybeFn(null)).toBe(null);
      expect(resolveMaybeFn(undefined)).toBe(undefined);

      const obj = { foo: "bar" };
      const arr = [1, 2, 3];
      expect(resolveMaybeFn(obj)).toBe(obj);
      expect(resolveMaybeFn(arr)).toBe(arr);
    });

    it("should invoke the function with the provided argument", () => {
      expect(resolveMaybeFn((x: number) => x * 2, 21)).toBe(42);
      expect(resolveMaybeFn((s: string) => s.toUpperCase(), "hello")).toBe(
        "HELLO",
      );
      expect(resolveMaybeFn((id) => ({ id, name: "test" }), 123)).toEqual({
        id: 123,
        name: "test",
      });
      expect(resolveMaybeFn(() => null)).toBe(null);
      expect(resolveMaybeFn(() => undefined)).toBe(undefined);
      expect(resolveMaybeFn(() => "constant", "ignored")).toBe("constant");

      const innerFn = () => 42;
      const result = resolveMaybeFn(() => innerFn);
      expect(result).toBe(innerFn);
      expect(result()).toBe(42);

      const fn = vi.fn((arg: unknown) => arg);
      resolveMaybeFn(fn);
      expect(fn).toHaveBeenCalledWith(undefined);
    });
  });
});
