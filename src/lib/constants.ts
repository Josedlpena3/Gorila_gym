import { OrderStatus } from "@prisma/client";

export const AUTH_COOKIE_NAME = "gorila_strong_session";

export const OBJECTIVE_LABELS: Record<string, string> = {
  MUSCLE_GAIN: "Volumen muscular",
  RECOVERY: "Recuperación",
  WEIGHT_LOSS: "Definición",
  PERFORMANCE: "Rendimiento y fuerza",
  WELLNESS: "Salud y bienestar"
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "Pendiente de confirmación",
  CONTACTED: "Nos comunicamos con vos",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado"
};

export const ORDER_STATUS_BADGE_VARIANTS: Record<
  OrderStatus,
  "warning" | "info" | "success" | "danger"
> = {
  PENDING_CONFIRMATION: "warning",
  CONTACTED: "info",
  DELIVERED: "success",
  CANCELLED: "danger"
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
