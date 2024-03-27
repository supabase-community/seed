import { generateHandler } from "../generate/generateHandler.js";
import { introspectHandler } from "../introspect/introspectHandler.js";
import { predictHandler } from "../predict/predictHandler.js";

export async function syncHandler(args: { output?: string }) {
  await introspectHandler();
  await predictHandler();
  await generateHandler(args);
}
