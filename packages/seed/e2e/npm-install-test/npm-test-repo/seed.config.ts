import { SeedPostgres } from "@snaplet/seed/adapter-postgres";
import { defineConfig } from "@snaplet/seed/config";
import postgres from "postgres";

const DB_SERVER =
  process.env["PG_TEST_DATABASE_SERVER"] ??
  "postgres://postgres@127.0.0.1:5432/postgres";

export default defineConfig({
  adapter: () => {
    const client = postgres(DB_SERVER);
    return new SeedPostgres(client);
  },
});
