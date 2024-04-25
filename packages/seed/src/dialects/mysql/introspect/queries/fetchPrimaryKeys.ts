import { type DatabaseClient } from "#core/databaseClient.js";
import { buildSchemaInclusionClause } from "./utils.js";

interface FetchPrimaryKeysResult {
  dirty: boolean;
  keys: Array<{ name: string; type: string }>;
  table: string;
  tableId: string;
}

const FETCH_PRIMARY_KEYS = (schemas: Array<string>) => `
SELECT 
  tc.TABLE_SCHEMA AS \`schema\`,
  tc.TABLE_NAME AS \`table\`,
  CONCAT(tc.TABLE_SCHEMA, '.', tc.TABLE_NAME) AS tableId,
  JSON_ARRAYAGG(JSON_OBJECT('name', kcu.COLUMN_NAME, 'type', cols.DATA_TYPE)) AS \`keys\`,
  false AS dirty
FROM 
  information_schema.TABLE_CONSTRAINTS AS tc
JOIN 
  information_schema.KEY_COLUMN_USAGE AS kcu 
    ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
    AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA 
    AND tc.TABLE_NAME = kcu.TABLE_NAME
JOIN
  information_schema.COLUMNS AS cols
    ON cols.TABLE_SCHEMA = tc.TABLE_SCHEMA
    AND cols.TABLE_NAME = tc.TABLE_NAME
    AND cols.COLUMN_NAME = kcu.COLUMN_NAME
WHERE 
  tc.CONSTRAINT_TYPE = 'PRIMARY KEY' AND
  ${buildSchemaInclusionClause(schemas, "tc.TABLE_SCHEMA")}
GROUP BY 
  tc.TABLE_SCHEMA, tc.TABLE_NAME
UNION ALL
SELECT 
  s.TABLE_SCHEMA AS \`schema\`,
  s.TABLE_NAME AS \`table\`,
  CONCAT(s.TABLE_SCHEMA, '.', s.TABLE_NAME) AS tableId,
  JSON_ARRAYAGG(JSON_OBJECT('name', s.COLUMN_NAME, 'type', cols.DATA_TYPE)) AS \`keys\`,
  false AS dirty
FROM 
  information_schema.STATISTICS AS s
JOIN
  information_schema.COLUMNS AS cols
    ON cols.TABLE_SCHEMA = s.TABLE_SCHEMA
    AND cols.TABLE_NAME = s.TABLE_NAME
    AND cols.COLUMN_NAME = s.COLUMN_NAME
WHERE 
  s.NON_UNIQUE = 0 AND
  s.INDEX_NAME != 'PRIMARY' AND
  cols.IS_NULLABLE = 'NO' AND
  ${buildSchemaInclusionClause(schemas, "s.TABLE_SCHEMA")}
GROUP BY 
  s.TABLE_SCHEMA, s.TABLE_NAME
HAVING 
  COUNT(s.COLUMN_NAME) > 0
ORDER BY 
  \`schema\`, \`table\`;
`;

export async function fetchPrimaryKeys(
  client: DatabaseClient,
  schemas: Array<string>,
) {
  const query = FETCH_PRIMARY_KEYS(schemas);
  const response = await client.query<FetchPrimaryKeysResult>(query);
  return response.map((row) => ({
    ...row,
    dirty: Boolean(row.dirty),
  }));
}
