import { expect, test, type Page } from "@playwright/test";
import { ESTADO_ADMIN } from "./helpers";
import { E2E } from "./seed";

/**
 * El bug reportado: en el panel se elegía otra categoría y no se guardaba.
 * Era de estado en el cliente —un efecto pisaba la elección apenas el usuario
 * la hacía—, así que ninguna capa de tests que no abra un navegador lo podía
 * detectar. Esto sí.
 */

/** Abre la ficha de edición del producto cuyo nombre se pasa. */
async function editarProducto(page: Page, nombre: string) {
  await page.goto("/admin/productos");

  await page
    .locator("article")
    .filter({ hasText: nombre })
    .getByRole("link", { name: /editar/i })
    .click();

  await expect(page).toHaveURL(/\/admin\/productos\/[^/]+$/, { timeout: 20_000 });
}

const selectCategoria = (page: Page) =>
  page.getByLabel("Categoría", { exact: true });

async function guardar(page: Page) {
  await page.getByRole("button", { name: /guardar producto/i }).click();
  await expect(page).toHaveURL(/\/admin\/productos\/?$/, { timeout: 20_000 });
}

test.describe("panel: editar producto", () => {
  // Sesión tomada del setup, no un login por test.
  test.use({ storageState: ESTADO_ADMIN });

  test("elegir otra categoría no se revierte sola", async ({ page }) => {
    await editarProducto(page, E2E.productos.editable.name);

    const select = selectCategoria(page);
    await expect(select).toBeVisible();

    await select.selectOption({ label: E2E.categorias.creatinas.name });

    // Acá estaba el bug: el efecto volvía a escribir la categoría original y
    // el select saltaba de vuelta a Proteínas.
    await expect(select.locator("option:checked")).toHaveText(
      E2E.categorias.creatinas.name
    );
  });

  test("la categoría nueva queda guardada", async ({ page }) => {
    await editarProducto(page, E2E.productos.editable.name);
    await selectCategoria(page).selectOption({
      label: E2E.categorias.creatinas.name
    });
    await guardar(page);

    // Al reabrir la ficha tiene que seguir en la categoría nueva.
    await editarProducto(page, E2E.productos.editable.name);
    await expect(selectCategoria(page).locator("option:checked")).toHaveText(
      E2E.categorias.creatinas.name
    );
  });

  test("el cambio de categoría se ve en la tienda", async ({ page }) => {
    await editarProducto(page, E2E.productos.editableDos.name);
    await selectCategoria(page).selectOption({
      label: E2E.categorias.proteinas.name
    });
    await guardar(page);

    await page.goto(`/productos/${E2E.productos.editableDos.slug}`);
    await expect(
      page.getByText(E2E.categorias.proteinas.name).first()
    ).toBeVisible();
  });

  test("editar el precio lo guarda y se ve en la ficha pública", async ({
    page
  }) => {
    await editarProducto(page, E2E.productos.editableDos.name);

    await page.getByLabel("Precio", { exact: true }).fill("31500");
    await guardar(page);

    await page.goto(`/productos/${E2E.productos.editableDos.slug}`);
    await expect(page.getByText("31.500").first()).toBeVisible();
  });

  test("editar el stock lo guarda", async ({ page }) => {
    await editarProducto(page, E2E.productos.editable.name);

    await page.getByLabel("Stock", { exact: true }).fill("3");
    await guardar(page);

    await editarProducto(page, E2E.productos.editable.name);
    await expect(page.getByLabel("Stock", { exact: true })).toHaveValue("3");
  });
});

test.describe("panel: acceso", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("un visitante sin sesión no entra al panel", async ({ page }) => {
    await page.goto("/admin/productos");

    // El middleware lo manda al login.
    await expect(page).toHaveURL(/\/login/);
  });
});
