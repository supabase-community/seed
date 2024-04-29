export type AsyncFunctionSuccessType<
  T extends (...args: never) => Promise<unknown>,
> = Awaited<ReturnType<T>>;
