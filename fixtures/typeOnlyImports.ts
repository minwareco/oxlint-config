// Lint-clean fixture for the type-only import rules. `Sum` is used only in type position, so it
// must carry a `type` specifier, and that specifier must be inline rather than hoisted into a
// second `import type` declaration.
import { add, type Sum } from './sumTypes';

export const total: Sum = add(1, 2);
