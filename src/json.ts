/**
 * Serialize a value to JSON, converting BigInts to strings. `BigInt` values are
 * not supported by `JSON.stringify()`.
 *
 * @note
 * - assumes the receiver can handle those stringified `BigInt` values
 *   appropriately, or it's for logging purposes.
 * - when calling `JSON.parse()` on the result, the `BigInt` values will remain
 *   strings.
 */
export function stringifyWithBigIntAsString(
  value: unknown,
): string | undefined {
  return JSON.stringify(value, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}

/**
 * Deterministic JSON serialization that sorts object keys alphabetically at
 * every nesting level. Produces the same output regardless of key insertion
 * order, making it suitable for hashing or equality comparison.
 *
 * Handles: objects (sorted keys), arrays (preserved order), primitives, and null.
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
