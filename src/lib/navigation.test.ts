import { describe, expect, it } from "vitest";
import {
  getFooterNavLinks,
  getVisibleNavLinks,
  NAV_LINKS
} from "@/lib/navigation";

/**
 * La navegación es una sola fuente para el header de escritorio, el menú móvil
 * y el footer. Lo que importa acá es que "Admin" no se filtre a un visitante.
 */
describe("getVisibleNavLinks", () => {
  it("le oculta Admin a quien no es administrador", () => {
    const links = getVisibleNavLinks(false);

    expect(links.some((link) => link.href === "/admin")).toBe(false);
    expect(links.some((link) => link.href === "/catalogo")).toBe(true);
  });

  it("le muestra Admin al administrador", () => {
    expect(getVisibleNavLinks(true).some((link) => link.href === "/admin")).toBe(true);
  });

  it("no pierde ninguna sección de tienda en ninguno de los dos casos", () => {
    const publicas = NAV_LINKS.filter((link) => !link.adminOnly);

    for (const esAdmin of [true, false]) {
      const visibles = getVisibleNavLinks(esAdmin);

      for (const link of publicas) {
        expect(visibles).toContainEqual(link);
      }
    }
  });
});

describe("getFooterNavLinks", () => {
  it("nunca incluye Admin, ni siquiera para un administrador", () => {
    expect(getFooterNavLinks().some((link) => link.href === "/admin")).toBe(false);
  });

  it("respeta hideInFooter", () => {
    for (const link of getFooterNavLinks()) {
      expect(link.hideInFooter).toBeFalsy();
      expect(link.adminOnly).toBeFalsy();
    }
  });

  it("deja al menos el catálogo", () => {
    expect(getFooterNavLinks().some((link) => link.href === "/catalogo")).toBe(true);
  });
});
