import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Dos proyectos separados:
 *
 *  unit          funciones puras (pricing, descuentos, agrupación). Sin base
 *                de datos, corren en milisegundos y son las que se ejecutan
 *                en cada commit.
 *  integration   contra Postgres real. Ejercitan cart.service y
 *                order.service tal como los llaman las rutas de API: son las
 *                únicas que pueden confirmar que el stock y el precio se
 *                recalculan en el servidor y no se pueden manipular desde el
 *                cliente. Requieren TEST_DATABASE_URL y se excluyen del
 *                comando por defecto para que `npm test` no falle en un
 *                entorno sin Postgres (CI, por ejemplo).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "src/**/*.integration.test.ts"]
  }
});
