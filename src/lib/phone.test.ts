import { describe, expect, it } from "vitest";
import { extractPhoneDigits, isValidPhone, normalizePhone } from "@/lib/phone";

/**
 * El teléfono normalizado es lo que se usa para armar el link de WhatsApp con
 * el que se cierra cada pedido. Si queda mal, el pedido se registra pero el
 * chat se abre contra un número que no existe.
 */
describe("extractPhoneDigits", () => {
  it("se queda solo con los dígitos", () => {
    expect(extractPhoneDigits("+54 9 351 555-0000")).toBe("5493515550000");
    expect(extractPhoneDigits("(351) 555 0000")).toBe("3515550000");
  });

  it("devuelve cadena vacía si no hay dígitos", () => {
    expect(extractPhoneDigits("sin numero")).toBe("");
  });
});

describe("normalizePhone", () => {
  it("deja intacto un número que ya empieza con 54", () => {
    expect(normalizePhone("5493515550000")).toBe("5493515550000");
  });

  it("antepone 54 a un número que ya trae el 9", () => {
    expect(normalizePhone("93515550000")).toBe("5493515550000");
  });

  it("antepone 549 a un número local", () => {
    expect(normalizePhone("3515550000")).toBe("5493515550000");
  });

  it("normaliza aunque venga con espacios, guiones y paréntesis", () => {
    expect(normalizePhone("(351) 555-0000")).toBe("5493515550000");
  });

  it("devuelve cadena vacía cuando no hay número", () => {
    expect(normalizePhone("")).toBe("");
    expect(normalizePhone("hola")).toBe("");
  });
});

describe("isValidPhone", () => {
  it("acepta desde 8 dígitos", () => {
    expect(isValidPhone("35155500")).toBe(true);
    expect(isValidPhone("+54 9 351 555 0000")).toBe(true);
  });

  it("rechaza números demasiado cortos", () => {
    expect(isValidPhone("3515")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});
