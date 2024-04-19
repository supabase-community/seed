import { type DatabaseClient } from "#core/databaseClient.js";

interface FetchSchemasResult {
  schemaName: string;
}
const FETCH_AUTHORIZED_SCHEMAS = `
SELECT DISTINCT related_database as schemaName
FROM (
  SELECT 
    CASE
      WHEN CONSTRAINT_SCHEMA = DATABASE() THEN REFERENCED_TABLE_SCHEMA
      WHEN REFERENCED_TABLE_SCHEMA = DATABASE() THEN CONSTRAINT_SCHEMA
    END AS related_database
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE
    (CONSTRAINT_SCHEMA = DATABASE() OR REFERENCED_TABLE_SCHEMA = DATABASE())
    AND REFERENCED_TABLE_SCHEMA IS NOT NULL
    AND TABLE_SCHEMA != REFERENCED_TABLE_SCHEMA
  UNION
  SELECT DATABASE() AS related_database
) AS subquery
ORDER BY related_database;
`;

export async function fetchSchemas(client: DatabaseClient) {
  const response = await client.query<FetchSchemasResult>(
    FETCH_AUTHORIZED_SCHEMAS,
  );

  return response.map((row) => row.schemaName);
}
