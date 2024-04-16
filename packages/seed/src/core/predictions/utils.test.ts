import { readFileSync } from "fs-extra";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { determineShapeFromType as pgDetermineShapeFromType } from "#dialects/postgres/determineShapeFromType.js";
import { type DataModel } from "../dataModel/types.js";
import { columnsToPredict } from "./utils.js";

describe("columnsToPredict", () => {
  const postgresDataModel = JSON.parse(
    readFileSync(
      path.resolve(
        path.join(
          __dirname,
          "../dataModel/__fixtures__/basicPostgresDataModel.json",
        ),
      ),
      "utf-8",
    ),
  ) as DataModel;
  test("should exlude all non text and ids / relations / constraints columns", () => {
    expect(
      columnsToPredict(postgresDataModel, pgDetermineShapeFromType),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          columnName: "title",
          pgType: "text",
          schemaName: "public",
          tableName: "Post",
        }),
        expect.objectContaining({
          columnName: "content",
          pgType: "text",
          schemaName: "public",
          tableName: "Post",
        }),
        expect.objectContaining({
          columnName: "name",
          pgType: "text",
          schemaName: "public",
          tableName: "Tag",
        }),
        expect.objectContaining({
          columnName: "name",
          pgType: "text",
          schemaName: "public",
          tableName: "User",
        }),
        expect.objectContaining({
          columnName: "checksum",
          pgType: "varchar",
          schemaName: "public",
          tableName: "_prisma_migrations",
        }),
        expect.objectContaining({
          columnName: "migration_name",
          pgType: "varchar",
          schemaName: "public",
          tableName: "_prisma_migrations",
        }),
        expect.objectContaining({
          columnName: "logs",
          pgType: "text",
          schemaName: "public",
          tableName: "_prisma_migrations",
        }),
      ]),
    );
  });
});
