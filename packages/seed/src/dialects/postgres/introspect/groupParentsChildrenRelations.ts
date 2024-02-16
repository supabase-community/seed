import { groupBy } from 'lodash'

import type { AsyncFunctionSuccessType } from '~/types'

import type { fetchDatabaseRelationships } from './queries/fetchDatabaseRelationships'

type fetchRelationshipsResultsType = AsyncFunctionSuccessType<
  typeof fetchDatabaseRelationships
>

export const groupParentsChildrenRelations = (
  databaseRelationships: fetchRelationshipsResultsType,
  tableIds: string[]
) => {
  const tablesRelationships = new Map<
    string,
    {
      parents: fetchRelationshipsResultsType
      children: fetchRelationshipsResultsType
    }
  >()
  const children = groupBy(databaseRelationships, (f) => f.targetTable)
  const parents = groupBy(databaseRelationships, (f) => f.fkTable)
  for (const tableId of tableIds) {
    tablesRelationships.set(tableId, {
      parents: parents[tableId] || [],
      children: children[tableId] || [],
    })
  }
  return tablesRelationships
}

export type { fetchRelationshipsResultsType }
