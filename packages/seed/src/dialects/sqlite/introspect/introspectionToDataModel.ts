import {
  type DataModel,
  type DataModelField,
  type DataModelModel,
  type DataModelSequence,
} from "#core/dataModel/types.js";
import {
  type Relationship,
  type introspectDatabase,
} from "./introspectDatabase.js";
import { type AsyncFunctionSuccessType } from "./types.js";

type IntrospectedSqlite = AsyncFunctionSuccessType<typeof introspectDatabase>;

function getParentRelationAndFieldName({
  table,
  targetTable,
  parentRelation,
}: {
  parentRelation: Relationship;
  table: IntrospectedSqlite["tables"][number];
  targetTable: IntrospectedSqlite["tables"][number];
}) {
  const modelName = table.name;
  const targetModelName = targetTable.name;
  // if there is another field pointing to the same target table, it will influence the name of the fields
  const isMultiple =
    table.parents.filter((p) => p.targetTable === parentRelation.targetTable)
      .length > 1;
  const relationName = isMultiple
    ? `${modelName}_${parentRelation.keys
        .map((k) => k.fkColumn)
        .join("_")}To${targetModelName}`
    : `${modelName}To${targetModelName}`;
  const fieldName = isMultiple
    ? `${targetModelName}_${relationName}`
    : targetModelName;
  return { relationName, fieldName };
}

function getChildRelationAndFieldName({
  table,
  childTable,
  childRelation,
}: {
  childRelation: Relationship;
  childTable: IntrospectedSqlite["tables"][number];
  table: IntrospectedSqlite["tables"][number];
}) {
  const modelName = table.name;
  const childModelName = childTable.name;
  // if there is another field pointing to the same child table, it will influence the name of the fields
  const isMultiple =
    table.children.filter((c) => c.fkTable === childRelation.fkTable).length >
    1;
  const relationName = isMultiple
    ? `${childModelName}_${childRelation.keys
        .map((k) => k.fkColumn)
        .join("_")}To${modelName}`
    : `${childModelName}To${modelName}`;
  const fieldName = isMultiple
    ? `${childModelName}_${relationName}`
    : childModelName;
  return { relationName, fieldName };
}

// Check if a column is a sequence if it is, retrive the sequence information
// otherwise return false
function columnSequence(
  column: IntrospectedSqlite["tables"][number]["columns"][number],
): DataModelSequence | false {
  if (column.identity) {
    const current = column.identity.current;
    return {
      identifier: column.identity.name,
      increment: 1,
      current: current,
    };
  }
  return false;
}

export function introspectionToDataModel(
  introspection: IntrospectedSqlite,
): DataModel {
  const dataModel: DataModel = { models: {}, enums: {} };

  for (const table of introspection.tables) {
    const fields: Array<DataModelField> = [];
    // Will contain a map with the column name of all columns that are part of a primary key
    // or of a unique non nullable constraint
    const primaryKeysColumnsNames = new Map<string, boolean>();
    if (table.primaryKeys) {
      const pks = table.primaryKeys;
      for (const key of pks.keys) {
        primaryKeysColumnsNames.set(key.name, true);
      }
    }
    for (const column of table.columns) {
      const type = column.affinity;
      const sequence = columnSequence(column);
      const field: DataModelField = {
        id: column.id,
        name: column.name,
        columnName: column.name,
        type,
        isRequired: !column.nullable,
        kind: "scalar",
        isList: false,
        isGenerated: false,
        sequence,
        hasDefaultValue: column.default !== null,
        isId: Boolean(primaryKeysColumnsNames.get(column.name)),
      };
      fields.push(field);
    }
    for (const parentRelation of table.parents) {
      const targetTable = introspection.tables.find(
        (t) => t.id === parentRelation.targetTable,
      );
      if (!targetTable) {
        console.log(
          `WARN: Could not find target table for relation: ${parentRelation.id}`,
        );
        continue;
      }
      const { relationName, fieldName } = getParentRelationAndFieldName({
        table,
        targetTable,
        parentRelation,
      });
      const field: DataModelField = {
        name: fieldName,
        type: targetTable.name,
        isRequired: parentRelation.keys.every((k) => !k.nullable),
        kind: "object",
        relationName,
        relationFromFields: parentRelation.keys.map((k) => k.fkColumn),
        relationToFields: parentRelation.keys.map((k) => k.targetColumn),
        isList: false,
        isId: false,
        isGenerated: false,
        sequence: false,
        hasDefaultValue: false,
      };
      fields.push(field);
    }
    for (const childRelation of table.children) {
      // TODO: isList detection for one-to-one relationships
      // a child relation is not a list if there is a unique constraint on the keys
      // currently we don't have unique constraints in the introspection result
      // so we assume that a child relation is always a list

      const childTable = introspection.tables.find(
        (t) => t.id === childRelation.fkTable,
      );
      if (!childTable) {
        console.log(
          `WARN: Could not find target table for relation: ${childRelation.id}`,
        );
        continue;
      }
      const { relationName, fieldName } = getChildRelationAndFieldName({
        table,
        childTable,
        childRelation,
      });
      const field: DataModelField = {
        name: fieldName,
        type: childTable.name,
        isRequired: false,
        kind: "object",
        relationName,
        relationFromFields: [],
        relationToFields: [],
        // this is only true if there is a unique constraint on the keys
        isList: true,
        isId: false,
        isGenerated: false,
        sequence: false,
        hasDefaultValue: false,
      };
      fields.push(field);
    }

    const model: DataModelModel = {
      id: table.id,
      tableName: table.name,
      fields,
      uniqueConstraints: table.constraints.map((c) => ({
        name: c.name,
        fields: c.columns,
      })),
    };

    const modelName = table.name;
    dataModel.models[modelName] = model;
  }

  return dataModel;
}
