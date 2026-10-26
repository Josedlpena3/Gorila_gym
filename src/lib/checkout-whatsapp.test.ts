import { DeliveryMethod, PaymentMethod } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildCheckoutWhatsappMessage,
  getOrderDeliveryMethodValue,
  getOrderPaymentMethodValue,
  getPaymentMethodLabel
} from "@/lib/checkout-whatsapp";

/**
 * Este mensaje es el pedido: no hay panel que el cliente mire después, lo que
 * llega por WhatsApp es el comprobante de los dos lados. Si falta un producto,
 * el total o los datos bancarios, se pierde una venta o se cobra de menos.
 */
const BASE = {
  customerName: "Luciano",
  phone: "5493515550000",
  orderCode: "GS-123456789",
  items: [
    { name: "Creatina Fruit Punch", quantity: 2 },
    { name: "Whey Protein Vainilla", quantity: 1 }
  ],
  total: 135000,
  discountApplied: null,
  deliveryMethod: DeliveryMethod.PICKUP,
  paymentMethod: PaymentMethod.CASH,
  transferConfig: null
} as unknown as Parameters<typeof buildCheckoutWhatsappMessage>[0];

describe("buildCheckoutWhatsappMessage", () => {
  it("incluye el código del pedido, todos los productos con su cantidad y el total", () => {
    const mensaje = buildCheckoutWhatsappMessage(BASE);

    expect(mensaje).toContain("GS-123456789");
    expect(mensaje).toContain("- Creatina Fruit Punch x2");
    expect(mensaje).toContain("- Whey Protein Vainilla x1");
    expect(mensaje).toContain("135.000");
    expect(mensaje).toContain("Luciano");
  });

  it("distingue retiro de envío", () => {
    expect(buildCheckoutWhatsappMessage(BASE)).toContain("Retiro en el local");
    expect(
      buildCheckoutWhatsappMessage({
        ...BASE,
        deliveryMethod: DeliveryMethod.SHIPMENT
      })
    ).toContain("Envío a domicilio");
  });

  it("en efectivo recuerda el 10%, que se aplica a mano al cobrar", () => {
    const mensaje = buildCheckoutWhatsappMessage(BASE);

    expect(mensaje).toContain("Elegiste la opción: Efectivo");
    expect(mensaje).toContain("10% OFF");
  });

  it("en transferencia manda los datos bancarios configurados", () => {
    const mensaje = buildCheckoutWhatsappMessage({
      ...BASE,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      transferConfig: {
        alias: "mi.alias.test",
        cbu: "1234567890123456789012",
        accountHolder: "Nombre Apellido"
      }
    });

    expect(mensaje).toContain("Elegiste la opción: Transferencia");
    expect(mensaje).toContain("mi.alias.test");
    expect(mensaje).toContain("1234567890123456789012");
    expect(mensaje).toContain("Nombre Apellido");
    expect(mensaje).toContain("comprobante");
    // El recordatorio de efectivo no corresponde acá.
    expect(mensaje).not.toContain("10% OFF");
  });

  it("con tarjeta no filtra datos bancarios", () => {
    const mensaje = buildCheckoutWhatsappMessage({
      ...BASE,
      paymentMethod: PaymentMethod.CARD
    });

    expect(mensaje).toContain("Elegiste la opción: Tarjeta");
    expect(mensaje).not.toContain("Alias:");
    expect(mensaje).not.toContain("CVU:");
  });

  it("solo menciona el descuento cuando efectivamente se aplicó uno", () => {
    expect(buildCheckoutWhatsappMessage(BASE)).not.toContain("Descuento aplicado");
    expect(
      buildCheckoutWhatsappMessage({ ...BASE, discountApplied: "10% OFF" })
    ).toContain("Descuento aplicado: 10% OFF");
  });
});

describe("traducción de métodos al payload de la API", () => {
  it("mapea la entrega", () => {
    expect(getOrderDeliveryMethodValue(DeliveryMethod.PICKUP)).toBe("retiro");
    expect(getOrderDeliveryMethodValue(DeliveryMethod.SHIPMENT)).toBe("envio");
  });

  it("mapea el pago", () => {
    expect(getOrderPaymentMethodValue(PaymentMethod.CASH)).toBe("efectivo");
    expect(getOrderPaymentMethodValue(PaymentMethod.BANK_TRANSFER)).toBe("transferencia");
    expect(getOrderPaymentMethodValue(PaymentMethod.CARD)).toBe("tarjeta");
  });

  it("etiqueta el pago para mostrar", () => {
    expect(getPaymentMethodLabel(PaymentMethod.CASH)).toBe("Efectivo");
    expect(getPaymentMethodLabel(PaymentMethod.BANK_TRANSFER)).toBe("Transferencia");
    expect(getPaymentMethodLabel(PaymentMethod.CARD)).toBe("Tarjeta");
  });
});
