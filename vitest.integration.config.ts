import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    // Comparten la conexión a Postgres: en secuencia se evita pisarse el
    // stock entre tests que corren en paralelo sobre la misma base.
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 15_000
  }
});
