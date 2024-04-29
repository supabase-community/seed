import { type DataModel } from "#core/dataModel/types.js";
import { SQL_DATE_TYPES } from "#core/dialect/utils.js";
import { FallbackSymbol } from "#core/symbols.js";
import { type UserModels } from "#core/userModels/types.js";
import { getDialect } from "./getDialect.js";

function patchSqliteDatetimeFields(
  dataModel: DataModel,
  userModels: UserModels,
): UserModels {
  const resultModels: UserModels = { ...userModels };
  for (const [modelName, fields] of Object.entries(dataModel.models)) {
    const datetimeFields = fields.fields.filter((field) =>
      SQL_DATE_TYPES.has(field.type),
    );
    if (datetimeFields.length > 0) {
      const model = userModels[modelName].data;
      if (model) {
        for (const field of datetimeFields) {
          const fieldDefinition = model[field.name];
          if (
            typeof fieldDefinition === "function" &&
            fieldDefinition[FallbackSymbol] === true
          ) {
            // Note: We don't put back the FallbackSymbol on the patched function because prisma also wrongly define
            // DEFAULT CURRENT_TIMESTAMP on datetime fields. However, at runtime, it doesn't actually use the default value coming from the database.
            // Which is a string, but rather it use his own Date.now() timestamp. So we pretend our override are user defines so we don't rely on the database default value either.
            model[field.name] = (...args) => {
              const value = fieldDefinition(...args) as Date | string;
              if (typeof value !== "number") {
                return new Date(value).getTime();
              }
              return value;
            };
          }
        }
      }
    }
  }
  return resultModels;
}

function patchSqliteUserModels(dataModel: DataModel, userModels: UserModels) {
  // In SQLite prisma store the datetime fields as timestamps. We need to patch the default user models
  // tranform to automatically align with what prisma is doing.
  return patchSqliteDatetimeFields(dataModel, userModels);
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function patchUserModels(props: {
  dataModel: DataModel;
  userModels: UserModels;
}) {
  const dialect = await getDialect();

  if (dialect === "sqlite") {
    return patchSqliteUserModels(props.dataModel, props.userModels);
  }

  return props.userModels;
}
