import { Objective } from "@prisma/client";
import { z } from "zod";
const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, z.coerce.number().optional());

const imageSourceSchema = z
  .string()
  .trim()
  .min(1, "Agregá al menos una imagen")
  .transform((value) => value.trim());

export const productSchema = z.object({
  sku: z.string().min(3, "SKU inválido"),
  name: z.string().min(3, "Nombre inválido"),
  slug: z.string().optional(),
  brand: z.string().min(2, "Marca inválida"),
  categoryId: z.string().min(1, "Categoría requerida"),
  description: z.string().min(20, "Descripción demasiado corta"),
  benefits: z.array(z.string().min(2)).default([]),
  price: z.coerce.number().positive("Precio inválido"),
  stock: z.coerce.number().int().min(0, "Stock inválido"),
  objective: z.nativeEnum(Objective),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  weight: z.string().optional(),
  flavor: z.string().optional(),
  images: z.array(imageSourceSchema).min(1, "Agregá al menos una imagen")
});

export const productFiltersSchema = z.object({
  q: optionalText,
  category: optionalText,
  brand: optionalText,
  objective: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.nativeEnum(Objective).optional()
  ),
  minPrice: optionalNumber,
  maxPrice: optionalNumber
});
