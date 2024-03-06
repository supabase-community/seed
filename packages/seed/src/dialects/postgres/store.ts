import { format } from "@scaleleap/pg-format";
import { type Json } from "#core/data/types.js";
import {
  type DataModel,
  type DataModelModel,
  type DataModelScalarField,
} from "#core/dataModel/types.js";
import { groupFields } from "#core/dataModel/utils.js";
import { type ModelData } from "#core/plan/types.js";
import { type Store, StoreBase } from "#core/store/store.js";
import { sortModels } from "#core/store/topologicalSort.js";
import { escapeIdentifier, escapeLiteral, serializeToSQL } from "./utils.js";

export class PgStore extends StoreBase {
  toSQL() {
    const sequenceFixerStatements: Array<string> = [];
    const inserted: Record<string, Array<string>> = Object.fromEntries(
      Object.keys(this.dataModel.models).map(
        (modelName) => [modelName, []] as [string, Array<string>],
      ),
    );
    const pending: Record<string, Array<string>> = Object.fromEntries(
      Object.keys(this.dataModel.models).map(
        (modelName) => [modelName, []] as [string, Array<string>],
      ),
    );
    const statements: Array<string> = [];

    const sortedModels = sortModels(this.dataModel);
    for (const entry of sortedModels) {
      const model = entry.node as DataModelModel & { modelName: string };
      const rows = this._store[model.modelName];
      if (rows.length === 0) {
        continue;
      }

      sequenceFixerStatements.push(...getSequenceFixerStatements(model));

      for (const [i] of rows.entries()) {
        createStatement({
          modelName: model.modelName,
          rowId: `${model.modelName}-${i}`,
          row: rows[i],
          dataModel: this.dataModel,
          inserted,
          pending,
          statements,
          store: this._store,
        });
      }
    }

    return [...statements, ...sequenceFixerStatements];
  }
}

function createStatement(ctx: {
  dataModel: DataModel;
  inserted: Record<string, Array<string>>;
  modelName: string;
  pending: Record<string, Array<string>>;
  row: ModelData;
  rowId: string;
  statements: Array<string>;
  store: Store["_store"];
}) {
  const model = ctx.dataModel.models[ctx.modelName];

  // check if the row has already been inserted
  const isRowInserted = ctx.inserted[ctx.modelName].includes(ctx.rowId);
  if (isRowInserted) {
    return;
  }

  // mark the row as pending
  ctx.pending[ctx.modelName].push(ctx.rowId);

  const { parents } = groupFields(model.fields);

  for (const parent of parents) {
    const parentIdFields = [] as Array<[string, ModelData]>;
    for (const [i] of parent.relationFromFields.entries()) {
      parentIdFields.push([
        parent.relationToFields[i],
        ctx.row[parent.relationFromFields[i]],
      ] as [string, ModelData]);
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (parentIdFields.every(([, v]) => v === null || v === undefined)) {
      continue;
    }

    const parentRowIndex = ctx.store[parent.type].findIndex((r) =>
      parentIdFields.every(([k, v]) => r[k] === v),
    );

    // external data, no need to create a statement
    if (parentRowIndex === -1) {
      continue;
    }

    const parentRowId = `${parent.type}-${parentRowIndex}`;
    const parentRow = ctx.store[parent.type][parentRowIndex];
    // if the row is pending, we have a circular dependency
    if (ctx.pending[parent.type].includes(parentRowId)) {
      throw new Error(
        `Circular dependency detected for model ${parent.type} for row ${JSON.stringify(parentRow)}`,
      );
    }

    // create the parent statement
    createStatement({
      ...ctx,
      modelName: parent.type,
      row: parentRow,
      rowId: parentRowId,
    });
  }

  // create the statement for the current model
  const insertStatement = getInsertStatement(model, ctx.row);

  ctx.statements.push(insertStatement);

  // remove the row from pending and add it to inserted
  ctx.pending[ctx.modelName] = ctx.pending[ctx.modelName].filter(
    (r) => r !== ctx.rowId,
  );
  ctx.inserted[ctx.modelName].push(ctx.rowId);
}

function getSequenceFixerStatements(model: DataModelModel) {
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
      const sequenceFixerStatement = `SELECT setval(${escapeLiteral(
        sequenceIdentifier,
      )}::regclass, (SELECT MAX(${escapeIdentifier(
        fieldColumn,
      )}) FROM ${escapeIdentifier(schemaName)}.${escapeIdentifier(
        tableName,
      )}))`;
      statements.push(sequenceFixerStatement);
    }
  }

  return statements;
}

function getInsertStatement(model: DataModelModel, row: ModelData) {
  const SQL_DEFAULT_SYMBOL = "$$DEFAULT$$";
  // create the statement for the current model
  const isGeneratedId =
    model.fields.filter((f) => f.isGenerated && f.isId).length > 0;

  const insertStatementTemplate = [
    "INSERT INTO %I.%I (%I)",
    isGeneratedId ? "OVERRIDING SYSTEM VALUE" : undefined,
    "VALUES (%L)",
  ]
    .filter((s) => Boolean(s))
    .join(" ");

  const insertableFields = model.fields.filter(
    (f) => f.kind === "scalar" && !(f.isGenerated && !f.isId),
  ) as Array<DataModelScalarField>;

  const insertStatement = format(
    insertStatementTemplate,
    model.schemaName,
    model.tableName,
    insertableFields.map((f) => f.columnName),
    insertableFields.map((f) => {
      if (f.hasDefaultValue && row[f.name] === undefined) {
        return SQL_DEFAULT_SYMBOL;
      }
      return serializeToSQL(f.type, row[f.name] as Json);
    }),
  ).replaceAll(`'${SQL_DEFAULT_SYMBOL}'`, "DEFAULT");

  return insertStatement;
}
