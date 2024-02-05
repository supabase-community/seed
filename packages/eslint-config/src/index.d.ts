import { type Linter } from "eslint";

declare function defineConfig<T extends Array<Linter.FlatConfig>>(config: T): T;

declare const recommended: Array<Linter.FlatConfig>;
declare const react: Array<Linter.FlatConfig>;

export {
  defineConfig,
  recommended,
  react,
};