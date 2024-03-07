import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { v4 } from "uuid";

interface State {
  roles: Array<{
    client: postgres.Sql;
    name: string;
  }>;
}

const TEST_DATABASE_SERVER =
  process.env["PG_TEST_DATABASE_SERVER"] ??
  "postgres://postgres@localhost/postgres";
const TEST_ROLE_PREFIX = "testrole";

export const defineCreateTestRole = (state: State) => {
  const serverClient = postgres(TEST_DATABASE_SERVER, { max: 1 });
  const serverDrizzle = drizzle(serverClient, { logger: false });
  const createTestRole = async (client: postgres.Sql) => {
    const roleName = `${TEST_ROLE_PREFIX}${v4()}`;
    await serverDrizzle.execute(
      sql.raw(`CREATE ROLE "${roleName}" WITH LOGIN PASSWORD 'password'`),
    );
    const loggedClient = postgres(TEST_DATABASE_SERVER, {
      max: 1,
      database: client.options.database,
      username: roleName,
      password: "password",
    });
    const result = {
      client: loggedClient,
      name: roleName,
    };
    state.roles.push(result);
    return result;
  };

  createTestRole.afterEach = async () => {
    const roles = state.roles;
    state.roles = [];

    const failures: Array<{ error: Error; roleName: string }> = [];

    // Close all pools connections on the database, if there is more than one to be able to drop it
    for (const { name } of roles) {
      try {
        await serverDrizzle.execute(sql.raw(`DROP ROLE IF EXISTS "${name}"`));
      } catch (error) {
        failures.push({
          roleName: name,
          error: error as Error,
        });
      }
    }

    if (failures.length) {
      throw new Error(
        [
          "Failed to delete all roleNames, note that these will need to be manually cleaned up:",
          JSON.stringify(failures, null, 2),
        ].join("\n"),
      );
    }
  };

  return createTestRole;
};

export const createTestRole = defineCreateTestRole({ roles: [] });
