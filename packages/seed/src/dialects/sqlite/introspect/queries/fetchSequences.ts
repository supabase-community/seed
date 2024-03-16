import { type DatabaseClient } from "#core/databaseClient.js";
import {
  FETCH_TABLE_COLUMNS_LIST,
  type FetchTableAndColumnsResultRaw,
  type SQLiteAffinity,
  mapCommonTypesToAffinity,
} from "./fetchTablesAndColumns.js";

export interface FetchSequencesResult {
  colId: string;
  current: number;
  name: string;
  tableId: string;
}

export async function fetchSequences(client: DatabaseClient) {
  const results: Array<FetchSequencesResult> = [];
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
  for (const tableId in tableColumnsInfosGrouped) {
    const tableColumns = tableColumnsInfosGrouped[tableId];
    const tablePk = tableColumns.find((column) => column.colPk);
    // The table must have an autoincrement pk column or will have an implicit rowid column
    // used as a sequence
    const pkKey =
      tablePk && tablePk.affinity === "integer" ? tablePk.colName : "rowid";
    const maxSeqRes = await client.query<{ currentSequenceValue: number }>(
      `SELECT MAX(${pkKey}) + 1 as currentSequenceValue FROM ${tableId}`,
    );
    const maxSeqNo = maxSeqRes[0];
    results.push({
      colId: pkKey,
      tableId,
      name: `${tableId}_${pkKey}_seq`,
      current: maxSeqNo.currentSequenceValue || 1,
    });
  }
  return results;
}
