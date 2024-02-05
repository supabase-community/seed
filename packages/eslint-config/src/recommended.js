import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-i";
import nodeImportPlugin from "eslint-plugin-node-import";
import prettierPlugin from "eslint-plugin-prettier";
import perfectionistPlugin from 'eslint-plugin-perfectionist';
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import vitestPlugin from "eslint-plugin-vitest";
import globals from "globals";

export const recommended = [
  {
    ignores: ["**/{.cache,.dts,dist,node_modules,playwright,test-results}"],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
  {
    files: ["**/*.?([cm])[jt]s?(x)"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: typescriptParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        project: "./tsconfig.json",
        EXPERIMENTAL_useProjectService: true,
      },
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".js", ".cjs", ".mjs", ".jsx", ".cjsx", ".mjsx", ".ts", ".cts", ".mts", ".tsx", ".ctsx", ".mtsx"],
      },
      "import/external-module-folders": ["node_modules", "node_modules/@types"],
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      import: importPlugin,
      "node-import": nodeImportPlugin,
      perfectionist: perfectionistPlugin,
      prettier: prettierPlugin,
      "unused-imports": unusedImportsPlugin,
    },
    rules: {
      ...typescriptPlugin.configs["eslint-recommended"].rules,
      ...typescriptPlugin.configs["strict-type-checked"].rules,
      ...typescriptPlugin.configs["stylistic-type-checked"].rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
      ...perfectionistPlugin.configs["recommended-natural"].rules,
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/return-await": "error",
      "import/consistent-type-specifier-style": ["error", "prefer-inline"],
      "import/newline-after-import": "error",
      "import/no-duplicates": ["error", { "prefer-inline": true }],
      "import/no-unresolved": "off",
      "node-import/prefer-node-protocol": "error",
      "no-restricted-syntax": [
        "error",
        {
          "selector": "TSEnumDeclaration",
          "message": "Use const object instead of enum."
        }
      ],
      "perfectionist/sort-imports": ["error", {
        ...perfectionistPlugin.configs["recommended-natural"].rules["perfectionist/sort-imports"][1],
        "newlines-between": "never",
        "internal-pattern": ["#*", "#*/**"],
      }],
      "perfectionist/sort-objects": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": ["error", { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }],
      ...prettierConfig.rules,
      ...prettierPlugin.configs.recommended.rules,
    },
  },
  {
    files: ["**/?(*.)+(test).?([cm])[jt]s?(x)"],
    plugins: {
      vitest: vitestPlugin,
    },
    rules: vitestPlugin.configs.recommended.rules
  }
];