import { generateClientTypes as _generateClientTypes } from "#core/codegen/generateClientTypes.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import {
  SQL_DATE_TYPES,
  SQL_TO_JS_TYPES,
  extractPrimitiveSQLType,
} from "./utils.js";

export function generateClientTypes(props: {
  dataModel: DataModel;
  fingerprint?: Fingerprint;
}) {
  return _generateClientTypes({
    ...props,
    database2tsType: mysql2tsType,
    isJson,
    refineType,
  });
}

function mysql2tsType(
  dataModel: DataModel,
  sqliteType: string,
  isRequired: boolean,
) {
  const type = mysql2tsTypeName(dataModel, sqliteType);

  return refineType(type, sqliteType, isRequired);
}

function mysql2tsTypeName(dataModel: DataModel, sqliteType: string) {
  const primitiveType = extractPrimitiveSQLType(sqliteType);
  // In mysql, booleans are converted and stored as tinyint(1)
  // in this case, we want to allow the user to priovide a boolean or a number
  if (primitiveType === "tinyint") {
    return "( boolean | number )";
  }
  if (SQL_DATE_TYPES.has(primitiveType)) {
    return "( Date | string )";
  }
  const jsType = SQL_TO_JS_TYPES[primitiveType];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (jsType) {
    return jsType;
  }

  const enumName = Object.keys(dataModel.enums).find(
    (name) => name === primitiveType,
  );

  if (enumName) {
    return `${enumName}Enum`;
  }

  return "unknown";
}

function refineType(type: string, _sqliteType: string, isRequired: boolean) {
  if (!isRequired) {
    type = `${type} | null`;
  }

  return type;
}

function isJson(databaseType: string) {
  return ["json", "jsonb"].includes(extractPrimitiveSQLType(databaseType));
}
