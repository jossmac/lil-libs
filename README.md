# lil-libs

A small collection of TypeScript-first utilities for everyday application code. Each module is focused, composable, and ships with zero runtime dependencies.

## Array

```ts
import {
  chunk,
  isIterable,
  isLength,
  isPopulatedArray,
  partition,
  stableKeyFactory,
  toArray,
} from "@jossmac/lil-libs/array";
```

### `isIterable`

Type guard that checks whether a value implements the iterable protocol.

```ts
isIterable(new Map()); // true
isIterable(new Set()); // true
isIterable([]); // true
isIterable({}); // false
```

### `isLength`

Type guard for narrowing an array to a tuple of a specific length.

```ts
const values: number[] = [1, 2, 3];

if (isLength(values, 3)) {
  // values: [number, number, number]
}
```

### `isPopulatedArray`

Type guard for narrowing an array to a non-empty tuple-like type.

```ts
const values: number[] = [1, 2, 3];

if (isPopulatedArray(values)) {
  // values: [number, ...number[]]
}
```

### `toArray`

Returns an array for nullish, scalar, iterable, or array input.

```ts
toArray(null); // []
toArray(1); // [1]
toArray(new Set([1, 2])); // [1, 2]
```

### `chunk`

Splits an array into fixed-size chunks.

The last chunk may be smaller than the given size if the array does not divide evenly.

```ts
chunk([1, 2, 3, 4], 2); // [[1, 2], [3, 4]]
chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
chunk([], 2); // []
```

### `partition`

Splits an array into two arrays using a predicate.

```ts
partition([1, 2, 3, 4], (n) => n % 2 === 0);
// [[2, 4], [1, 3]]

partition(["a", "bb", "ccc"], (s) => s.length > 1);
// [["bb", "ccc"], ["a"]]
```

**Behaviour:**

- Returns a 2-item tuple: `[matched, unmatched]`.
- Preserves the original item order within both output arrays.
- Passes `(item, index, array)` to the predicate.

### `stableKeyFactory`

Creates a function that deterministically maps a string to one of the provided keys using a stable hash.

```ts
const colors = ["red", "green", "blue"] as const;
const getColor = stableKeyFactory(colors);

getColor("Albert"); // 'blue'
getColor("Barbara"); // 'green'
getColor("Charlie"); // 'red'

const color = getColor("David");
//    ^? 'red' | 'green' | 'blue' (inferred return type)
```

**Behaviour:**

- Returns the same key for the same input every time.
- Preserves literal key types (for `as const` arrays).
- Supports empty input strings.
- Throws if called with an empty keys array.

## Assert

```ts
import { assert, assertNever, ensure } from "@jossmac/lil-libs/assert";
```

### `assert`

Asserts that a value is present (or that a boolean is `true`).

```ts
function getName(id: number): string | undefined;

const maybeName = getName(123);
//    ^? string | undefined

assert(maybeName, "Name is required");
const name = maybeName;
//    ^? string
```

**Behaviour:**

- Throws for `false`, `null`, and `undefined`.
- Does not throw for other falsy values like `0` and `""`.
- Narrows types after the assertion.

### `assertNever`

Throws for unreachable branches in discriminated unions.

```ts
switch (status.kind) {
  case "idle":
  case "loading":
  case "done":
    break;
  default:
    assertNever(status.kind);
}
```

### `ensure`

A convenience wrapper around `assert` that returns the value if the assertion passes.

```ts
function findUser(id: number): User | null;

const user = ensure(findUser(123), "User is required");
//    ^? User
```

## Console

```ts
import { errorOnce, warnOnce } from "@jossmac/lil-libs/console";
```

### `errorOnce`

Logs each unique **error** message only once per runtime instance.

```ts
errorOnce("API request failed");
errorOnce("API request failed"); // ignored
```

### `warnOnce`

Logs each unique **warning** message only once per runtime instance.

```ts
warnOnce("Using fallback value");
warnOnce("Using fallback value"); // ignored
```

## Error

```ts
import {
  ensureError,
  isError,
  isErrorLike,
  parseError,
} from "@jossmac/lil-libs/error";
```

### `isError`

Guard for native `Error` instances.

```ts
isError(new Error("boom")); // true
isError("boom"); // false
```

### `isErrorLike`

Guard for error-like objects exposing a string `message` property.

```ts
isErrorLike({ message: "boom" }); // true
isErrorLike({ message: 123 }); // false
```

