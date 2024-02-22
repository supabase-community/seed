import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { v4 } from "uuid";

interface State {
  roles: Array<{
    client: Client;
    name: string;
  }>;
}

const TEST_DATABASE_SERVER =
  process.env["TEST_DATABASE_SERVER"] ??
  "postgres://postgres@localhost/postgres";
const TEST_ROLE_PREFIX = "testrole";

export const defineCreateTestRole = (state: State) => {
  const serverClient = new Client({ connectionString: TEST_DATABASE_SERVER });
  const serverDrizzle = drizzle(serverClient, { logger: false });
  let clientConnected = false;
  const createTestRole = async (client: Client) => {
    if (!clientConnected) {
      await serverClient.connect();
      clientConnected = true;
    }
    const roleName = `${TEST_ROLE_PREFIX}${v4()}`;
    await serverDrizzle.execute(
      sql.raw(`CREATE ROLE "${roleName}" WITH LOGIN PASSWORD 'password'`),
    );
    const loggedClient = new Client({
      host: client.host,
      port: client.port,
      database: client.database,
      user: roleName,
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
