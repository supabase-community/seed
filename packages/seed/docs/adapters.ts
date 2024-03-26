import { globby } from "globby";
import { basename, join } from "node:path";
import { Project, SyntaxKind, type VariableDeclaration } from "ts-morph";

/**
 * This script generates a description of all the adapters available from our source code.
 */

interface Adapter {
  id: string;
  name: string;
  packageName: string;
}

const adapters: Array<Adapter> = [];

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

  adapters.push({
    id: adapterId,
    name: adapterName,
    packageName: adapterPackageName,
  });
}

console.log(JSON.stringify(adapters, null, 2));
