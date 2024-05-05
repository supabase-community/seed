import { DEFAULT_SQL_TEMPLATES } from "#core/dialect/userModels.js";
import { type Templates } from "#core/userModels/templates/types.js";
import {
  type MYSQL_GEOMETRY_TYPES,
  geometryCollection,
  lineString,
  multiLineString,
  multiPoint,
  multiPolygon,
  point,
  polygon,
} from "./userModels/templates/geometry.js";
import { type SQLTypeName } from "./utils.js";

export const SQL_TEMPLATES: Templates<MYSQL_GEOMETRY_TYPES | SQLTypeName> = {
  ...DEFAULT_SQL_TEMPLATES,
  point,
  geometry: point,
  linestring: lineString,
  polygon,
  multipoint: multiPoint,
  multilinestring: multiLineString,
  multipolygon: multiPolygon,
  geomcollection: geometryCollection,
};
