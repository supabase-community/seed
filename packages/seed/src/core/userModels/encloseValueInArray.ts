export function encloseValueInArray(value: string, dimensions: number) {
  if (dimensions === 0) {
    return value;
  }

  return Array(dimensions)
    .fill(undefined)
    .reduce<string>((acc) => `[${acc}]`, value);
}
