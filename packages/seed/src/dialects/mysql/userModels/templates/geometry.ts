import { type TypeTemplates } from "#core/userModels/templates/types.js";

export const point: TypeTemplates = ({ input }) =>
  `'POINT(' + copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 }) + ')'`;

export const lineString: TypeTemplates = ({ input }) => `(() => {
  const points = [];
  for (let i = 0; i < 2; i++) {
    points.push(copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 }));
  }
  return 'LINESTRING(' + points.join(', ') + ')';
})()`;

export const polygon: TypeTemplates = ({ input }) => `(() => {
  const points = [];
  for (let i = 0; i < 4; i++) {  // Create 3 points and duplicate the first to close the polygon
    points.push(copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 }));
  }
  points.push(points[0]); // Close the polygon by repeating the first point
  return 'POLYGON((' + points.join(', ') + '))';
})()`;

export const multiPoint: TypeTemplates = ({ input }) => `(() => {
  const points = [];
  for (let i = 0; i < 3; i++) {
    points.push(copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 }));
  }
  return 'MULTIPOINT(' + points.join(', ') + ')';
})()`;

export const multiLineString: TypeTemplates = ({ input }) => `(() => {
  const lines = [];
  for (let i = 0; i < 2; i++) {  // Two linestrings
    const points = [];
    for (let j = 0; j < 2; j++) {  // Each with two points
      points.push(copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 }));
    }
    lines.push('(' + points.join(', ') + ')');
  }
  return 'MULTILINESTRING(' + lines.join(', ') + ')';
})()`;

export const multiPolygon: TypeTemplates = ({ input }) => `(() => {
  const polygons = [];
  for (let i = 0; i < 2; i++) {  // Two polygons
    const points = [];
    for (let j = 0; j < 4; j++) {  // Each with three points plus one to close
      points.push(copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 }));
    }
    points.push(points[0]);  // Close the polygon
    polygons.push('((' + points.join(', ') + '))');
  }
  return 'MULTIPOLYGON(' + polygons.join(', ') + ')';
})()`;

export const geometryCollection: TypeTemplates = ({ input }) => `(() => {
  // Define each geometry type inline for the collection
  const point = copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 });
  const lineString = [
    copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 }),
    copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 })
  ].join(', ');
  const polygon = [
    copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 }),
    copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 }),
    copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 }),
    copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 })
  ].join(', ') + ', ' + copycat.int(${input}, { max: 10 }) + ' ' + copycat.int(${input}, { max: 10 });  // Closing point same as first point

  return 'GEOMETRYCOLLECTION(' +
    'POINT(' + point + '),' +
    'LINESTRING(' + lineString + '),' +
    'POLYGON((' + polygon + '))' +
  ')';
})()`;

export type MYSQL_GEOMETRY_TYPES =
  | "geomcollection"
  | "geometry"
  | "linestring"
  | "multilinestring"
  | "multipoint"
  | "multipolygon"
  | "point"
  | "polygon";
