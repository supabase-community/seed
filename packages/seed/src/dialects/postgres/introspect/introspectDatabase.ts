import { type DatabaseClient } from "#core/databaseClient.js";
import { groupParentsChildrenRelations } from "#core/dialect/groupParentsChildrenRelations.js";
import { groupBy } from "../utils.js";
import { fetchDatabaseRelationships } from "./queries/fetchDatabaseRelationships.js";
import { fetchEnums } from "./queries/fetchEnums.js";
import { fetchPrimaryKeys } from "./queries/fetchPrimaryKeys.js";
import { fetchSequences } from "./queries/fetchSequences.js";
import { fetchTablesAndColumns } from "./queries/fetchTablesAndColumns.js";
import { fetchUniqueConstraints } from "./queries/fetchUniqueConstraints.js";
import { type AsyncFunctionSuccessType } from "./types.js";

type PrimaryKeys = AsyncFunctionSuccessType<typeof fetchPrimaryKeys>;
type UniqueConstraints = Array<
  AsyncFunctionSuccessType<typeof fetchUniqueConstraints>[number]
>;
type Tables = AsyncFunctionSuccessType<typeof fetchTablesAndColumns>;
type Enums = Array<AsyncFunctionSuccessType<typeof fetchEnums>[number]>;
type Sequences = AsyncFunctionSuccessType<typeof fetchSequences>;
type Relationships = AsyncFunctionSuccessType<
  typeof fetchDatabaseRelationships
>;
export type Relationship = Relationships[number];
type GroupedRelationships = ReturnType<typeof groupParentsChildrenRelations>;
type GroupedRelationshipsValue = NonNullable<
  ReturnType<GroupedRelationships["get"]>
>;
export type IntrospectedTableColumn = Tables[number]["columns"][number];

interface IntrospectedStructureBase {
  enums: Enums;
  tables: Tables;
}

export interface IntrospectedStructure extends IntrospectedStructureBase {
  sequences?: Record<string, Sequences>;
  tables: Array<
    IntrospectedStructureBase["tables"][number] &
      GroupedRelationshipsValue & {
        primaryKeys: PrimaryKeys[number] | null;
        uniqueConstraints?: UniqueConstraints;
      }
  >;
}

export async function introspectDatabase(
  client: DatabaseClient,
): Promise<IntrospectedStructure> {
  const tablesInfos = await fetchTablesAndColumns(client);
  const enums = await fetchEnums(client);
  const relationships = await fetchDatabaseRelationships(client);
  const primaryKeys = await fetchPrimaryKeys(client);
  const uniqueConstraints = await fetchUniqueConstraints(client);
  const sequences = await fetchSequences(client);
  const tableIds = tablesInfos.map((table) => table.id);
  const groupedRelationships = groupParentsChildrenRelations(
    relationships,
    tableIds,
  );
  const sequencesGroupesBySchema = groupBy(sequences, (s) => s.schema);
  // tableId is the schema.table of the pk in our results
  const groupedPrimaryKeys = groupBy(primaryKeys, (k) => k.tableId);
  const groupedUniqueConstraints = groupBy(uniqueConstraints, (c) => c.tableId);
  // We build or final table structure here, augmenting the basic one with
  // relations and primary keys infos
  const tablesWithRelations: IntrospectedStructure["tables"] = tablesInfos.map(
    (table) => {
      const tableRelationships = groupedRelationships.get(table.id);
      const primaryKeys = groupedPrimaryKeys[table.id]?.[0] ?? null;
      const uniqueConstraints = groupedUniqueConstraints[table.id] ?? [];
      return {
        id: table.id,
        name: table.name,
        schema: table.schema,
        rows: table.rows,
        bytes: table.bytes,
        partitioned: table.partitioned,
        columns: table.columns,
        parents: tableRelationships?.parents ?? [],
        children: tableRelationships?.children ?? [],
        primaryKeys,
        uniqueConstraints,
      };
    },
  );
  return {
    tables: tablesWithRelations,
    enums: enums,
    // @ts-expect-error zod we have possible undefined in groupBy type signature to enforce chekcking for value after access like group[key] but in that case we know that we have a value for each key
    sequences: sequencesGroupesBySchema,
  };
}
