import { createHmac, timingSafeEqual } from "crypto";
import {
  Discount,
  DiscountType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  getBankTransferConfig,
  isMercadoPagoConfigured
} from "@/lib/store-config";
import { decimalToNumber, formatCurrency, isCordobaProvince } from "@/lib/utils";
import type { DiscountSummaryDto, PaymentMethodOptionDto } from "@/types";

function mapDiscount(discount: Discount, subtotal: number): DiscountSummaryDto {
  return {
    id: discount.id,
    name: discount.name,
    code: discount.code,
    type: discount.type,
    value: decimalToNumber(discount.value) ?? 0,
    amount: calculateDiscountAmount(subtotal, discount)
  };
}

export function getAvailablePaymentMethods(province?: string | null) {
  const methods: PaymentMethod[] = [];

  if (isMercadoPagoConfigured()) {
    methods.push(PaymentMethod.MERCADO_PAGO);
  }

  if (getBankTransferConfig()) {
    methods.push(PaymentMethod.BANK_TRANSFER);
  }

  if (isCordobaProvince(province)) {
    methods.push(PaymentMethod.CASH);
  }

  return methods;
}

export async function getApplicableDiscount(input: {
  paymentMethod: PaymentMethod;
  province?: string | null;
  subtotal: number;
}) {
  const now = new Date();
  const discounts = await prisma.discount.findMany({
    where: {
      active: true,
      OR: [{ paymentMethod: null }, { paymentMethod: input.paymentMethod }],
      AND: [
        {
          OR: [{ startsAt: null }, { startsAt: { lte: now } }]
        },
        {
          OR: [{ endsAt: null }, { endsAt: { gte: now } }]
        },
        ...(input.province
          ? [
              {
                OR: [{ province: null }, { province: input.province }]
              }
            ]
          : [])
      ]
    },
    orderBy: [{ paymentMethod: "desc" }, { createdAt: "desc" }]
  });

  let selected: Discount | null = null;
  let bestAmount = 0;

  for (const discount of discounts) {
    const amount = calculateDiscountAmount(input.subtotal, discount);

    if (amount > bestAmount) {
      selected = discount;
      bestAmount = amount;
    }
  }

  return selected;
}

export function calculateDiscountAmount(
  subtotal: number,
  discount: Discount | null
) {
  if (!discount) {
    return 0;
  }

  if (discount.type === DiscountType.PERCENTAGE) {
    return Math.round((subtotal * (decimalToNumber(discount.value) ?? 0)) / 100);
  }

  return Math.min(subtotal, decimalToNumber(discount.value) ?? 0);
}

export async function buildCheckoutPricing(input: {
  subtotal: number;
  province?: string | null;
  paymentMethod: PaymentMethod;
  shippingCost: number;
}) {
  const discount = await getApplicableDiscount({
    paymentMethod: input.paymentMethod,
    province: input.province,
    subtotal: input.subtotal
  });
  const discountAmount = calculateDiscountAmount(input.subtotal, discount);

  return {
    shippingCost: input.shippingCost,
    discountAmount,
    total: input.subtotal + input.shippingCost - discountAmount,
    appliedDiscount: discount ? mapDiscount(discount, input.subtotal) : null
  };
}

export function buildPaymentMethodOptions(input: {
  province?: string | null;
  transferDiscount: DiscountSummaryDto | null;
}) {
  const methods = getAvailablePaymentMethods(input.province);

  return methods.map((method): PaymentMethodOptionDto => {
    if (method === PaymentMethod.MERCADO_PAGO) {
      return {
        method,
        label: "Mercado Pago",
        description: "Confirmación automática al acreditarse el pago."
      };
    }

    if (method === PaymentMethod.BANK_TRANSFER) {
      return {
        method,
        label: "Transferencia bancaria",
        description: input.transferDiscount
          ? `${input.transferDiscount.name}: ${formatCurrency(
              input.transferDiscount.amount
            )} de descuento. Verificación manual del pago.`
          : "Pago por transferencia con verificación manual."
      };
    }

    return {
      method,
      label: "Efectivo",
      description: "Disponible sólo para Córdoba."
    };
  });
}

