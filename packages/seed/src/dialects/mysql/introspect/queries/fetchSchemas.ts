import { type DatabaseClient } from "#core/databaseClient.js";

interface SchemaPair {
  CONSTRAINT_SCHEMA: string;
  REFERENCED_TABLE_SCHEMA: string;
}

const FETCH_ALL_SCHEMA_RELATIONSHIPS = `
SELECT DISTINCT
    CONSTRAINT_SCHEMA,
    REFERENCED_TABLE_SCHEMA
FROM
    information_schema.KEY_COLUMN_USAGE
WHERE
    REFERENCED_TABLE_SCHEMA IS NOT NULL
    AND TABLE_SCHEMA != REFERENCED_TABLE_SCHEMA;
`;

// Define a function to find all related schemas
function findRelatedSchemas(
  startSchema: string,
  schemaPairs: Array<SchemaPair>,
) {
  let related = new Set([startSchema]);
  let newFound = true;

  while (newFound) {
    newFound = false;
    let currentRelated = new Set([...related]); // Snapshot of currently related schemas

    schemaPairs.forEach((pair) => {
      if (
        currentRelated.has(pair.CONSTRAINT_SCHEMA) &&
        !related.has(pair.REFERENCED_TABLE_SCHEMA)
      ) {
        related.add(pair.REFERENCED_TABLE_SCHEMA);
        newFound = true;
      }
      if (
        currentRelated.has(pair.REFERENCED_TABLE_SCHEMA) &&
        !related.has(pair.CONSTRAINT_SCHEMA)
      ) {
        related.add(pair.CONSTRAINT_SCHEMA);
        newFound = true;
      }
    });
  }

  return [...related]; // Convert Set to Array
}

export async function fetchSchemas(client: DatabaseClient) {
  // Fetch all schema relationships
  const relationships = await client.query<SchemaPair>(
    FETCH_ALL_SCHEMA_RELATIONSHIPS,
  );

  // Find the current database name
  const currentDatabase = await client.query<{ currentDatabase: string }>(
    "SELECT DATABASE() as currentDatabase",
  );
  const currentDbName = currentDatabase[0].currentDatabase;
  // Use the function to find all schemas related to the current database
  const relatedSchemas = findRelatedSchemas(currentDbName, relationships);
  return relatedSchemas;
}