### `parseError`

Returns a human-readable error message from unknown input.

```ts
parseError(new Error("Boom")); // "Boom"
parseError("Something went wrong"); // "Something went wrong"
parseError({ message: "from object" }); // "from object"

parseError(null); // "An unknown error occurred."
parseError({ message: 123 }); // "An unknown error occurred."
parseError(null, "Custom fallback"); // "Custom fallback"
```

**Behaviour:**

- Returns `error.message` for native `Error` values.
- Returns `value.message` for error-like objects where `message` is a string.
- Returns string inputs as-is.
- Returns a fallback message for all other values.

### `ensureError`

Returns an `Error` instance from unknown thrown input.

```ts
ensureError(new Error("boom")); // same Error instance
ensureError("boom"); // Error("boom")
ensureError({ message: "boom", name: "CustomError" }); // Error with copied metadata
```

## Function

```ts
import {
  isDefined,
  lazy,
  noop,
  not,
  resolveMaybeFn,
} from "@jossmac/lil-libs/function";
```

### `noop`

Does nothing and returns `undefined`.

```ts
button.addEventListener("click", noop);
```

### `isDefined`

Type guard for filtering out `null` and `undefined` without losing type precision.

```ts
const bad = [1, null, 2, undefined, 3].filter(Boolean);
//    ^? (number | null | undefined)[]

const good = [1, null, 2, undefined, 3].filter(isDefined);
//    ^? number[]
```

### `not`

Inverts a predicate.

```ts
const isEven = (n: number) => n % 2 === 0;
const isOdd = not(isEven);

isOdd(3); // true
isOdd(4); // false
```

### `resolveMaybeFn`

Returns a value directly or by invoking a unary function.

```ts
resolveMaybeFn(42); // 42
resolveMaybeFn((x: number) => x * 2, 21); // 42
```

### `lazy`

Returns a lazily computed value that is cached after first access. Access the result via `.value`.

```ts
const settings = lazy(() => loadSettings());

settings.value; // computes once
settings.value; // cached
```

## Datetime

```ts
import { relativeTime } from "@jossmac/lil-libs/datetime";
```

### `relativeTime`

Formats a date as relative time for recent values and falls back to a date string for older values.

```ts
relativeTime(new Date(Date.now() - 1_000 * 60)); // "1 minute ago"
relativeTime(new Date(Date.now() - 1_000), { numeric: "auto" }); // "Just now"
relativeTime(new Date(Date.now() - 1_000 * 60), { style: "short" }); // "1 min. ago"

relativeTime(
  new Date(Date.now() - 1_000 * 60 * 60 * 24),
  {},
  { dateStyle: "medium" },
); // "Jan 6, 2026" (locale-dependent)
```

**Signature:**

```ts
function relativeTime(
  value: Date | string,
  relativeOptions?: {
    numeric?: Intl.RelativeTimeFormatNumeric;
    style?: Intl.RelativeTimeFormatStyle;
  },
  dateOptions?: Intl.DateTimeFormatOptions,
): string;
```

**Behaviour:**

- Accepts a `Date` or [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) string.
- Returns relative output (e.g. `"1 minute ago"`) for values within 24 hours.
- Returns a localized date string once the value is 24 hours old or more.
- Supports relative formatting via `numeric` and `style` options.
- Supports custom date formatting via `Intl.DateTimeFormat` options.

## DOM

```ts
import {
  atScrollBottom,
  atScrollLeft,
  atScrollRight,
  atScrollTop,
  getAbsoluteClientRect,
  getComputedStyle,
  getDisplayMode,
  hasScrollX,
  hasScrollY,
  isHtmlElement,
  isKeyboardInput,
  isTouchCapable,
  isTouchDevice,
  nearestComputedStyle,
  querySelector,
  querySelectorAll,
  toDataAttributes,
} from "@jossmac/lil-libs/dom";
```

### `isHtmlElement`

Type guard for narrowing unknown values to `HTMLElement`.

```ts
const el = document.querySelector("#app");
//    ^? Element | null

if (isHtmlElement(el)) {
  el.tabIndex = -1; // safe to operate on `el` as an `HTMLElement` type
}
```

### `isKeyboardInput`

Checks whether an event target is an element that can trigger the software keyboard, on mobile devices.

