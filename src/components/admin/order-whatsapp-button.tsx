"use client";

import { MessageCircle } from "lucide-react";
import { formatCurrency, normalizeWhatsappPhone } from "@/lib/utils";

type OrderWhatsappButtonProps = {
  customerName: string;
  orderCode: string;
  phone?: string | null;
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
};

function buildWhatsappMessage(input: {
  customerName: string;
  orderCode: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}) {
  const lines = input.items.map((item) => `* ${item.name} x${item.quantity}`);

  return [
    `Hola ${input.customerName}, soy de Gorila Strong 💪`,
    "",
    `Te contacto por tu pedido #${input.orderCode}.`,
    "",
    "Productos:",
    "",
    ...lines,
    "",
    `Total: ${formatCurrency(input.total)}`,
    "",
    "Cuando puedas confirmamos entrega o retiro 👍"
  ].join("\n");
}

export function OrderWhatsappButton({
  customerName,
  orderCode,
  phone,
  total,
  items
}: OrderWhatsappButtonProps) {
  const normalizedPhone = normalizeWhatsappPhone(phone);
  const whatsappUrl = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
        buildWhatsappMessage({
          customerName,
          orderCode,
          total,
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
