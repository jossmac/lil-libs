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
export function stringifyWithBigIntAsString(objectLike: unknown): string {
  return JSON.stringify(objectLike, (_key, value) =>
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
export function stringifyWithSortedKeys(value: unknown): string {
  if (value == null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stringifyWithSortedKeys).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const sorted = Object.keys(obj)
    .sort()
    .filter((k) => obj[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${stringifyWithSortedKeys(obj[k])}`)
    .join(",");

  return `{${sorted}}`;
}
