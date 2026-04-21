import { DeliveryMethod, OrderStatus, PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { extractPhoneDigits, normalizePhone } from "@/lib/phone";

const phoneSchema = z
  .string()
  .trim()
  .transform(extractPhoneDigits)
  .refine((value) => value.length >= 8, "Teléfono inválido")
  .refine((value) => /^[0-9]+$/.test(value), "Solo números")
  .transform(normalizePhone);

const orderAddressSchema = z.object({
  street: z.string().trim().min(2, "Calle inválida"),
  number: z.string().trim().min(1, "Número requerido"),
  city: z.string().trim().min(2, "Ciudad inválida"),
  province: z.string().trim().min(2, "Provincia inválida"),
  postalCode: z.string().trim().min(3, "Código postal inválido")
});

function validateOrderAddressRequirement<
  T extends {
    deliveryMethod: DeliveryMethod;
    paymentMethod: PaymentMethod;
    address?: unknown;
  }
>(data: T, ctx: z.RefinementCtx) {
  if (data.deliveryMethod === DeliveryMethod.SHIPMENT && !data.address) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["address"],
      message: "La dirección es obligatoria para envío"
    });
  }

  if (
    data.paymentMethod !== PaymentMethod.CASH &&
    data.paymentMethod !== PaymentMethod.BANK_TRANSFER
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["paymentMethod"],
      message: "Forma de pago inválida"
    });
  }
}

const createOrderBaseSchema = z.object({
  firstName: z.string().trim().min(2, "Nombre inválido"),
  lastName: z.string().trim().optional().default(""),
  phone: phoneSchema,
  deliveryMethod: z.nativeEnum(DeliveryMethod).default(DeliveryMethod.SHIPMENT),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  notes: z.string().max(300).optional(),
  address: orderAddressSchema.optional()
});

export const createOrderSchema = createOrderBaseSchema.superRefine(
  validateOrderAddressRequirement
);

export const createGuestOrderSchema = createOrderBaseSchema
  .extend({
    items: z
      .array(
        z.object({
          productId: z.string().trim().min(1, "Producto inválido"),
          quantity: z.number().int().min(1, "Cantidad inválida")
        })
      )
      .min(1, "Tu carrito está vacío")
  })
  .superRefine(validateOrderAddressRequirement);

export const quoteCheckoutSchema = z.object({
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  province: z.string().trim().optional().nullable()
});

export const orderStatusSchema = z.nativeEnum(OrderStatus);

export const orderAdminActionSchema = z.object({
  status: orderStatusSchema
});
