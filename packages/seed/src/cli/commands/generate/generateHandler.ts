import { generateAssets } from "#core/codegen/codegen.js";
import { computeCodegenContext } from "./computeCodegenContext.js";

export async function generateHandler(args: { output?: string }) {
  try {
    const context = await computeCodegenContext({ outputDir: args.output });

    await generateAssets(context);

    return { ok: true };
  } catch (error) {
    throw error as Error;
  }
}
