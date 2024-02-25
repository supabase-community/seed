import { type QueryResultHKT } from "drizzle-orm/pg-core";
import { type DrizzleDbClient } from "#core/adapters.js";
import { buildSchemaExclusionClause } from "./utils.js";

export const TYPE_CATEGORY_DISPLAY_NAMES = {
  A: "Array",
  B: "Boolean",
  C: "Composite",
  D: "Date/time",
  E: "Enum",
  G: "Geometric",
  I: "Network address",
  N: "Numeric",
  P: "Pseudo-types",
  R: "Range",
  S: "String",
  T: "Timespan",
  U: "User-defined",
  V: "Bit-string",
  X: "unknown",
  Z: "Internal-use",
} as const;

export const COLUMN_CONSTRAINTS = {
  PRIMARY_KEY: "p",
  FOREIGN_KEY: "f",
  UNIQUE: "u",
  CHECK_CONSTRAINT: "c",
  TRIGGER_CONSTRAINT: "t",
  EXCLUSION_CONSTRAINT: "x",
} as const;

export type ColumnConstraintType =
  (typeof COLUMN_CONSTRAINTS)[keyof typeof COLUMN_CONSTRAINTS];

interface SelectColumnsResult {
  constraints: Array<ColumnConstraintType>;
  default: null | string;
  generated: "ALWAYS" | "NEVER";
  id: string;
  identity?: {
    current: number;
    generated: "ALWAYS" | "BY DEFAULT";
    increment: number;
    sequenceName: string | undefined;
    start: number;
  } | null;
  maxLength: null | number;
  name: string;
  nullable: boolean;
  schema: string;
  table: string;
  type: string;
  typeCategory: keyof typeof TYPE_CATEGORY_DISPLAY_NAMES;
  typeId: string;
}
const SELECT_COLUMNS = `
  SELECT
    concat(columns.table_schema, '.', columns.table_name, '.', columns.column_name) AS id,
    columns.table_schema AS schema,
    columns.table_name AS table,
    columns.column_name AS name,
    columns.ordinal_position AS ordinal_position,
    case
      when array_dimensions.attndims > 0 then
        right(columns.udt_name, length(columns.udt_name) - 1) || repeat('[]', array_dimensions.attndims)
      else columns.udt_name
    end AS type,
    concat(columns.udt_schema, '.', columns.udt_name) as "typeId",
    columns.is_nullable::boolean AS nullable,
    columns.column_default AS default,
    columns.is_generated AS generated,
    columns.character_maximum_length as "maxLength",
    columns.is_identity,
    columns.identity_generation,
    columns.identity_start::bigint,
    columns.identity_increment::bigint,
    types.category as "typeCategory",
    (coalesce(constraints.constraints, '{}'))::text[] as "constraints"
  FROM
    information_schema.columns as columns
    LEFT JOIN (
      SELECT
        n.nspname AS schema,
        k.relname AS table,
        array_agg(DISTINCT c.contype) as constraints,
        a.attname as column
      FROM pg_constraint c
      JOIN pg_class k
        ON k.oid = c.conrelid
      JOIN pg_namespace n
        ON n.oid = c.connamespace
      CROSS JOIN LATERAL unnest(c.conkey) ak(k)
      INNER JOIN pg_attribute a
        ON a.attrelid = c.conrelid
        AND a.attnum = ak.k
      GROUP BY
        n.nspname,
        k.relname,
        a.attname
      ORDER BY n.nspname, k.relname, a.attname
    ) as constraints ON constraints.schema = columns.table_schema AND constraints.table = columns.table_name AND constraints.column = columns.column_name
    LEFT JOIN (
      SELECT
        n.nspname AS schema,
        t.typname AS name,
        t.typcategory AS category
      FROM pg_namespace n
      JOIN pg_type t ON t.typnamespace = n.oid
    ) AS types ON columns.udt_name = types.name AND columns.udt_schema = types.schema
    LEFT JOIN (
      SELECT
        n.nspname,
        c.relname,
        a.attname,
        a.attndims
      FROM pg_namespace n
      JOIN pg_class c ON c.relnamespace = n.oid
      JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE c.relkind IN ('p', 'r') AND c.relispartition IS FALSE AND a.attnum > 0
    ) AS array_dimensions ON
      array_dimensions.nspname = columns.table_schema AND
      array_dimensions.relname = columns.table_name AND
      array_dimensions.attname = columns.column_name
`;

interface SelectTablesResult {
  indexBytes: number;
  oid: string;
  rowEstimate: null | number;
  tableId: string;
  tableName: string;
  tableSchema: string;
  toastBytes: number;
  totalBytes: number;
}
const SELECT_TABLES = `
  SELECT
    c.oid,
    concat(n.nspname, '.', c.relname) AS "tableId",
    n.nspname AS "tableSchema",
    relname AS "tableName",
    CASE c.relkind WHEN 'p' THEN TRUE ELSE FALSE END AS "tablePartitioned",
    (CASE
      WHEN c.relkind = 'p' THEN NULL -- partitioned table (we can't properly approximate the number of rows)
      WHEN c.reltuples < 0 THEN NULL -- never vacuumed
      -- empty table (except if the table has been vacuumed with no rows and no re-vacuumed since)
      WHEN c.relpages = 0 THEN float8 '0'
      ELSE c.reltuples / c.relpages END
      * (pg_catalog.pg_relation_size(c.oid)
      / pg_catalog.current_setting('block_size')::int)
    )::bigint AS "rowEstimate",
    pg_total_relation_size(c.oid) AS "totalBytes",
    pg_indexes_size(c.oid) AS "indexBytes",
    pg_total_relation_size(reltoastrelid) AS "toastBytes"
  FROM pg_class c
  INNER JOIN pg_namespace n ON n.oid = c.relnamespace
`;

