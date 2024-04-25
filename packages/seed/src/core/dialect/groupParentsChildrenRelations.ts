import { groupBy } from "./utils.js";

export function groupParentsChildrenRelations<
  C extends {
    fkColumn: string;
    fkType: string;
    nullable: boolean;
    targetColumn: string;
    targetType: string;
  },
  T extends {
    fkTable: string;
    id: string;
    keys: Array<C>;
    targetTable: string;
  },
>(databaseRelationships: Array<T>, tableIds: Array<string>) {
  const tablesRelationships = new Map<
    string,
    {
      children: Array<T>;
      parents: Array<T>;
    }
  >();
  const children = groupBy(databaseRelationships, (f) => f.targetTable);
  const parents = groupBy(databaseRelationships, (f) => f.fkTable);
  for (const tableId of tableIds) {
    tablesRelationships.set(tableId, {
      parents: parents[tableId] ?? [],
      children: children[tableId] ?? [],
    });
  }
  return tablesRelationships;
}
