// Lint-clean fixture used by `npm test` to confirm the shared config parses and runs.
export const add = (a: number, b: number): number => {
  if (a === b) {
    return a;
  }
  return a + b;
};
