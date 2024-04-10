import { type TableShapePredictions } from "#trpc/shapes.js";

export type ShapePredictions = Array<TableShapePredictions>;

export interface DataExample {
  examples: Array<string>;
  input?: string;
  shape?: string;
}
