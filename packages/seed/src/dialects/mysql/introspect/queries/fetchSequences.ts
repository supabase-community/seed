import { type DatabaseClient } from "#core/databaseClient.js";
import {
  buildSchemaInclusionClause,
  updateDatabasesTablesInfos,
} from "./utils.js";

interface FetchSequencesResult {
  columnName: string;
  current: bigint | number;
  interval: bigint | number;
  name: string;
  schema: string;
  start: number;
}

// Updated query to fetch AUTO_INCREMENT information along with the specific column
const FETCH_SEQUENCES = (schemas: Array<string>) => `
SELECT
  t.TABLE_SCHEMA AS \`schema\`,
  t.TABLE_NAME AS name,
  t.AUTO_INCREMENT AS current,
  c.COLUMN_NAME AS columnName
FROM
  information_schema.TABLES t
JOIN
  information_schema.COLUMNS c ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
WHERE
  t.TABLE_TYPE = 'BASE TABLE' AND
  t.AUTO_INCREMENT IS NOT NULL AND
  c.EXTRA LIKE '%auto_increment%' AND
  ${buildSchemaInclusionClause(schemas, "t.TABLE_SCHEMA")}
ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME;
`;

export async function fetchSequences(
  client: DatabaseClient,
  schemas: Array<string>,
) {
  // MySQL will delegate updating the informations_schemas infos by default
  // When fetching sequences, we need to make sure the tables infos are up-to-date
  await updateDatabasesTablesInfos(client, schemas);
  const response = await client.query<FetchSequencesResult>(
    FETCH_SEQUENCES(schemas),
  );

  return response.map((r) => ({
    columnName: r.columnName,
    tableId: `${r.schema}.${r.name}`,
    schema: r.schema,
    name: `${r.schema}.${r.name}.${r.columnName}`,
    start: 1, // Auto-increment always starts from 1 in MySQL
    current: r.current, // Adjusting to simulate 'last_value' from PostgreSQL
    interval: 1, // Interval is always 1 in MySQL
  }));
}
