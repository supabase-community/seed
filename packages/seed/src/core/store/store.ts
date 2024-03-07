import { EOL } from "node:os";
import { groupFields } from "#core/dataModel/utils.js";
import {
  type DataModel,
  type DataModelModel,
  type DataModelObjectField,
  type DataModelScalarField,
} from "../dataModel/types.js";
import { type ModelData } from "../plan/types.js";
import { sortModels } from "./topologicalSort.js";

type SerializeInsertStatement = (props: {
  columns: Array<string>;
  model: DataModelModel;
  values: Array<unknown>;
}) => string;

type SerializeUpdateStatement = (props: {
  filterData: Array<[string, unknown]>;
  model: DataModelModel;
  updateData: Array<[string, unknown]>;
}) => string;

export interface Store {
  _store: Record<string, Array<ModelData>>;
  add(model: string, value: ModelData): void;
  toSQL(): Array<string>;
}

export const SQL_DEFAULT_SYMBOL = "$$DEFAULT$$";

export abstract class StoreBase implements Store {
  _store: Record<string, Array<ModelData>>;
  public readonly dataModel: DataModel;

  constructor(dataModel: DataModel) {
    this.dataModel = dataModel;
    this._store = Object.fromEntries(
      Object.keys(dataModel.models).map((modelName) => [modelName, []]),
    );
  }

  protected _toSQL(props: {
    getEndStatements?: (model: DataModelModel) => Array<string>;
    serializeInsertStatement: SerializeInsertStatement;
    serializeUpdateStatement: SerializeUpdateStatement;
  }): Array<string> {
    const endStatements: Array<string> = [];
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

      for (const [i] of rows.entries()) {
        createStatements({
          serializeInsertStatement: props.serializeInsertStatement,
          serializeUpdateStatement: props.serializeUpdateStatement,
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

      if (props.getEndStatements) {
        endStatements.push(...props.getEndStatements(model));
      }
    }

    return [...insertStatements, ...updateStatements, ...endStatements];
  }

  add(model: string, value: ModelData) {
    this._store[model].push(value);
  }

  abstract toSQL(): Array<string>;
}

function createStatements(ctx: {
  dataModel: DataModel;
  insertStatements: Array<string>;
  inserted: Record<string, Array<number>>;
  modelName: string;
  pending: Record<string, Array<number>>;
  row: ModelData;
  rowId: number;
  serializeInsertStatement: SerializeInsertStatement;
  serializeUpdateStatement: SerializeUpdateStatement;
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
  const { insertStatement, updateStatement } = getStatements({
    model,
    row: ctx.row,
    updatableParents,
    serializeInsertStatement: ctx.serializeInsertStatement,
    serializeUpdateStatement: ctx.serializeUpdateStatement,
  });

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

function getStatements(props: {
  model: DataModelModel;
  row: ModelData;
  serializeInsertStatement: SerializeInsertStatement;
  serializeUpdateStatement: SerializeUpdateStatement;
  updatableParents: Array<DataModelObjectField>;
}) {
  const insertableFields = props.model.fields.filter(
    (f) => f.kind === "scalar" && !(f.isGenerated && !f.isId),
  ) as Array<DataModelScalarField>;

  const insertStatement = props.serializeInsertStatement({
    model: props.model,
    columns: insertableFields.map((f) => f.columnName),
    values: insertableFields.map((f) => {
      // check if the field is part of the updatable parents
      if (
        props.updatableParents.some((p) =>
          p.relationFromFields.includes(f.name),
        )
      ) {
        return null;
      }
      if (f.hasDefaultValue && props.row[f.name] === undefined) {
        return SQL_DEFAULT_SYMBOL;
      }
      return props.row[f.name];
    }),
  });

  let updateStatement = null;
  if (props.updatableParents.length > 0) {
    const updateData = props.updatableParents.flatMap((p) => {
      return p.relationFromFields.map((f) => {
        const column = (
          props.model.fields.find(
            (field) => field.name === f,
          ) as DataModelScalarField
        ).columnName;
        const value = props.row[f];
        return [column, value] as [string, unknown];
      });
    });
    const filterData = props.model.fields
      .filter((f) => f.isId)
      .map((f) => {
        const idColumn = (
          props.model.fields.find(
            (field) => field.name === f.name,
          ) as DataModelScalarField
        ).columnName;
        const idValue = props.row[f.name];
        return [idColumn, idValue] as [string, unknown];
      });
    updateStatement = props.serializeUpdateStatement({
      model: props.model,
      filterData,
      updateData,
    });
  }

  return { insertStatement, updateStatement };
}
