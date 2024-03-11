import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "..");

// context(justinvdm, 11 Mar 2023): We put the temp dir in the project so that the temporary seed
// scripts we create for each test are able to resolve the same modules in node_modules
export const TMP_DIR = path.join(ROOT_DIR, ".tmp");
