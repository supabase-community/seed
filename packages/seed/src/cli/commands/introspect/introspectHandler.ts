import { setDataModelConfig } from "#config/dataModelConfig.js";

export async function introspectHandler(args: { connectionString: string }) {
  const protocol = new URL(args.connectionString).protocol.slice(0, -1);

  if (protocol === "postgres" || protocol === "postgresql") {
    await pgIntrospect(args.connectionString);
  } else if (protocol === "mysql") {
    throw new Error(`Not implemented yet`);
  } else if (protocol === "file") {
    throw new Error(`Not implemented yet`);
  } else if (protocol === "libsql") {
    throw new Error(`Not implemented yet`);
  } else {
    throw new Error(`Unsupported protocol: ${protocol}`);
  }
}

async function pgIntrospect(connectionString: string) {
  await assertPackage("postgres");
  const { default: postgres } = await import("postgres");
  const client = postgres(connectionString, {
    max: 1,
  });
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const db = drizzle(client);
  const { getDatamodel } = await import("#dialects/postgres/dataModel.js");
  const dataModel = await getDatamodel(db);
  await setDataModelConfig(dataModel);
}

async function assertPackage(pkg: string) {
  try {
    await import(pkg);
  } catch (e) {
    console.error(`please install required package: '${pkg}'`);
    process.exit(1);
  }
}