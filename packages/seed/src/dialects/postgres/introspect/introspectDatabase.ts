import { z } from "zod";
import { type DatabaseClient } from "#core/adapters.js";
import { groupBy } from "../utils.js";
import { groupParentsChildrenRelations } from "./groupParentsChildrenRelations.js";
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
export type Relationships = AsyncFunctionSuccessType<
  typeof fetchDatabaseRelationships
>;
export type Relationship = Relationships[number];
type GroupedRelationships = ReturnType<typeof groupParentsChildrenRelations>;
type GroupedRelationshipsValue = NonNullable<
  ReturnType<GroupedRelationships["get"]>
>;
export type IntrospectedTableColumn = Tables[number]["columns"][number];
export type IntrospectedEnum = Enums[number];
export type IntrospectedTable = Tables[number];

export interface IntrospectedStructureBase {
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

const introspectedStructureBaseSchema = z.object({
  tables: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      schema: z.string(),
      rows: z.number().nullable(),
      bytes: z.number(),
      columns: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          typeId: z.string(),
          table: z.string(),
          schema: z.string(),
          nullable: z.boolean(),
          default: z.string().nullable(),
          generated: z.union([z.literal("ALWAYS"), z.literal("NEVER")]),
          maxLength: z.number().nullable(),
          identity: z
            .object({
              sequenceName: z.string(),
              generated: z.union([
                z.literal("ALWAYS"),
                z.literal("BY DEFAULT"),
              ]),
              increment: z.number(),
              current: z.number(),
            })
            .nullable(),
          typeCategory: z.union([
            z.literal("A"),
            z.literal("B"),
            z.literal("C"),
            z.literal("D"),
            z.literal("E"),
            z.literal("G"),
            z.literal("I"),
            z.literal("N"),
            z.literal("P"),
            z.literal("R"),
            z.literal("S"),
            z.literal("T"),
            z.literal("U"),
            z.literal("V"),
            z.literal("X"),
            z.literal("Z"),
          ]),
          constraints: z.array(
            z.union([
              z.literal("p"),
              z.literal("f"),
              z.literal("u"),
              z.literal("c"),
              z.literal("t"),
              z.literal("x"),
            ]),
          ),
        }),
      ),
      partitioned: z.boolean(),
      primaryKeys: z
        .object({
          tableId: z.string(),
          schema: z.string(),
          table: z.string(),
          dirty: z.boolean(),
          keys: z.array(
            z.object({
              name: z.string(),
              type: z.string(),
            }),
          ),
        })
        .nullable(),
      parents: z.array(
        z.object({
          id: z.string(),
          fkTable: z.string(),
          targetTable: z.string(),
          keys: z.array(
            z.object({
              fkColumn: z.string(),
              fkType: z.string(),
              targetColumn: z.string(),
              targetType: z.string(),
              nullable: z.boolean(),
            }),
          ),
        }),
      ),
      children: z.array(
        z.object({
          id: z.string(),
          fkTable: z.string(),
          targetTable: z.string(),
          keys: z.array(
            z.object({
              fkColumn: z.string(),
              fkType: z.string(),
              targetColumn: z.string(),
              targetType: z.string(),
              nullable: z.boolean(),
            }),
          ),
        }),
      ),
      uniqueConstraints: z
        .array(
          z.object({
            tableId: z.string(),
            schema: z.string(),
            table: z.string(),
            dirty: z.boolean(),
            name: z.string(),
            columns: z.array(z.string()),
          }),
        )
        .optional(),
    }),
  ),
  enums: z.array(
    z.object({
      id: z.string(),
      schema: z.string(),
      name: z.string(),
      values: z.array(z.string()),
    }),
  ),
  // satisfies allow us to ensure that zod schema always match
  // the actual type of IntrospectedStructure, if the type change and the schema does not
  // it'll raise an error at type-checking time
}) satisfies z.ZodType<IntrospectedStructureBase>;

export const introspectedStructureSchema = z.object({
  ...introspectedStructureBaseSchema.shape,
  sequences: z
    .record(
      z.string(),
      z.array(
        z.object({
          schema: z.string(),
          name: z.string(),
          start: z.number(),
          current: z.number(),
          min: z.number(),
          max: z.number(),
          interval: z.number(),
        }),
      ),
    )
    .optional(),
}) satisfies z.ZodType<IntrospectedStructure>;
