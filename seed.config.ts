import { defineConfig } from "@snaplet/seed";
import { createDatabaseClient } from "@snaplet/seed/postgres-js";
import postgres from "postgres";

export default defineConfig({
  databaseClient: () => createDatabaseClient(postgres(process.env.DATABASE_URL))
});