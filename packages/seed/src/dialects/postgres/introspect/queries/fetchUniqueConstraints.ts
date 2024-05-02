import { type DatabaseClient } from "#core/databaseClient.js";
import { buildSchemaExclusionClause } from "./utils.js";

interface FetchUniqueConstraintsResult {
  /**
   * The columns that are part of the constraint
   */
  columns: Array<string>;
  /**
   * allows us to always know if the constraint we are using
   * are the one retrieved from the database or the one we augmented via user setting or fallback
   */
  dirty: boolean;
  /**
   * The constraint name
   */
  name: string;
  /**
   * Whether the constraint is NULLS NOT DISTINCT
   */
  nullNotDistinct?: boolean;
  /**
   * The schema name
   */
  schema: string;
  /**
   * The table name
   */
  table: string;
  /**
   * The table id (schemaName.tableName)
   */
  tableId: string;
}

const FETCH_UNIQUE_CONSTRAINTS = `
SELECT
    CONCAT(tc.table_schema, '.', tc.table_name) AS "tableId",
    tc.table_schema AS "schema",
    tc.table_name AS "table",
    FALSE AS "dirty", -- Assuming all constraints are initially not dirty (unmodified)
    tc.constraint_name AS "name",
    json_agg(ccu.column_name ORDER BY ccu.column_name) AS "columns",
    pg_get_constraintdef(con.oid) ILIKE '%NULLS NOT DISTINCT%' AS "nullNotDistinct"
FROM
    information_schema.table_constraints AS tc
JOIN
    information_schema.constraint_column_usage AS ccu
ON
    tc.constraint_catalog = ccu.constraint_catalog
    AND tc.constraint_schema = ccu.constraint_schema
    AND tc.constraint_name = ccu.constraint_name
LEFT JOIN
    pg_constraint AS con
ON
    con.conname = tc.constraint_name
    AND con.connamespace = (SELECT oid FROM pg_namespace WHERE nspname = tc.constraint_schema)
WHERE
  ${buildSchemaExclusionClause("tc.table_schema")} AND
  -- If the constraint is either UNIQUE or PRIMARY KEY (implicit unique constraint)
  (tc.constraint_type = 'UNIQUE' OR tc.constraint_type = 'PRIMARY KEY')
GROUP BY
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    con.oid
ORDER BY
    tc.table_schema,
    tc.table_name,
    tc.constraint_name;
`;

const FETCH_UNIQUE_INDEXES = `
SELECT
    CONCAT(idx.schemaname, '.', idx.tablename) AS "tableId",
    idx.schemaname AS "schema",
    idx.tablename AS "table",
    FALSE AS "dirty",
    idx.indexname AS "name",
    json_agg(att.attname ORDER BY att.attname) AS "columns",
    FALSE AS "nullNotDistinct"
FROM
    pg_indexes AS idx
JOIN
    pg_class AS cls ON cls.relname = idx.indexname
JOIN
    pg_index AS ind ON ind.indexrelid = cls.oid
JOIN
    pg_attribute AS att ON att.attrelid = ind.indrelid AND att.attnum = ANY(ind.indkey)
WHERE
    ${buildSchemaExclusionClause("idx.schemaname")}
    AND ind.indisunique = TRUE
    AND NOT ind.indisprimary
GROUP BY
    idx.schemaname,
    idx.tablename,
    idx.indexname
ORDER BY
    idx.schemaname,
    idx.tablename,
    idx.indexname;
`;

export async function fetchUniqueConstraints(client: DatabaseClient) {
  const results: Array<FetchUniqueConstraintsResult> = [];
  const uniqueConstraints = await client.query<FetchUniqueConstraintsResult>(
    FETCH_UNIQUE_CONSTRAINTS,
  );

  const uniqueIndexes =
    await client.query<FetchUniqueConstraintsResult>(FETCH_UNIQUE_INDEXES);

  const constraints = new Set();
  for (const constraint of uniqueConstraints) {
    // Save the constraint to the set to avoid duplicates with unique indexes
    constraints.add(
      `${constraint.tableId}.${JSON.stringify(constraint.columns)}`,
    );
    results.push(constraint);
  }
  for (const index of uniqueIndexes) {
    // Check if the unique index is already a unique constraint
    if (!constraints.has(`${index.tableId}.${JSON.stringify(index.columns)}`)) {
      results.push(index);
    }
  }
  return results;
}
