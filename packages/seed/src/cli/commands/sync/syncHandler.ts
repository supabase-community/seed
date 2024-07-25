import { bold, brightGreen, dim } from "#cli/lib/output.js";
import { dotSnapletPathExists, getDotSnapletPath } from "#config/dotSnaplet.js";
import {
  getProjectConfigPath,
  projectConfigExists,
} from "#config/project/projectConfig.js";
import {
  getSeedConfigPath,
  seedConfigExists,
} from "#config/seedConfig/seedConfig.js";
import { SnapletError } from "#core/utils.js";
import { generateHandler } from "../generate/generateHandler.js";
import { introspectHandler } from "../introspect/introspectHandler.js";
import { predictHandler } from "../predict/predictHandler.js";

async function ensureCanSync() {
  if (!(await seedConfigExists())) {
    throw new SnapletError("SEED_CONFIG_NOT_FOUND", {
      path: await getSeedConfigPath(),
    });
  }

  if (!(await dotSnapletPathExists())) {
    throw new SnapletError("SNAPLET_FOLDER_NOT_FOUND", {
      path: await getDotSnapletPath(),
    });
  }

  if (!(await projectConfigExists())) {
    throw new SnapletError("SNAPLET_PROJECT_CONFIG_NOT_FOUND", {
      path: await getProjectConfigPath(),
    });
  }
}

export async function syncHandler(args: { isInit?: boolean; output?: string }) {
  await ensureCanSync();
  await introspectHandler();
  if (process.env["OPENAI_API_KEY"] ?? process.env["GROQ_API_KEY"]) {
    await predictHandler();
  } else {
    console.log(`
${dim("Skipping AI-generated data...")}

To get ${bold(" AI-generated data")}, you need to set either the ${brightGreen("OPENAI_API_KEY")} or ${brightGreen("GROQ_API_KEY")} environment variable.")}
We also look for a .env file in the root of your project.

To use a specific model, set the ${brightGreen("AI_MODEL_NAME")} environment variable.
Example: ${brightGreen("AI_MODEL_NAME=gpt-4-mini")}
      `);
  }

  await generateHandler(args);
}
