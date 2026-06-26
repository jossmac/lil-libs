# Lil’ Libs

A small collection of TypeScript-first utilities for everyday application code. Each module is focused, composable, and ships with zero runtime dependencies.

## Install

```bash
pnpm add @jossmac/lil-libs
```

## Usage

Import only what you need via subpath exports:

```ts
import { chunk, partition } from "@jossmac/lil-libs/array";
import { clamp, lerp } from "@jossmac/lil-libs/number";
import type { Maybe, Prettify } from "@jossmac/lil-libs/types";
```

### Modules

- `array`
- `assert`
- `console`
- `constants`
- `datetime`
- `dom`
- `error`
- `function`
- `number`
- `object`
- `random`
- `string`
- `types`

## API documentation

Full API reference with examples: [jossmac.github.io/lil-libs](https://jossmac.github.io/lil-libs/)

## License

MIT
