import { pathToFileURL } from "node:url";
import { generateAssets } from "#core/codegen/codegen.js";
import { bold, link, spinner } from "../../lib/output.js";
import { computeCodegenContext } from "./computeCodegenContext.js";

export async function generateHandler(args: { output?: string }) {
  spinner.start(`Generating your ${bold("Seed Client")}`);

  const context = await computeCodegenContext({ outputDir: args.output });

  const outputDir = await generateAssets(context);

  spinner.succeed(
    `Generated your ${bold("Seed Client")} to ${link(pathToFileURL(outputDir).toString())}`,
  );

  spinner.info(
    `You might want to reload your TypeScript Server to pick up the changes`,
  );
}
