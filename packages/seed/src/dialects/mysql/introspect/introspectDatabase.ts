import { type DatabaseClient } from "#core/databaseClient.js";
import { groupParentsChildrenRelations } from "#core/dialect/groupParentsChildrenRelations.js";
import { groupBy } from "../utils.js";
import { fetchDatabaseRelationships } from "./queries/fetchDatabaseRelationships.js";
import { fetchEnums } from "./queries/fetchEnums.js";
import { fetchPrimaryKeys } from "./queries/fetchPrimaryKeys.js";
import { fetchSchemas } from "./queries/fetchSchemas.js";
import { fetchSequences } from "./queries/fetchSequences.js";
import { fetchTablesAndColumns } from "./queries/fetchTablesAndColumns.js";
import { fetchUniqueConstraints } from "./queries/fetchUniqueConstraints.js";
import { updateDatabasesTablesInfos } from "./queries/utils.js";
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
export type IntrospectedTableColumn = Tables[number]["columns"][number] & {
  identity: {
    current: bigint | number;
    name: string;
  } | null;
};

interface IntrospectedStructureBase {
  enums: Enums;
  tables: Tables;
}

export interface IntrospectedStructure extends IntrospectedStructureBase {
  sequences?: Record<string, Sequences>;
  tables: Array<
    IntrospectedStructureBase["tables"][number] &
      GroupedRelationshipsValue & {
        columns: Array<IntrospectedTableColumn>;
        primaryKeys: PrimaryKeys[number] | null;
        uniqueConstraints?: UniqueConstraints;
      }
  >;
}

export async function introspectDatabase(
  client: DatabaseClient,
): Promise<IntrospectedStructure> {
  const schemas = await fetchSchemas(client);
  // MySQL will delegate updating the informations_schemas infos by default
  // we want to ensure we get the latest infos
  await updateDatabasesTablesInfos(client, schemas);
  const tablesInfos = await fetchTablesAndColumns(client, schemas);
  const enums = await fetchEnums(client, schemas);
  const relationships = await fetchDatabaseRelationships(client, schemas);
  const primaryKeys = await fetchPrimaryKeys(client, schemas);
  const uniqueConstraints = await fetchUniqueConstraints(client, schemas);
  const sequences = await fetchSequences(client, schemas);
  const tableIds = tablesInfos.map((table) => table.id);
  const groupedRelationships = groupParentsChildrenRelations(
    relationships,
    tableIds,
  );
  const sequencesGroupesBySchema = groupBy(sequences, (s) => s.schema);
  // tableId is the schema.table of the pk in our results
  const groupedPrimaryKeys = groupBy(primaryKeys, (k) => k.tableId);
  const groupedConstraints = groupBy(uniqueConstraints, (c) => c.tableId);
  // We build or final table structure here, augmenting the basic one with
  // relations and primary keys infos
  const tablesWithRelations: IntrospectedStructure["tables"] = tablesInfos.map(
    (table) => {
      const tableRelations = groupedRelationships.get(table.id) ?? {
        parents: [],
        children: [],
      };
      const primaryKeys = groupedPrimaryKeys[table.id]?.[0] ?? null;
      const tableConstraints = groupedConstraints[table.id] ?? [];
      const columns = table.columns.map((column) => {
        const sequence = sequences.find(
          (s) => s.name === `${table.id}.${column.name}`,
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
        uniqueConstraints: tableConstraints,
        primaryKeys,
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
