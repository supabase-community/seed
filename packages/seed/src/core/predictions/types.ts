import { type Shape, type TableShapePredictions } from "#trpc/shapes.js";

export type ShapePredictions = Array<TableShapePredictions>;

export type ShapeExamples = Array<{
  examples: Array<string>;
  shape: string;
}>;

export interface DataExample {
  examples: Array<string>;
  input?: string;
  shape?: string;
}

export interface PredictedShape {
  column: string;
  confidence?: number;
  input: string;
  shape?: Shape;
}
