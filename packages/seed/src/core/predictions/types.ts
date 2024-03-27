import { type TableShapePredictions } from "#trpc/shapes.js";

export type ShapePredictions = Array<TableShapePredictions>;

export type ShapeExamples = Array<{
  examples: Array<string>;
  shape: string;
}>;
