import { DeliveryMethod, PaymentMethod } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import type { CartDto } from "@/types";

/**
 * Traducción de los métodos del checkout al payload de la API y armado del
 * mensaje de WhatsApp con el que se cierra el pedido.
 *
 * Vivía dentro de checkout-form.tsx, que tenía 778 líneas y mezclaba el armado
 * del texto con el render del formulario. Es lógica pura, sin React: acá se
 * puede probar el mensaje de cada método de pago sin montar nada.
 */

export type OrderDeliveryMethodPayload = "retiro" | "envio";
export type OrderPaymentMethodPayload = "efectivo" | "transferencia" | "tarjeta";

export type TransferConfig = {
  alias: string;
  cbu: string;
  accountHolder: string;
} | null;

export const STORE_WHATSAPP_NUMBER = "5493512288010";

export function getOrderDeliveryMethodValue(
  deliveryMethod: DeliveryMethod
): OrderDeliveryMethodPayload {
  return deliveryMethod === DeliveryMethod.PICKUP ? "retiro" : "envio";
}

export function getOrderPaymentMethodValue(
  paymentMethod: PaymentMethod
): OrderPaymentMethodPayload {
  if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
    return "transferencia";
  }

  if (paymentMethod === PaymentMethod.CARD) {
    return "tarjeta";
  }

  return "efectivo";
}

export function getPaymentMethodLabel(paymentMethod: PaymentMethod) {
  if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
    return "Transferencia";
  }

  if (paymentMethod === PaymentMethod.CARD) {
    return "Tarjeta";
  }

  return "Efectivo";
}

export function buildCheckoutWhatsappMessage(input: {
  customerName: string;
  phone: string;
  orderCode: string;
  items: CartDto["items"];
  total: number;
  discountApplied: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  transferConfig: TransferConfig;
}) {
  const products = input.items.map((item) => `- ${item.name} x${item.quantity}`).join("\n");
  const deliveryLabel =
    input.deliveryMethod === DeliveryMethod.PICKUP
      ? "Retiro en el local"
      : "Envío a domicilio";
  const transferDetails = input.transferConfig ?? {
    alias: "josedlp3",
    cbu: "0000003100097110373230",
    accountHolder: "Jose Ignacio de la Peña"
  };
  const baseMessage = [
    `Hola, soy ${input.customerName}.`,
    "",
    `Te contacto por mi pedido #${input.orderCode}.`,
    "",
    "Productos:",
    products,
    "",
    `Total: ${formatCurrency(input.total)}`,
    ...(input.discountApplied ? [`Descuento aplicado: ${input.discountApplied}`] : []),
    `Teléfono: ${input.phone}`,
    `Forma de entrega: ${deliveryLabel}`
  ];

  if (input.paymentMethod === PaymentMethod.BANK_TRANSFER) {
    return [
      ...baseMessage,
      "",
      "Elegiste la opción: Transferencia",
      "",
      "Datos bancarios:",
      `Alias: ${transferDetails.alias}`,
      `CVU: ${transferDetails.cbu}`,
      `Nombre: ${transferDetails.accountHolder}`,
      "",
      "Mandanos el comprobante para confirmar tu pedido."
    ].join("\n");
  }

  if (input.paymentMethod === PaymentMethod.CARD) {
    return [
      ...baseMessage,
      "",
      "Elegiste la opción: Tarjeta"
    ].join("\n");
  }

  return [
    ...baseMessage,
    "",
    "Elegiste la opción: Efectivo"
  ].join("\n");
}
