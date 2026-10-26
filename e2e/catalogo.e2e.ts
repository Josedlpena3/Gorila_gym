import { expect, test } from "@playwright/test";
import { E2E } from "./seed";

test.describe("catálogo", () => {
  test("muestra los productos sembrados con su precio", async ({ page }) => {
    await page.goto("/catalogo");

    await expect(
      page.getByRole("heading", { name: E2E.productos.whey.name })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: E2E.productos.creatina.name })
    ).toBeVisible();

    // El precio se muestra formateado en pesos: 75000 -> 75.000
    await expect(page.getByText("75.000").first()).toBeVisible();
  });

  test("marca como sin stock el producto agotado", async ({ page }) => {
    await page.goto("/catalogo");

    const tarjeta = page
      .locator("article")
      .filter({ hasText: E2E.productos.agotado.name });

    await expect(tarjeta.getByText(/sin stock/i)).toBeVisible();
  });

  test("buscar filtra la grilla", async ({ page }) => {
    await page.goto("/catalogo");

    await page.getByRole("searchbox", { name: /buscar productos/i }).fill("creatina");
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("heading", { name: E2E.productos.creatina.name })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: E2E.productos.whey.name })
    ).toHaveCount(0);
  });

  test("abrir un producto lleva a su ficha con el precio y el botón de compra", async ({
    page
  }) => {
    await page.goto("/catalogo");

    await page
      .getByRole("heading", { name: E2E.productos.whey.name })
      .getByRole("link")
      .click();

    await expect(page).toHaveURL(new RegExp(E2E.productos.whey.slug));
    await expect(
      page.getByRole("heading", { level: 1, name: E2E.productos.whey.name })
    ).toBeVisible();
    await expect(page.getByText("75.000").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /agregar al carrito/i }).first()
    ).toBeVisible();
  });

  test("una ficha inexistente muestra la página de no encontrado y no se indexa", async ({
    page
  }) => {
    await page.goto("/productos/no-existe-este-producto");

    await expect(page.getByText(/no existe/i).first()).toBeVisible();

    // Bajo ISR en ruta dinámica, Next sirve `notFound()` con status 200 en vez
    // de 404. Forzar el 404 exigiría `dynamicParams: false`, que dejaría
    // inaccesible todo producto creado después del deploy. El daño real —que
    // el buscador indexe fichas que no existen— se corta con noindex, y es eso
    // lo que se verifica.
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      /noindex/
    );
  });
});
