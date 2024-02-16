import { Dictionary, groupBy } from 'lodash'

import { AsyncFunctionSuccessType } from '~/types.js'

import type { DatabaseClient } from '../client.js'
import { fetchAuthorizedEnums } from './queries/fetchAuthorizedEnums.js'
import { fetchAuthorizedExtensions } from './queries/fetchAuthorizedExtensions.js'
import { fetchAuthorizedSchemas } from './queries/fetchAuthorizedSchemas.js'
import { fetchDatabaseRelationships } from './queries/fetchDatabaseRelationships.js'
import { fetchIndexes } from './queries/fetchIndexes.js'
import { fetchPrimaryKeys } from './queries/fetchPrimaryKeys.js'
import { fetchServerVersion } from './queries/fetchServerVersion.js'
import { fetchTablesAndColumns } from './queries/fetchTablesAndColumns.js'
import { groupParentsChildrenRelations } from './groupParentsChildrenRelations.js'
import {
  IntrospectConfig,
  mergeConfigWithRelationshipsResult,
} from '~/config/snapletConfig/introspectConfig.js'
import { z } from 'zod'
import { fetchSequences } from './queries/fetchSequences.js'
import { fetchUniqueConstraints } from './queries/fetchUniqueConstraints.js'

type PrimaryKeys = AsyncFunctionSuccessType<typeof fetchPrimaryKeys>
type Constraints = AsyncFunctionSuccessType<typeof fetchUniqueConstraints>
type Schemas = AsyncFunctionSuccessType<typeof fetchAuthorizedSchemas>
type Tables = AsyncFunctionSuccessType<typeof fetchTablesAndColumns>
type Extensions = AsyncFunctionSuccessType<typeof fetchAuthorizedExtensions>
type Indexes = AsyncFunctionSuccessType<typeof fetchIndexes>
type Enums = AsyncFunctionSuccessType<typeof fetchAuthorizedEnums>
type Sequences = AsyncFunctionSuccessType<typeof fetchSequences>
export type Relationships = AsyncFunctionSuccessType<
  typeof fetchDatabaseRelationships
>
export type Relationship = Relationships[number]
type GroupedRelationships = ReturnType<typeof groupParentsChildrenRelations>
type GroupedRelationshipsValue = NonNullable<
  ReturnType<GroupedRelationships['get']>
>
export type IntrospectedTableColumn = Tables[number]['columns'][number]
export type IntrospectedEnum = Enums[number]
export type IntrospectedTable = Tables[number]

export interface IntrospectedStructureBase {
  schemas: Schemas
  tables: Tables
  extensions: Extensions
  enums: Enums
  server: { version: string }
}

export interface IntrospectedStructure extends IntrospectedStructureBase {
  tables: Array<
    IntrospectedStructureBase['tables'][number] &
      GroupedRelationshipsValue & {
        primaryKeys: PrimaryKeys[number] | null
        constraints?: Constraints
      }
  >
  indexes: Indexes
  sequences?: Dictionary<Sequences>
}

export const basicIntrospectDatabase = async (
  client: DatabaseClient
): Promise<IntrospectedStructureBase> => {
  const schemas = await fetchAuthorizedSchemas(client)
  const tablesInfos = await fetchTablesAndColumns(client)
  const extensions = await fetchAuthorizedExtensions(client)
  const version = await fetchServerVersion(client)
  const enums = await fetchAuthorizedEnums(client)
  return {
    schemas,
    tables: tablesInfos,
    extensions,
    enums,
    server: { version },
  }
}

