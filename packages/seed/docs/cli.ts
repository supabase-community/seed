import { Project, SyntaxKind } from "ts-morph";

/**
 * This script generates a description of all the commands available in the CLI from our source code.
 */

const project = new Project();

project.addSourceFilesAtPaths("src/cli/commands/*/*Command.ts");

interface CommandOption {
  alias?: string;
  description?: string;
  name: string;
  type: string;
}

interface Command {
  description: string;
  name: string;
  options: Array<CommandOption>;
}

const commands: Array<Command> = [];

for (const sourceFile of project.getSourceFiles()) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const commandFunctionArguments = Array.from(
    sourceFile.getExportedDeclarations().values(),
  )
    .flat()
    .at(0)!
    .asKindOrThrow(SyntaxKind.FunctionDeclaration)
    .getBodyOrThrow()
    .asKindOrThrow(SyntaxKind.Block)
    .getStatementByKindOrThrow(SyntaxKind.ReturnStatement)
    .getExpressionIfKindOrThrow(SyntaxKind.CallExpression)
    .getArguments();

  const commandName = commandFunctionArguments[0]
    .asKindOrThrow(SyntaxKind.StringLiteral)
    .getLiteralValue();

  const commandDescription = commandFunctionArguments[1]
    .asKindOrThrow(SyntaxKind.StringLiteral)
    .getLiteralValue();

  const commandArgsAndOptions = commandFunctionArguments[2]
    .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
    .getProperties();

  const commandOptions: Array<CommandOption> = [];
  for (const property of commandArgsAndOptions) {
    const propertyAssignment = property.asKindOrThrow(
      SyntaxKind.PropertyAssignment,
    );
    const optionName = propertyAssignment.getName();
    const optionAlias = propertyAssignment
      .getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      .getProperty("alias")
      ?.asKindOrThrow(SyntaxKind.PropertyAssignment)
      .getFirstChildByKindOrThrow(SyntaxKind.StringLiteral)
      .getLiteralValue();
    const optionDescription = propertyAssignment
      .getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      .getProperty("describe")
      ?.asKindOrThrow(SyntaxKind.PropertyAssignment)
      .getFirstChildByKindOrThrow(SyntaxKind.StringLiteral)
      .getLiteralValue();
    const optionType = propertyAssignment
      .getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      .getPropertyOrThrow("type")
      .asKindOrThrow(SyntaxKind.PropertyAssignment)
      .getFirstChildByKindOrThrow(SyntaxKind.StringLiteral)
      .getLiteralValue();
    commandOptions.push({
      alias: optionAlias,
      description: optionDescription,
      name: optionName,
      type: optionType,
    });
  }
  commands.push({
    description: commandDescription,
    name: commandName,
    options: commandOptions,
  });
}

console.log(JSON.stringify(commands, null, 2));
