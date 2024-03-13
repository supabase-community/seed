import { updateProjectConfig } from "#config/projectConfig.js";
import { bold, highlight } from "../../lib/output.js";
import { generateHandler } from "../generate/generateHandler.js";
import { introspectHandler } from "../introspect/introspectHandler.js";
import { loginHandler } from "../login/loginHandler.js";
import { getDatabaseUrl } from "./getDatabaseUrl.js";
import { getUser } from "./getUser.js";

export async function setupHandler() {
  const user = await getUser();

  const welcomeText = user
    ? `Welcome back ${highlight(user.email)}! 🌱`
    : `Welcome to ${bold("@snaplet/seed")}, your best data buddy! 🌱`;

  console.log(welcomeText);

  if (!user) {
    await loginHandler();
  }

  const databaseUrl = await getDatabaseUrl();

  await introspectHandler({ databaseUrl });

  await updateProjectConfig({ targetDatabaseUrl: databaseUrl });

  await generateHandler({});
}
