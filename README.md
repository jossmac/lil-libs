# lil-libs

A small collection of TypeScript-first utilities for everyday application code. Each module is focused, composable, and ships with zero runtime dependencies.

## API Overview

### Array

#### `isNonEmpty`

Type guard for narrowing an array to a non-empty tuple-like type.

```ts
const values: number[] = [1, 2, 3];

if (isNonEmpty(values)) {
  // values: [number, ...number[]]
}
```

#### `isLength`

Type guard for narrowing an array to a tuple of a specific length.

```ts
const values: number[] = [1, 2, 3];

if (isLength(values, 3)) {
  // values: [number, number, number]
}
```

#### `toArray`

Returns an array for nullish, scalar, iterable, or array input.

```ts
toArray(null); // []
toArray(1); // [1]
toArray(new Set([1, 2])); // [1, 2]
```

#### `isIterable`

Type guard that checks whether a value implements the iterable protocol.

```ts
isIterable(new Map()); // true
isIterable(new Set()); // true
isIterable([]); // true
isIterable({}); // false
```

#### `chunk`

Splits an array into fixed-size chunks.

The last chunk may be smaller than the given size if the array does not divide evenly.

```ts
chunk([1, 2, 3, 4], 2); // [[1, 2], [3, 4]]
chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
chunk([], 2); // []
```

#### `partition`

Splits an array into two arrays using a predicate.

Behaviour:

- Returns a 2-item tuple: `[matched, unmatched]`.
- Preserves the original item order within both output arrays.
- Passes `(item, index, array)` to the predicate.

```ts
partition([1, 2, 3, 4], (n) => n % 2 === 0);
// [[2, 4], [1, 3]]

partition(["a", "bb", "ccc"], (s) => s.length > 1);
// [["bb", "ccc"], ["a"]]
```

#### `createStableKeySelector`

Creates a function that deterministically maps a string to one of the provided keys using a stable hash.

Behaviour:

- Returns the same key for the same input every time.
- Preserves literal key types (for `as const` arrays).
- Supports empty input strings.
- Throws if called with an empty keys array.

```ts
const colors = ["red", "green", "blue"] as const;
const getColor = createStableKeySelector(colors);

getColor("Albert"); // 'blue'
getColor("Barbara"); // 'green'
getColor("Charlie"); // 'red'

const color = getColor("David");
//    ^? 'red' | 'green' | 'blue' (inferred return type)
```

### Assert

#### `assert`

Asserts that a value is present (or that a boolean is `true`).

Behaviour:

- Throws for `false`, `null`, and `undefined`.
- Does not throw for other falsy values like `0` and `""`.
- Narrows types after the assertion.

```ts
const maybeName: string | undefined = getName();
assert(maybeName, "Name is required");
// maybeName is now string
```

#### `ensure`

Returns the validated value, or throws if assertion fails.

```ts
const maybeUser: User | null = findUser();
const user = ensure(maybeUser, "User is required");
// user is User
```

#### `assertNever`

Throws for unreachable branches in discriminated unions.

```ts
switch (status.kind) {
  case "idle":
  case "loading":
  case "done":
    break;
  default:
    assertNever(status);
}
```

### Console

#### `errorOnce`

Logs each unique error message only once per runtime instance.

Behaviour:

- Repeated error messages are ignored after the first log.
- No-op in production environments.

```ts
errorOnce("API request failed");
errorOnce("API request failed"); // ignored
```

#### `warnOnce`

Logs each unique warning message only once per runtime instance.

Behaviour:

- Repeated warning messages are ignored after the first log.
- Message tracking is independent from `errorOnce`.
- No-op in production environments.

```ts
warnOnce("Using fallback value");
warnOnce("Using fallback value"); // ignored
```

### Error

#### `isError`

Guard for native `Error` instances.

```ts
isError(new Error("boom")); // true
isError("boom"); // false
```

#### `isErrorLike`

Guard for error-like objects exposing a string `message` property.

```ts
isErrorLike({ message: "boom" }); // true
isErrorLike({ message: 123 }); // false
```

#### `parseError`

Returns a human-readable error message from unknown input.

Behaviour:

- Returns `error.message` for native `Error` values.
- Returns `value.message` for error-like objects where `message` is a string.
- Returns string inputs as-is.
- Returns a fallback message for all other values.

