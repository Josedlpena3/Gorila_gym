import { PaymentMethod } from "@prisma/client";

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function applyPaymentSurcharge(total: number, _paymentMethod: PaymentMethod) {
  return roundCurrency(total);
}

export function getPaymentSurchargeAmount(
  _total: number,
  _paymentMethod: PaymentMethod
) {
  return 0;
}
