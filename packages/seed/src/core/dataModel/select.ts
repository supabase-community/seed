import {
  SELECT_WILDCARD_STRING,
  type SelectConfig,
} from "../../config/seedConfig/selectConfig.js";
import { SnapletError } from "../utils.js";
import { type DataModel, type DataModelObjectField } from "./types.js";
import { groupFields } from "./utils.js";

export function computeIncludedTables(
  tableIds: Array<string>,
  selectConfig: SelectConfig,
) {
  const wildcardSelect = Object.fromEntries(
    Object.entries(selectConfig).filter(([key]) =>
      key.endsWith(SELECT_WILDCARD_STRING),
    ),
  );
  const strictSelect = Object.fromEntries(
    Object.entries(selectConfig).filter(
      ([key]) => !key.endsWith(SELECT_WILDCARD_STRING),
    ),
  );
  const wildcardMatchers = Object.keys(wildcardSelect).map((key) =>
    // We remve the * from the key to match the tableIds with startsWith
    key.slice(0, -SELECT_WILDCARD_STRING.length),
  );
  return tableIds.filter((tableId) => {
    const tableStrictSelect = strictSelect[tableId];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (tableStrictSelect !== undefined) {
      return tableStrictSelect;
    }
    // We get all the wildcard matchers that match the tableId
    const matchingWildcard = wildcardMatchers.filter((matcher) =>
      tableId.startsWith(matcher),
    );
    // We choose the most specific wildcard matcher for the tableId by sorting
    // them by length and taking the last one
    const mostSpecificWildcard = matchingWildcard.sort(
      (a, b) => b.length - a.length,
    )[0];
    // If we have a most specific wildcard matcher we return its value
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (mostSpecificWildcard !== undefined) {
      return wildcardSelect[`${mostSpecificWildcard}${SELECT_WILDCARD_STRING}`];
    }
    // If we don't have a most specific wildcard matcher we return true
    // to include the table by default
    return true;
  });
}

export function getTableRelationsErrors(
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

export function checkParentRelations(
  includedTableIds: Set<string>,
  models: DataModel["models"],
) {
  const errors: Array<{ relationName: string; relationToTable: string }> = [];

  for (const [_, model] of Object.entries(models)) {
    const groupedFields = groupFields(model.fields);
    errors.push(
      ...getTableRelationsErrors(includedTableIds, models, groupedFields),
    );
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
    dialect: dataModel.dialect,
    models: {},
    enums: dataModel.enums,
  };
  // We rebuild the data model with only the included tables
  for (const [key, model] of Object.entries(relationsFilteredDataModel)) {
    if (includedTables.has(model.id)) {
      filteredDataModel.models[key] = model;
    }
  }
  return filteredDataModel;
}
