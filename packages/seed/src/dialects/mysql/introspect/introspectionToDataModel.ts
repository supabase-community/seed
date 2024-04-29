import {
  type DataModel,
  type DataModelField,
  type DataModelModel,
  type DataModelSequence,
} from "#core/dataModel/types.js";
import {
  type IntrospectedStructure,
  type IntrospectedTableColumn,
  type Relationship,
} from "./introspectDatabase.js";

type MinimalRelationship = Pick<Relationship, "fkTable" | "targetTable"> & {
  keys: Array<Pick<Relationship["keys"][number], "fkColumn" | "targetColumn">>;
};
function getModelName(
  introspection: { tables: Array<{ name: string; schema: string }> },
  table: Pick<IntrospectedStructure["tables"][number], "name" | "schema">,
) {
  const tableIsInMultipleSchemas = introspection.tables.some(
    (t) => t.name === table.name && t.schema !== table.schema,
  );

  const modelName = tableIsInMultipleSchemas
    ? `${table.schema}_${table.name}`
    : table.name;

  return modelName;
}

function getParentRelationAndFieldName({
  introspection,
  table,
  targetTable,
  parentRelation,
}: {
  introspection: IntrospectedStructure;
  parentRelation: MinimalRelationship;
  table: IntrospectedStructure["tables"][number];
  targetTable: Pick<
    IntrospectedStructure["tables"][number],
    "name" | "schema"
  > & { parents: Array<MinimalRelationship> };
}) {
  const modelName = getModelName(introspection, table);
  const targetModelName = getModelName(introspection, targetTable);
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
  introspection,
  table,
  childTable,
  childRelation,
}: {
  childRelation: MinimalRelationship;
  childTable: IntrospectedStructure["tables"][number];
  introspection: IntrospectedStructure;
  table: IntrospectedStructure["tables"][number];
}) {
  const modelName = getModelName(introspection, table);
  const childModelName = getModelName(introspection, childTable);
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

const computeEnumType = (
  introspection: IntrospectedStructure,
  column: IntrospectedStructure["tables"][number]["columns"][number],
): string => {
  const matchingEnum = introspection.enums.find((e) => e.id === column.type);

  if (!matchingEnum) {
    throw new Error(
      `Could not find enum "${column.type}" when creating data model`,
    );
  }

  return matchingEnum.id;
};

// Check if a column is a sequence if it is, retrive the sequence information
// otherwise return false
function columnSequence(
  column: IntrospectedTableColumn,
  sequences: IntrospectedStructure["sequences"],
): DataModelSequence | false {
  // If the column is an identity column we return the identity information
  // https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-identity-column/
  if (column.identity && sequences) {
    const sequence = sequences[column.schema].find(
      (s) => s.name === column.identity?.name,
    );
    if (sequence) {
      return {
        identifier: sequence.name,
        increment: sequence.interval,
        start: sequence.start,
      };
    }
  }
  return false;
}

export function introspectionToDataModel(
  introspection: IntrospectedStructure,
): DataModel {
  const dataModel: DataModel = { models: {}, enums: {} };

  for (const e of introspection.enums) {
    const enumName = e.id;
    dataModel.enums[enumName] = {
      schemaName: e.schema,
      values: e.values.map((v) => ({ name: v })),
    };
  }

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
      const type = column.type.startsWith("enum")
        ? computeEnumType(introspection, column)
        : column.type;
      const sequence = columnSequence(column, introspection.sequences);
      const field: DataModelField = {
        id: column.id,
        name: column.name,
        columnName: column.name,
        type,
        isRequired: !column.nullable,
        kind: "scalar",
        isList: false,
        isGenerated: column.generated,
        sequence,
        hasDefaultValue: column.default !== null,
        isId: Boolean(primaryKeysColumnsNames.get(column.name)),
        maxLength: column.maxLength,
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
        introspection,
        table,
        targetTable,
        parentRelation,
      });
      const field: DataModelField = {
        name: fieldName,
        type: getModelName(introspection, targetTable),
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
        introspection,
        table,
        childTable: childTable,
        childRelation,
      });
      const field: DataModelField = {
        name: fieldName,
        type: getModelName(introspection, childTable),
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
      schemaName: table.schema,
      tableName: table.name,
      fields,
      uniqueConstraints:
        table.uniqueConstraints?.map((c) => ({
          name: c.name,
          fields: c.columns,
        })) ?? [],
    };

    const modelName = getModelName(introspection, table);
    dataModel.models[modelName] = model;
  }
  return dataModel;
}
