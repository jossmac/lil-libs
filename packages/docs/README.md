# @jossmac/lil-libs-docs

TypeDoc site for [@jossmac/lil-libs](../lil-libs). Generates static API reference pages from the library source and publishes them to [GitHub Pages](https://jossmac.github.io/lil-libs/).

## Commands

From the repo root:

```bash
pnpm docs:build    # one-off build → packages/docs/dist
pnpm docs:dev      # watch + live reload
pnpm docs:preview  # serve the last build
```

From this package:

```bash
pnpm build
pnpm dev
pnpm preview
pnpm clean         # remove dist/
```

## How it works

TypeDoc reads every module under `packages/lil-libs/src` (test files excluded), uses the library's `tsconfig.json`, and writes HTML to `dist/`. The root [README.md](../../README.md) is included as the site landing page.

Configuration lives in [typedoc.json](./typedoc.json):

| Option                         | Purpose                                   |
| ------------------------------ | ----------------------------------------- |
| `entryPointStrategy: "expand"` | One page per source file                  |
| `basePath: "/lil-libs"`        | GitHub Pages path prefix                  |
| `githubPages: true`            | Emit `.nojekyll` and relative asset paths |
| `plugin`                       | GitHub theme + local customizations       |
| `customCss` / `favicon`        | Branding in [assets/](./assets/)          |

## Custom plugins

Two small TypeDoc plugins live in [plugin/](./plugin/):

- **`dedupe-overload-comments.mjs`** — TypeScript copies JSDoc from the first overload onto later overloads. This strips duplicate comments so examples and remarks render once.
- **`function-page-navigation.mjs`** — Adds "On This Page" anchors and links for Parameters, Returns, Type Parameters, and block tags on standalone function pages.

## Deployment

The [Docs workflow](../../.github/workflows/docs.yml) builds on pushes to `main`, version tags, or manual dispatch, then deploys `packages/docs/dist` to GitHub Pages.

To verify locally before pushing:

```bash
pnpm docs:build
pnpm docs:preview
```

Then open the URL printed by `live-server` (typically `http://127.0.0.1:8080/lil-libs/`).

## Layout

```
packages/docs/
├── assets/          # favicon, custom CSS
├── plugin/          # TypeDoc renderer hooks
├── dist/            # generated site (gitignored)
├── typedoc.json
└── package.json
```
