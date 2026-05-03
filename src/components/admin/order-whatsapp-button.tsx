"use client";

import type { DeliveryMethod, PaymentMethod } from "@prisma/client";
import { MessageCircle } from "lucide-react";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import type { BankTransferDetailsDto } from "@/types";
import { formatCurrency } from "@/lib/utils";

const FALLBACK_TRANSFER_DETAILS = {
  alias: "josedlp3",
  cbu: "0000003100097110373230",
  accountHolder: "Jose Ignacio de la Peña"
} satisfies Pick<BankTransferDetailsDto, "alias" | "cbu" | "accountHolder">;

type OrderWhatsappButtonProps = {
  customerName: string;
  orderCode: string;
  phone?: string | null;
  total: number;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  street?: string | null;
  number?: string | null;
  city?: string | null;
  province?: string | null;
  transfer?: BankTransferDetailsDto | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
};

function buildDeliveryText(input: {
  deliveryMethod: DeliveryMethod;
  street?: string | null;
  number?: string | null;
  city?: string | null;
  province?: string | null;
}) {
  if (input.deliveryMethod === "PICKUP") {
    return "Retiro por el local";
  }

  const address = [input.street, input.number].filter(Boolean).join(" ").trim();
  const location = [address || null, input.city, input.province].filter(Boolean).join(", ");

  return location.length > 0 ? `Envío a ${location}` : "Envío a domicilio";
}

function buildWhatsappMessage(input: {
  customerName: string;
  orderCode: string;
  total: number;
  contactPhone?: string | null;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  street?: string | null;
  number?: string | null;
  city?: string | null;
  province?: string | null;
  transfer?: BankTransferDetailsDto | null;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}) {
  const lines = input.items.map((item) => `* ${item.name} x${item.quantity}`);
  const delivery = buildDeliveryText({
    deliveryMethod: input.deliveryMethod,
    street: input.street,
    number: input.number,
    city: input.city,
    province: input.province
  });

  if (input.paymentMethod === "BANK_TRANSFER") {
    const transfer = input.transfer ?? FALLBACK_TRANSFER_DETAILS;

    return [
      `Hola ${input.customerName}, soy de Gorilla Strong 🦍`,
      "",
      `Te contacto por tu pedido #${input.orderCode}.`,
      "",
      "📦 Productos:",
      ...lines,
      "",
      `💰 Total: ${formatCurrency(input.total)}`,
      input.contactPhone ? `📱 Teléfono: ${input.contactPhone}` : null,
      "",
      "💳 Forma de pago: Transferencia",
      "",
      "🏦 Datos bancarios:",
      `Alias: ${transfer.alias}`,
      `CVU: ${transfer.cbu}`,
      `Nombre: ${transfer.accountHolder}`,
      "",
      `🚚 Entrega: ${delivery}`,
      "",
      "📩 Cuando puedas, envianos el comprobante para confirmar tu pedido."
    ].join("\n");
  }

  if (input.paymentMethod === "CASH") {
    return [
      `Hola ${input.customerName}, soy de Gorilla Strong 🦍`,
      "",
      `Te contacto por tu pedido #${input.orderCode}.`,
      "",
      "📦 Productos:",
      ...lines,
      "",
      `💰 Total: ${formatCurrency(input.total)}`,
      input.contactPhone ? `📱 Teléfono: ${input.contactPhone}` : null,
      "",
      "💵 Forma de pago: Efectivo",
      "",
      `🚚 Entrega: ${delivery}`,
      "",
      "👍 Coordinamos por acá el horario o envío."
    ].join("\n");
  }

  if (input.paymentMethod === "CARD") {
    return [
      `Hola ${input.customerName}, soy de Gorilla Strong 🦍`,
      "",
      `Te contacto por tu pedido #${input.orderCode}.`,
      "",
      "📦 Productos:",
      ...lines,
      "",
      `💰 Total: ${formatCurrency(input.total)}`,
      input.contactPhone ? `📱 Teléfono: ${input.contactPhone}` : null,
      "",
      "💳 Forma de pago: Tarjeta",
      "",
      `🚚 Entrega: ${delivery}`,
      "",
      "👍 Coordinamos por acá el retiro."
    ].join("\n");
  }

  return [
    `Hola ${input.customerName}, soy de Gorilla Strong 🦍`,
    "",
    `Te contacto por tu pedido #${input.orderCode}.`,
    "",
    "📦 Productos:",
    ...lines,
    "",
    `💰 Total: ${formatCurrency(input.total)}`,
    input.contactPhone ? `📱 Teléfono: ${input.contactPhone}` : null,
    "",
    "💳 Forma de pago: Mercado Pago",
    "",
    `🚚 Entrega: ${delivery}`,
    "",
    "👍 Coordinamos por acá el horario o envío."
  ].join("\n");
}

export function OrderWhatsappButton({
  customerName,
  orderCode,
  phone,
  total,
  paymentMethod,
  deliveryMethod,
  street,
  number,
  city,
  province,
  transfer,
  items
}: OrderWhatsappButtonProps) {
  const normalizedPhone =
    phone?.trim() && isValidPhone(phone) ? normalizePhone(phone) : null;
  const whatsappUrl = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
        buildWhatsappMessage({
          customerName,
          orderCode,
          total,
          contactPhone: phone,
          paymentMethod,
          deliveryMethod,
          street,
          number,
          city,
          province,
          transfer,
          items
        })
      )}`
    : null;
  const tooltip = !phone?.trim()
    ? "Sin teléfono"
    : !normalizedPhone
      ? "Número inválido"
      : `Contactar a ${customerName} por WhatsApp`;

  return (
    <button
      type="button"
      title={tooltip}
      disabled={!whatsappUrl}
      onClick={() => {
        if (!whatsappUrl) {
          return;
        }

        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:border-line disabled:bg-white/5 disabled:text-mist"
      aria-label={tooltip}
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp
    </button>
  );
}
