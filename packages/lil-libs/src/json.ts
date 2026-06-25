/**
 * JSON serialization helpers.
 *
 * @module
 */

/**
 * Serialises JSON while converting `BigInt` values to strings.
 *
 * @example
 * JSON.stringify({ id: 123n });
 * // Uncaught TypeError: Do not know how to serialize a BigInt
 *
 * stringifyWithBigIntAsString({ id: 123n });
 * // '{"id":"123"}'
 *
 * @remarks When calling `JSON.parse()` on the result, `BigInt` values remain strings.
 *
 * @param value - The value to serialise.
 * @returns The JSON string, or `undefined` for `undefined` input.
 */
export function stringifyWithBigIntAsString(
  value: unknown,
): string | undefined {
  return JSON.stringify(value, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}

/**
 * Serialises deterministic JSON by sorting object keys at every nesting level.
 *
 * @example
 * stringifyWithSortedKeys({ b: 2, a: 1 });
 * // '{"a":1,"b":2}'
 *
 * stringifyWithSortedKeys([{ z: 1, a: 2 }]);
 * // '[{"a":2,"z":1}]'
 *
 * @remarks Object keys are sorted alphabetically. Array order is preserved.
 * `undefined` object properties are omitted.
 *
 * @param value - The value to serialise.
 * @returns The JSON string, or `undefined` for `undefined` input.
 */
export function stringifyWithSortedKeys(value: unknown): string | undefined {
  return JSON.stringify(value, (_key, currentValue) => {
    if (
      currentValue == null ||
      typeof currentValue !== "object" ||
      Array.isArray(currentValue)
    ) {
      return currentValue;
    }

    const record = currentValue as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = record[key];
    }
    return sorted;
  });
}
