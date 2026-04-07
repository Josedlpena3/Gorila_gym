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

function readText(value: string | undefined, fallback = "") {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : fallback;
}

export const env = {
  nodeEnv: readText(process.env.NODE_ENV, "development"),
  appUrl: readText(process.env.NEXT_PUBLIC_APP_URL),
  jwtSecret: readText(process.env.JWT_SECRET),
  jwtExpiresIn: readText(process.env.JWT_EXPIRES_IN, "7d"),
  mercadoPagoAccessToken: readText(process.env.MERCADO_PAGO_ACCESS_TOKEN),
  mercadoPagoPublicKey: readText(process.env.MERCADO_PAGO_PUBLIC_KEY),
  mercadoPagoWebhookSecret: readText(process.env.MERCADO_PAGO_WEBHOOK_SECRET),
  cronSecret: readText(process.env.CRON_SECRET),
  defaultShippingCost: readNumber(process.env.DEFAULT_SHIPPING_COST),
  mercadoPagoReservationMinutes: readNumber(process.env.MERCADO_PAGO_RESERVATION_MINUTES),
  offlinePaymentReservationMinutes: readNumber(
    process.env.OFFLINE_PAYMENT_RESERVATION_MINUTES
  ),
  storePickupRecipientName: readText(process.env.STORE_PICKUP_RECIPIENT_NAME),
  storePickupStreet: readText(process.env.STORE_PICKUP_STREET),
  storePickupNumber: readText(process.env.STORE_PICKUP_NUMBER),
  storePickupFloor: readText(process.env.STORE_PICKUP_FLOOR),
  storePickupApartment: readText(process.env.STORE_PICKUP_APARTMENT),
  storePickupCity: readText(process.env.STORE_PICKUP_CITY),
  storePickupProvince: readText(process.env.STORE_PICKUP_PROVINCE),
  storePickupPostalCode: readText(process.env.STORE_PICKUP_POSTAL_CODE),
  storePickupCountry: readText(process.env.STORE_PICKUP_COUNTRY, "Argentina"),
  bankTransferAlias: readText(process.env.BANK_TRANSFER_ALIAS, "josedlp3"),
  bankTransferCbu: readText(
    process.env.BANK_TRANSFER_CBU,
    "0000003100097110373230"
  ),
  bankTransferAccountHolder: readText(
    process.env.BANK_TRANSFER_ACCOUNT_HOLDER,
    "Jose Ignacio de la Peña"
  ),
  bankTransferBankName: readText(process.env.BANK_TRANSFER_BANK_NAME),
  bankTransferInstructions: readText(process.env.BANK_TRANSFER_INSTRUCTIONS),
  notificationProvider: readText(process.env.NOTIFICATION_PROVIDER),
  mailFromName: readText(process.env.MAIL_FROM_NAME),
  mailFromAddress: readText(process.env.MAIL_FROM_ADDRESS),
  smtpHost: readText(process.env.SMTP_HOST),
  smtpPort: readNumber(process.env.SMTP_PORT),
  smtpUser: readText(process.env.SMTP_USER),
  smtpPassword: readText(process.env.SMTP_PASSWORD),
  smtpSecure:
    process.env.SMTP_SECURE?.trim().toLowerCase() === "true" ||
    process.env.SMTP_SECURE === "1",
  allowedImageHosts: readCsv(process.env.NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS)
};
