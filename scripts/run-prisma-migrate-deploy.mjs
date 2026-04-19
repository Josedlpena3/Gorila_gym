import { spawn } from "node:child_process";

function resolveNpxCommand() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

async function run() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is not configured.");
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
