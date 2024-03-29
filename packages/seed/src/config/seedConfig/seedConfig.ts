import { loadConfig } from "c12";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as z from "zod";
import { getRootPath } from "#config/utils.js";
import { type Inflection } from "#core/dataModel/aliases.js";
import { adapterConfigSchema } from "./adapterConfig.js";
import { aliasConfigSchema } from "./aliasConfig.js";
import { fingerprintConfigSchema } from "./fingerprintConfig.js";
import { selectConfigSchema } from "./selectConfig.js";

// We place the "seed" config at the root of the config object
const configSchema = z.object({
  alias: aliasConfigSchema.optional(),
  adapter: adapterConfigSchema,
  fingerprint: fingerprintConfigSchema.optional(),
  select: selectConfigSchema.optional(),
  // TODO: add "introspect" config here to enable virtual constraints user defined setup
});

type SeedConfigInferred = z.infer<typeof configSchema>;

export interface SeedConfig {
  /**
   * The database adapter to use.
   *
   * @example
   * ```ts seed.config.ts
   * import { SeedPostgres } from "@snaplet/seed/adapter-postgres";
   * import { defineConfig } from "@snaplet/seed/config";
   * import postgres from "postgres";
   *
   * export default defineConfig({
   *   adapter: () => {
   *     const client = postgres(process.env.DATABASE_URL);
   *     return new SeedPostgres(client);
   *   },
   * });
   * ```
   *
   * To learn more about the available adapters, see the [Adapters](https://docs.snaplet.dev/seed/reference/adapters) reference.
   */
  adapter: SeedConfigInferred["adapter"];
  alias?: {
    /**
     * Apply a global renaming strategy to all tables and columns in the generated Seed Client.
     *
     * When `true`, a default strategy is applied:
     *
     * - **Model names:** pluralized and camelCased.
     * - **Scalar field names:** camelCased.
     * - **Parent field names (one to one relationships):** singularized and camelCased.
     * - **Child field names (one to many relationships):** pluralized and camelCased.
     * - We also support prefix extraction and opposite baseName for foreign keys inspired by [PostGraphile](https://github.com/graphile/pg-simplify-inflector#naming-your-foreign-key-fields).
     *
     * @example
     * ```ts seed.client.ts
     * import { defineConfig } from "@snaplet/seed/config";
     *
     * export default defineConfig({
     *   alias: {
     *     inflection: true,
     *   },
     * });
     * ```
     */
    inflection?: Partial<Inflection> | boolean;
    /**
     * Rename specific tables and columns in the generated Seed Client.
     * This option is useful for resolving renaming conflicts that can arise when using `alias.inflection`.
     *
     * @example
     * ```ts seed.client.ts
     * import { defineConfig } from "@snaplet/seed/config";
     *
     * export default defineConfig({
     *   alias: {
     *     override: {
     *       Book: {
     *         name: "books",
     *         fields: {
     *           User: "author",
     *           published_at: "publishedAt",
     *         },
     *       },
     *     },
     *   },
     * });
     * ```
     */
    override?: NonNullable<SeedConfigInferred["alias"]>["override"];
  };
  fingerprint?: SeedConfigInferred["fingerprint"];
  /**
   * Exclude tables from the generated Seed Client.
   * For excluding multiple tables at once, you can use a wildcard character `*` at the end of the table name.
   *
   * @example
   * ```ts seed.client.ts
   * import { defineConfig } from "@snaplet/seed/config";
   *
   * export default defineConfig({
   *   select: {
   *     "archive*": false,
   *     "access_logs": false,
   *     "auth.*": false,
   *   },
   * });
   * ```
   */
  select?: SeedConfigInferred["select"];
}

export async function getSeedConfig() {
  const { config } = await loadConfig({
    dotenv: true,
    name: "seed",
  });

  const parsedConfig = configSchema.parse(config ?? {});

  return parsedConfig;
}

export async function getSeedConfigPath() {
  return join(await getRootPath(), "seed.config.ts");
}

export async function seedConfigExists() {
  return existsSync(await getSeedConfigPath());
}

export async function setSeedConfig(template: string) {
  await writeFile(await getSeedConfigPath(), template);
}
