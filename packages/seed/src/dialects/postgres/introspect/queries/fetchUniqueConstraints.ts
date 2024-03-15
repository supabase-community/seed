import { type DrizzleDbClient } from "#core/adapters.js";
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

export async function fetchUniqueConstraints(client: DrizzleDbClient) {
  const response = await client.query<FetchUniqueConstraintsResult>(
    FETCH_UNIQUE_CONSTRAINTS,
  );

  return response;
}
