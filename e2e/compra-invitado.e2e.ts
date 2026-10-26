import { expect, test } from "@playwright/test";
import { agregarAlCarrito, irAlCheckout } from "./helpers";
import { E2E } from "./seed";

/**
 * El recorrido que genera la plata: alguien sin cuenta entra, agrega al
 * carrito y llega al checkout. Es el único camino que ninguna otra capa de
 * tests puede ejercitar completo, porque el carrito de invitado vive en
 * localStorage del navegador.
 */
test.describe("compra como invitado", () => {
  test("agregar al carrito lleva al carrito con el producto adentro", async ({
    page
  }) => {
    await page.goto("/catalogo");

    const tarjeta = page
      .locator("article")
      .filter({ hasText: E2E.productos.whey.name });

    await tarjeta.getByRole("button", { name: /agregar al carrito/i }).click();

    await expect(page).toHaveURL(/\/carrito/);
    await expect(page.getByText(E2E.productos.whey.name).first()).toBeVisible();
  });

  test("el carrito calcula el subtotal al cambiar la cantidad", async ({ page }) => {
    await page.goto("/catalogo");
    await page
      .locator("article")
      .filter({ hasText: E2E.productos.creatina.name })
      .getByRole("button", { name: /agregar al carrito/i })
      .click();

    await expect(page).toHaveURL(/\/carrito/);

    // 30.000 de una unidad
    await expect(page.getByText("30.000").first()).toBeVisible();

    await page.getByRole("button", { name: /aumentar cantidad/i }).first().click();

    // 60.000 con dos
    await expect(page.getByText("60.000").first()).toBeVisible();
  });

  test("el carrito sobrevive una recarga de página", async ({ page }) => {
    await page.goto("/catalogo");
    await page
      .locator("article")
      .filter({ hasText: E2E.productos.whey.name })
      .getByRole("button", { name: /agregar al carrito/i })
      .click();

    await expect(page).toHaveURL(/\/carrito/);
    await page.reload();

    await expect(page.getByText(E2E.productos.whey.name).first()).toBeVisible();
  });

  test("quitar el último producto deja el carrito vacío", async ({ page }) => {
    await page.goto("/catalogo");
    await page
      .locator("article")
      .filter({ hasText: E2E.productos.whey.name })
      .getByRole("button", { name: /agregar al carrito/i })
      .click();

    await expect(page).toHaveURL(/\/carrito/);
    await page.getByRole("button", { name: /quitar/i }).first().click();

    await expect(page.getByText(/carrito está vacío/i)).toBeVisible();
  });

  test("desde el carrito se llega al checkout con el total y las formas de pago", async ({
    page
  }) => {
    await page.goto("/catalogo");
    await page
      .locator("article")
      .filter({ hasText: E2E.productos.creatina.name })
      .getByRole("button", { name: /agregar al carrito/i })
      .click();

    await expect(page).toHaveURL(/\/carrito/);
    await irAlCheckout(page);

    await expect(page.getByText("Forma de pago", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^efectivo$/i })).toBeVisible();
    await expect(page.getByText("30.000").first()).toBeVisible();
  });

  test("el checkout avisa que el 10% en efectivo se hace al cobrar", async ({
    page
  }) => {
    await page.goto("/catalogo");
    await page
      .locator("article")
      .filter({ hasText: E2E.productos.creatina.name })
      .getByRole("button", { name: /agregar al carrito/i })
      .click();
    await irAlCheckout(page);

    // Efectivo viene seleccionado por defecto: sin esta aclaración el cliente
    // ve el total completo y cree que no se lo hicieron.
    await expect(page.getByText(/10% OFF pagando en efectivo/i)).toBeVisible();

    await page.getByRole("button", { name: /transferencia/i }).click();
    await expect(page.getByText(/10% OFF pagando en efectivo/i)).toHaveCount(0);
  });

  test("un producto sin stock no se puede agregar", async ({ page }) => {
    await page.goto("/catalogo");

    const agotado = page
      .locator("article")
      .filter({ hasText: E2E.productos.agotado.name });

    await expect(
      agotado.getByRole("button", { name: /agregar al carrito/i })
    ).toBeDisabled();
  });
});