interface FetchTableAndColumnsResult {
  bytes: number;
  columns: Array<SelectColumnsResult>;
  id: SelectTablesResult["tableId"];
  name: SelectTablesResult["tableName"];
  partitioned: boolean;
  rows: SelectTablesResult["rowEstimate"];
  schema: SelectTablesResult["tableSchema"];
}
const FETCH_TABLES_AND_COLUMNS = `
  WITH
      constraints_data AS (
        ${SELECT_COLUMNS}
        -- Exclude all system tables
        WHERE ${buildSchemaExclusionClause("columns.table_schema")}
        -- We want to keep the order of the columns as they are in the table creation
        ORDER BY columns.ordinal_position
      ),
      tables AS (
        ${SELECT_TABLES}
        WHERE
          -- table objects
          c.relkind IN ('p', 'r') AND c.relispartition IS FALSE AND
          -- Exclude all system tables
          ${buildSchemaExclusionClause("n.nspname")} AND
          pg_catalog.has_schema_privilege(current_user, n.nspname, 'USAGE') AND
          pg_catalog.has_table_privilege(current_user, concat(quote_ident(n.nspname), '.', quote_ident(c.relname)), 'SELECT')
      ),
      tables_with_bytes AS (
        SELECT
          *,
          "totalBytes" - "indexBytes" - coalesce("toastBytes", 0) AS "tableBytes"
        FROM tables
      )
    SELECT
      json_build_object(
        'id', tables_with_bytes."tableId",
        'name', tables_with_bytes."tableName",
        'schema', tables_with_bytes."tableSchema",
        'partitioned', tables_with_bytes."tablePartitioned",
        'rows', tables_with_bytes."rowEstimate",
        'bytes', tables_with_bytes."tableBytes",
        'columns', json_agg(
          json_build_object(
            'id', constraints_data.id,
            'name', constraints_data.name,
            'type', constraints_data.type,
            'typeId', constraints_data."typeId",
            'table', constraints_data.table,
            'schema', constraints_data.schema,
            'nullable', constraints_data.nullable,
            'default', constraints_data.default,
            'generated', constraints_data.generated,
            'maxLength', constraints_data."maxLength",
            'identity', case when constraints_data.is_identity = 'YES' then json_build_object(
              'sequenceName', (SELECT pg_get_serial_sequence( '"' || constraints_data.schema || '"."' || constraints_data.table || '"', constraints_data.name)),
              'generated', constraints_data.identity_generation,
              'start', constraints_data.identity_start,
              'increment', constraints_data.identity_increment,
              'current', (SELECT COALESCE(last_value, start_value) AS current FROM pg_sequences WHERE sequencename = (SELECT replace((SELECT pg_get_serial_sequence( '"' || constraints_data.schema || '"."' || constraints_data.table || '"', constraints_data.name)::regclass::text), '"', '')))
            ) else null end,
            'typeCategory', constraints_data."typeCategory",
            'constraints', constraints_data."constraints"
          )
          -- We want to keep the order of the columns as they are in the table creation (see: S-1116)
          ORDER BY constraints_data.ordinal_position
      )
    )
    FROM tables_with_bytes
    JOIN constraints_data
      ON tables_with_bytes."tableSchema" = constraints_data.schema
      AND tables_with_bytes."tableName" = constraints_data.table
    GROUP BY
  tables_with_bytes."tableId",
      tables_with_bytes."tableSchema",
      tables_with_bytes."tableName",
      tables_with_bytes."tablePartitioned",
      tables_with_bytes."rowEstimate",
      tables_with_bytes."tableBytes"
    ORDER BY tables_with_bytes."tableName";
`;

export async function fetchTablesAndColumns<T extends QueryResultHKT>(
  client: DrizzleDbClient<T>,
) {
  const response = await client.query<{
    json_build_object: FetchTableAndColumnsResult;
  }>(FETCH_TABLES_AND_COLUMNS);

  return response.map((r) => ({
    ...r.json_build_object,
    columns: r.json_build_object.columns.map((c) => ({
      ...c,
      identity: c.identity
        ? {
            sequenceName: c.identity.sequenceName,
            generated: c.identity.generated,
            increment: c.identity.increment,
            // When a sequence is created, the current value is the start value and is available for use
            // but when the sequence is used for the first time, the current values is the last used one not available for use
            // so we increment it by one to get the next available value instead
            current:
              c.identity.start === c.identity.current
                ? c.identity.current
                : c.identity.current + 1,
          }
        : null,
    })),
  }));
}
