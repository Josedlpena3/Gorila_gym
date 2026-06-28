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

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function runMigrate() {
  return new Promise((resolve, reject) => {
    const child = spawn(resolveNpxCommand(), ["prisma", "migrate", "deploy"], {
      stdio: ["inherit", "inherit", "pipe"],
      env: process.env,
      timeout: 60_000
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const isLockTimeout = stderr.includes("P1002") || stderr.includes("advisory lock");
      const err = new Error(`prisma migrate deploy exited with code ${code ?? 1}`);
      err.isLockTimeout = isLockTimeout;
      reject(err);
    });
  });
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

  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 5_000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`Running Prisma migrations... (attempt ${attempt}/${MAX_ATTEMPTS})`);

    try {
      await runMigrate();
      console.log("Migrations applied successfully.");
      return;
    } catch (error) {
      const isLast = attempt === MAX_ATTEMPTS;
      const isRetryable = error.isLockTimeout;

      if (!isRetryable || isLast) {
        console.error(
          `[prisma-migrate-deploy] migration failed: ${error instanceof Error ? error.message : "unknown_error"}`
        );
        console.warn("WARNING: migrations could not run, manual check required");
        process.exit(0);
      }

      console.warn(`Advisory lock timeout on attempt ${attempt}, retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

run();
