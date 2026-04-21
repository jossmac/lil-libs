# lil-libs

Small, focused TypeScript utility libraries for common app-level tasks.

## Features

- Strict TypeScript-first utilities with type guards and helper types
- Small modules grouped by domain (array, number, object, string, etc.)
- Test coverage via Vitest
- No runtime dependencies

## Install

- Node.js `24` (active LTS)
- pnpm `10.33.0` (managed via Corepack or installed globally)

```bash
nvm use
pnpm install
```

## Scripts

```bash
pnpm test           # run tests once
pnpm test:watch     # watch mode
pnpm test:coverage  # run tests with v8 coverage
```

## Usage

There is no barrel export file in this repo, import from each module directly.

```ts
import { chunk, isNonEmpty } from "lil-libs/array";
import { clamp, remap, sequence } from "lil-libs/number";
import { contains, pluralize } from "lil-libs/string";
```

## API Overview

### array

- `isNonEmpty(items)` — type guard for non-empty arrays
- `isLength(arr, n)` — tuple-length type guard
- `toArray(value)` — normalize single values/iterables/arrays into arrays
- `isIterable(value)` — iterable protocol guard
- `chunk(arr, size)` — split into fixed-size chunks
- `createStableKeySelector(keys)` — deterministic key selector from string input

### assert

- `assert(value, message?)` — runtime assertion with type narrowing
- `assertNever(value)` — exhaustive-check helper for discriminated unions
- `ensure(value, message?)` — assert and return the value

### console

- `errorOnce(message)` — log unique error messages once (no-op in production)
- `warnOnce(message)` — log unique warning messages once (no-op in production)

### error

- `isError(value)` — native `Error` guard
- `isErrorLike(value)` — guard for objects with `message`
- `parseError(value, fallback?)` — extract display-safe error messages
- `ensureError(value)` — normalize unknown thrown values to `Error`

### function

- `noop()` — no-op placeholder
- `not(predicate)` — invert a predicate function
- `isDefined(value)` — guard excluding `null | undefined`
- `resolveMaybeFn(valueOrFn, arg?)` — resolve value or unary factory
- `lazy(factory)` — lazy cached value wrapper

### json

- `stringifyWithBigIntAsString(value)` — stringify with `BigInt` → string conversion
- `stringifyWithSortedKeys(value)` — deterministic JSON serialization with sorted object keys

### number

- `isNumber(value)` and `isFiniteNumber(value)` — guards
- `isAscending(items)` / `isDescending(items)` — order checks
- `clamp(value, min, max)` — constrain a number to an inclusive range
- `roundToPrecision(value, digits, base?)` — round to a configurable decimal precision
- `roundToStep(value, step)` — snap a number to the nearest step interval
- `findNearest(value, items, bias?)` — pick the nearest value from a list with optional tie bias
- `sequence(start, end, step?)` — generate an inclusive numeric sequence
- `lerp(from, to, t)`, `unlerp(from, to, value)`, `remap(value, inRange, outRange, options?)` — interpolate and map values between ranges

### object

- `isPlainObject(value)` — plain-object guard
- `typedKeys(obj)` — get object keys with preserved key types
- `typedEntries(obj)` — get object entries with typed key/value tuples
- `typedFromEntries(entries)` — build objects from typed entries with inferred shape
- `TObject` — namespace-like helper for typed object methods

### random

The `random` object exposes:

- `random.int(min, max)` — generate a random integer within an inclusive range
- `random.float(min?, max?)` — generate a random floating-point number in a range
- `random.bool()` — generate a random boolean value
- `random.choice(items)` — pick a single random item from an array
- `random.sample(items, count?)` — return a random subset without mutating the input
- `random.sampler(items, count?)` — create a reusable sampler function for repeated sampling
- `random.shuffle(items)` — return a shuffled copy of an array
- `random.shuffler(items)` — create a reusable function that shuffles on demand

### string

- `isString(value)` — guard
- `contains(string, substring, locale?)` — case/diacritic-insensitive substring check
- `pluralize(count, terms, includeCount?)` — choose singular/plural terms with optional count prefix
- `base64Encode(value, mimeType?)` — base64 encoding or data URI generation

### types (type-only)

- `Satisfies<T, Base>` — ensure a type is assignable to a base type while preserving detail
- `Maybe<T>` — represent a value that can be `T`, `null`, or `undefined`
- `Prettify<T>` — flatten and simplify displayed object/intersection types
- `NonNullableValues<T>` — remove `null` and `undefined` from all property value types
- `SomeRequired<T, K>` — make a subset of keys required while keeping others unchanged
- `SomeOptional<T, K>` — make a subset of keys optional while keeping others unchanged
- `TupleOf<T, N>` — build a tuple of fixed length `N` filled with `T`
- `Widen<T>` — widen literal types to their broader primitive counterparts
- `UnknownRecord` — alias for a generic object map with unknown values