```ts
parseError(new Error("Boom")); // "Boom"
parseError("Something went wrong"); // "Something went wrong"
parseError({ message: "from object" }); // "from object"

parseError(null); // "An unknown error occurred."
parseError({ message: 123 }); // "An unknown error occurred."
parseError(null, "Custom fallback"); // "Custom fallback"
```

#### `ensureError`

Returns an `Error` instance from unknown thrown input.

```ts
ensureError(new Error("boom")); // same Error instance
ensureError("boom"); // Error("boom")
ensureError({ message: "boom", name: "CustomError" }); // Error with copied metadata
```

### Env

#### `getEnvVariable`

Returns the first matching runtime env string in this order:

1. `import.meta.env`
2. `process.env`
3. `globalThis.__env__`

Only string values are returned.

```ts
const apiBaseUrl = getEnvVariable("API_BASE_URL");
const mode = getEnvVariable("MODE");
```

#### `isProductionEnv`

Returns `true` when either `MODE` or `NODE_ENV` is `"production"`.

```ts
if (!isProductionEnv()) {
  loggingService("Logging enabled");
}
```

### Function

#### `noop`

Does nothing and returns `undefined`.

```ts
button.addEventListener("click", noop);
```

#### `isDefined`

Type guard for filtering out `null` and `undefined` without losing type precision.

```ts
const ids = [1, null, 2, undefined, 3].filter(isDefined);
//    ^? number[]
```

#### `not`

Inverts a predicate.

```ts
const isEven = (n: number) => n % 2 === 0;
const isOdd = not(isEven);

isOdd(3); // true
isOdd(4); // false
```

#### `resolveMaybeFn`

Returns a value directly or by invoking a unary function.

```ts
resolveMaybeFn(42); // 42
resolveMaybeFn((x: number) => x * 2, 21); // 42
```

#### `lazy`

Returns a lazily computed value that is cached after first access. Access the result via `.value`.

```ts
const settings = lazy(() => loadSettings());

settings.value; // computes once
settings.value; // cached
```

### JSON

#### `stringifyWithBigIntAsString`

Serialises JSON while converting `BigInt` values to strings.

```ts
stringifyWithBigIntAsString({ id: 123n });
// '{"id":"123"}'
```

#### `stringifyWithSortedKeys`

Serialises deterministic JSON by sorting object keys at every nesting level.

Behaviour:

- Object keys are sorted alphabetically.
- Array order is preserved.
- `undefined` object properties are omitted.

```ts
stringifyWithSortedKeys({ b: 2, a: 1 });
// '{"a":1,"b":2}'

stringifyWithSortedKeys([{ z: 1, a: 2 }]);
// '[{"a":2,"z":1}]'
```

### Number

#### `isNumber`

Runtime guard for JavaScript numbers, excluding `NaN`.

```ts
isNumber(42); // true
isNumber(NaN); // false
isNumber(Infinity); // true
```

#### `isFiniteNumber`

Runtime guard for finite numbers.

```ts
isFiniteNumber(42); // true
isFiniteNumber(Infinity); // false
```

#### `isAscending`

Checks whether an array is in ascending order (allowing equal neighbouring values).

```ts
isAscending([1, 1, 2, 3]); // true
isAscending([3, 2, 1]); // false
```

#### `isDescending`

Checks whether an array is in descending order (allowing equal neighbouring values).

```ts
isDescending([3, 3, 2, 1]); // true
isDescending([1, 2, 3]); // false
```

#### `clamp`

Constrains a number to an inclusive range.

```ts
clamp(5, 0, 10); // 5
clamp(-5, 0, 10); // 0
clamp(15, 0, 10); // 10
```

#### `roundToPrecision`

Rounds a number to a specified number of fractional digits.

```ts
roundToPrecision(3.14159, 2); // 3.14
roundToPrecision(3.005, 2); // 3.01
```

#### `roundToStep`

Rounds a number to the nearest step interval.

```ts
roundToStep(5.26, 0.25); // 5.25
roundToStep(-5.26, 0.25); // -5.25
```

#### `findNearest`

Returns the closest value from a list, with configurable tie-breaking.

Bias options:

- `"first"` / `"last"` — prefer the item that appears earlier or later in the array.
- `"smaller"` / `"larger"` — prefer the numerically smaller or larger tied value.

