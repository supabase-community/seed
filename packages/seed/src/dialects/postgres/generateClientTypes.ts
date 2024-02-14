import { generateClientTypes as _generateClientTypes } from "#core/codegen/generateClientTypes.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "../../core/fingerprint/types.js";
import {
  PG_DATE_TYPES,
  PG_TO_JS_TYPES,
  extractPrimitivePgType,
  getPgTypeArrayDimensions,
  isNestedArrayPgType,
} from "./serializer.js";

export function generateClientTypes(props: {
  dataModel: DataModel;
  fingerprint?: Fingerprint;
}) {
  return _generateClientTypes({
    ...props,
    database2tsType: pg2tsType,
    isJson,
    databaseClientType: "PgDatabase<any>",
    imports: "import { type PgDatabase } from 'drizzle-orm/pg-core';",
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
  const primitiveType = extractPrimitivePgType(postgresType);
  if (PG_DATE_TYPES.has(primitiveType)) {
    return "( Date | string )";
  }
  const jsType = PG_TO_JS_TYPES[primitiveType];
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
  return ["json", "jsonb"].includes(extractPrimitivePgType(databaseType));
}
