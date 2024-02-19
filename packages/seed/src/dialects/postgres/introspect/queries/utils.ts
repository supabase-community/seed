import { escapeLiteral } from "../../utils.js";

const EXCLUDED_SCHEMAS = ["information_schema", "pg\\_%"];

function buildSchemaExclusionClause(escapedColumn: string) {
  return EXCLUDED_SCHEMAS.map(
    (s) => `${escapedColumn} NOT LIKE ${escapeLiteral(s)}`,
  ).join(" AND ");
}

export { buildSchemaExclusionClause };
