# ESLint → oxlint migration (MW-11618)

This documents how `@minware/eslint-config@2.1.0` (Airbnb base + minware overrides) was mapped to
`@minware/oxlint-config`. The mapping was derived authoritatively: we dumped the fully-resolved
ESLint ruleset with `eslint --print-config` and intersected every **enabled** rule (286 rules)
against oxlint's rule registry (`oxlint --rules --format json`, oxlint 1.71).

## Summary

| Bucket | Count | Where it lives |
|--------|-------|----------------|
| **Supported (syntax)** — implemented by oxlint, carried over at original severity | 172 | active in `.oxlintrc.json` `rules` |
| **Supported (type-aware)** — available via `oxlint-tsgolint`, activated by `options.typeAware` | 5 | active in `.oxlintrc.json` (silently skipped without `--type-aware`) |
| **Roadmap** — not yet in oxlint | ~31 | commented out in `.oxlintrc.json` under the proposed name |
| **Lost: formatting** — owned by dprint | ~75 | dropped (see below) |
| **Lost: custom/ticket** — intentionally dropped | 3 | dropped (see below) |
| **Replaced** | 1 | `unused-imports/no-unused-imports` → `no-unused-vars` |

The base config uses only explicit rules — no `categories` shortcut. This keeps the rule set
faithful to `@minware/eslint-config` without pulling in oxlint-native or plugin-specific
correctness rules that have no ESLint equivalent.

## Naming translation

- `@typescript-eslint/X` → oxlint implements most TS extension rules under the **`eslint`** scope
  (its core rules are natively TypeScript-aware), so e.g. `@typescript-eslint/no-unused-vars`
  becomes plain `no-unused-vars`. A few exist only under `typescript/` and are **type-aware** (see
  below).
- `react-hooks/X` → `react/X` (oxlint folds the hooks rules into the react plugin).
- `import/X`, `react/X`, `jest/X`, `jsx-a11y/X` keep their prefix (`jsx-a11y` config key maps to the
  internal `jsx_a11y` scope).

## Options carried over

Most rules are enabled severity-only (oxlint's default options match common usage). Options were
preserved only where `@minware/eslint-config` customised them:
`eqeqeq` (`always`), `radix` (`as-needed`), `prefer-const` (`destructuring: all`),
`no-param-reassign` (props + ignore list), `no-use-before-define`, `no-unused-vars` (`^_` patterns),
`no-empty-function` (`allow` arrow/functions/methods), `no-unused-expressions`,
`react/jsx-filename-extension` (`.jsx`/`.tsx`).

## Type-aware rules (commented — enable later)

These have oxlint implementations, but only under the type-aware engine
(`options.typeAware: true` + the `oxlint-tsgolint` package + TypeScript 7), which is not yet
production-ready. They are commented in `.oxlintrc.json`:

- `typescript/dot-notation` (was `@typescript-eslint/dot-notation`)
- `typescript/only-throw-error` (was `@typescript-eslint/only-throw-error`)
- `typescript/return-await` (was `@typescript-eslint/return-await`, `in-try-catch`)

> Per-repo type-aware rules used the same engine and are likewise deferred:
> `@typescript-eslint/no-floating-promises` (orchestrator, gql-generator) and
> `@typescript-eslint/no-unnecessary-condition` (app).

## Roadmap rules (commented — not yet in oxlint)

Notable ones (full list in `.oxlintrc.json`): `consistent-return`,
`import/no-extraneous-dependencies`, `import/order`, `import/no-unresolved`,
`import/no-import-module-exports`, `import/no-useless-path-segments`, `strict`, `one-var`,
`no-unreachable-loop`, and the React prop-types family (`react/prop-types`,
`react/no-unused-prop-types`, `react/destructuring-assignment`,
`react/function-component-definition`, `react/sort-comp`, etc.). Re-enable by uncommenting once
oxlint ships them.

## What we're losing (dropped, not coming back via this config)

### Intentionally disabled (deviates from airbnb)

| Rule | Reason |
|------|--------|
| `no-underscore-dangle` | Codebase uses `_prefix` convention for private/internal identifiers. The rule has no "allow all leading underscores" option; disabling is the only practical choice. This is consistent with `no-unused-vars` already accepting `^_` as an ignore pattern. |

### Intentionally dropped (per ticket)

| Rule | Reason |
|------|--------|
| `@typescript-eslint/naming-convention` | Not in oxlint. Enforce naming via code review. |
| `no-restricted-syntax` (LabeledStatement / WithStatement) | Not in oxlint. Labeled statements / `with` are rare. |
| `rulesdir/jsx-wrap-multilines` (custom rule) + `react/jsx-wrap-multilines` | Custom plugin discarded; wrapping is handled by dprint. |

### Formatting / stylistic — owned by dprint

oxlint implements no formatting rules. All of these are already handled by dprint, so dropping them
is a no-op for the codebase:

- ESLint core (deprecated/formatting): `arrow-parens`, `operator-linebreak`, `object-curly-newline`,
  `semi`, `indent`, `quotes`, `comma-dangle`, `comma-spacing`, `brace-style`, `key-spacing`,
  `keyword-spacing`, `max-len`, `no-multi-spaces`, `no-trailing-spaces`, `space-*`, `spaced-comment`,
  `padded-blocks`, `no-multiple-empty-lines`, `func-call-spacing`, `function-paren-newline`, … (~60)
- React JSX layout: `react/jsx-indent`, `react/jsx-indent-props`, `react/jsx-curly-spacing`,
  `react/jsx-closing-bracket-location`, `react/jsx-closing-tag-location`,
  `react/jsx-max-props-per-line`, `react/jsx-first-prop-new-line`, `react/jsx-equals-spacing`,
  `react/jsx-tag-spacing`, `react/jsx-props-no-multi-spaces`, `react/jsx-curly-newline`

### Replaced

- `unused-imports/no-unused-imports` → covered by `no-unused-vars` (the `eslint-plugin-unused-imports`
  plugin is discarded). Unused imports surface as `no-unused-vars` warnings.

## How to reproduce / update this mapping

```bash
# 1. Dump the resolved ESLint config (run inside eslint-config/ with deps installed)
npx eslint --print-config some.ts > resolved.json
# 2. Dump the oxlint registry
npx oxlint --rules --format json > oxlint-rules.json
# 3. Intersect enabled (non-off) rules against the registry, translating names as above.
```
