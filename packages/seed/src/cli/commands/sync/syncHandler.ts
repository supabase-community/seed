import { generateHandler } from "../generate/generateHandler.js";
import { introspectHandler } from "./introspectHandler.js";

export async function syncHandler() {
  await introspectHandler();

  await generateHandler({});
}
