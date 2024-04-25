import { type DatabaseClient } from "#core/databaseClient.js";
import {
  buildSchemaInclusionClause,
  updateDatabasesTablesInfos,
} from "./utils.js";

interface FetchSequencesResult {
  current: bigint | number;
  interval: bigint | number;
  name: string;
  schema: string;
  start: number;
}

// Query to fetch AUTO_INCREMENT information, which behaves like sequences in MySQL
const FETCH_SEQUENCES = (schemas: Array<string>) => `
SELECT
  TABLE_SCHEMA AS \`schema\`,
  TABLE_NAME AS name,
  AUTO_INCREMENT AS current
FROM
  information_schema.TABLES
WHERE
  TABLE_TYPE = 'BASE TABLE' AND
  AUTO_INCREMENT IS NOT NULL AND
  ${buildSchemaInclusionClause(schemas, "TABLE_SCHEMA")}
ORDER BY TABLE_SCHEMA, TABLE_NAME;
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
    schema: r.schema,
    name: `${r.name}_seq`,
    start: 1, // Auto-increment always starts from 1 in MySQL
    current: r.current, // Adjusting to simulate 'last_value' from PostgreSQL
    interval: 1, // Interval is always 1 in MySQL
  }));
}