```ts
const textInput = document.createElement("input");
textInput.type = "text";

const checkbox = document.createElement("input");
checkbox.type = "checkbox";

isKeyboardInput(textInput); // true
isKeyboardInput(checkbox); // false
isKeyboardInput(document.createElement("textarea")); // true
```

### `isTouchCapable`

Returns `true` when the device can receive touch input.

Some devices support both touch and mouse input, such as laptop computers with a touchscreen.

```ts
isTouchCapable(); // true on touch-capable devices, otherwise false
```

### `isTouchDevice`

Returns `true` when the primary pointer is "coarse" (for example, touch input).

```ts
isTouchDevice(); // true on coarse-pointer devices, otherwise false
```

### `querySelector`

Thin wrapper around the `Element.querySelector()` method, which qualifies the returned value as an HTMLElement.

```ts
const container = document.createElement("div");
container.innerHTML = "<button>Save</button><svg><circle /></svg>";

querySelector(container, "button"); // HTMLButtonElement
querySelector(container, "circle"); // null (non-HTMLElement)
querySelector(null, "button"); // null
```

### `querySelectorAll`

Thin wrapper around the `Element.querySelectorAll()` method, which returns `HTMLElement[]` instead of `NodeListOf<Element>`.

```ts
const container = document.createElement("div");
container.innerHTML = "<span>One</span><span>Two</span><svg><circle /></svg>";

querySelectorAll(container, "span"); // [HTMLSpanElement, HTMLSpanElement]
querySelectorAll(container, "span, circle"); // spans only
querySelectorAll(undefined, "span"); // []
```

### `getComputedStyle`

Returns a computed style value for regular CSS properties and CSS variables.

```ts
const el = document.createElement("div");

getComputedStyle(el, "color"); // e.g. "rgb(0, 0, 0)"
getComputedStyle(el, "line-height"); // e.g. "normal"
getComputedStyle(el, "--space-10"); // custom property value
```

### `nearestComputedStyle`

Walks up the parent chain until it finds a non-empty computed style value.

```ts
const parent = document.createElement("div");
const child = document.createElement("span");
parent.appendChild(child);

nearestComputedStyle(child, "color");
// value from child if present, otherwise nearest parent value
```

### `getDisplayMode`

Returns the current display mode for browser and PWA contexts.

Possible values:

- `"fullscreen"`
- `"minimal-ui"`
- `"picture-in-picture"`
- `"standalone"`
- `"window-controls-overlay"`
- `"browser"`

```ts
getDisplayMode();
// e.g. "browser" in a tab, "standalone" in an installed PWA
```

### `toDataAttributes`

Converts object keys to HTML `data-*` attributes.

```ts
toDataAttributes({
  isSelected: true,
  panelIndex: 2,
  empty: "",
});
// {
//   "data-selected": true,
//   "data-panel-index": 2,
// }

toDataAttributes(
  { isSelected: true, empty: "" },
  { omitFalsyValues: false, trimBooleanKeys: false },
);
// {
//   "data-is-selected": true,
//   "data-empty": "",
// }
```

**Behaviour:**

- Converts camelCase keys to kebab-case.
- Omits `null` and `undefined` values.
- Omits `false` and `""` by default.
- Preserves `0` values.
- Trims leading `is` from boolean-style keys by default.

### `getAbsoluteClientRect`

Returns `getBoundingClientRect()` values offset by document scroll, giving absolute page coordinates.

```ts
const rect = getAbsoluteClientRect(document.body);

rect.top;
rect.left;
rect.width;
rect.height;
```

### `hasScrollX`

Checks whether an element has horizontal overflow.

```ts
hasScrollX(document.body); // true or false
```

### `hasScrollY`

Checks whether an element has vertical overflow.

```ts
hasScrollY(document.body); // true or false
```

### `atScrollTop`

Checks whether an element is at the top of its scroll range.

Uses `<= 0` to handle elastic scrolling behavior.

```ts
atScrollTop(document.documentElement); // true or false
```

### `atScrollBottom`

Checks whether an element is at the bottom of its scroll range.

Uses `>=` to handle elastic scrolling behavior.

```ts
atScrollBottom(document.documentElement); // true or false
```

### `atScrollLeft`

Checks whether an element is at the left edge of its scroll range.

Uses `<= 0` to handle elastic scrolling behavior.

```ts
atScrollLeft(document.documentElement); // true or false
```

### `atScrollRight`

Checks whether an element is at the right edge of its scroll range.

