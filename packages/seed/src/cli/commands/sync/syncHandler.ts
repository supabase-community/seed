import { generateHandler } from "../generate/generateHandler.js";
import { introspectHandler } from "./introspectHandler.js";

export async function syncHandler(args: { output?: string }) {
  await introspectHandler();

  await generateHandler(args);
}
