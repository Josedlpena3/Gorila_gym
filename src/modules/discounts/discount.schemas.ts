import { DiscountType, PaymentMethod } from "@prisma/client";
import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const optionalDate = z.preprocess((value) => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(String(value));

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}, z.date().optional());

export const discountSchema = z.object({
  name: z.string().min(3, "Nombre inválido"),
  description: optionalText,
  code: optionalText,
  type: z.nativeEnum(DiscountType),
  value: z.coerce.number().positive("Valor inválido"),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  province: optionalText,
  active: z.boolean().default(true),
  startsAt: optionalDate,
  endsAt: optionalDate
});