Uses `>=` to handle elastic scrolling behavior.

```ts
atScrollRight(document.documentElement); // true or false
```

## JSON

```ts
import {
  stringifyWithBigIntAsString,
  stringifyWithSortedKeys,
} from "@jossmac/lil-libs/json";
```

### `stringifyWithBigIntAsString`

Serialises JSON while converting `BigInt` values to strings.

```ts
JSON.stringify({ id: 123n });
// ⚠ Uncaught TypeError: Do not know how to serialize a BigInt

stringifyWithBigIntAsString({ id: 123n });
// '{"id":"123"}'
```

### `stringifyWithSortedKeys`

Serialises deterministic JSON by sorting object keys at every nesting level.

```ts
stringifyWithSortedKeys({ b: 2, a: 1 });
// '{"a":1,"b":2}'

stringifyWithSortedKeys([{ z: 1, a: 2 }]);
// '[{"a":2,"z":1}]'
```

**Behaviour:**

- Object keys are sorted alphabetically.
- Array order is preserved.
- `undefined` object properties are omitted.

## Number

```ts
import {
  clamp,
  findNearest,
  isAscending,
  isDescending,
  isFiniteNumber,
  isNumber,
  lerp,
  remap,
  roundToPrecision,
  roundToStep,
  sequence,
  unlerp,
} from "@jossmac/lil-libs/number";
```

### `isNumber`

Runtime guard for JavaScript numbers, excluding `NaN`.

```ts
isNumber(42); // true
isNumber(Infinity); // true
isNumber(NaN); // false
isNumber("foo"); // false
isNumber({}); // false
```

### `isFiniteNumber`

A convenience wrapper around `isNumber`, that also checks whether the value is finite.

```ts
isFiniteNumber(42); // true
isFiniteNumber(Infinity); // false
```

### `isAscending`

Checks whether an array is in ascending order (allowing equal neighbouring values).

```ts
isAscending([1, 1, 2, 3]); // true
isAscending([3, 2, 1]); // false
```

### `isDescending`

Checks whether an array is in descending order (allowing equal neighbouring values).

```ts
isDescending([3, 3, 2, 1]); // true
isDescending([1, 2, 3]); // false
```

### `clamp`

Constrains a number to an inclusive range.

```ts
clamp(5, 0, 10); // 5
clamp(-5, 0, 10); // 0
clamp(15, 0, 10); // 10
```

### `roundToPrecision`

Rounds a number to a specified number of fractional digits.

```ts
roundToPrecision(3.14159, 2); // 3.14
roundToPrecision(3.005, 2); // 3.01
```

### `roundToStep`

Rounds a number to the nearest step interval.

```ts
roundToStep(5.26, 0.25); // 5.25
roundToStep(-5.26, 0.25); // -5.25
```

### `findNearest`

Returns the closest value from a list, with configurable tie-breaking.

```ts
const items = [1, 3, 5, 7, 9];

findNearest(4, items); // 3 (default bias: "first")
findNearest(4, items, "last"); // 5
findNearest(4, items, "smaller"); // 3
findNearest(4, items, "larger"); // 5
```

**Bias options:**

- `"first"` / `"last"` — prefer the item that appears earlier or later in the array.
- `"smaller"` / `"larger"` — prefer the numerically smaller or larger tied value.

### `sequence`

Generates inclusive numeric sequences in ascending or descending order.

```ts
sequence(1, 5); // [1, 2, 3, 4, 5]
sequence(5, 1); // [5, 4, 3, 2, 1]
sequence(0, 1, 0.33); // [0, 0.33, 0.66, 0.99]
```

**Behaviour:**

- Includes both start and end when reachable by step increments.
- Supports negative step input (uses absolute step size).
- Derives decimal precision from the provided step.
- Throws for `step = 0` or non-finite step values.

### `lerp`

Linear interpolation between two values.

```ts
lerp(0, 100, 0.25); // 25
```

### `unlerp`

Inverse interpolation that returns a clamped factor in the `0..1` range.

```ts
unlerp(0, 100, 25); // 0.25

// unlerp clamps outside-range values to 0..1
unlerp(0, 10, -5); // 0
unlerp(0, 10, 15); // 1
```

### `remap`

Maps a value from one numeric range to another using linear interpolation.

