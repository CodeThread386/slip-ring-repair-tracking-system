import EmbeddedPostgres from "embedded-postgres";
import fs from "fs";
import path from "path";

const databaseDir = path.join(process.cwd(), ".pgdata");

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "slipring",
  password: "slipring",
  port: 5432,
  persistent: true,
});

async function main() {
  // initdb refuses a non-empty directory, so only initialise on first run.
  if (!fs.existsSync(path.join(databaseDir, "PG_VERSION"))) {
    await pg.initialise();
  }
  await pg.start();

  try {
    await pg.createDatabase("slipring");
  } catch {
    // Database may already exist on subsequent starts.
  }

  console.log("PostgreSQL running at postgresql://slipring:slipring@localhost:5432/slipring");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
