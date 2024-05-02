import { confirm } from "@inquirer/prompts";
import boxen from "boxen";
import dedent from "dedent";
import path from "node:path";
import { adapters } from "#adapters/index.js";
import { getUser } from "#cli/lib/getUser.js";
import { telemetry } from "#cli/lib/telemetry.js";
import { SNAPLET_APP_URL } from "#config/constants.js";
import { getProjectConfig } from "#config/project/projectConfig.js";
import { seedConfigExists } from "#config/seedConfig/seedConfig.js";
import { trpc } from "#trpc/client.js";
import { bold, brightGreen, dim, highlight, link } from "../../lib/output.js";
import { linkHandler } from "../link/linkHandler.js";
import { loginHandler } from "../login/loginHandler.js";
import { syncHandler } from "../sync/syncHandler.js";
import { adapterHandler } from "./adapterHandler.js";
import { generateSeedScriptExample } from "./generateSeedScriptExample.js";
import { installDependencies } from "./installDependencies.js";
import { saveSeedConfig } from "./saveSeedConfig.js";

export async function initHandler(args: {
  directory: string;
  reset?: boolean;
}) {
  // Every files are created in the same directory as the seed.config.ts file
  process.env["SNAPLET_SEED_CONFIG"] = path.join(
    args.directory,
    "seed.config.ts",
  );

  const user = await getUser();
  const wasLoggedIn = Boolean(user);

  const welcomeText = user
    ? `Welcome back ${highlight(user.email)}! 😻`
    : `Welcome to ${bold("@snaplet/seed")}! Snaplet Seed populates your database with realistic, production-like mock data ✨`;

  console.log();
  console.log(welcomeText);

  const projectConfig = await getProjectConfig();
  let isLoggedIn = Boolean(user);

  if (!user) {
    console.log();
    console.log(
      `Seed works best with ${brightGreen("Snaplet AI")} - it improves data quality significantly and requires a ${bold("free")} Snaplet account 🤖`,
    );
    console.log();

    const shouldUseSnapletAI = await confirm({
      message: `Use Snaplet AI to enhance your generated data?`,
      default: true,
    });

    await telemetry.captureEvent("$action:init:step:authChosen", {
      choice: shouldUseSnapletAI,
    });

    if (shouldUseSnapletAI) {
      await loginHandler();
      isLoggedIn = true;
    }
  }

  await telemetry.captureEvent("$action:init:step:authDone", {
    isLoggedIn,
    wasLoggedIn,
  });

  const shouldLink = !projectConfig.projectId && isLoggedIn;

  if (shouldLink) {
    await linkHandler();
  }

  await telemetry.captureEvent("$action:init:step:afterLink", {
    didLink: shouldLink,
    isLoggedIn,
  });

  const hadAdapter = Boolean(projectConfig.adapter);

  const adapter = projectConfig.adapter
    ? adapters[projectConfig.adapter]
    : await adapterHandler();

  await telemetry.captureEvent("$action:init:step:adapter", {
    adapter: adapter.id,
    hadAdapter,
    isLoggedIn,
  });

  await installDependencies({ adapter });

  if (!(await seedConfigExists())) {
    await saveSeedConfig({ adapter });
  }

  await telemetry.captureEvent("$action:init:step:config", {
    isLoggedIn,
  });

  await syncHandler({ isInit: true });

  await telemetry.captureEvent("$action:init:step:sync", {
    isLoggedIn,
  });

  const seedScriptExamplePath = await generateSeedScriptExample();

  if (isLoggedIn) {
    const organization =
      await trpc.organization.organizationGetByProjectId.query({
        // context(justinvdm, 02 May 2024): At this point, we've linked the project
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        projectId: (await getProjectConfig()).projectId!,
      });

    console.log(
      "\n" +
        dedent`
      ✅ Seed is now set up for your project. Here's what to do next:

        ${bold("1. Edit and run your seed script")} 📝
        ${bold("$")} code ${path.relative(process.cwd(), seedScriptExamplePath)}  ${dim("# Tell Seed how to seed your database")}
        ${bold("$")} npx tsx seed.ts  ${dim("# Run your seed script")}

        ${bold("2. Refine your data (optional)")} 🔧
        Customize your AI-generated data using our Data Generator: ${link(`${SNAPLET_APP_URL}/o/${organization.id}/p/${projectConfig.projectId}/seed`)}

        ${bold("3. Learn more")} 📚
        * Quick start guide: ${link("https://docs.snaplet.dev/getting-started/quick-start/seed")}
        * Community and support: ${link("https://app.snaplet.dev/chat")}

      Happy seeding! 🌱
  `,
    );
  } else {
    console.log(
      boxen(
        `Want to improve your data? Use ${highlight("Snaplet AI")}! Rerun ${bold("npx @snaplet/seed init")} and choose ${bold("Snaplet AI")}.`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "bold",
        },
      ),
    );

    console.log(
      "\n" +
        dedent`
      ✅ Seed is now set up for your project. Here's what to do next:

        ${bold("1. Edit and run your seed script")} 📝
        ${bold("$")} code ${path.relative(process.cwd(), seedScriptExamplePath)}  ${dim("# Tell Seed how to seed your database")}
        ${bold("$")} npx tsx seed.ts  ${dim("# Run your seed script")}

        ${bold("2. Learn more")} 📚
        * Quick start guide: ${link("https://docs.snaplet.dev/getting-started/quick-start/seed")}
        * Community and support: ${link("https://app.snaplet.dev/chat")}

      Happy seeding! 🌱`,
    );
  }
}
