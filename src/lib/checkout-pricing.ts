import { PaymentMethod } from "@prisma/client";

export const CARD_SURCHARGE_RATE = 0.1;

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function applyPaymentSurcharge(total: number, paymentMethod: PaymentMethod) {
  if (paymentMethod !== PaymentMethod.CARD) {
    return roundCurrency(total);
  }

  return roundCurrency(total * (1 + CARD_SURCHARGE_RATE));
}

export function getPaymentSurchargeAmount(total: number, paymentMethod: PaymentMethod) {
  return roundCurrency(applyPaymentSurcharge(total, paymentMethod) - roundCurrency(total));
}
