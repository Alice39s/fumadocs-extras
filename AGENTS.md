# Repository Guidelines

## Rules That Apply Everywhere

- **MUST**, **MUST NOT**, **SHOULD** and **MAY** use RFC 2119 meanings. They mark
  real invariants - layer boundaries, wire contracts, output shapes - not house style.
- Every `src/**` module that renders components MUST keep working with both `fumadocs-ui`
  (Radix UI) and `@fumadocs/base-ui`. Entries differ only in the primitives they pass in.
- Props of exported components MUST stay serializable, so server components can pass them.

## Project Structure

- `src/page-actions/`: the published module. `core.ts` holds framework-free logic,
  `popover.tsx` builds the menu from injected primitives, and `index.ts` (Radix) and
  `base-ui.ts` (Base UI) are the two entries. Both entries start with `'use client'`.
- `scripts/preset-css.ts`: pack plugin that writes `css/preset.css` (generated, gitignored).
- `test/`: Vitest suites and tsnapi API snapshots in `test/__snapshots__/`.
- `e2e/`: `run.ts` installs the packed tarball into the Next.js app in `e2e/fixture/`
  for each UI variant, and `checks.ts` asserts the menu in Chromium.

## Build, Test, and Development Commands

The toolchain is Vite+, configured in `vite.config.ts`. Use pnpm.

- `pnpm run build` (`vp pack`): build `dist/` with tsdown, publint and attw.
- `pnpm run dev`: rebuild on change.
- `pnpm run check` (`vp check`): Oxfmt, type-aware Oxlint and type check.
- `pnpm test` (`vp test`): Vitest node and browser projects.
- `pnpm run knip`: report unused files, exports and dependencies.
- `pnpm run ci`: check, knip, pack, then run tests once.
- `pnpm run e2e [variant...]`: end-to-end runs for `radix`, `base-ui-alias` and `base-ui`.

## Coding Style & Naming Conventions

Oxfmt formats code: 2-space indent, no semicolons, single quotes, `arrowParens: 'avoid'`,
sorted imports and Tailwind classes. Use `import type` for types. Import cycles are errors.
The pre-commit hook runs `vp check --fix` on staged files.

## Testing Guidelines

- Name node tests `*.test.ts` and browser tests `*.browser.test.tsx`. Browser tests run in
  headless Chromium at a desktop and a mobile viewport. Run
  `pnpm exec playwright install chromium` once.
- The API snapshot test needs a fresh `dist/`, so build before testing. When you change the
  public API on purpose, update snapshots with `pnpm test run -u` and commit them.

## Commit & Pull Request Guidelines

- Commits follow Conventional Commits, for example `feat: add grouped page actions menu`.
- Before a PR, all gates MUST pass: `pnpm run ci && pnpm run e2e`. CI runs the same steps.
- For visual changes, attach light and dark screenshots of the menu.
