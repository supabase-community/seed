export function serializeParameters(parameters: Array<unknown>) {
  return parameters
    .map((p) => JSON.stringify(p))
    .join(",")
    .replace(/"process\.env\.(\w+)"/g, "process.env.$1");
}
