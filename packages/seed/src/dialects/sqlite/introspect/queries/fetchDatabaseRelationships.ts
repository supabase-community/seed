/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { type DatabaseClient } from "#core/databaseClient.js";
import {
  FETCH_TABLE_COLUMNS_LIST,
  type FetchTableAndColumnsResultRaw,
  type SQLiteAffinity,
  mapCommonTypesToAffinity,
} from "./fetchTablesAndColumns.js";

export interface RelationKeyInfos {
  fkAffinity: SQLiteAffinity;
  fkColumn: string;
  fkType: string;
  nullable: boolean;
  targetAffinity: SQLiteAffinity;
  targetColumn: string;
  targetType: string;
}
export interface FetchRelationshipsInfosResult {
  fkTable: string;
  id: string;
  keys: Array<RelationKeyInfos>;
  targetTable: string;
}

interface FetchTableForeignKeysResultRaw {
  fkFromColumn: string;
  fkId: number;
  fkSeq: number;
  fkToColumn: string;
  fkToTable: string;
  tableId: string;
  tableName: string;
}

const FETCH_TABLE_FOREIGN_KEYS = `
SELECT
	alltables.name  as tableId,
	alltables.name  as tableName,
	fk.id           as fkId,
	fk.seq          as fkSeq,
	fk."from"       as fkFromColumn,
	fk."to"         as fkToColumn,
	fk."table"      as fkToTable
FROM
  	sqlite_master AS alltables,
  	pragma_foreign_key_list(alltables.name) AS fk
WHERE
  alltables.type = 'table' AND alltables.name NOT LIKE 'sqlite_%'
ORDER BY
  alltables.name, fk.id
`;

export async function fetchDatabaseRelationships(client: DatabaseClient) {
  const results: Array<FetchRelationshipsInfosResult> = [];
  const foreignKeysResult = await client.query<FetchTableForeignKeysResultRaw>(
    FETCH_TABLE_FOREIGN_KEYS,
  );
  const tableColumnsInfos = await client.query<FetchTableAndColumnsResultRaw>(
    FETCH_TABLE_COLUMNS_LIST,
  );
  const tableColumnsInfosGrouped = tableColumnsInfos.reduce<
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
  const groupedByTableResults = foreignKeysResult.reduce<
    Record<string, Array<FetchTableForeignKeysResultRaw>>
  >((acc, row) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!acc[row.tableId]) {
      acc[row.tableId] = [];
    }
    acc[row.tableId].push(row);
    return acc;
  }, {});
  for (const tableId in groupedByTableResults) {
    const tableForeignKeys = groupedByTableResults[tableId];
    const groupedByFkId = tableForeignKeys.reduce<
      Record<string, FetchRelationshipsInfosResult>
    >((acc, row) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!acc[`${row.fkId}`]) {
        acc[`${row.fkId}`] = {
          id: `${row.fkId}`,
          fkTable: row.tableName,
          targetTable: row.fkToTable,
          keys: [],
        };
      }
      const columnInfosToTable = tableColumnsInfosGrouped[row.fkToTable];
      const columnInfosFromTable = tableColumnsInfosGrouped[row.tableName];
      const fkToColumnInfos = columnInfosToTable.find(
        (c) => c.colName === row.fkToColumn,
      );
      const fkFromColumnInfos = columnInfosFromTable.find(
        (c) => c.colName === row.fkFromColumn,
      );

      acc[`${row.fkId}`].keys.push({
        fkColumn: row.fkFromColumn,
        fkType: fkFromColumnInfos!.colType,
        fkAffinity: fkFromColumnInfos!.affinity,
        targetColumn: row.fkToColumn,
        targetType: fkToColumnInfos!.colType,
        targetAffinity: fkToColumnInfos!.affinity,
        nullable: fkFromColumnInfos!.colNotNull === 0,
      });
      return acc;
    }, {});
    for (const fkId in groupedByFkId) {
      const foreignKeyInfos = groupedByFkId[fkId];
      results.push({
        id: `${foreignKeyInfos.fkTable}_${foreignKeyInfos.keys.map((k) => k.fkColumn).join("_")}_fkey`,
        fkTable: foreignKeyInfos.fkTable,
        targetTable: foreignKeyInfos.targetTable,
        keys: foreignKeyInfos.keys,
      });
    }
  }

  return results;
}
