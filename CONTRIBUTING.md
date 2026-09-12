# Contributing to Presupuestapp

Thanks for taking the time to contribute. This is a small, single-maintainer
open-source project — keeping changes focused and easy to review goes a long
way.

## Before you start

Read `CLAUDE.md` first — it's the source of truth for the architecture (the
document model, routing, persistence/sharing, and conventions). `PRODUCT.md`
and `DESIGN.md` cover product intent and the app-chrome design system if
your change touches either.

## Setup

Requires Node 22 (see `.nvmrc`) and [pnpm](https://pnpm.io) 11.

```bash
pnpm install
pnpm dev
```

## Conventions

- **Language:** routes and every internal identifier are in English. All
  user-facing copy is Argentine Spanish (es-AR) — keep the voice plain and
  direct, not corporate.
- **`components/ui/*`** are vendored shadcn/ui primitives — don't hand-edit
  them. Customize per call site via `className`/props, or wrap them in a
  feature component instead.
- **Formatting** is enforced by Prettier (100 col, single quotes, no
  trailing commas, `arrowParens: avoid`) — run `pnpm prettier` before
  committing rather than hand-formatting.
- **Path alias:** `@/*` resolves to the repo root.

## Before opening a pull request

There's no test suite or CI — `lint` and `build` are the only gates, so both
must pass locally:

```bash
pnpm lint
pnpm build
```

For UI changes, actually run `pnpm dev` and try the feature in a browser —
type-checking and linting verify correctness, not that the feature works.

## Commit messages

Recent history uses a light conventional-commit style: `feat:`, `fix:`,
`chore:`, `docs:` followed by a short, imperative summary. Match it.

## Pull requests

Changes to `main` go through a pull request. Keep each PR scoped to one
change — describe what changed and why (the "why" matters more than the
"what", which the diff already shows).

## Reporting bugs / suggesting features

Open a GitHub issue. Include repro steps for bugs; for feature ideas,
explain the use case, not just the desired implementation.
