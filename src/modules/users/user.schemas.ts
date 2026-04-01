import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().min(2, "Etiqueta inválida").default("Principal"),
  recipientName: z.string().min(2, "Destinatario inválido"),
  street: z.string().min(2, "Calle inválida"),
  number: z.string().min(1, "Número requerido"),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().min(2, "Ciudad inválida"),
  province: z.string().min(2, "Provincia inválida"),
  postalCode: z.string().min(3, "Código postal inválido"),
  country: z.string().default("Argentina"),
  notes: z.string().max(200).optional(),
  isDefault: z.boolean().optional()
});

export const profileSchema = z.object({
  firstName: z.string().min(2, "Nombre inválido"),
  lastName: z.string().min(2, "Apellido inválido"),
  phone: z.string().min(8, "Teléfono inválido"),
  address: addressSchema.optional()
});