export const introspectDatabaseV3 = async (
  client: DatabaseClient,
  introspectConfig?: IntrospectConfig
): Promise<IntrospectedStructure> => {
  const {
    schemas,
    tables: tablesInfos,
    extensions,
    enums,
    server,
  } = await basicIntrospectDatabase(client)
  const baseRelationships = await fetchDatabaseRelationships(client)
  const primaryKeys = await fetchPrimaryKeys(client)
  const constraints = await fetchUniqueConstraints(client)
  const indexes = await fetchIndexes(client)
  const sequences = await fetchSequences(client)
  const tableIds = tablesInfos.map((table) => table.id)
  const relationships = introspectConfig
    ? mergeConfigWithRelationshipsResult(introspectConfig, {
        relationships: baseRelationships,
        tables: tablesInfos,
      })
    : baseRelationships
  const groupedRelationships = groupParentsChildrenRelations(
    relationships,
    tableIds
  )
  const sequencesGroupesBySchema = groupBy(sequences, (s) => s.schema)
  // tableId is the schema.table of the pk in our results
  const groupedPrimaryKeys = groupBy(primaryKeys, (k) => k.tableId)
  const groupedConstraints = groupBy(constraints, (c) => c.tableId)
  // We build or final table structure here, augmenting the basic one with
  // relations and primary keys infos
  const tablesWithRelations: IntrospectedStructure['tables'] = tablesInfos.map(
    (table) => {
      const tableRelationships = groupedRelationships.get(table.id)!
      const primaryKeys = groupedPrimaryKeys[table.id]?.[0] ?? null
      const constraints = groupedConstraints[table.id] ?? []
      if (introspectConfig?.virtualForeignKeys?.length) {
        const relations = [
          ...tableRelationships.parents,
          ...tableRelationships.children,
        ]
        // Since the relations can have been augmented via the config, we need to
        // update the columns constraints to reflect the new "virtual" foreign keys
        relations
          .filter((relation) => relation.fkTable === table.id)
          .flatMap((relation) => relation.keys.map((k) => k.fkColumn))
          .forEach((fkColumn) => {
            const column = table.columns.find((c) => c.name === fkColumn)
            if (column && !column.constraints.some((c) => c === 'f')) {
              column.constraints.push('f')
            }
          })
      }
      return {
        ...table,
        ...tableRelationships,
        primaryKeys,
        constraints,
      }
    }
  )
  return {
    schemas,
    tables: tablesWithRelations,
    extensions,
    enums,
    server,
    indexes,
    sequences: sequencesGroupesBySchema,
  }
}

const introspectedStructureBaseSchema = z.object({
  schemas: z.array(z.string()),
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
          generated: z.union([z.literal('ALWAYS'), z.literal('NEVER')]),
          maxLength: z.number().nullable(),
          identity: z
            .object({
              sequenceName: z.string().optional(),
              generated: z.union([
                z.literal('ALWAYS'),
                z.literal('BY DEFAULT'),
              ]),
              start: z.number(),
              increment: z.number(),
              current: z.number(),
            })
            .nullable()
            .optional(),
          typeCategory: z.union([
            z.literal('A'),
            z.literal('B'),
            z.literal('C'),
            z.literal('D'),
            z.literal('E'),
            z.literal('G'),
            z.literal('I'),
            z.literal('N'),
            z.literal('P'),
            z.literal('R'),
            z.literal('S'),
            z.literal('T'),
            z.literal('U'),
            z.literal('V'),
            z.literal('X'),
            z.literal('Z'),
          ]),
          constraints: z.array(
            z.union([
              z.literal('p'),
              z.literal('f'),
              z.literal('u'),
              z.literal('c'),
              z.literal('t'),
              z.literal('x'),
            ])
          ),
        })
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
            })
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
            })
          ),
        })
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
            })
          ),
        })
      ),
      constraints: z
        .array(
          z.object({
            tableId: z.string(),
            schema: z.string(),
            table: z.string(),
            dirty: z.boolean(),
            name: z.string(),
            columns: z.array(z.string()),
          })
        )
        .optional(),
    })
  ),
  extensions: z.array(
    z.object({
      name: z.string(),
      version: z.string(),
      schema: z.string(),
    })
  ),
  enums: z.array(
    z.object({
      id: z.string(),
      schema: z.string(),
      name: z.string(),
      values: z.array(z.string()),
    })
  ),
  server: z.object({ version: z.string() }),
  // satisfies allow us to ensure that zod schema always match
  // the actual type of IntrospectedStructure, if the type change and the schema does not
  // it'll raise an error at type-checking time
}) satisfies z.ZodType<IntrospectedStructureBase>

export const introspectedStructureSchema = z.object({
  ...introspectedStructureBaseSchema.shape,
  indexes: z.array(
    z.object({
      schema: z.string(),
      table: z.string(),
      index: z.string(),
      definition: z.string(),
      type: z.string(),
      indexColumns: z.array(z.string()),
    })
  ),
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
        })
      )
    )
    .optional(),
}) satisfies z.ZodType<IntrospectedStructure>
