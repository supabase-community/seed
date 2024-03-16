import { type DatabaseClient } from "#core/databaseClient.js";

export interface FetchUniqueConstraintsResult {
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
  table: string;
  // Unique identifier allowing to access the table in the database
  tableId: string;
  // Allow to know if the constraint is a primary key or a unique constraint
  // or coming from an isolated CREATE INDEX
  // origin?: 'c' | 'u' | 'pk'
  // TODO: Add support for partial indexes (will tipically be used to change the behavior for NULL values)
  // partial?: 0 | 1
}

interface FetchUniqueConstraintsResultRaw {
  idxColName: string;
  idxName: string;
  idxOrigin: "c" | "pk" | "u";
  idxPartial: 0 | 1;
  tableName: string;
}

// Fetch all unique constraints defined as indexes
const FETCH_UNIQUE_CONSTRAINTS = `
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
    alltables.type = 'table' AND alltables.name NOT LIKE 'sqlite_%'
  ORDER BY
    alltables.name, indexlist.name, indexinfos.seqno
`;

// Fetch all primary keys constraints
const FETCH_PRIMARY_KEYS_CONSTRAINTS = `
  SELECT
    alltables.name AS tableName,
    colinfo.name AS colName
  FROM
    sqlite_master AS alltables,
    pragma_table_info(alltables.name) AS colinfo
  WHERE
    alltables.type = 'table' AND alltables.name NOT LIKE 'sqlite_%'
    AND colinfo.pk = 1
  ORDER BY
    alltables.name, colinfo.name
`;

export async function fetchUniqueConstraints(client: DatabaseClient) {
  const uniqueIndexesResponse =
    await client.query<FetchUniqueConstraintsResultRaw>(
      FETCH_UNIQUE_CONSTRAINTS,
    );
  const primaryKeysResponse = await client.query<{
    colName: string;
    tableName: string;
  }>(FETCH_PRIMARY_KEYS_CONSTRAINTS);

  const groupedResults: Record<
    string,
    Omit<
      FetchUniqueConstraintsResult & {
        origin: FetchUniqueConstraintsResultRaw["idxOrigin"];
      },
      "name"
    >
  > = {};
  // We push all the unique constraints coming from an index first
  for (const row of uniqueIndexesResponse) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!groupedResults[row.idxName]) {
      groupedResults[row.idxName] = {
        tableId: row.tableName,
        table: row.tableName,
        dirty: false,
        columns: [row.idxColName],
        origin: row.idxOrigin,
      };
      // If the constraint is a composite one, we need to add the column to the existing constraint
    } else {
      groupedResults[row.idxName].columns.push(row.idxColName);
    }
  }
  const results: Array<FetchUniqueConstraintsResult> = Object.values(
    groupedResults,
  ).map((value) => {
    return {
      tableId: value.tableId,
      columns: value.columns,
      dirty: false,
      table: value.table,
      name:
        value.origin === "pk"
          ? `${value.table}_pkey`
          : `${value.table}_${value.columns.join("_")}_key`,
    };
  });
  // SQLite will only create index for primary keys if they are composite
  // We need to add the primary key constraint for tables that have a single primary key (aka the ones not already in uniqueIndexesResponse)
  for (const table of primaryKeysResponse) {
    if (
      !results.find(
        (result) =>
          result.table === table.tableName && result.name.endsWith("_pkey"),
      )
    ) {
      results.push({
        tableId: table.tableName,
        table: table.tableName,
        dirty: false,
        name: `${table.tableName}_pkey`,
        columns: [table.colName],
      });
    }
  }
  return results;
}
