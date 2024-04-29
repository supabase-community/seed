import { type DatabaseClient } from "#core/databaseClient.js";
import { groupParentsChildrenRelations } from "#core/dialect/groupParentsChildrenRelations.js";
import { groupBy } from "../utils.js";
import {
  type FetchRelationshipsInfosResult,
  fetchDatabaseRelationships,
} from "./queries/fetchDatabaseRelationships.js";
import {
  type FetchPrimaryKeysResult,
  fetchPrimaryKeys,
} from "./queries/fetchPrimaryKeys.js";
import {
  type FetchSequencesResult,
  fetchSequences,
} from "./queries/fetchSequences.js";
import {
  type FetchTableAndColumnsResult,
  type SelectColumnsResult,
  fetchTablesAndColumns,
} from "./queries/fetchTablesAndColumns.js";
import {
  type FetchUniqueConstraintsResult,
  fetchUniqueConstraints,
} from "./queries/fetchUniqueConstraints.js";
import { type AsyncFunctionSuccessType } from "./types.js";

type Relationships = AsyncFunctionSuccessType<
  typeof fetchDatabaseRelationships
>;
export type Relationship = Relationships[number];

export async function basicIntrospectDatabase(client: DatabaseClient) {
  const tableInfos = await fetchTablesAndColumns(client);
  return {
    tables: tableInfos,
  };
}

interface IntrospectedStructure {
  sequences: Array<FetchSequencesResult>;
  tables: Array<
    {
      children: Array<FetchRelationshipsInfosResult>;
      columns: Array<
        {
          identity: {
            current: number;
            name: string;
          } | null;
        } & SelectColumnsResult
      >;
      constraints: Array<FetchUniqueConstraintsResult>;
      parents: Array<FetchRelationshipsInfosResult>;
      primaryKeys: FetchPrimaryKeysResult | null;
    } & FetchTableAndColumnsResult
  >;
}

export async function introspectDatabase(
  client: DatabaseClient,
): Promise<IntrospectedStructure> {
  const { tables: tablesInfos } = await basicIntrospectDatabase(client);
  const baseRelationships = await fetchDatabaseRelationships(client);
  const constraints = await fetchUniqueConstraints(client);
  const sequences = await fetchSequences(client);
  const primaryKeys = await fetchPrimaryKeys(client);
  const tableIds = tablesInfos.map((t) => t.id);
  const relationships = baseRelationships;
  const groupedRelationships = groupParentsChildrenRelations(
    relationships,
    tableIds,
  );
  const groupedConstraints = groupBy(constraints, (c) => c.tableId);
  const groupedPrimaryKeys = groupBy(primaryKeys, (k) => k.tableId);
  const tablesWithRelations = tablesInfos.map((table) => {
    const tableRelations = groupedRelationships.get(table.id) ?? {
      parents: [],
      children: [],
    };
    const tableConstraints = groupedConstraints[table.id] ?? [];
    const primaryKeys = groupedPrimaryKeys[table.id]?.[0] ?? null;
    const columns = table.columns.map((column) => {
      const sequence = sequences.find(
        (s) => s.tableId === table.id && s.colId === column.name,
      );
      return {
        ...column,
        identity: sequence
          ? {
              current: sequence.current,
              name: sequence.name,
            }
          : null,
      };
    });
    return {
      ...table,
      ...tableRelations,
      columns,
      constraints: tableConstraints,
      primaryKeys,
    };
  });
  return {
    tables: tablesWithRelations,
    sequences,
  };
}
