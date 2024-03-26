import { Project } from "ts-morph";

/**
 * This script generates a description of all the commands available in the CLI from our source code.
 */

const project = new Project();

project.addSourceFilesAtPaths("src/cli/commands/*/*Command.ts");
