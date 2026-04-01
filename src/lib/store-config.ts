import { DeliveryMethod, PaymentMethod } from "@prisma/client";
import { env } from "@/lib/env";

export type AddressSnapshot = {
  recipientName: string;
  street: string;
  number: string;
  floor: string | null;
  apartment: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

export type BankTransferConfig = {
  alias: string;
  cbu: string;
  accountHolder: string;
  bankName: string | null;
  instructions: string | null;
};

function hasValues(values: string[]) {
  return values.every((value) => value.trim().length > 0);
}

export function getStorePickupAddress(): AddressSnapshot | null {
  if (
    !hasValues([
      env.storePickupRecipientName,
      env.storePickupStreet,
      env.storePickupNumber,
      env.storePickupCity,
      env.storePickupProvince,
      env.storePickupPostalCode
    ])
  ) {
    return null;
  }

  return {
    recipientName: env.storePickupRecipientName,
    street: env.storePickupStreet,
    number: env.storePickupNumber,
    floor: env.storePickupFloor || null,
    apartment: env.storePickupApartment || null,
    city: env.storePickupCity,
    province: env.storePickupProvince,
    postalCode: env.storePickupPostalCode,
    country: env.storePickupCountry
  };
}

export function getBankTransferConfig(): BankTransferConfig | null {
  if (
    !hasValues([
      env.bankTransferAlias,
      env.bankTransferCbu,
      env.bankTransferAccountHolder
    ])
  ) {
    return null;
  }

  return {
    alias: env.bankTransferAlias,
    cbu: env.bankTransferCbu,
    accountHolder: env.bankTransferAccountHolder,
    bankName: env.bankTransferBankName || null,
    instructions: env.bankTransferInstructions || null
  };
}

export function isMercadoPagoConfigured() {
  return Boolean(
    env.appUrl &&
      env.mercadoPagoAccessToken &&
      env.mercadoPagoWebhookSecret
  );
}

export function getShippingCost() {
  return env.defaultShippingCost;
}

export function getReservationWindowMinutes(paymentMethod: PaymentMethod) {
  if (paymentMethod === PaymentMethod.MERCADO_PAGO) {
    return env.mercadoPagoReservationMinutes;
  }

  return env.offlinePaymentReservationMinutes;
}

export function getAvailableDeliveryMethods() {
  const shipmentAvailable = env.defaultShippingCost !== null;
  const pickupAvailable = getStorePickupAddress() !== null;
  const methods: DeliveryMethod[] = [];

  if (shipmentAvailable) {
    methods.push(DeliveryMethod.SHIPMENT);
  }

  if (pickupAvailable) {
    methods.push(DeliveryMethod.PICKUP);
  }

  return {
    methods,
    shipmentAvailable,
    pickupAvailable,
    pickupAddress: getStorePickupAddress()
  };
}
