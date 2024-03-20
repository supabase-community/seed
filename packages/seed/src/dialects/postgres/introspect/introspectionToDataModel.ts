import {
  type DataModel,
  type DataModelField,
  type DataModelModel,
  type DataModelSequence,
} from "#core/dataModel/types.js";
import { escapeIdentifier } from "../utils.js";
import {
  type IntrospectedStructure,
  type IntrospectedTableColumn,
  type Relationship,
} from "./introspectDatabase.js";

function getModelName(
  introspection: { tables: Array<{ name: string; schema: string }> },
  table: IntrospectedStructure["tables"][number],
) {
  const tableIsInMultipleSchemas = introspection.tables.some(
    (t) => t.name === table.name && t.schema !== table.schema,
  );

  const modelName = tableIsInMultipleSchemas
    ? `${table.schema}_${table.name}`
    : table.name;

  return modelName;
}

function getEnumName(
  introspection: IntrospectedStructure,
  enumItem: IntrospectedStructure["enums"][number],
) {
  const enumIsInMultipleSchemas = introspection.enums.some(
    (e) => e.name === enumItem.name && e.schema !== enumItem.schema,
  );

  const enumName = enumIsInMultipleSchemas
    ? `${enumItem.schema}_${enumItem.name}`
    : enumItem.name;

  return enumName;
}

function getParentRelationAndFieldName({
  introspection,
  table,
  targetTable,
  parentRelation,
}: {
  introspection: IntrospectedStructure;
  parentRelation: Relationship;
  table: IntrospectedStructure["tables"][number];
  targetTable: IntrospectedStructure["tables"][number];
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
  childRelation: Relationship;
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
  const matchingEnum = introspection.enums.find((e) => e.id === column.typeId);

  if (!matchingEnum) {
    throw new Error(
      `Could not find enum "${column.typeId}" when creating data model`,
    );
  }

  const name = getEnumName(introspection, matchingEnum);

  // context(justinvdm, 31 Aug 2023): Preserve array annotations
  const suffix = column.type.slice(matchingEnum.name.length);

  return [name, suffix].join("");
};

function extractSequenceDetails(
  defaultValue: string,
  defaultSchema: string,
): {
  schema: null | string;
  sequence: null | string;
} {
  // This regex matches strings that follow the PostgreSQL function format nextval('schema."sequence"'::regclass) for sequences
  const matchWithSchemaName = defaultValue.match(
    /nextval\('("?)([^.]+)\1\."([^'"]+)"?'::regclass\)/,
  );
  if (matchWithSchemaName) {
    return {
      schema: matchWithSchemaName[2],
      sequence: matchWithSchemaName[3],
    };
  } else {
    // This regex is for matching strings in the format nextval('"sequence"'::regclass) where the schema name is not provided
    const matchWithoutSchema = defaultValue.match(
      /nextval\('"?([^".]+)"?'::regclass\)/i,
    );
    if (matchWithoutSchema) {
      return {
        schema: defaultSchema,
        sequence: matchWithoutSchema[1],
      };
    }
    return { schema: null, sequence: null };
  }
}

// Check if a column is a sequence if it is, retrive the sequence information
// otherwise return false
function columnSequence(
  column: IntrospectedTableColumn,
  sequences: IntrospectedStructure["sequences"],
): DataModelSequence | false {
  // If the column is an identity column we return the identity information
  // https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-identity-column/
  if (column.identity) {
    const current = column.identity.current;
    return {
      identifier: column.identity.sequenceName
        ? // Comes from: pg_get_serial_sequence which will automatically escape the identifier if it needs to
          // Will be something like: `public."User_id_seq"`
          column.identity.sequenceName
        : null,
      increment: column.identity.increment,
      current: current,
    };
  }
  // Otherwise a column can have a sequence as default value wihtout being an identity column
  // in that case, we extract the sequence informations via the default value nextval()
  // function parameters call
  if (column.default?.startsWith("nextval(") && sequences) {
    // Extract the sequence schema and name from the default function definition
    const sequenceDetails = extractSequenceDetails(
      column.default,
      column.schema,
    );
    if (!sequenceDetails.schema || !sequenceDetails.sequence) {
      return false;
    }
    const schemaSequences = sequences[sequenceDetails.schema];
    const sequence = schemaSequences.find(
      (s) => s.name === sequenceDetails.sequence,
    );
    if (sequence) {
      return {
        identifier: `${escapeIdentifier(
          sequenceDetails.schema,
        )}.${escapeIdentifier(sequenceDetails.sequence)}`,
        increment: sequence.interval,
        current: sequence.current,
      };
    }
    return false;
  }
  return false;
}

export function introspectionToDataModel(
  introspection: IntrospectedStructure,
): DataModel {
  const dataModel: DataModel = { dialect: "postgres", models: {}, enums: {} };

  for (const e of introspection.enums) {
    const enumName = getEnumName(introspection, e);
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
      const type =
        column.typeCategory === "E"
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
        isGenerated:
          column.generated === "ALWAYS" ||
          column.identity?.generated === "ALWAYS",
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