export async function createMercadoPagoPreference(input: {
  orderId: string;
  orderCode: string;
  total: number;
  customerName: string;
  customerEmail: string;
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
  }>;
}) {
  if (!isMercadoPagoConfigured()) {
    throw new AppError(
      "Mercado Pago no está configurado. Faltan credenciales o URL pública.",
      503
    );
  }

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.mercadoPagoAccessToken}`
    },
    body: JSON.stringify({
      external_reference: input.orderCode,
      notification_url: `${env.appUrl}/api/payments/mercadopago/webhook`,
      items: input.items,
      payer: {
        email: input.customerEmail,
        name: input.customerName
      },
      back_urls: {
        success: `${env.appUrl}/mis-pedidos?highlight=${input.orderId}&status=success`,
        pending: `${env.appUrl}/mis-pedidos?highlight=${input.orderId}&status=pending`,
        failure: `${env.appUrl}/mis-pedidos?highlight=${input.orderId}&status=failure`
      },
      auto_return: "approved"
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new AppError("No se pudo crear la preferencia de Mercado Pago", 502, error);
  }

  const result = await response.json();

  return {
    checkoutUrl: result.init_point as string,
    preferenceId: result.id as string,
    mode: "live" as const
  };
}

function parseMercadoPagoSignature(signature: string | null) {
  if (!signature) {
    return null;
  }

  const pairs = signature
    .split(",")
    .map((item) => item.trim())
    .map((item) => item.split("=", 2) as [string, string]);

  const parsed = Object.fromEntries(pairs);

  if (!parsed.ts || !parsed.v1) {
    return null;
  }

  return {
    ts: parsed.ts,
    v1: parsed.v1
  };
}

export function validateMercadoPagoWebhookSignature(input: {
  request: Request;
  dataId: string;
}) {
  if (!env.mercadoPagoWebhookSecret) {
    throw new AppError("Falta MERCADO_PAGO_WEBHOOK_SECRET", 503);
  }

  const signature = parseMercadoPagoSignature(
    input.request.headers.get("x-signature")
  );
  const requestId = input.request.headers.get("x-request-id");

  if (!signature || !requestId) {
    return false;
  }

  const manifest = `id:${input.dataId};request-id:${requestId};ts:${signature.ts};`;
  const expected = createHmac("sha256", env.mercadoPagoWebhookSecret)
    .update(manifest)
    .digest("hex");

  const actualBuffer = Buffer.from(signature.v1, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

async function cancelOrderAfterRejectedMercadoPago(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order || order.status === OrderStatus.CANCELLED) {
      return;
    }

    for (const item of order.items) {
      if (!item.productId) {
        continue;
      }

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED
      }
    });
  });
}

export async function syncMercadoPagoPayment(paymentId: string) {
  if (!env.mercadoPagoAccessToken) {
    throw new AppError("Mercado Pago no está configurado", 500);
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${env.mercadoPagoAccessToken}`
    }
  });

  if (!response.ok) {
    throw new AppError("No se pudo validar el pago en Mercado Pago", 502);
  }

  const payload = await response.json();
  const orderCode = payload.external_reference as string | undefined;

  if (!orderCode) {
    return null;
  }

  const payment = await prisma.payment.findFirst({
    where: {
      externalReference: orderCode,
      provider: PaymentMethod.MERCADO_PAGO
    },
    include: {
      order: {
        select: {
          id: true,
          code: true,
          total: true,
          status: true,
          user: {
            select: {
              email: true,
              firstName: true
            }
          }
        }
      }
    }
  });

  if (!payment) {
    return null;
  }

  const mercadoPagoStatus = String(payload.status ?? "");
  const transactionId = String(payload.id);

  if (mercadoPagoStatus === "approved") {
    if (payment.status === PaymentStatus.APPROVED) {
      return { approved: true, orderId: payment.orderId };
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.APPROVED,
          transactionId,
          metadata: payload,
          paidAt: new Date()
        }
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status:
            payment.order.status === OrderStatus.CANCELLED
              ? OrderStatus.CANCELLED
              : payment.order.status
        }
      });
    });

    revalidatePath("/mis-pedidos");
    revalidatePath("/admin/pedidos");

    return { approved: true, orderId: payment.orderId };
  }

  const nextStatus =
    mercadoPagoStatus === "rejected"
      ? PaymentStatus.REJECTED
      : mercadoPagoStatus === "cancelled"
        ? PaymentStatus.CANCELED
        : PaymentStatus.PENDING;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      transactionId,
      metadata: payload,
      status: nextStatus
    }
  });

  if (
    mercadoPagoStatus === "rejected" ||
    mercadoPagoStatus === "cancelled"
  ) {
    await cancelOrderAfterRejectedMercadoPago(payment.orderId);
  }

  revalidatePath("/mis-pedidos");
  revalidatePath("/admin/pedidos");

  return { approved: false, orderId: payment.orderId };
}
