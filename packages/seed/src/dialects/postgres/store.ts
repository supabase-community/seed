import { format, ident, literal } from "@scaleleap/pg-format";
import { EOL } from "node:os";
import { type Json } from "#core/data/types.js";
import {
  type DataModel,
  type DataModelModel,
  type DataModelObjectField,
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
    const inserted: Record<string, Array<number>> = Object.fromEntries(
      Object.keys(this.dataModel.models).map(
        (modelName) => [modelName, []] as [string, Array<number>],
      ),
    );
    const pending: Record<string, Array<number>> = Object.fromEntries(
      Object.keys(this.dataModel.models).map(
        (modelName) => [modelName, []] as [string, Array<number>],
      ),
    );
    const insertStatements: Array<string> = [];
    const updateStatements: Array<string> = [];

    const sortedModels = sortModels(this.dataModel);
    for (const entry of sortedModels) {
      const model = entry.node as DataModelModel & { modelName: string };
      const rows = this._store[model.modelName];
      if (rows.length === 0) {
        continue;
      }

      sequenceFixerStatements.push(...getSequenceFixerStatements(model));

      for (const [i] of rows.entries()) {
        createStatements({
          modelName: model.modelName,
          rowId: i,
          row: rows[i],
          dataModel: this.dataModel,
          inserted,
          pending,
          insertStatements,
          updateStatements,
          store: this._store,
        });
      }
    }

    return [
      ...insertStatements,
      ...updateStatements,
      ...sequenceFixerStatements,
    ];
  }
}

function createStatements(ctx: {
  dataModel: DataModel;
  insertStatements: Array<string>;
  inserted: Record<string, Array<number>>;
  modelName: string;
  pending: Record<string, Array<number>>;
  row: ModelData;
  rowId: number;
  store: Store["_store"];
  updateStatements: Array<string>;
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

  const updatableParents = [] as Array<DataModelObjectField>;

  for (const parent of parents) {
    const parentIdFields = [] as Array<[string, ModelData]>;
    for (const [i] of parent.relationFromFields.entries()) {
      parentIdFields.push([
        parent.relationToFields[i],
        ctx.row[parent.relationFromFields[i]],
      ] as [string, ModelData]);
    }

    // if the parent is not set or null, we can skip it
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (parentIdFields.every(([, v]) => v === null || v === undefined)) {
      continue;
    }

    const parentRowId = ctx.store[parent.type].findIndex((r) =>
      parentIdFields.every(([k, v]) => r[k] === v),
    );

    // external data, no need to create a statement
    if (parentRowId === -1) {
      continue;
    }

    const parentRow = ctx.store[parent.type][parentRowId];
    // if the row is pending, we have a circular dependency
    // we know that the parent will be created earlier in the pending chain, so we can skip this one
    // and set the parent's id to NULL at insertion time
    // do we need to keep track of the exact chain of parents?
    if (ctx.pending[parent.type].includes(parentRowId)) {
      if (parent.isRequired) {
        throw new Error(
          [
            `Circular dependency detected for model ${parent.type} for row ${JSON.stringify(parentRow)}`,
            `Pending context:`,
            JSON.stringify(
              ctx.pending[parent.type].map(
                () => ctx.store[parent.type][parentRowId],
              ),
            ),
          ].join(EOL),
        );
      } else {
        updatableParents.push(parent);
        continue;
      }
    }

    // create the parent statement
    createStatements({
      ...ctx,
      modelName: parent.type,
      row: parentRow,
      rowId: parentRowId,
    });
  }

  // create the statements for the current model
  const { insertStatement, updateStatement } = getStatements(
    model,
    ctx.row,
    updatableParents,
  );

  ctx.insertStatements.push(insertStatement);
  if (updateStatement !== null) {
    ctx.updateStatements.push(updateStatement);
  }

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

function getStatements(
  model: DataModelModel,
  row: ModelData,
  updatableParents: Array<DataModelObjectField>,
) {
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
      // check if the field is part of the updatable parents
      if (updatableParents.some((p) => p.relationFromFields.includes(f.name))) {
        return null;
      }
      if (f.hasDefaultValue && row[f.name] === undefined) {
        return SQL_DEFAULT_SYMBOL;
      }
      return serializeToSQL(f.type, row[f.name] as Json);
    }),
  ).replaceAll(`'${SQL_DEFAULT_SYMBOL}'`, "DEFAULT");

  let updateStatement = null;
  if (updatableParents.length > 0) {
    const updateData = updatableParents.flatMap((p) => {
      return p.relationFromFields.map((f) => {
        const column = (
          model.fields.find((field) => field.name === f) as DataModelScalarField
        ).columnName;
        const value = row[f];
        return [column, value] as [string, Json | undefined];
      });
    });
    const filterData = model.fields
      .filter((f) => f.isId)
      .map((f) => {
        const idColumn = (
          model.fields.find(
            (field) => field.name === f.name,
          ) as DataModelScalarField
        ).columnName;
        const idValue = row[f.name];
        return [idColumn, idValue] as [string, Json | undefined];
      });
    updateStatement = [
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      `UPDATE ${ident(model.schemaName!)}.${ident(model.tableName)}`,
      `SET ${updateData
        .map(([c, v]) => `${ident(c)} = ${literal(v)}`)
        .join(", ")}`,
      `WHERE ${filterData
        .map(([c, v]) => `${ident(c)} = ${literal(v)}`)
        .join(" AND ")}`,
    ].join(" ");
  }

  return { insertStatement, updateStatement };
}
