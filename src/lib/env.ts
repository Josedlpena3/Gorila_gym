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

function normalizeUrl(value?: string) {
  const trimmed = value?.trim() ?? "";

  if (trimmed.length === 0) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

function readAppUrl() {
  return (
    normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeUrl(process.env.VERCEL_URL)
  );
}

export const env = {
  nodeEnv: readText(process.env.NODE_ENV, "development"),
  databaseUrl: readText(process.env.DATABASE_URL),
  appUrl: readAppUrl(),
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
  bankTransferAlias: readText(process.env.BANK_TRANSFER_ALIAS),
  bankTransferCbu: readText(process.env.BANK_TRANSFER_CBU),
  bankTransferAccountHolder: readText(process.env.BANK_TRANSFER_ACCOUNT_HOLDER),
  bankTransferBankName: readText(process.env.BANK_TRANSFER_BANK_NAME),
  bankTransferInstructions: readText(process.env.BANK_TRANSFER_INSTRUCTIONS),
  orderNotificationEmails: readCsv(
    process.env.ORDER_NOTIFICATION_EMAILS ||
      process.env.MAIL_FROM_ADDRESS ||
      process.env.EMAIL_USER ||
      process.env.SMTP_USER
  ),
  mailFromName: readText(process.env.MAIL_FROM_NAME),
  mailFromAddress: readText(
    process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_USER || process.env.SMTP_USER
  ),
  emailHost: readText(process.env.EMAIL_HOST || process.env.SMTP_HOST),
  emailPort: readNumber(process.env.EMAIL_PORT || process.env.SMTP_PORT) ?? 465,
  emailUser: readText(process.env.EMAIL_USER || process.env.SMTP_USER),
  emailPass: readText(process.env.EMAIL_PASS || process.env.SMTP_PASSWORD),
  emailSecure:
    (process.env.EMAIL_SECURE || process.env.SMTP_SECURE)?.trim().toLowerCase() ===
      "true" ||
    process.env.EMAIL_SECURE === "1" ||
    process.env.SMTP_SECURE === "1" ||
    (readNumber(process.env.EMAIL_PORT) ?? 465) === 465,
  allowedImageHosts: readCsv(process.env.NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS)
};
