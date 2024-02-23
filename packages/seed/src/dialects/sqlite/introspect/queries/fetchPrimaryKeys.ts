import { sql } from "drizzle-orm";
import { type BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import {
  FETCH_TABLE_COLUMNS_LIST,
  type FetchTableAndColumnsResultRaw,
  type SQLiteAffinity,
  mapCommonTypesToAffinity,
} from "./fetchTablesAndColumns.js";

export interface FetchPrimaryKeysResult {
  // are the one retrieved from the database or the one we fallback on
  dirty: boolean;
  keys: Array<{ affinity: SQLiteAffinity; name: string; type: string }>;
  // Simple boolean who'll allows us to always know if the primary keys we are using
  table: string;
  tableId: string;
}

interface FetchCompositePrimaryKeysResultRaw {
  idxColName: string;
  idxName: string;
  idxOrigin: "pk";
  idxPartial: 0 | 1;
  tableName: string;
}

// Fetch all unique constraints defined as indexes
const FETCH_PRIMARY_COMPOSITE_PRIMARY_KEYS = `
SELECT
  alltables.name AS tableName,
  indexlist.origin AS idxOrigin,
  indexlist.name AS idxName,
  indexlist.partial as idxPartial,
  indexinfos.name AS idxColName
FROM
  sqlite_master AS alltables,
  pragma_index_list(alltables.name) AS indexlist,
  pragma_index_info(indexlist.name) AS indexinfos
WHERE
  alltables.type = 'table' AND alltables.name NOT LIKE 'sqlite_%' AND
  indexlist.origin = 'pk'
ORDER BY
	alltables.name, indexlist.name, indexinfos.seqno
`;

// Fetch all primary keys constraints
const FETCH_PRIMARY_KEYS_CONSTRAINTS = `
SELECT
  	alltables.name AS tableName,
	  colinfo.name AS colName,
    colinfo.type AS colType,
    colinfo."notnull" AS colNotNull
	FROM
	  sqlite_master AS alltables,
	  pragma_table_info(alltables.name) AS colinfo
	WHERE
	  alltables.type = 'table' AND alltables.name NOT LIKE 'sqlite_%'
	  AND colinfo.pk = 1
	ORDER BY
		alltables.name, colinfo.name
`;

export async function fetchPrimaryKeys<T extends "async" | "sync", R>(
  client: BaseSQLiteDatabase<T, R>,
) {
  const results: Array<FetchPrimaryKeysResult> = [];
  const compositePrimaryKeysIndexes =
    await client.all<FetchCompositePrimaryKeysResultRaw>(
      sql.raw(FETCH_PRIMARY_COMPOSITE_PRIMARY_KEYS),
    );
  const tableColumnsInfos = await client.all<FetchTableAndColumnsResultRaw>(
    sql.raw(FETCH_TABLE_COLUMNS_LIST),
  );
  const primaryKeysResponse = await client.all<{
    colName: string;
    colNotNull: 0 | 1;
    colType: string;
    tableName: string;
  }>(sql.raw(FETCH_PRIMARY_KEYS_CONSTRAINTS));
  const groupedTableColumnsInfos = tableColumnsInfos.reduce<
    Record<
      string,
      Array<FetchTableAndColumnsResultRaw & { affinity: SQLiteAffinity }>
    >
  >((acc, row) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!acc[row.tableId]) {
      acc[row.tableId] = [];
    }
    acc[row.tableId].push({
      ...row,
      affinity: mapCommonTypesToAffinity(row.colType, row.colNotNull === 0),
    });
    return acc;
  }, {});
  const groupedCompositePrimaryKeys = compositePrimaryKeysIndexes.reduce<
    Record<string, Array<FetchCompositePrimaryKeysResultRaw>>
  >((acc, result) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!acc[result.tableName]) {
      acc[result.tableName] = [];
    }
    acc[result.tableName].push(result);
    return acc;
  }, {});
  const groupedPrimaryKeys = primaryKeysResponse.reduce<
    Record<
      string,
      {
        affinity: SQLiteAffinity;
        colName: string;
        colType: string;
        tableName: string;
      }
    >
  >((acc, result) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!acc[result.tableName]) {
      acc[result.tableName] = {
        tableName: result.tableName,
        colName: result.colName,
        colType: result.colType,
        affinity: mapCommonTypesToAffinity(
          result.colType,
          result.colNotNull === 0,
        ),
      };
    }
    return acc;
  }, {});
  for (const tableName in groupedTableColumnsInfos) {
    const tableColumns = groupedTableColumnsInfos[tableName];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (groupedCompositePrimaryKeys[tableName]) {
      const compositePkColumns = groupedCompositePrimaryKeys[tableName];
      results.push({
        tableId: tableName,
        table: tableName,
        dirty: false,
        keys: compositePkColumns.map((column) => {
          const columnInfos = tableColumns.find(
            (c) => c.colName === column.idxColName,
          );
          return {
            name: column.idxColName,
            type: columnInfos?.colType ?? "INTEGER",
            affinity: columnInfos?.affinity ?? "integer",
          };
        }),
      });
      // If the table has a primary key, we use it
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (groupedPrimaryKeys[tableName]) {
      const primaryKey = groupedPrimaryKeys[tableName];
      results.push({
        tableId: tableName,
        table: tableName,
        dirty: false,
        keys: [
          {
            name: primaryKey.colName,
            type: primaryKey.colType,
            affinity: primaryKey.affinity,
          },
        ],
      });
      // Otherwise if the table has no primary key, we fallback on the rowid
    } else {
      results.push({
        tableId: tableName,
        table: tableName,
        dirty: false,
        keys: [
          {
            name: "rowid",
            type: "INTEGER",
            affinity: "integer",
          },
        ],
      });
    }
  }
  return results;
}
