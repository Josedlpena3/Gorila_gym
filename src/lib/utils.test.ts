import { describe, expect, it } from "vitest";
import {
  decimalToNumber,
  formatCurrency,
  generateOrderCode,
  isCordobaProvince,
  normalizeText,
  slugify
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formatea en pesos argentinos sin decimales", () => {
    // El separador de miles de es-AR es el punto; se normaliza el espacio
    // porque Intl usa uno no separable entre el símbolo y el número.
    const resultado = formatCurrency(30000).replace(/ /g, " ");

    expect(resultado).toContain("30.000");
    expect(resultado).toContain("$");
    expect(resultado).not.toContain(",00");
  });

  it("redondea en vez de mostrar centavos", () => {
    expect(formatCurrency(16400.49).replace(/ /g, " ")).toContain("16.400");
  });

  it("maneja el cero", () => {
    expect(formatCurrency(0)).toContain("0");
  });
});

describe("normalizeText", () => {
  it("saca tildes y pasa a minúsculas, que es lo que permite buscar sin acentos", () => {
    expect(normalizeText("Proteínas")).toBe("proteinas");
    expect(normalizeText("NUTRICIÓN")).toBe("nutricion");
  });

  it("colapsa espacios repetidos y recorta los extremos", () => {
    expect(normalizeText("  pre   entreno  ")).toBe("pre entreno");
  });
});

describe("slugify", () => {
  it("arma un slug apto para URL", () => {
    expect(slugify("Creatina Fruit Punch")).toBe("creatina-fruit-punch");
    expect(slugify("Proteína Whey 2 lb")).toBe("proteina-whey-2-lb");
  });

  it("no deja guiones sueltos en los bordes", () => {
    expect(slugify("  ¡Oferta!  ")).toBe("oferta");
    expect(slugify("Chocolate / Coffee")).toBe("chocolate-coffee");
  });
});

describe("isCordobaProvince", () => {
  it("reconoce Córdoba escrita de cualquier forma", () => {
    expect(isCordobaProvince("Córdoba")).toBe(true);
    expect(isCordobaProvince("cordoba")).toBe(true);
    expect(isCordobaProvince("CORDOBA")).toBe(true);
  });

  it("rechaza otras provincias y valores vacíos", () => {
    expect(isCordobaProvince("Santa Fe")).toBe(false);
    expect(isCordobaProvince(null)).toBe(false);
    expect(isCordobaProvince(undefined)).toBe(false);
    expect(isCordobaProvince("")).toBe(false);
  });
});

describe("decimalToNumber", () => {
  it("convierte los Decimal de Prisma", () => {
    expect(decimalToNumber({ toNumber: () => 1234.5 })).toBe(1234.5);
  });

  it("acepta números y cadenas tal cual vienen", () => {
    expect(decimalToNumber(99)).toBe(99);
    expect(decimalToNumber("150.25")).toBe(150.25);
  });

  it("devuelve null si no hay valor", () => {
    expect(decimalToNumber(null)).toBeNull();
    expect(decimalToNumber(undefined)).toBeNull();
  });
});

describe("generateOrderCode", () => {
  it("usa el prefijo GS-", () => {
    expect(generateOrderCode()).toMatch(/^GS-\d+$/);
  });

  it("no repite el código en llamadas seguidas", () => {
    const codigos = new Set(Array.from({ length: 50 }, () => generateOrderCode()));

    // Lleva un componente aleatorio además del timestamp: 50 llamadas dentro
    // del mismo milisegundo no deberían colisionar todas.
    expect(codigos.size).toBeGreaterThan(1);
  });
});
