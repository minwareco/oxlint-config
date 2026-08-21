# @minware/oxlint-config

Shared [oxlint](https://oxc.rs) configuration for minware repositories. This replaces
`@minware/eslint-config`. Formatting is still owned by **dprint** (`@minware/dprint-config`) —
oxlint intentionally ships no stylistic/formatting rules, so the two tools do not conflict.

See [MIGRATION.md](./MIGRATION.md) for the rule-by-rule mapping from the old ESLint config and
the list of rules we lost in the move.

## Usage

1. Install the config, oxlint, and the type-aware backend:

   ```bash
   npm i -D @minware/oxlint-config oxlint oxlint-tsgolint
   ```

2. Add a `.oxlintrc.json` to the root of the repo that extends the shared config:

   ```jsonc
   {
     "$schema": "./node_modules/oxlint/configuration_schema.json",
     "extends": ["./node_modules/@minware/oxlint-config/.oxlintrc.json"],
     // repo-specific ignores (migrated from .eslintignore); oxlint also honors .gitignore
     "ignorePatterns": [],
     "rules": {
       // repo-specific overrides only
     }
   }
   ```

3. Add/replace the lint scripts in `package.json` (keep your existing dprint `format` scripts).
   Pass `--type-aware` to activate the type-aware rules (the base config sets
   `options.typeAware: true`, but the flag is still needed for the CLI runner):

   ```jsonc
   {
     "format": "dprint fmt",
     "format:check": "dprint check",
     "lint": "run-p -c --aggregate-output \"format:check\" \"lint:oxlint\"",
     "lint:oxlint": "oxlint --type-aware",
     "lint:fix": "run-s \"format\" \"lint:oxlint -- --fix\""
   }
   ```

4. Remove ESLint: delete `.eslintrc*` and `.eslintignore`, and drop `eslint`, `eslint-config-*`,
   `eslint-plugin-*`, `@typescript-eslint/*`, and `eslint-plugin-dprint-integration` from
   `devDependencies`. (`dprint` and `@minware/dprint-config` stay.)

### Type-aware linting

The base config enables `options.typeAware: true` and includes type-aware rules
(`typescript/dot-notation`, `typescript/no-floating-promises`, `typescript/only-throw-error`,
`typescript/return-await`, `typescript/consistent-return`). These are activated automatically
when you install `oxlint-tsgolint` (step 1 above) and pass `--type-aware` to the CLI (step 3).
`oxlint-tsgolint` uses typescript-go internally — no TypeScript version constraint.

Per-repo opt-in rule (not in base): `typescript/no-unnecessary-condition` — add it to the
repo's `.oxlintrc.json` `rules`, e.g. for `app/`.

### Type-only imports

An import referenced only in type position must be annotated, so TypeScript erases it instead of
emitting a runtime import of a module that is never used at runtime. Two rules enforce this, and
they are set to the same form:

- `typescript/consistent-type-imports` (`fixStyle: inline-type-imports`) — requires the annotation.
- `import/consistent-type-specifier-style` (`prefer-inline`) — requires it to be **inline**.

```ts
// ✗ Sum is only a type, but the import is not annotated
import { add, Sum } from './sum';

// ✗ annotated, but hoisted into a second declaration for the same module
import type { Sum } from './sum';
import { add } from './sum';

// ✓ one declaration per module, type specifiers inline
import { add, type Sum } from './sum';
```

Default and namespace imports have no inline form, so they keep the `import type` prefix and are
not reported: `import type Cfg from './cfg'`, `import type * as NS from './ns'`.

Both rules are syntax-only — they run without `oxlint-tsgolint` and without `--type-aware`.

`typescript/consistent-type-imports` also has a `disallowTypeAnnotations` option, on by default,
that bans `typeof import('m')`. It is turned **off** here: `typeof import('m')` is the only way to
name a whole module's shape, and it is how lazily-loaded module handles and
`jest.requireActual<typeof import('m')>` are typed. A static `import type` cannot express either.

#### Upgrading a repo to this version

Both rules autofix, so the bump is mechanical:

```bash
npm i -D @minware/oxlint-config@latest
npm run lint:fix   # rewrites every type-only import
npm run format     # lint:fix runs dprint BEFORE oxlint, so the fixer's output is not yet formatted
```

One case is left over for you to resolve by hand. A file that already split its type imports into a
separate declaration —

```ts
import { sql } from 'slonik';
import type { ValueExpression } from 'slonik';
```

— becomes two value-form imports of the same module once the specifiers go inline, which
`import/no-duplicates` then reports. Merge them into one declaration:

```ts
import { sql, type ValueExpression } from 'slonik';
```

### ⚠️ Plugins must be repeated, not just extended

A child config's `plugins` array **overwrites** the parent's — it does not merge. The base config
enables `["eslint", "typescript", "unicorn", "oxc", "import", "react", "jest"]`. If your repo needs
an additional plugin you must repeat the base list **and** add yours. For example, a repo that wants
accessibility rules:

```jsonc
{
  "extends": ["./node_modules/@minware/oxlint-config/.oxlintrc.json"],
  "plugins": ["eslint", "typescript", "unicorn", "oxc", "import", "react", "jest", "jsx-a11y"],
  "rules": { "jsx-a11y/alt-text": "error" /* ... */ }
}
```

Two plugins are deliberately **not** in the base:

- **`jsx-a11y`** — accessibility rules were off in `@minware/eslint-config`. `ui-minware` opts back
  in using the pattern above.
- **`nextjs`** — Next.js rules (e.g. `no-img-element`) fire on _any_ JSX, not just Next projects,
  so only `app` adds `"nextjs"`.

## VS Code setup

1. Install the **Oxc** extension (`oxc.oxc-vscode`).
2. Add it to the repo's `.vscode/extensions.json` recommendations (alongside `dprint.dprint`):

   ```jsonc
   { "recommendations": ["oxc.oxc-vscode", "dprint.dprint"] }
   ```

3. In `.vscode/settings.json`, let **dprint** format and **oxc** lint/fix — do not let oxc format:

   ```jsonc
   {
     "editor.defaultFormatter": "dprint.dprint",
     "editor.formatOnSave": true,
     "oxc.enable": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.oxc": "explicit"
     }
   }
   ```

4. Remove any ESLint extension recommendation (`dbaeumer.vscode-eslint`).

## Gotchas

- Ensure `NPM_TOKEN` is set in your environment to install this private package.
- `plugins` overwrites, it does not merge — see the warning above.
- oxlint reads `.gitignore` by default; only list extra paths in `ignorePatterns`.
