import type postgres from "postgres";
import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
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
    json_agg(ccu.column_name ORDER BY ccu.column_name) AS "columns"
FROM
    information_schema.table_constraints AS tc
JOIN
    information_schema.constraint_column_usage AS ccu
ON
    tc.constraint_catalog = ccu.constraint_catalog
    AND tc.constraint_schema = ccu.constraint_schema
    AND tc.constraint_name = ccu.constraint_name
WHERE
  ${buildSchemaExclusionClause("tc.table_schema")} AND
  -- If the constraint is either UNIQUE or PRIMARY KEY (implicit unique constraint)
  (tc.constraint_type = 'UNIQUE' OR tc.constraint_type = 'PRIMARY KEY')
GROUP BY
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
ORDER BY
    tc.table_schema,
    tc.table_name,
    tc.constraint_name;
`;

export async function fetchUniqueConstraints<T extends QueryResultHKT>(
  client: PgDatabase<T>,
) {
  const response = (await client.execute(
    sql.raw(FETCH_UNIQUE_CONSTRAINTS),
  )) as postgres.RowList<Array<FetchUniqueConstraintsResult>>;

  return response;
}
