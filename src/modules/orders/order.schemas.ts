import { DeliveryMethod, OrderStatus, PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { isValidWhatsAppPhone, normalizeWhatsAppPhone } from "@/lib/phone";

const whatsappPhoneSchema = z
  .string()
  .trim()
  .refine(
    isValidWhatsAppPhone,
    "Ingresá un celular válido de WhatsApp con código de área. Ej.: +54 9 351 555 0000"
  )
  .transform(normalizeWhatsAppPhone);

export const createOrderSchema = z.object({
  firstName: z.string().trim().min(2, "Nombre inválido"),
  lastName: z.string().trim().min(2, "Apellido inválido"),
  phone: whatsappPhoneSchema,
  notes: z.string().max(300).optional(),
  address: z.object({
    street: z.string().trim().min(2, "Calle inválida"),
    number: z.string().trim().min(1, "Número requerido"),
    city: z.string().trim().min(2, "Ciudad inválida"),
    province: z.string().trim().min(2, "Provincia inválida"),
    postalCode: z.string().trim().min(3, "Código postal inválido")
  })
});

export const quoteCheckoutSchema = z.object({
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  province: z.string().trim().optional().nullable()
});

export const orderStatusSchema = z.nativeEnum(OrderStatus);

export const orderAdminActionSchema = z.object({
  status: orderStatusSchema
});
