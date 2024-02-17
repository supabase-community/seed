export type AsyncFunctionSuccessType<
  T extends (...args: any) => Promise<unknown>,
> = Awaited<ReturnType<T>>