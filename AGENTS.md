## Rules that apply everywhere

- **MUST**, **MUST NOT**, **SHOULD** and **MAY** use RFC 2119 meanings. They mark
  real invariants - layer boundaries, wire contracts, output shapes - not house style.
- Toolchain is Vite+: `vp check` (Oxfmt, Oxlint with type-aware rules and type check),
  `vp test` (Vitest node and browser projects), `vp pack` (tsdown with publint and attw).
- Every `src/**` module that renders components MUST keep working with both `fumadocs-ui`
  (Radix UI) and `@fumadocs/base-ui`. Entries differ only in the primitives they pass in.
- Props of exported components MUST stay serializable, so server components can pass them.
- Before a PR, all gates MUST pass: `pnpm run ci && pnpm run e2e`.
  Commits follow Conventional Commits.
