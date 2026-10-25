import { describe, expect, it } from "vitest";
import { resolveDefaultCategoryId } from "@/components/admin/category-selection";

const CATEGORIAS = [
  { id: "cat-proteinas" },
  { id: "cat-creatinas" },
  { id: "cat-barritas" }
];

describe("resolveDefaultCategoryId", () => {
  it("no pisa la categoría que acaba de elegir el administrador", () => {
    // La regresión: al editar un producto de proteínas y pasarlo a creatinas,
    // el efecto re-escribía la original y el cambio se deshacía solo.
    const resultado = resolveDefaultCategoryId({
      selectedCategoryId: "cat-creatinas",
      productCategoryId: "cat-proteinas",
      availableCategories: CATEGORIAS
    });

    expect(resultado).toBeNull();
  });

  it("no toca nada cuando el producto ya trae su categoría", () => {
    expect(
      resolveDefaultCategoryId({
        selectedCategoryId: "cat-proteinas",
        productCategoryId: "cat-proteinas",
        availableCategories: CATEGORIAS
      })
    ).toBeNull();
  });

  it("elige la primera cuando el producto es nuevo y no hay nada seleccionado", () => {
    // Pasa cuando la lista llega por fetch en vez de por prop: al montar no hay
    // categorías, y recién cuando responde la API se puede elegir una.
    expect(
      resolveDefaultCategoryId({
        selectedCategoryId: "",
        productCategoryId: undefined,
        availableCategories: CATEGORIAS
      })
    ).toBe("cat-proteinas");
  });

  it("no elige nada si todavía no llegaron las categorías", () => {
    expect(
      resolveDefaultCategoryId({
        selectedCategoryId: "",
        productCategoryId: undefined,
        availableCategories: []
      })
    ).toBeNull();
  });

  it("respeta la elección del usuario en un producto nuevo", () => {
    expect(
      resolveDefaultCategoryId({
        selectedCategoryId: "cat-barritas",
        productCategoryId: null,
        availableCategories: CATEGORIAS
      })
    ).toBeNull();
  });
});
