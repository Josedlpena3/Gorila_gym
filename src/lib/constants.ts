export const AUTH_COOKIE_NAME = "gorila_strong_session";

export const OBJECTIVE_LABELS: Record<string, string> = {
  MUSCLE_GAIN: "Volumen muscular",
  RECOVERY: "Recuperación",
  WEIGHT_LOSS: "Definición",
  PERFORMANCE: "Rendimiento y fuerza",
  WELLNESS: "Salud y bienestar"
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

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente de pago",
  UNDER_REVIEW: "Pendiente de verificación",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELED: "Cancelado"
};

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  SHIPMENT: "Envío",
  PICKUP: "Retiro"
};
