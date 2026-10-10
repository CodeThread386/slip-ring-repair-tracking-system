import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pgBin = path.join(
  root,
  "node_modules/@embedded-postgres/linux-x64/native/bin",
);
const dataDir = path.join(root, ".postgres/data");
const logFile = path.join(root, ".postgres/server.log");

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, PGDATA: dataDir },
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function isRunning() {
  const result = spawnSync(path.join(pgBin, "pg_ctl"), ["-D", dataDir, "status"], {
    stdio: "pipe",
    encoding: "utf8",
  });
  return result.stdout.includes("server is running");
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  run(path.join(pgBin, "initdb"), [
    "-D",
    dataDir,
    "-U",
    "slipring",
    "--auth=trust",
  ]);
}

if (!isRunning()) {
  run(path.join(pgBin, "pg_ctl"), ["-D", dataDir, "-l", logFile, "-o", "-p 5432", "start"]);
}

const createdb = spawnSync(
  path.join(pgBin, "createdb"),
  ["-p", "5432", "-U", "slipring", "slipring"],
  { stdio: "pipe", encoding: "utf8" },
);

if (createdb.status !== 0 && !createdb.stderr.includes("already exists")) {
  console.error(createdb.stderr);
  process.exit(createdb.status ?? 1);
}

console.log("PostgreSQL ready on port 5432");
