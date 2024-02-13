export const dedupePreferLast = <Value>(values: Array<Value>): Array<Value> =>
  Array.from(new Set(values.reverse())).reverse();

// context(justinvdm, 18 Jan 2024): In some cases, we cannot rely on native instanceof, since the constructor might
// be an entirely different object. For example:
// * Our code and libraries (e.g. @snaplet/seed) used inside of jest - jest overrides global objects
// * Dual package hazard: (https://nodejs.org/api/packages.html#dual-package-hazard) - this can happen, for e.g, if
// for some reason two versions of our packages or their dependencies end up in the same runtime for a user
// * Comparing values created inside of a sandbox (e.g. an evaluated snaplet.config.ts file) with constructors created
// outside of that sandbox
export const isInstanceOf = <
  Constructor extends new (...args: Array<unknown>) => unknown,
>(
  v: unknown,
  constructor: Constructor,
): v is InstanceType<Constructor> => {
  if (v instanceof constructor) {
    return true;
  }

  if (v?.constructor.name === constructor.name) {
    return true;
  }

  return false;
};

export function isError(e: unknown): e is Error {
  return Boolean(
    e instanceof Error ||
      // In some case, like jest test running environment, we can't rely on the instanceof
      // operator because jest override global Error object
      // Since some of our sdk code is integrated into the seed client which can be run in test environment
      // we need this custom function to check if an object is an error, or more accurately, if it's 'error like'
      (typeof (e as Error).message === "string" &&
        typeof (e as Error).name === "string" &&
        (e as Error).constructor),
  );
}

export function escapeKey(key: string): string {
  // This regex checks for a valid JavaScript identifier.
  // It should start with a letter, underscore or dollar, followed by zero or more letters, underscores, dollars or digits.
  const isValidIdentifier = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(key);

  if (isValidIdentifier) {
    return key;
  } else {
    return `"${key}"`;
  }
}
