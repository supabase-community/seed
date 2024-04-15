import { generateClientTypes as _generateClientTypes } from "#core/codegen/generateClientTypes.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import {
  SQL_DATE_TYPES,
  SQL_TO_JS_TYPES,
  extractPrimitiveSQLType,
  getPgTypeArrayDimensions,
  isNestedArrayPgType,
} from "./utils.js";

export function generateClientTypes(props: {
  dataModel: DataModel;
  fingerprint?: Fingerprint;
}) {
  return _generateClientTypes({
    ...props,
    database2tsType: pg2tsType,
    isJson,
    refineType,
  });
}

function pg2tsType(
  dataModel: DataModel,
  postgresType: string,
  isRequired: boolean,
) {
  const type = pg2tsTypeName(dataModel, postgresType);

  return refineType(type, postgresType, isRequired);
}

function pg2tsTypeName(dataModel: DataModel, postgresType: string) {
  const primitiveType = extractPrimitiveSQLType(postgresType);
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

function refineType(type: string, postgresType: string, isRequired: boolean) {
  if (isNestedArrayPgType(postgresType)) {
    type = `${type}${"[]".repeat(getPgTypeArrayDimensions(postgresType))}`;
  }

  if (!isRequired) {
    type = `${type} | null`;
  }

  return type;
}

function isJson(databaseType: string) {
  return ["json", "jsonb"].includes(extractPrimitiveSQLType(databaseType));
}
