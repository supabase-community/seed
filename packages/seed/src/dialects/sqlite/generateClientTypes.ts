import { generateClientTypes as _generateClientTypes } from "#core/codegen/generateClientTypes.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import {
  PG_DATE_TYPES,
  PG_TO_JS_TYPES,
  extractPrimitivePgType,
} from "./utils.js";

export function generateClientTypes(props: {
  dataModel: DataModel;
  fingerprint?: Fingerprint;
}) {
  return _generateClientTypes({
    ...props,
    database2tsType: sqlite2tsType,
    isJson: () => false,
    databaseClientType: `BaseSQLiteDatabase<"async" | "sync", unknown, any>`,
    imports: `import { type BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";`,
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

function sqlite2tsTypeName(dataModel: DataModel, sqliteType: string) {
  const primitiveType = extractPrimitivePgType(sqliteType);
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

function refineType(type: string, _sqliteType: string, isRequired: boolean) {
  if (!isRequired) {
    type = `${type} | null`;
  }

  return type;
}
