import { DeliveryMethod, OrderStatus, PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

const phoneSchema = z
  .string()
  .trim()
  .refine((value) => /^[0-9]+$/.test(value), "Solo números")
  .refine((value) => value.length >= 8, "Teléfono inválido")
  .transform(normalizePhone);

const orderAddressSchema = z.object({
  street: z.string().trim().min(2, "Calle inválida"),
  number: z.string().trim().min(1, "Número requerido"),
  city: z.string().trim().min(2, "Ciudad inválida"),
  province: z.string().trim().min(2, "Provincia inválida"),
  postalCode: z.string().trim().min(3, "Código postal inválido")
});

const normalizedAddressSchema = z.preprocess(
  (value) => (value == null ? undefined : value),
  orderAddressSchema.optional()
);

const deliveryMethodSchema = z
  .union([
    z.literal("retiro"),
    z.literal("envio"),
    z.literal(DeliveryMethod.PICKUP),
    z.literal(DeliveryMethod.SHIPMENT)
  ])
  .transform((value) =>
    value === "retiro" || value === DeliveryMethod.PICKUP
      ? DeliveryMethod.PICKUP
      : DeliveryMethod.SHIPMENT
  );

const paymentMethodSchema = z
  .union([
    z.literal("efectivo"),
    z.literal("transferencia"),
    z.literal("tarjeta"),
    z.literal(PaymentMethod.CASH),
    z.literal(PaymentMethod.BANK_TRANSFER),
    z.literal(PaymentMethod.CARD)
  ])
  .transform((value) => {
    if (value === "efectivo" || value === PaymentMethod.CASH) {
      return PaymentMethod.CASH;
    }

    if (value === "transferencia" || value === PaymentMethod.BANK_TRANSFER) {
      return PaymentMethod.BANK_TRANSFER;
    }

    return PaymentMethod.CARD;
  });

const orderItemSchema = z.object({
  productId: z.string().trim().min(1, "Producto inválido"),
  name: z.string().trim().min(1, "Nombre de producto inválido"),
  quantity: z.number().int().min(1, "Cantidad inválida"),
  price: z.number().positive("Precio inválido")
});

const legacyGuestOrderItemSchema = z.object({
  productId: z.string().trim().min(1, "Producto inválido"),
  quantity: z.number().int().min(1, "Cantidad inválida")
});

function normalizeOrderInput(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }

  const input = raw as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";

  return {
    ...input,
    name,
    totalFinal: input.totalFinal ?? input.total,
    address: input.address ?? undefined,
    deliveryMethod: input.deliveryMethod ?? "envio",
    paymentMethod: input.paymentMethod ?? "efectivo"
  };
}

const createOrderBaseObjectSchema = z.object({
  name: z.string().trim().min(2, "Nombre inválido"),
  phone: phoneSchema,
  deliveryMethod: deliveryMethodSchema,
  paymentMethod: paymentMethodSchema,
  items: z
    .array(z.union([orderItemSchema, legacyGuestOrderItemSchema]))
    .min(1, "Tu carrito está vacío")
    .optional(),
  discountCode: z.string().trim().max(80).optional().nullable(),
  discountApplied: z.string().trim().max(80).nullable().optional(),
  totalFinal: z.number().positive("Total inválido"),
  notes: z.string().max(300).optional(),
  address: normalizedAddressSchema
});

type CreateOrderBaseObject = z.infer<typeof createOrderBaseObjectSchema>;

function validateOrderRequest(data: CreateOrderBaseObject, ctx: z.RefinementCtx) {
  if (data.deliveryMethod === DeliveryMethod.SHIPMENT && !data.address) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["address"],
      message: "La dirección es obligatoria para envío"
    });
  }

  if (
    data.paymentMethod === PaymentMethod.CARD &&
    data.deliveryMethod !== DeliveryMethod.PICKUP
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["paymentMethod"],
      message: "La tarjeta solo está disponible para retiro en el local"
    });
  }
}

export const createOrderSchema = z.preprocess(
  normalizeOrderInput,
  createOrderBaseObjectSchema.superRefine(validateOrderRequest)
);

export const createGuestOrderSchema = z.preprocess(
  normalizeOrderInput,
  createOrderBaseObjectSchema
    .extend({
      items: z
        .array(z.union([orderItemSchema, legacyGuestOrderItemSchema]))
        .min(1, "Tu carrito está vacío")
    })
    .superRefine(validateOrderRequest)
);

export const quoteCheckoutSchema = z.object({
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  province: z.string().trim().optional().nullable()
});

export const orderStatusSchema = z.nativeEnum(OrderStatus);

export const orderAdminActionSchema = z.object({
  status: orderStatusSchema
});

export const orderDiscountUpdateSchema = z.object({
  discountCode: z.string().trim().max(80).nullable().optional()
});
