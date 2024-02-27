import { type DrizzleDbClient } from "#core/adapters.js";
import { groupBy } from "../utils.js";
import { groupParentsChildrenRelations } from "./groupParentsChildrenRelations.js";
import { fetchDatabaseRelationships } from "./queries/fetchDatabaseRelationships.js";
import { fetchPrimaryKeys } from "./queries/fetchPrimaryKeys.js";
import { fetchSequences } from "./queries/fetchSequences.js";
import { fetchTablesAndColumns } from "./queries/fetchTablesAndColumns.js";
import { fetchUniqueConstraints } from "./queries/fetchUniqueConstraints.js";
import { type AsyncFunctionSuccessType } from "./types.js";

export type Relationships = AsyncFunctionSuccessType<
  typeof fetchDatabaseRelationships
>;
export type Relationship = Relationships[number];
export type TableInfos = AsyncFunctionSuccessType<typeof fetchTablesAndColumns>;

export async function basicIntrospectDatabase(client: DrizzleDbClient) {
  const tableInfos = await fetchTablesAndColumns(client);
  return {
    tables: tableInfos,
  };
}

export async function introspectDatabase(client: DrizzleDbClient) {
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
