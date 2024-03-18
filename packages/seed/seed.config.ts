import { SeedPostgres } from "@snaplet/seed/adapter-postgres";
import { defineConfig } from "@snaplet/seed/config";
import postgres from "postgres";

export default defineConfig({
  adapter: () =>
    new SeedPostgres(
      postgres("postgres://postgres@localhost/5432/snaplet_development"),
    ),
  // insert your postgres client instance here
});
