import { seedConfigExists } from "#config/seedConfig/seedConfig.js";
import { bold, highlight } from "../../lib/output.js";
import { introspectHandler } from "../introspect/introspectHandler.js";
import { loginHandler } from "../login/loginHandler.js";
import { getUser } from "./getUser.js";
import { seedConfigHandler } from "./seedConfigHandler.js";

export async function setupHandler() {
  const user = await getUser();

  const welcomeText = user
    ? `Welcome back ${highlight(user.email)}! 🌱`
    : `Welcome to ${bold("@snaplet/seed")}, your best data buddy! 🌱`;

  console.log(welcomeText);

  if (!user) {
    await loginHandler();
  }

  if (!(await seedConfigExists())) {
    await seedConfigHandler();
  }

  await introspectHandler();

  // await generateHandler({});
}
