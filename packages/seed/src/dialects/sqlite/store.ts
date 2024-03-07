import { format, ident, literal } from "@scaleleap/pg-format";
import { type Json } from "#core/data/types.js";
import { type DataModelModel } from "#core/dataModel/types.js";
import { SQL_DEFAULT_SYMBOL, StoreBase } from "#core/store/store.js";
import { serializeToSQL } from "./utils.js";

export class SqliteStore extends StoreBase {
  toSQL() {
    return this._toSQL({
      serializeInsertStatement,
      serializeUpdateStatement,
    });
  }
}

function serializeInsertStatement(props: {
  columns: Array<string>;
  model: DataModelModel;
  values: Array<unknown>;
}) {
  const insertStatementTemplate = "INSERT INTO %I (%I) VALUES (%L)";

  return format(
    insertStatementTemplate,
    props.model.tableName,
    props.columns.filter((_, i) => props.values[i] !== SQL_DEFAULT_SYMBOL),
    props.values
      .filter((v) => v !== SQL_DEFAULT_SYMBOL)
      .map((v, i) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const field = props.model.fields.find(
          (f) => f.kind === "scalar" && f.columnName === props.columns[i],
        )!;
        return serializeToSQL(field.type, v as Json);
      }),
  );
}

function serializeUpdateStatement(props: {
  filterData: Array<[string, unknown]>;
  model: DataModelModel;
  updateData: Array<[string, unknown]>;
}) {
  return [
    `UPDATE ${ident(props.model.tableName)}`,
    `SET ${props.updateData
      .map(([c, v]) => `${ident(c)} = ${literal(v)}`)
      .join(", ")}`,
    `WHERE ${props.filterData
      .map(([c, v]) => `${ident(c)} = ${literal(v)}`)
      .join(" AND ")}`,
  ].join(" ");
}
