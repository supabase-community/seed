import { createSeedClient } from "@snaplet/seed";

const main = async () => {
    const seed = await createSeedClient({});

    await seed.$resetDatabase();

    process.exit();
};

main();