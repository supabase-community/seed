import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient({});
await seed.$resetDatabase();
process.exit();
