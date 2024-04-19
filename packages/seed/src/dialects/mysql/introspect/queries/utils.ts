import { type DatabaseClient } from "#core/databaseClient.js";
import { escapeIdentifier, escapeLiteral } from "../../utils.js";

const EXCLUDED_SCHEMAS = ["information_schema", "performance_schema", "sys"];

function buildSchemaExclusionClause(escapedColumn: string) {
  return EXCLUDED_SCHEMAS.map(
    (s) => `${escapedColumn} NOT LIKE ${escapeLiteral(s)}`,
  ).join(" AND ");
}

function buildSchemaInclusionClause(
  schemas: Array<string>,
  escapedColumn: string,
) {
  return schemas
    .map((s) => `${escapedColumn} = ${escapeLiteral(s)}`)
    .join(" OR ");
}

const FETCH_TABLES = (schema: string) => `
SELECT TABLE_NAME as tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = ${escapeLiteral(schema)}
`;
const ANALYZE_TABLE = (schema: string, table: string) => `
ANALYZE TABLE ${escapeIdentifier(schema)}.${escapeIdentifier(table)}
`;
const OPTIMIZE_TABLE = (schema: string, table: string) => `
OPTIMIZE TABLE ${escapeIdentifier(schema)}.${escapeIdentifier(table)}
`;

async function updateDatabasesTablesInfos(
  client: DatabaseClient,
  schemas: Array<string>,
) {
  for (const schema of schemas) {
    const tables = await client.query<{ tableName: string }>(
      FETCH_TABLES(schema),
    );
    for (const { tableName } of tables) {
      await client.execute(ANALYZE_TABLE(schema, tableName));
      await client.execute(OPTIMIZE_TABLE(schema, tableName));
    }
  }
}

export {
  buildSchemaExclusionClause,
  buildSchemaInclusionClause,
  updateDatabasesTablesInfos,
};