```ts
const items = [1, 3, 5, 7, 9];

findNearest(4, items); // 3 (default bias: "first")
findNearest(4, items, "last"); // 5
findNearest(4, items, "smaller"); // 3
findNearest(4, items, "larger"); // 5
```

#### `sequence`

Generates inclusive numeric sequences in ascending or descending order.

Behaviour:

- Includes both start and end when reachable by step increments.
- Supports negative step input (uses absolute step size).
- Derives decimal precision from the provided step.
- Throws for `step = 0` or non-finite step values.

```ts
sequence(1, 5); // [1, 2, 3, 4, 5]
sequence(5, 1); // [5, 4, 3, 2, 1]
sequence(0, 1, 0.33); // [0, 0.33, 0.66, 0.99]
```

#### `lerp`

Linear interpolation between two values.

```ts
lerp(0, 100, 0.25); // 25
```

#### `unlerp`

Inverse interpolation that returns a clamped factor in the `0..1` range.

```ts
unlerp(0, 100, 25); // 0.25

// unlerp clamps outside-range values to 0..1
unlerp(0, 10, -5); // 0
unlerp(0, 10, 15); // 1
```

#### `remap`

Maps a value from one numeric range to another using linear interpolation.

Behaviour:

- Clamps to the output range by default.
- Supports negative and floating-point ranges.
- Allows extrapolation with `{ clamp: false }`.
- Handles degenerate input ranges (`from === to`) predictably.

```ts
remap(5, [0, 10], [0, 100]); // 50
remap(-5, [-10, 0], [0, 100]); // 50
remap(7.5, [0, 10], [-20, -10]); // -12.5

remap(-5, [0, 10], [0, 100]); // 0 (clamped)
remap(15, [0, 10], [0, 100]); // 100 (clamped)

remap(15, [0, 10], [0, 100], { clamp: false }); // 150
```

### Object

#### `isPlainObject`

Checks whether a value is a plain object (including `Object.create(null)`).

```ts
isPlainObject({}); // true
isPlainObject(Object.create(null)); // true
isPlainObject([]); // false
isPlainObject(new Date()); // false
```

#### `typedKeys`

Typed alternative to `Object.keys()` that preserves key inference.

```ts
const obj = { foo: 1, bar: "hello" };

const keys = typedKeys(obj);
//    ^? ("foo" | "bar")[]
```

#### `typedEntries`

Typed alternative to `Object.entries()` that preserves key/value tuples.

```ts
const obj = { foo: 1, bar: "hello" };

const entries = typedEntries(obj);
//    ^? (["foo", number] | ["bar", string])[]
```

#### `typedFromEntries`

Typed alternative to `Object.fromEntries()` that preserves output shape.

```ts
const entries = [
  ["foo", 1],
  ["bar", "hello"],
] as const;

const rebuilt = typedFromEntries(entries);
//    ^? { foo: number; bar: string }
```

#### `TObject`

Provides a namespace-like wrapper around the typed object helpers.

```ts
const keys = TObject.keys({ foo: 1, bar: "hello" });
//    ^? ("foo" | "bar")[]
```

### Random

#### `random.bool`

Returns random boolean values.

```ts
random.bool(); // true or false
```

#### `random.int`

Generates random integers in an inclusive range.

Behaviour:

- `random.int(min, max)` is inclusive of both bounds.
- Reversed bounds are automatically normalised.

```ts
random.int(1, 3); // 1, 2, or 3
random.int(10, 1); // still valid
```

#### `random.float`

Generates random floating-point numbers in a half-open range.

Behaviour:

- `random.float(min, max)` is inclusive of `min` and exclusive of `max`.
- Reversed bounds are automatically normalised.

```ts
random.float(10, 20); // 10 <= n < 20
random.float(20, 10); // still valid
```

#### `random.choice`

Returns one random item from an array.

```ts
random.choice(["a", "b", "c"]); // one item
```

#### `random.sample`

Returns a randomly sampled subset without mutating the original array.

Behaviour:

- Defaults to `count = 1`.
- Returns an empty array when `count` is `0`.
- Returns all items when `count` equals the array length.
- Never mutates the input array.

```ts
const items = ["a", "b", "c", "d"];

random.sample(items, 2); // e.g. ["d", "a"]
random.sample(items); // single-item sample
random.sample(items, 0); // []

items; // still ["a", "b", "c", "d"]
```

