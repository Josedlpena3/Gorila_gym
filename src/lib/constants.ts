export const AUTH_COOKIE_NAME = "gorila_strong_session";

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  PROTEIN: "Proteína",
  PRE_WORKOUT: "Pre entreno",
  CREATINE: "Creatina",
  AMINO_ACIDS: "Aminoácidos",
  VITAMINS: "Vitaminas",
  ACCESSORY: "Accesorio",
  GAINER: "Mass gainer",
  FAT_BURNER: "Fat burner"
};

export const OBJECTIVE_LABELS: Record<string, string> = {
  MUSCLE_GAIN: "Ganancia muscular",
  RECOVERY: "Recuperación",
  WEIGHT_LOSS: "Pérdida de peso",
  PERFORMANCE: "Performance",
  WELLNESS: "Bienestar"
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PENDING_VERIFICATION: "Pendiente de verificación",
  PAID: "Pagado",
  PREPARING: "Preparando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELED: "Cancelado"
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  MERCADO_PAGO: "Mercado Pago",
  BANK_TRANSFER: "Transferencia",
  CASH: "Efectivo"
};

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  SHIPMENT: "Envío",
  PICKUP: "Retiro"
};
