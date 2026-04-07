import { DeliveryMethod, OrderStatus, PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { addressSchema } from "@/modules/users/user.schemas";

const transferReceiptSchema = z.object({
  url: z.string().trim().min(1, "Falta la URL del comprobante"),
  fileName: z.string().trim().min(1, "Falta el nombre del comprobante"),
  mimeType: z.string().trim().min(1, "Falta el tipo del comprobante"),
  size: z.coerce.number().positive("Tamaño de comprobante inválido"),
  uploadedAt: z.string().datetime("Fecha de comprobante inválida")
});

export const createOrderSchema = z.object({
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().max(300).optional(),
  saveAddress: z.boolean().optional(),
  addressId: z.string().optional(),
  transferReceipt: transferReceiptSchema.optional(),
  address: addressSchema.partial({
    isDefault: true
  }).optional()
});

export const quoteCheckoutSchema = z.object({
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  province: z.string().trim().optional().nullable()
});

export const orderStatusSchema = z.nativeEnum(OrderStatus);

export const orderAdminActionSchema = z.union([
  z.object({
    action: z.literal("confirm-transfer")
  }),
  z.object({
    status: orderStatusSchema
  })
]);
