import { escapeLiteral } from "../../utils.js";

const EXCLUDED_SCHEMAS = ["information_schema", "performance_schema", "sys"];

function buildSchemaExclusionClause(escapedColumn: string) {
  return EXCLUDED_SCHEMAS.map(
    (s) => `${escapedColumn} NOT LIKE ${escapeLiteral(s)}`,
  ).join(" AND ");
}
function buildSchemaInclusionClause(
  schemas: Array<string>,
  escapedColumn: string,
) {
  return schemas
    .map((s) => `${escapedColumn} = ${escapeLiteral(s)}`)
    .join(" OR ");
}

export { buildSchemaExclusionClause, buildSchemaInclusionClause };
