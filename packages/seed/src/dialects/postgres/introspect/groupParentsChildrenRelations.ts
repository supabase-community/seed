import { groupBy } from "../utils.js";
import { type fetchDatabaseRelationships } from "./queries/fetchDatabaseRelationships.js";
import { type AsyncFunctionSuccessType } from "./types.js";

type fetchRelationshipsResultsType = Array<
    AsyncFunctionSuccessType<typeof fetchDatabaseRelationships>[number]
>;

export const groupParentsChildrenRelations = (
    databaseRelationships: fetchRelationshipsResultsType,
    tableIds: Array<string>,
) => {
    const tablesRelationships = new Map<
        string,
        {
            children: fetchRelationshipsResultsType;
            parents: fetchRelationshipsResultsType;
        }
    >();
    const children = groupBy(databaseRelationships, (f) => f.targetTable);
    const parents = groupBy(databaseRelationships, (f) => f.fkTable);
    for (const tableId of tableIds) {
        tablesRelationships.set(tableId, {
            parents: parents[tableId],
            children: children[tableId],
        });
    }
    return tablesRelationships;
};

export type { fetchRelationshipsResultsType };
