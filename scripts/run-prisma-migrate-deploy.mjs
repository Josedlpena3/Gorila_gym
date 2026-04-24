import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

function resolveNpxCommand() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

function loadLocalEnvFile() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const raw = readFileSync(envPath, "utf8");

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (!key || process.env[key] !== undefined) {
      return;
    }

    process.env[key] = value;
  });
}

function isPlaceholderDatabaseUrl(value) {
  return /YOUR-REMOTE-HOST|USER:PASSWORD|DBNAME/.test(value);
}

async function run() {
  loadLocalEnvFile();

  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

  if (!databaseUrl) {
    console.error("DATABASE_URL is not configured.");
    process.exit(1);
  }

  if (isPlaceholderDatabaseUrl(databaseUrl)) {
    console.error(
      "DATABASE_URL contains placeholders. Configure the real Neon connection string in Vercel with sslmode=require."
    );
    process.exit(1);
  }

  console.log("Running Prisma migrations...");

  await new Promise((resolve, reject) => {
    const child = spawn(resolveNpxCommand(), ["prisma", "migrate", "deploy"], {
      stdio: "inherit",
      env: process.env
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`prisma migrate deploy exited with code ${code ?? 1}`));
    });
  });

  console.log("Migrations applied successfully");
}

run().catch((error) => {
  console.error("[prisma-migrate-deploy] migration failed", {
    message: error instanceof Error ? error.message : "unknown_error"
  });
  process.exit(1);
});
