import { test as setup } from "@playwright/test";
import { ESTADO_ADMIN, iniciarSesion } from "./helpers";
import { E2E } from "./seed";

/**
 * Inicia sesión una sola vez y guarda la cookie para que la reutilicen todos
 * los tests del panel.
 *
 * No es solo por velocidad: `/api/auth/login` tiene límite de intentos por IP,
 * y una sesión por test hacía que la suite se auto-bloqueara con "Demasiados
 * intentos, esperá unos minutos". El límite está bien puesto —es la defensa
 * contra fuerza bruta—, lo que estaba mal era el test.
 */
setup("autenticar como administrador", async ({ page }) => {
  await iniciarSesion(page, E2E.admin);
  await page.context().storageState({ path: ESTADO_ADMIN });
});
