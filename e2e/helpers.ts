import { expect, type Page } from "@playwright/test";
import { E2E } from "./seed";

/** Cookie de administrador que guarda auth.setup.ts y reutilizan los tests. */
export const ESTADO_ADMIN = "e2e/.auth/admin.json";

/**
 * Inicia sesión por la interfaz real, no inyectando una cookie: así el test
 * también cubre que el formulario de login siga funcionando.
 *
 * El campo de contraseña se busca por `name` y no por etiqueta: el botón de
 * mostrar/ocultar lleva `aria-label="Mostrar contraseña"`, así que
 * `getByLabel(/contraseña/i)` encuentra dos elementos.
 */
export async function iniciarSesion(
  page: Page,
  credenciales: { email: string; password: string }
) {
  await page.goto("/login");

  // Todo acotado al formulario: el header también tiene un "Ingresar" y el
  // campo de contraseña convive con el botón de mostrar/ocultar, que lleva
  // "contraseña" en su aria-label.
  const formulario = page.locator("form").first();

  await formulario.locator('input[name="email"]').fill(credenciales.email);
  await formulario.locator('input[name="password"]').fill(credenciales.password);
  await formulario.getByRole("button", { name: /^ingresar$/i }).click();

  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

export const entrarComoAdmin = (page: Page) => iniciarSesion(page, E2E.admin);
export const entrarComoCliente = (page: Page) => iniciarSesion(page, E2E.cliente);

/** Agrega un producto del catálogo al carrito y espera a estar en /carrito. */
export async function agregarAlCarrito(page: Page, nombreProducto: string) {
  await page.goto("/catalogo");

  await page
    .locator("article")
    .filter({ hasText: nombreProducto })
    .getByRole("button", { name: /agregar al carrito/i })
    .click();

  await expect(page).toHaveURL(/\/carrito/, { timeout: 20_000 });
}

/**
 * Pasa del carrito al checkout. El enlace dice "Continuar con el pedido"; hay
 * que pedirlo completo porque "Mis pedidos" del menú también contiene
 * "pedido".
 */
export async function irAlCheckout(page: Page) {
  await page.getByRole("link", { name: /continuar con el pedido/i }).click();
  await expect(page).toHaveURL(/\/checkout/, { timeout: 20_000 });
}
