import { type Json } from "#core/data/types.js";
import { isNullableParent as checkIsNullableParent } from "#core/dataModel/dataModel.js";
import { type DataModelScalarField } from "#core/dataModel/types.js";
import { StoreBase } from "#core/store/store.js";
import { sortModels } from "#core/store/topologicalSort.js";
import { escapeIdentifier, formatValues, serializeToSQL } from "./utils.js";

interface MissingPKForUpdateError {
  modelName: string;
  type: "missingPKForUpdateError";
}
type ToSQLErrors = MissingPKForUpdateError;

function logToSqlErrors(errors: Array<ToSQLErrors>) {
  if (errors.length === 0) {
    return;
  }
  const missingPKForUpdateErrorsMap = new Map<string, number>();
  for (const error of errors) {
    // Set a unique map per model with the number of affected rows
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (error.type === "missingPKForUpdateError") {
      missingPKForUpdateErrorsMap.set(
        error.modelName,
        (missingPKForUpdateErrorsMap.get(error.modelName) ?? 1) + 1,
      );
    }
  }
  for (const [modelName, affectedRows] of missingPKForUpdateErrorsMap) {
    console.warn(
      `Warning: skipping UPDATE on model ${modelName} for ${affectedRows} rows as it has no id fields (no PRIMARY KEYS or UNIQUE NON NULL columns found)`,
    );
  }
}

export class MySQLStore extends StoreBase {
  toSQL() {
    const SQL_DEFAULT_SYMBOL = "$$DEFAULT$$";

    const sortedModels = sortModels(this.dataModel);
    // we need to maintain an update map to store the ids of nullable parents
    // we will use this map to create the links between the parent and the child once all the models have been inserted
    const insertStatements: Array<string> = [];
    const updateStatements: Array<string> = [];
    const errorsData: Array<ToSQLErrors> = [];

    for (const model of sortedModels) {
      const idFieldNames = this.dataModel.models[model.modelName].fields
        .filter((f) => f.kind === "scalar" && f.isId)
        .map((f) => f.name);
      const rows = this._store[model.modelName];

      if (!rows.length) {
        continue;
      }

      const fieldMap = new Map(
        model.fields
          .filter((f) => f.kind === "scalar" && !(f.isGenerated && !f.isId))
          .map((f) => [f.name, f as DataModelScalarField]),
      );
      const fieldToColumnMap = new Map(
        Array.from(fieldMap.values()).map((f) => [f.name, f.columnName]),
      );
      const insertRowsValues: Array<Array<unknown>> = [];
      for (const row of rows) {
        const insertRowValues: Array<unknown> = [];
        let updateRow:
          | {
              filter: Record<string, unknown>;
              values: Record<string, unknown>;
            }
          | undefined;

        for (const fieldName of fieldMap.keys()) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const field = fieldMap.get(fieldName)!;

          const value = row[fieldName];

          if (value === undefined && field.hasDefaultValue) {
            // we use this weird syntax to replace the value in the final sql statements
            insertRowValues.push(SQL_DEFAULT_SYMBOL);
            continue;
          }

          // We check if the column is part of a nullable parent relation
          const isNullableParent = checkIsNullableParent(
            this.dataModel,
            model.modelName,
            fieldName,
          );
          // If it is, and the value is not null, we store the id of the parent in the update map
          if (isNullableParent && value !== null) {
            if (idFieldNames.length > 0) {
              if (!updateRow) {
                updateRow = {
                  filter: idFieldNames.reduce(
                    (acc, idFieldName) => ({
                      ...acc,
                      [idFieldName]: serializeToSQL(
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        fieldMap.get(idFieldName)!.type,
                        row[idFieldName],
                      ),
                    }),
                    {},
                  ),
                  values: {},
                };
              }
              updateRow.values[fieldName] = serializeToSQL(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                fieldMap.get(fieldName)!.type,
                value as Json,
              );
            } else {
              errorsData.push({
                modelName: model.modelName,
                type: "missingPKForUpdateError",
              });
            }
          }
          // If the field is a nullable parent with a defined value, we check if it's part of a unique constraint with a nullNotDistinct
          // if that's the case we already tried to solve the unique constraint for it so we can use it's value since null fallback will likely not be possible
          if (
            isNullableParent &&
            value !== null &&
            model.uniqueConstraints.length > 0
          ) {
            const constraintsForField = model.uniqueConstraints.filter((c) =>
              c.fields.includes(fieldName),
            );
            const hasNullNotDistinctConstraint = constraintsForField.some(
              (c) => c.nullNotDistinct,
            );
            if (hasNullNotDistinctConstraint) {
              insertRowValues.push(
                serializeToSQL(
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  fieldMap.get(fieldName)!.type,
                  value as Json,
                ),
              );
              continue;
            }
          }
          insertRowValues.push(
            serializeToSQL(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              fieldMap.get(fieldName)!.type,
              // if the field is a nullable parent, we defer the insert of its parent id for later to avoid fk constraint errors
              isNullableParent ? null : (value as Json),
            ),
          );
        }
        if (updateRow) {
          const updateStatement = [
            `UPDATE ${escapeIdentifier(model.schemaName)}.${escapeIdentifier(model.tableName)}`,
            `SET ${Object.entries(updateRow.values)
              .map(
                ([c, v]) =>
                  `${escapeIdentifier(fieldToColumnMap.get(c))} = ${v}`,
              )
              .join(", ")}`,
            `WHERE ${Object.entries(updateRow.filter)
              .map(
                ([c, v]) =>
                  `${escapeIdentifier(fieldToColumnMap.get(c))} = ${v}`,
              )
              .join(" AND ")}`,
          ].join(" ");
          updateStatements.push(updateStatement);
        }
        insertRowsValues.push(insertRowValues);
      }
      const columnsMap = Array.from(fieldToColumnMap.values());
      const inserts = insertRowsValues.map((row) => {
        const columnsToFills = columnsMap.filter(
          (_, index) => row[index] !== SQL_DEFAULT_SYMBOL,
        );
        const values = row.filter((v) => v !== SQL_DEFAULT_SYMBOL);
        return `INSERT INTO ${escapeIdentifier(model.schemaName)}.${escapeIdentifier(model.tableName)} (${columnsToFills.map(escapeIdentifier).join(", ")}) VALUES ${formatValues([values])}`;
      });
      insertStatements.push(...inserts);
    }
    logToSqlErrors(errorsData);
    return [...insertStatements, ...updateStatements];
  }
}