```ts
remap(5, [0, 10], [0, 100]); // 50
remap(-5, [-10, 0], [0, 100]); // 50
remap(7.5, [0, 10], [-20, -10]); // -12.5

remap(-5, [0, 10], [0, 100]); // 0 (clamped)
remap(15, [0, 10], [0, 100]); // 100 (clamped)

remap(15, [0, 10], [0, 100], { clamp: false }); // 150
```

**Behaviour:**

- Clamps to the output range by default.
- Supports negative and floating-point ranges.
- Allows extrapolation with `{ clamp: false }`.
- Handles degenerate input ranges (`from === to`) predictably.

## Object

```ts
import {
  TObject,
  isPlainObject,
  typedEntries,
  typedFromEntries,
  typedKeys,
} from "@jossmac/lil-libs/object";
```

### `isPlainObject`

Checks whether a value is a plain object (including `Object.create(null)`).

```ts
isPlainObject({}); // true
isPlainObject(Object.create(null)); // true
isPlainObject([]); // false
isPlainObject(new Date()); // false
```

### `typedKeys`

Typed alternative to `Object.keys()` that preserves key inference.

```ts
const obj = { foo: 1, bar: "hello" };

const keys = typedKeys(obj);
//    ^? ("foo" | "bar")[]
```

### `typedEntries`

Typed alternative to `Object.entries()` that preserves key/value tuples.

```ts
const obj = { foo: 1, bar: "hello" };

const entries = typedEntries(obj);
//    ^? (["foo", number] | ["bar", string])[]
```

### `typedFromEntries`

Typed alternative to `Object.fromEntries()` that preserves output shape.

```ts
const entries = [
  ["foo", 1],
  ["bar", "hello"],
] as const;

const rebuilt = typedFromEntries(entries);
//    ^? { foo: number; bar: string }
```

### `TObject`

Provides a namespace-like wrapper around the typed object helpers.

```ts
const keys = TObject.keys({ foo: 1, bar: "hello" });
//    ^? ("foo" | "bar")[]
```

## Random

Exports a single `random` object containing all methods to avoid naming collisions.

```ts
import { random } from "@jossmac/lil-libs/random";
```

### `random.bool`

Returns random boolean values.

```ts
random.bool(); // true or false
```

### `random.int`

Generates random integers in an inclusive range.

```ts
random.int(1, 3); // 1, 2, or 3
random.int(10, 1); // still valid
```

**Behaviour:**

- `random.int(min, max)` is inclusive of both bounds.
- Reversed bounds are automatically normalised.

### `random.float`

Generates random floating-point numbers in a half-open range.

```ts
random.float(10, 20); // 10 <= n < 20
random.float(20, 10); // still valid
```

**Behaviour:**

- `random.float(min, max)` is inclusive of `min` and exclusive of `max`.
- Reversed bounds are automatically normalised.

### `random.choice`

Returns one random item from an array.

```ts
random.choice(["a", "b", "c"]); // one item
```

### `random.sample`

Returns a randomly sampled subset without mutating the original array.

```ts
const items = ["a", "b", "c", "d"];

random.sample(items, 2); // e.g. ["d", "a"]
random.sample(items); // single-item sample
random.sample(items, 0); // []

items; // still ["a", "b", "c", "d"]
```

**Behaviour:**

- Defaults to `count = 1`.
- Returns an empty array when `count` is `0`.
- Returns all items when `count` equals the array length.
- Never mutates the input array.

### `random.shuffle`

Returns a shuffled copy without mutating the original array.

```ts
const items = [1, 2, 3, 4];

random.shuffle(items); // shuffled copy
items; // unchanged
```

### `random.shuffler`

Creates a function that returns a newly shuffled copy on each call.

```ts
const items = [1, 2, 3, 4];

const shuffleNow = random.shuffler(items);
shuffleNow(); // shuffled copy each call
```

### `random.sampler`

Creates a function that returns a random sample on each call.

```ts
const items = [1, 2, 3, 4];

const sampleTwo = random.sampler(items, 2);
sampleTwo(); // random 2-item sample each call
```

## String

```ts
import {
  base64Encode,
  contains,
  formatInitials,
  isString,
  pluralize,
} from "@jossmac/lil-libs/string";
```

### `isString`

Type guard for string values.

```ts
isString("hello"); // true
isString(123); // false
```

### `base64Encode`

Encodes UTF-8 strings to base64, or to a base64 data URI when a MIME type is provided.

