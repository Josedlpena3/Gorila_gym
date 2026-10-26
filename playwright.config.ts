import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3210);
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * E2E contra la aplicación real: build de producción, Postgres de verdad y un
 * navegador de verdad.
 *
 * Se usa `next build && next start` y no `next dev` a propósito: las fases de
 * rendimiento dejaron la home y las fichas de producto con ISR, y en modo
 * desarrollo ese comportamiento no existe. Probar sobre `dev` verificaría una
 * aplicación que no es la que se despliega.
 *
 * La base sale de E2E_DATABASE_URL y nunca de DATABASE_URL, para que una
 * corrida distraída no borre datos de desarrollo: el seed limpia antes de
 * sembrar.
 */
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/gorila_strong_e2e";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  testMatch: /.*\.(e2e|setup)\.ts/,
  // El seed deja un catálogo fijo y los tests de admin mutan productos: en
  // paralelo se pisarían entre sí.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "es-AR"
  },

  projects: [
    // Inicia sesión una vez y guarda la cookie: `/api/auth/login` tiene límite
    // de intentos y una sesión por test hacía que la suite se auto-bloqueara.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"]
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"]
    }
  ],

  webServer: {
    command: "npm run build && npm run start -- --port " + PORT,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 480_000,
    env: {
      DATABASE_URL,
      JWT_SECRET: "e2e-secret-no-usar-en-produccion-1234567890",
      NEXT_PUBLIC_APP_URL: BASE_URL,
      NODE_ENV: "production"
    }
  }
});
