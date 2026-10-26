import { seedE2E } from "./seed";

/**
 * Corre una vez antes de toda la suite: deja la base de E2E con el mismo
 * catálogo de siempre. Los tests pueden entonces afirmar sobre nombres y
 * precios concretos.
 */
export default async function globalSetup() {
  process.env.DATABASE_URL =
    process.env.E2E_DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/gorila_strong_e2e";

  await seedE2E();
}