#### `random.shuffle`

Returns a shuffled copy without mutating the original array.

```ts
const items = [1, 2, 3, 4];

random.shuffle(items); // shuffled copy
items; // unchanged
```

#### `random.shuffler`

Creates a function that returns a newly shuffled copy on each call.

```ts
const items = [1, 2, 3, 4];

const shuffleNow = random.shuffler(items);
shuffleNow(); // shuffled copy each call
```

#### `random.sampler`

Creates a function that returns a random sample on each call.

```ts
const items = [1, 2, 3, 4];

const sampleTwo = random.sampler(items, 2);
sampleTwo(); // random 2-item sample each call
```

### String

#### `isString`

Type guard for string values.

```ts
isString("hello"); // true
isString(123); // false
```

#### `contains`

Case-insensitive and diacritic-insensitive substring matching.

```ts
contains("café", "cafe"); // true
contains("Hello World", "world"); // true
contains("hello", "bye"); // false
```

#### `pluralize`

Returns singular/plural forms with optional count prefix.

```ts
pluralize(1, "wallet"); // "1 wallet"
pluralize(2, "wallet"); // "2 wallets"
pluralize(2, ["person", "people"]); // "2 people"
pluralize(2, ["person", "people"], false); // "people"
```

#### `base64Encode`

Encodes UTF-8 strings to base64, or to a base64 data URI when a MIME type is provided.

Behaviour:

- Supports Unicode input.
- Preserves MIME type in data URI output.
- Optimises SVG payload whitespace when `mimeType` is `"image/svg+xml"`.

```ts
base64Encode("hello");
// "aGVsbG8="

base64Encode("hello", "text/plain");
// "data:text/plain;base64,aGVsbG8="
```

### Types

#### `Maybe<T>`

Represents a maybe-present value for app-level checks.

```ts
type MaybeName = Maybe<string>;
//   ^? string | null | undefined | false
```

#### `Prettify<T>`

Flattens intersections and mapped types into a cleaner displayed shape.

```ts
type Raw = { id: string } & { name: string };
type User = Prettify<Raw>;
//   ^? { id: string; name: string }
```

#### `Satisfies<T, Base>`

Constrains `T` to be assignable to `Base` while preserving `T`'s full detail.

```ts
type Endpoint = Satisfies<
  { method: "GET"; path: "/users" },
  { method: "GET" | "POST"; path: string }
>;
//   ^? { method: "GET"; path: "/users" }
```

#### `NonNullableValues<T>`

Removes `null` and `undefined` from each property value type.

```ts
type Input = { id: string | null; age?: number | undefined };
type Output = NonNullableValues<Input>;
//   ^? { id: string; age?: number }
```

#### `SomeRequired<T, K>`

Makes a subset of keys required while leaving all other keys unchanged.

```ts
type Input = { id?: string; name?: string; active?: boolean };
type Output = SomeRequired<Input, "id">;
//   ^? { id: string; name?: string; active?: boolean }
```

#### `SomeOptional<T, K>`

Makes a subset of keys optional while leaving all other keys unchanged.

```ts
type Input = { id: string; name: string; active: boolean };
type Output = SomeOptional<Input, "active">;
//   ^? { id: string; name: string; active?: boolean }
```

#### `TupleOf<T, N>`

Builds a fixed-length tuple of `N` elements of type `T`.

```ts
type Triple = TupleOf<number, 3>;
//   ^? [number, number, number]
```

#### `Widen<T>`

Widens literals to their broader primitive types.

```ts
type A = Widen<"hello">;
//   ^? string
type B = Widen<42>;
//   ^? number
```

#### `UnknownRecord`

Alias for a generic object map with unknown values.

```ts
type Payload = UnknownRecord;
//   ^? Record<string, unknown>
```

---

## Development

### Setup

Prerequisites:

- Node.js `24` (active LTS)
- pnpm `10.33.0` (managed via Corepack or installed globally)

```bash
nvm use
pnpm install
```

### Scripts

```bash
pnpm check          # run all static checks
pnpm check:types    # TypeScript
pnpm check:lint     # ESLint
pnpm check:format   # Prettier

pnpm test           # run tests once
pnpm test:watch     # watch mode
pnpm test:coverage  # run tests with v8 coverage
```
