/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { type DrizzleDbClient } from "#core/adapters.js";
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
  fkToColumn: null | string;
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

function groupedForeignKeysById(
  tableForeignKeys: Array<FetchTableForeignKeysResultRaw>,
  tableColumnsInfosGrouped: Record<
    string,
    Array<
      Pick<
        FetchTableAndColumnsResultRaw,
        "colName" | "colNotNull" | "colPk" | "colType"
      > & {
        affinity: SQLiteAffinity;
      }
    >
  >,
) {
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
    const fkFromColumnInfos = columnInfosFromTable.find(
      (c) => c.colName === row.fkFromColumn,
    );
    // SQLite allow to create FK without referencing a column, in that case the fkToColumn is null and we should use the primary key of the target table
    // eg: FOREIGN KEY ("CourseID", "StudentID") REFERENCES "Enrollments" instead of FOREIGN KEY ("CourseID", "StudentID") REFERENCES "Enrollments"("CourseID", "StudentID")
    // In that case sqlite will re-use the primary key of the target table automatically so we must default to the primary key of the target table as well
    if (row.fkToColumn === null) {
      const primaryKeysColumns = columnInfosToTable.filter(
        (tableColumn) => tableColumn.colPk,
      );
      // Sort the primary keys columns by their position in the table declaration
      primaryKeysColumns.sort((a, b) => a.colPk - b.colPk);
      const keys = primaryKeysColumns.map((pkColumn) => {
        return {
          fkColumn: pkColumn.colName,
          fkType: pkColumn.colType,
          fkAffinity: pkColumn.affinity,
          targetColumn: pkColumn.colName,
          targetType: pkColumn.colType,
          targetAffinity: pkColumn.affinity,
          nullable: fkFromColumnInfos!.colNotNull === 0,
        };
      });
      acc[`${row.fkId}`].keys.push(keys[acc[`${row.fkId}`].keys.length]);
      return acc;
    } else {
      const fkToColumnInfos = columnInfosToTable.find(
        (c) => c.colName === row.fkToColumn,
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
    }
  }, {});
  return groupedByFkId;
}

export async function fetchDatabaseRelationships(client: DrizzleDbClient) {
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
    const groupedByFkId = groupedForeignKeysById(
      tableForeignKeys,
      tableColumnsInfosGrouped,
    );
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
