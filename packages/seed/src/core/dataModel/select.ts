import multimatch from "multimatch";
import { type SelectConfig } from "../../config/seedConfig/selectConfig.js";
import { SnapletError } from "../utils.js";
import { type DataModel, type DataModelObjectField } from "./types.js";
import { groupFields } from "./utils.js";

export function computeIncludedTables(
  tableIds: Array<string>,
  selectConfig: SelectConfig,
) {
  const tables = tableIds.reduce<Record<string, boolean>>((acc, tableId) => {
    acc[tableId] = true;
    return acc;
  }, {});

  for (const pattern of selectConfig) {
    const matches = multimatch(
      tableIds,
      pattern.startsWith("!") ? ["*", pattern] : pattern,
    );
    // If the pattern starts with a ! we pass all the unmatched tables to false
    if (pattern.startsWith("!")) {
      for (const tableId of tableIds) {
        if (!matches.includes(tableId)) {
          tables[tableId] = false;
        }
      }
    } else {
      for (const tableId of matches) {
        tables[tableId] = true;
      }
    }
  }

  return tableIds.filter((tableId) => tables[tableId]);
}

function getTableRelationsErrors(
  includedTableIds: Set<string>,
  models: DataModel["models"],
  groupedFields: {
    parents: Array<DataModelObjectField>;
  },
) {
  const errors: Array<{ relationName: string; relationToTable: string }> = [];
  for (const parent of groupedFields.parents) {
    const parentModel = models[parent.type];
    if (!includedTableIds.has(parentModel.id)) {
      errors.push({
        relationName: parent.relationName,
        relationToTable: parent.type,
      });
    }
  }
  return errors;
}

function checkParentRelations(
  includedTableIds: Set<string>,
  models: DataModel["models"],
) {
  const errors: Array<{ relationName: string; relationToTable: string }> = [];

  for (const [_, model] of Object.entries(models)) {
    // We only check the relations of the tables that are included
    if (includedTableIds.has(model.id)) {
      const groupedFields = groupFields(model.fields);
      errors.push(
        ...getTableRelationsErrors(includedTableIds, models, groupedFields),
      );
    }
  }
  if (errors.length > 0) {
    throw new SnapletError("SEED_SELECT_RELATIONSHIP_ERROR", { errors });
  }
}

function filterOutChildrenRelations(
  includedTableIds: Set<string>,
  models: DataModel["models"],
) {
  const result: DataModel["models"] = {};
  for (const [key, model] of Object.entries(models)) {
    const groupedFields = groupFields(model.fields);
    const childFields = groupedFields.children.filter((field) =>
      includedTableIds.has(models[field.type].id),
    );
    result[key] = {
      ...model,
      fields: [
        ...groupedFields.scalars,
        ...groupedFields.parents,
        ...childFields,
      ],
    };
  }
  return result;
}

export function getSelectFilteredDataModel(
  dataModel: DataModel,
  selectConfig?: SelectConfig,
) {
  if (!selectConfig) {
    return dataModel;
  }

  const tableIds = Object.values(dataModel.models).map((model) => model.id);

  const includedTables = new Set(computeIncludedTables(tableIds, selectConfig));
  // Check that the select doesn't break the relationships constraints
  // will throw an error if the select is invalid
  checkParentRelations(includedTables, dataModel.models);
  const relationsFilteredDataModel = filterOutChildrenRelations(
    includedTables,
    dataModel.models,
  );
  const filteredDataModel: DataModel = {
    ...dataModel,
    models: {},
  };
  // We rebuild the data model with only the included tables
  for (const [key, model] of Object.entries(relationsFilteredDataModel)) {
    if (includedTables.has(model.id)) {
      filteredDataModel.models[key] = model;
    }
  }
  return filteredDataModel;
}
