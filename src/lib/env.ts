function readNumber(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function readCsv(value?: string) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "",
  jwtSecret: process.env.JWT_SECRET?.trim() ?? "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "7d",
  mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() ?? "",
  mercadoPagoPublicKey: process.env.MERCADO_PAGO_PUBLIC_KEY?.trim() ?? "",
  mercadoPagoWebhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() ?? "",
  cronSecret: process.env.CRON_SECRET?.trim() ?? "",
  defaultShippingCost: readNumber(process.env.DEFAULT_SHIPPING_COST),
  mercadoPagoReservationMinutes: readNumber(process.env.MERCADO_PAGO_RESERVATION_MINUTES),
  offlinePaymentReservationMinutes: readNumber(
    process.env.OFFLINE_PAYMENT_RESERVATION_MINUTES
  ),
  storePickupRecipientName: process.env.STORE_PICKUP_RECIPIENT_NAME?.trim() ?? "",
  storePickupStreet: process.env.STORE_PICKUP_STREET?.trim() ?? "",
  storePickupNumber: process.env.STORE_PICKUP_NUMBER?.trim() ?? "",
  storePickupFloor: process.env.STORE_PICKUP_FLOOR?.trim() ?? "",
  storePickupApartment: process.env.STORE_PICKUP_APARTMENT?.trim() ?? "",
  storePickupCity: process.env.STORE_PICKUP_CITY?.trim() ?? "",
  storePickupProvince: process.env.STORE_PICKUP_PROVINCE?.trim() ?? "",
  storePickupPostalCode: process.env.STORE_PICKUP_POSTAL_CODE?.trim() ?? "",
  storePickupCountry: process.env.STORE_PICKUP_COUNTRY?.trim() || "Argentina",
  bankTransferAlias: process.env.BANK_TRANSFER_ALIAS?.trim() ?? "",
  bankTransferCbu: process.env.BANK_TRANSFER_CBU?.trim() ?? "",
  bankTransferAccountHolder:
    process.env.BANK_TRANSFER_ACCOUNT_HOLDER?.trim() ?? "",
  bankTransferBankName: process.env.BANK_TRANSFER_BANK_NAME?.trim() ?? "",
  bankTransferInstructions:
    process.env.BANK_TRANSFER_INSTRUCTIONS?.trim() ?? "",
  notificationProvider: process.env.NOTIFICATION_PROVIDER?.trim() ?? "",
  mailFromName: process.env.MAIL_FROM_NAME?.trim() ?? "",
  mailFromAddress: process.env.MAIL_FROM_ADDRESS?.trim() ?? "",
  smtpHost: process.env.SMTP_HOST?.trim() ?? "",
  smtpPort: readNumber(process.env.SMTP_PORT),
  smtpUser: process.env.SMTP_USER?.trim() ?? "",
  smtpPassword: process.env.SMTP_PASSWORD?.trim() ?? "",
  smtpSecure:
    process.env.SMTP_SECURE?.trim().toLowerCase() === "true" ||
    process.env.SMTP_SECURE === "1",
  allowedImageHosts: readCsv(process.env.NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS)
};
