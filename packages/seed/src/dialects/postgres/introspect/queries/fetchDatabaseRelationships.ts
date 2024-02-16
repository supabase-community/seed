import type postgres from "postgres";
import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
import { buildSchemaExclusionClause } from "./utils.js";

type RelationKeyInfos = {
  fkColumn: string
  fkType: string
  targetColumn: string
  targetType: string
  nullable: boolean
}
type FetchRelationshipsInfosResult = {
  id: string
  fkTable: string
  targetTable: string
  keys: RelationKeyInfos[]
}
const FETCH_RELATIONSHIPS_INFOS = `
  SELECT
    constraint_name AS "id",
    concat(fk_nsp.nspname, '.', fk_table) AS "fkTable",
    json_agg(json_build_object(
      'fkColumn', fk_att.attname,
      'fkType', fk_typ.typname,
      'targetColumn', tar_att.attname,
      'targetType', tar_typ.typname,
      'nullable', fk_att.attnotnull = false
    ) ORDER BY fk_att.attnum) AS "keys",
    concat(tar_nsp.nspname, '.', target_table) AS "targetTable"
    FROM (
        SELECT
            fk.oid AS fk_table_id,
            fk.relnamespace AS fk_schema_id,
            fk.relname AS fk_table,
            unnest(con.conkey) as fk_column_id,
            tar.oid AS target_table_id,
            tar.relnamespace AS target_schema_id,
            tar.relname AS target_table,
            unnest(con.confkey) as target_column_id,
            con.connamespace AS constraint_nsp,
            con.conname AS constraint_name
        FROM pg_constraint con
        JOIN pg_class fk ON con.conrelid = fk.oid
        JOIN pg_class tar ON con.confrelid = tar.oid
        WHERE con.contype = 'f' AND fk.relispartition IS FALSE
    ) sub
    JOIN pg_attribute fk_att ON fk_att.attrelid = fk_table_id AND fk_att.attnum = fk_column_id
    JOIN pg_attribute tar_att ON tar_att.attrelid = target_table_id AND tar_att.attnum = target_column_id
    JOIN pg_type fk_typ ON fk_att.atttypid = fk_typ.oid
    JOIN pg_type tar_typ ON tar_att.atttypid = tar_typ.oid
    JOIN pg_namespace fk_nsp ON fk_schema_id = fk_nsp.oid
    JOIN pg_namespace tar_nsp ON target_schema_id = tar_nsp.oid
  WHERE ${buildSchemaExclusionClause('fk_nsp.nspname')}
  GROUP BY "fkTable", "targetTable", sub.constraint_nsp, sub.constraint_name
  ORDER BY "fkTable", "targetTable";
`

export async function fetchDatabaseRelationships<T extends QueryResultHKT>(
  client: PgDatabase<T>,
) {
  const response = (await client.execute(
    sql.raw(FETCH_RELATIONSHIPS_INFOS),
  )) as postgres.RowList<Array<FetchRelationshipsInfosResult>>;

  return response;
}
