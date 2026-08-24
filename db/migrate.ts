import { migrate } from "drizzle-orm/libsql/migrator";

import { getDb } from "./client";

async function main() {
  await migrate(getDb(), { migrationsFolder: "./db/migrations" });
  console.log("Database migrations applied");
}

main().catch((error: unknown) => {
  console.error("Database migration failed", error);
  process.exitCode = 1;
});
