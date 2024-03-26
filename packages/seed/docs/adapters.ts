import { globby } from "globby";
import { basename, join } from "node:path";
import {
  type ClassDeclaration,
  Project,
  SyntaxKind,
  type VariableDeclaration,
} from "ts-morph";

/**
 * This script generates a description of all the adapters available from our source code.
 */

interface Adapter {
  id: string;
  name: string;
  packageName: string;
}

const adapters: Record<string, Array<Adapter>> = {
  ORM: [],
  PostgreSQL: [],
  SQLite: [],
};

const adaptersPaths = (
  await globby("src/adapters/*", { onlyDirectories: true })
).map((p) => join(p, `${basename(p)}.ts`));

const project = new Project();

project.addSourceFilesAtPaths(adaptersPaths);

for (const sourceFile of project.getSourceFiles()) {
  const exportedDeclarations = Array.from(
    sourceFile.getExportedDeclarations().values(),
  ).flat();
  const adapterDefinition = exportedDeclarations.find(
    (ed) =>
      ed.isKind(SyntaxKind.VariableDeclaration) &&
      ed.getName().endsWith("Adapter"),
  ) as VariableDeclaration | undefined;
  if (!adapterDefinition) {
    throw new Error(
      `Adapter definition not found for file ${sourceFile.getFilePath()}`,
    );
  }

  const objectDefinition = adapterDefinition.getFirstDescendantByKindOrThrow(
    SyntaxKind.ObjectLiteralExpression,
  );

  const adapterId = objectDefinition
    .getPropertyOrThrow("id")
    .getFirstDescendantByKindOrThrow(SyntaxKind.StringLiteral)
    .getLiteralValue();

  const adapterName = objectDefinition
    .getPropertyOrThrow("name")
    .getFirstDescendantByKindOrThrow(SyntaxKind.StringLiteral)
    .getLiteralValue();

  const adapterPackageName = objectDefinition
    .getPropertyOrThrow("packageName")
    .getFirstDescendantByKindOrThrow(SyntaxKind.StringLiteral)
    .getLiteralValue();

  const classDefinition = exportedDeclarations.find(
    (ed) =>
      ed.isKind(SyntaxKind.ClassDeclaration) &&
      ed.getName()?.startsWith("Seed"),
  ) as ClassDeclaration | undefined;
  if (!classDefinition) {
    throw new Error(
      `Adapter class definition not found for file ${sourceFile.getFilePath()}`,
    );
  }

  const superCalls = classDefinition
    .getFirstDescendantByKindOrThrow(SyntaxKind.Constructor)
    .getFirstChildByKindOrThrow(SyntaxKind.Block)
    .getDescendantsOfKind(SyntaxKind.SuperKeyword);

  let adapterCategory: string;
  if (superCalls.length > 1) {
    adapterCategory = "ORM";
  } else if (superCalls.length === 1) {
    const dialect = superCalls[0]
      .getFirstAncestorByKindOrThrow(SyntaxKind.CallExpression)
      .getArguments()[0]
      .asKindOrThrow(SyntaxKind.StringLiteral)
      .getLiteralValue();
    if (dialect === "postgres") {
      adapterCategory = "PostgreSQL";
    } else if (dialect === "sqlite") {
      adapterCategory = "SQLite";
    } else {
      throw new Error(
        `Unknown dialect ${dialect} for file ${sourceFile.getFilePath()}`,
      );
    }
  } else {
    throw new Error(
      `Adapter class definition is missing a super() call to determine the adapter category for file ${sourceFile.getFilePath()}`,
    );
  }

  adapters[adapterCategory].push({
    id: adapterId,
    name: adapterName,
    packageName: adapterPackageName,
  });
}

console.log(JSON.stringify(adapters, null, 2));
