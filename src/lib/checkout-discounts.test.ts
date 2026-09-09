import { DeliveryMethod } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { applyCheckoutDiscount } from "@/lib/checkout-discounts";

describe("applyCheckoutDiscount", () => {
  it("sin código devuelve el total intacto", () => {
    const result = applyCheckoutDiscount(null, 10000, DeliveryMethod.SHIPMENT);

    expect(result).toEqual({
      discountCode: null,
      discountApplied: null,
      discountAmount: 0,
      total: 10000,
      invalid: false
    });
  });

  it("gorillastrong aplica exactamente 10%", () => {
    const result = applyCheckoutDiscount(
      "gorillastrong",
      10000,
      DeliveryMethod.SHIPMENT
    );

    expect(result.total).toBe(9000);
    expect(result.discountAmount).toBe(1000);
    expect(result.invalid).toBe(false);
  });

  it("el código no distingue mayúsculas ni espacios", () => {
    const result = applyCheckoutDiscount(
      "  GorillaStrong  ",
      10000,
      DeliveryMethod.SHIPMENT
    );

    expect(result.total).toBe(9000);
  });

  it("joaco_battiston solo vale con envío, no con retiro", () => {
    const conEnvio = applyCheckoutDiscount(
      "joaco_battiston",
      10000,
      DeliveryMethod.SHIPMENT
    );
    const conRetiro = applyCheckoutDiscount(
      "joaco_battiston",
      10000,
      DeliveryMethod.PICKUP
    );

    expect(conEnvio.invalid).toBe(false);
    expect(conEnvio.discountApplied).toBe("Envío gratis");
    // Con retiro no hay costo de envío que descontar: el código no aplica y se
    // marca inválido en vez de silenciarse, para que el checkout avise.
    expect(conRetiro.invalid).toBe(true);
  });

  it("un código inexistente se marca inválido y no toca el total", () => {
    const result = applyCheckoutDiscount(
      "no-existe-2024",
      10000,
      DeliveryMethod.SHIPMENT
    );

    expect(result.invalid).toBe(true);
    expect(result.total).toBe(10000);
    expect(result.discountAmount).toBe(0);
  });

  it("redondea a centavos sin arrastrar error de punto flotante", () => {
    // 33.33 * 0.9 en punto flotante da 29.997000000000004: sin el redondeo, un
    // total con centavos quedaría con un tercer decimal que no existe en
    // dinero real.
    const result = applyCheckoutDiscount(
      "gorillastrong",
      33.33,
      DeliveryMethod.SHIPMENT
    );

    expect(result.total).toBe(30);
    expect(Number.isInteger(result.total * 100)).toBe(true);
  });

  it("nunca deja el total en negativo o en cero para un total positivo", () => {
    const result = applyCheckoutDiscount(
      "gorillastrong",
      1,
      DeliveryMethod.SHIPMENT
    );

    expect(result.total).toBeGreaterThan(0);
  });
});
