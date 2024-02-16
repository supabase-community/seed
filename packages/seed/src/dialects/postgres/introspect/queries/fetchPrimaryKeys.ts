import type postgres from "postgres";
import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
import { buildSchemaExclusionClause } from "./utils.js";

type FetchPrimaryKeysResult = {
  tableId: string
  schema: string
  table: string
  // Simple boolean who'll allows us to always know if the primary keys we are using
  // are the one retrieved from the database or the one we fallback on
  dirty: boolean
  keys: Array<{ name: string; type: string }>
}

const FETCH_PRIMARY_KEYS = `
WITH
keys_order AS (
  VALUES (1), (2), (3)
),
keys_search AS (
  SELECT
    n.nspname as schema_name,
    c.relname as table_name,
    a.attname as "column",
    t.typname as "type",
    k.order_num,
    con.contype
  FROM
    (VALUES (1, 'p'), (2, 'u'), (3, 'ui')) as k(order_num, contype)
  LEFT JOIN pg_class c ON true
  LEFT JOIN pg_namespace n ON c.relnamespace = n.oid
  LEFT JOIN pg_attribute a ON a.attrelid = c.oid
  LEFT JOIN pg_type t ON a.atttypid = t.oid
  LEFT JOIN pg_constraint con ON con.conrelid = c.oid AND a.attnum = ANY(con.conkey) AND con.contype = k.contype
  LEFT JOIN pg_index i ON i.indrelid = c.oid AND a.attnum = ANY (i.indkey) AND i.indisunique AND NOT i.indisprimary
  WHERE
    ${buildSchemaExclusionClause('n.nspname')}
    AND (
      -- First we will try to use the primary keys constraints
      (k.contype = 'p' AND con.contype = 'p')
      OR
      -- If there are no primary keys, we will try to use unique non nullable constraints as fallback
      (k.contype = 'u' AND a.attnotnull AND con.contype = 'u')
      OR
      --  If we still find nothing, we will try to look for an UNIQUE index on non nullable column
      (k.contype = 'ui' AND a.attnotnull AND i.indisunique AND NOT i.indisprimary)
    )
    AND ${buildSchemaExclusionClause('c.relname')}
  ORDER BY n.nspname, c.relname, a.attname
),
selected_keys AS (
  SELECT DISTINCT ON (schema_name, table_name)
  	schema_name,
	table_name,
	json_agg(json_build_object('name', "column", 'type', "type") ORDER BY "column") as "keys"
  FROM
    keys_search
  GROUP BY order_num, schema_name, table_name
  ORDER BY
    schema_name, table_name, order_num
)
SELECT
  concat(sk.schema_name, '.', sk.table_name) AS "tableId",
  sk.schema_name as "schema",
  sk.table_name as "table",
  false as "dirty",
  sk."keys"
FROM
  selected_keys sk
ORDER BY
  "schema", "table";
`

export async function fetchPrimaryKeys<T extends QueryResultHKT>(
  client: PgDatabase<T>,
) {
  const response = (await client.execute(
    sql.raw(FETCH_PRIMARY_KEYS),
  )) as postgres.RowList<Array<FetchPrimaryKeysResult>>;

  return response;
}
