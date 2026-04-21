import { DeliveryMethod } from "@prisma/client";

export type CheckoutDiscountResult = {
  discountCode: string | null;
  discountApplied: string | null;
  discountAmount: number;
  total: number;
  invalid: boolean;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function applyCheckoutDiscount(
  code: string | null | undefined,
  total: number,
  deliveryMethod: DeliveryMethod
): CheckoutDiscountResult {
  const normalized = code?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return {
      discountCode: null,
      discountApplied: null,
      discountAmount: 0,
      total,
      invalid: false
    };
  }

  if (normalized === "gorillastrong") {
    const finalTotal = roundCurrency(total * 0.9);

    return {
      discountCode: normalized,
      discountApplied: "10% OFF",
      discountAmount: roundCurrency(total - finalTotal),
      total: finalTotal,
      invalid: false
    };
  }

  if (
    normalized === "joaco_battiston" &&
    deliveryMethod === DeliveryMethod.SHIPMENT
  ) {
    return {
      discountCode: normalized,
      discountApplied: "Envío gratis",
      discountAmount: 0,
      total,
      invalid: false
    };
  }

  return {
    discountCode: normalized,
    discountApplied: null,
    discountAmount: 0,
    total,
    invalid: true
  };
}
