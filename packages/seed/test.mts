import { createConnection } from "mysql2/promise";

const TEST_DATABASE_SERVER = "mysql://root@127.0.0.1:3306/mysql";
const url = new URL(TEST_DATABASE_SERVER);

const dbServerClient = await createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password === "" ? undefined : url.password,
  database: url.pathname.replace("/", "") || "mysql", // Default database from the DSN or fallback to 'mysql'
  multipleStatements: true,
});

await dbServerClient.connect();

const results = await dbServerClient.query(
  "SELECT SCHEMA_NAME as schemaName FROM information_schema.schemata ORDER BY SCHEMA_NAME",
);

console.log("results:", results);
