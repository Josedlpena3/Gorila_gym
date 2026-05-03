import { type ClassValue, clsx } from "clsx";
import { normalizePhone } from "@/lib/phone";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function generateOrderCode() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 900 + 100);
  return `GS-${timestamp}${random}`;
}

export function isCordobaProvince(value?: string | null) {
  if (!value) {
    return false;
  }

  return normalizeText(value) === "cordoba";
}

export function decimalToNumber(
  value: { toNumber: () => number } | number | string | null | undefined
) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value.toNumber();
}

export function normalizeWhatsappPhone(value?: string | null) {
  const normalized = normalizePhone(value ?? "");
  return normalized || null;
}
