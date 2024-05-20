import { type DatabaseClient } from "#core/databaseClient.js";
import { buildSchemaInclusionClause } from "./utils.js";

interface FetchPrimaryKeysResult {
  name: string;
  schema: string;
  table: string;
  tableId: string;
  type: string;
}

interface FetchUniqueConstraintssResult {
  columnCount: number;
  name: string;
  schema: string;
  table: string;
  tableId: string;
  type: string;
}

interface FetchUniqueConstraintsFallbackResult {
  indexName: string;
  name: string;
  schema: string;
  table: string;
  tableId: string;
  type: string;
}

const FETCH_PRIMARY_KEYS = (schemas: Array<string>) => `
SELECT 
  tc.TABLE_SCHEMA AS \`schema\`,
  tc.TABLE_NAME AS \`table\`,
  CONCAT(tc.TABLE_SCHEMA, '.', tc.TABLE_NAME) AS tableId,
  kcu.COLUMN_NAME AS name,
  cols.DATA_TYPE AS \`type\`
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
`;

const FETCH_UNIQUE_CONSTRAINTS = (schemas: Array<string>) => `
SELECT 
  s.TABLE_SCHEMA AS \`schema\`,
  s.TABLE_NAME AS \`table\`,
  CONCAT(s.TABLE_SCHEMA, '.', s.TABLE_NAME) AS tableId,
  s.COLUMN_NAME AS name,
  cols.DATA_TYPE AS type,
  COUNT(*) OVER (PARTITION BY s.TABLE_SCHEMA, s.TABLE_NAME, s.INDEX_NAME) AS columnCount
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
`;

const FETCH_UNIQUE_CONSTRAINTS_FALLBACK = (schemas: Array<string>) => `
SELECT 
  s.TABLE_SCHEMA AS \`schema\`,
  s.TABLE_NAME AS \`table\`,
  CONCAT(s.TABLE_SCHEMA, '.', s.TABLE_NAME) AS tableId,
  s.COLUMN_NAME AS name,
  cols.DATA_TYPE AS type,
  s.INDEX_NAME AS \`indexName\`
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
`;

interface PrimaryKey {
  dirty: boolean;
  keys: Array<{ name: string; type: string }>;
  schema: string;
  table: string;
  tableId: string;
}


async function isVitess(client: DatabaseClient) : Promise<boolean>{
  const result: any = await client.query(`SELECT VERSION();`);
  return result[0]['VERSION()'].includes('Vitess');
}

function processColumnCounts(results: FetchUniqueConstraintsFallbackResult[]): FetchUniqueConstraintssResult[] {
  const indexCountMap: { [key: string]: number } = {};

  results.forEach(row => {
    const indexKey = `${row.schema}.${row.table}.${row.indexName}`;
    if (!indexCountMap[indexKey]) {
      indexCountMap[indexKey] = 0;
    }
    indexCountMap[indexKey]++;
  });

  return results.map(row => ({
    schema: row.schema,
    table: row.table,
    tableId: row.tableId,
    name: row.name,
    type: row.type,
    columnCount: indexCountMap[`${row.schema}.${row.table}.${row.indexName}`]
  }));
}

export async function fetchPrimaryKeys(
  client: DatabaseClient,
  schemas: Array<string>,
) {
  const results: Record<string, PrimaryKey> = {};
  const primaryKeys = await client.query<FetchPrimaryKeysResult>(
    FETCH_PRIMARY_KEYS(schemas),
  );
  let uniqueConstraints: FetchUniqueConstraintssResult[];
  if (await isVitess(client)) {
    console.log("Vitess Mysql Detected - Falling back to fetching unique constraints without window functions");
    const uniqueConstraintsFallback = await client.query<FetchUniqueConstraintsFallbackResult>(
      FETCH_UNIQUE_CONSTRAINTS_FALLBACK(schemas)
    );
    uniqueConstraints = processColumnCounts(uniqueConstraintsFallback);
  } else {
    uniqueConstraints = await client.query<FetchUniqueConstraintssResult>(
      FETCH_UNIQUE_CONSTRAINTS(schemas),
    );
  }

  // Group all primary keys results together by tableId
  const groupedPrimaryKeys = primaryKeys.reduce<typeof results>((acc, row) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!acc[row.tableId]) {
      acc[row.tableId] = {
        dirty: false,
        keys: [],
        schema: row.schema,
        table: row.table,
        tableId: row.tableId,
      };
    }
    // Raw results can contain duplicates
    if (
      !acc[row.tableId].keys.some(
        (key) => key.name === row.name && key.type === row.type,
      )
    ) {
      acc[row.tableId].keys.push({
        name: row.name,
        type: row.type,
      });
    }
    return acc;
  }, {});
  // Group all unique constraints results together by tableId
  // choosing the constraint with the minimum column count
  const grouedUniqueConstraints = uniqueConstraints.reduce<typeof results>(
    (acc, row) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!acc[row.tableId]) {
        acc[row.tableId] = {
          dirty: false,
          keys: [],
          schema: row.schema,
          table: row.table,
          tableId: row.tableId,
        };
      }

      if (
        acc[row.tableId].keys.length === 0 ||
        row.columnCount < acc[row.tableId].keys[0].name.length
      ) {
        acc[row.tableId].keys = [{ name: row.name, type: row.type }];
      }
      return acc;
    },
    {},
  );
  // Merge the two result, giving priority to primary keys and falling back
  // to unique constraints if there is no primary key
  const tableIds = new Set([
    ...Object.keys(groupedPrimaryKeys),
    ...Object.keys(grouedUniqueConstraints),
  ]);
  for (const tableId of tableIds) {
    results[tableId] =
      groupedPrimaryKeys[tableId] ?? grouedUniqueConstraints[tableId];
  }
  return Object.values(results);
}
