// Companion module for typeOnlyImports.ts: exports both a type and a value, so the importing file
// exercises a mixed value/type import declaration.
export type Sum = number;

export const add = (a: number, b: number): Sum => a + b;
