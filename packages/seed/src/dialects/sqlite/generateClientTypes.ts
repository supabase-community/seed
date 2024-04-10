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
    database2tsType: sqlite2tsType,
    isJson: () => false,
    refineType,
  });
}

function sqlite2tsType(
  dataModel: DataModel,
  sqliteType: string,
  isRequired: boolean,
) {
  const type = sqlite2tsTypeName(dataModel, sqliteType);

  return refineType(type, sqliteType, isRequired);
}

function sqlite2tsTypeName(_dataModel: DataModel, sqliteType: string) {
  const primitiveType = extractPrimitiveSQLType(sqliteType);
  // TODO: Find a way to automatically turn Date into number via `getTime()`
  // if the adapter used is `prisma`
  if (SQL_DATE_TYPES.has(primitiveType)) {
    return "( Date | string | number )";
  }
  const jsType = SQL_TO_JS_TYPES[primitiveType];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (jsType) {
    return jsType;
  }

  return "unknown";
}

function refineType(type: string, _sqliteType: string, isRequired: boolean) {
  if (!isRequired) {
    type = `${type} | null`;
  }

  return type;
}
