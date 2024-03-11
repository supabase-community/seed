import { format, ident, literal } from "@scaleleap/pg-format";
import { type Json } from "#core/data/types.js";
import {
  type DataModelModel,
  type DataModelScalarField,
} from "#core/dataModel/types.js";
import { SQL_DEFAULT_SYMBOL, StoreBase } from "#core/store/store.js";
import { serializeToSQL } from "./utils.js";

export class PgStore extends StoreBase {
  toSQL() {
    return this._toSQL({
      serializeInsertStatement,
      serializeUpdateStatement,
      getEndStatements,
    });
  }
}

function serializeInsertStatement(props: {
  columns: Array<string>;
  model: DataModelModel;
  values: Array<unknown>;
}) {
  const isGeneratedId =
    props.model.fields.filter((f) => f.isGenerated && f.isId).length > 0;

  const insertStatementTemplate = [
    "INSERT INTO %I.%I (%I)",
    isGeneratedId ? "OVERRIDING SYSTEM VALUE" : undefined,
    "VALUES (%L)",
  ]
    .filter((s) => Boolean(s))
    .join(" ");

  return format(
    insertStatementTemplate,
    props.model.schemaName,
    props.model.tableName,
    props.columns,
    Array.from(props.values.entries()).map(([i, v]) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const field = props.model.fields.find(
        (f) => f.kind === "scalar" && f.columnName === props.columns[i],
      )!;
      return serializeToSQL(field.type, v as Json);
    }),
  ).replaceAll(`'${SQL_DEFAULT_SYMBOL}'`, "DEFAULT");
}

function serializeUpdateStatement(props: {
  filterData: Array<[string, unknown]>;
  model: DataModelModel;
  updateData: Array<[string, unknown]>;
}) {
  return [
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    `UPDATE ${ident(props.model.schemaName!)}.${ident(props.model.tableName)}`,
    `SET ${props.updateData
      .map(([c, v]) => `${ident(c)} = ${literal(v)}`)
      .join(", ")}`,
    `WHERE ${props.filterData
      .map(([c, v]) => `${ident(c)} = ${literal(v)}`)
      .join(" AND ")}`,
  ].join(" ");
}

function getEndStatements(model: DataModelModel) {
  const statements: Array<string> = [];

  const fieldMap = new Map(
    model.fields
      .filter((f) => f.kind === "scalar" && !(f.isGenerated && !f.isId))
      .map((f) => [f.name, f as DataModelScalarField]),
  );
  const fieldToColumnMap = new Map(
    Array.from(fieldMap.values()).map((f) => [f.name, f.columnName]),
  );
  const sequenceFields = model.fields.filter((f) => f.sequence);
  // If we inserted new rows with sequences, we need to update the database sequence value to the max value of the inserted rows
  for (const sequenceField of sequenceFields) {
    const tableName = model.tableName;
    const schemaName = model.schemaName;
    const fieldColumn = fieldToColumnMap.get(sequenceField.name);

    if (
      fieldColumn &&
      sequenceField.sequence &&
      schemaName &&
      tableName &&
      sequenceField.sequence.identifier
    ) {
      const sequenceIdentifier = sequenceField.sequence.identifier;
      const sequenceFixerStatement = `SELECT setval(${literal(
        sequenceIdentifier,
      )}::regclass, (SELECT MAX(${ident(
        fieldColumn,
      )}) FROM ${ident(schemaName)}.${ident(tableName)}))`;
      statements.push(sequenceFixerStatement);
    }
  }

  return statements;
}
