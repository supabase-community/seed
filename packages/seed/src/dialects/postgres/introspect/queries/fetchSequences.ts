import { type DatabaseClient } from "#core/databaseClient.js";
import { buildSchemaExclusionClause } from "./utils.js";

interface FetchSequencesResult {
  interval: bigint | number;
  last: null | string;
  name: string;
  schema: string;
  start: string;
}

const FETCH_SEQUENCES = `
SELECT
  schemaname AS schema,
  sequencename AS name,
  start_value AS start,
  last_value as last,
  increment_by AS interval
FROM
 pg_sequences
WHERE ${buildSchemaExclusionClause("pg_sequences.schemaname")}
`;

export async function fetchSequences(client: DatabaseClient) {
  const response = await client.query<FetchSequencesResult>(FETCH_SEQUENCES);

  return response.map((r) => {
    return {
      schema: r.schema,
      name: r.name,
      start: Number(r.start),
      // When a sequence is created, the current value is the start value and is available for use
      // but when the sequence is used for the first time, the current values is the last used one not available for use
      // so we increment it by one to get the next available value instead
      current: r.last ? Number(r.last) + 1 : Number(r.start),
      interval: Number(r.interval),
    };
  });
}