```ts
base64Encode("hello");
// "aGVsbG8="

base64Encode("hello", "text/plain");
// "data:text/plain;base64,aGVsbG8="
```

**Behaviour:**

- Supports Unicode input.
- Preserves MIME type in data URI output.
- Optimises SVG payload whitespace when `mimeType` is `"image/svg+xml"`.

### `contains`

Case-insensitive and diacritic-insensitive substring matching.

```ts
contains("café", "cafe"); // true
contains("Hello World", "world"); // true
contains("hello", "bye"); // false
```

### `pluralize`

Returns singular/plural forms with optional count prefix.

```ts
pluralize(1, "wallet"); // "1 wallet"
pluralize(2, "wallet"); // "2 wallets"
pluralize(2, ["person", "people"]); // "2 people"
pluralize(2, ["person", "people"], false); // "people"
```

### `formatInitials`

Returns initials for names with Unicode-aware grapheme support.

```ts
formatInitials("John Doe"); // "JD"
formatInitials("John Ronald Reuel Tolkien"); // "JT"
formatInitials("John Ronald Reuel Tolkien", { maxLetters: 3 }); // "JRR"
formatInitials("Élodie Durand"); // "ÉD"
formatInitials("ilker", { locale: "tr" }); // "İL"
formatInitials("李小龍"); // "李小"
```

**Signature:**

```ts
function formatInitials(
  name: string,
  options?: {
    maxLetters?: number;
    locale?: string;
  },
): string;
```

**Behaviour:**

- Defaults to `maxLetters = 2`.
- Uses first + last word initials for multi-word names when `maxLetters === 2`.
- Uses the first letter from each word (left to right) when `maxLetters >= 3`.
- For single-word names, uses the first `maxLetters` letters.
- Returns `"?"` for empty or whitespace-only input.
- Throws when `maxLetters` is not finite or is less than `1`.

## Types

```ts
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
} from "@jossmac/lil-libs/string";
```

### `Maybe<T>`

Represents a maybe-present value for app-level checks.

```ts
type MaybeName = Maybe<string>;
//   ^? string | null | undefined
```

### `Prettify<T>`

Flattens intersections and mapped types into a cleaner displayed shape.

```ts
type Raw = { id: string } & { name: string };
type User = Prettify<Raw>;
//   ^? { id: string; name: string }
```

### `Satisfies<T, Base>`

Constrains `T` to be assignable to `Base` while preserving `T`'s full detail.

```ts
type Endpoint = Satisfies<
  { method: "GET"; path: "/users" },
  { method: "GET" | "POST"; path: string }
>;
//   ^? { method: "GET"; path: "/users" }
```

### `NonNullableValues<T>`

Removes `null` and `undefined` from each property value type.

```ts
type Input = { id: string | null; age?: number | undefined };
type Output = NonNullableValues<Input>;
//   ^? { id: string; age?: number }
```

### `SomeRequired<T, K>`

Makes a subset of keys required while leaving all other keys unchanged.

```ts
type Input = { id?: string; name?: string; active?: boolean };
type Output = SomeRequired<Input, "id">;
//   ^? { id: string; name?: string; active?: boolean }
```

### `SomeOptional<T, K>`

Makes a subset of keys optional while leaving all other keys unchanged.

```ts
type Input = { id: string; name: string; active: boolean };
type Output = SomeOptional<Input, "active">;
//   ^? { id: string; name: string; active?: boolean }
```

### `TupleOf<T, N>`

Builds a fixed-length tuple of `N` elements of type `T`.

```ts
type Triple = TupleOf<number, 3>;
//   ^? [number, number, number]
```

### `Widen<T>`

Widens literals to their broader primitive types.

```ts
type A = Widen<"hello">;
//   ^? string
type B = Widen<42>;
//   ^? number
```

### `UnknownRecord`

Alias for a generic object map with unknown values.

```ts
type Payload = UnknownRecord;
//   ^? Record<string, unknown>
```

## Development

## Setup

Prerequisites:

- Node.js `24` (active LTS)
- pnpm `10.33.0` (managed via Corepack or installed globally)

```bash
nvm use
pnpm install
```

## Scripts

```bash
pnpm check          # run all static checks
pnpm check:types    # TypeScript
pnpm check:lint     # ESLint
pnpm check:format   # Prettier

pnpm test           # run tests once
pnpm test:watch     # watch mode
pnpm test:coverage  # run tests with v8 coverage
```
