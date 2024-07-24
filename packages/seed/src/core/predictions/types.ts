import { type TableShapePredictions } from "#trpc/shapes.js";

export type ShapePredictions = Array<TableShapePredictions>;

export interface DataExample {
  description: string;
  examples: Array<string>;
  input: string;
}
