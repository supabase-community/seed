import "@total-typescript/ts-reset";

module "exit-hook" {
  export function gracefulExit(signal?: number): never;
}
