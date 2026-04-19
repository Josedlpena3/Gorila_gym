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

const optionalPositiveInteger = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, z.coerce.number().int().min(1).optional());

const optionalPageSize = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, z.coerce.number().int().min(1).max(100).optional());

const imageSourceSchema = z
  .string()
  .trim()
  .min(1, "Agregá al menos una imagen")
  .transform((value) => value.trim());

export const productSchema = z.object({
  sku: z.string().trim().min(3, "SKU inválido"),
  name: z.string().trim().min(3, "Nombre inválido"),
  slug: z.string().trim().optional(),
  brand: z.string().trim().min(2, "Marca inválida"),
  categoryId: z.string().trim().min(1, "Categoría requerida"),
  description: z.string().trim().min(20, "Descripción demasiado corta"),
  benefits: z.array(z.string().min(2)).default([]),
  price: z.coerce.number().positive("Precio inválido"),
  stock: z.coerce.number().int().min(0, "Stock inválido"),
  objective: z.nativeEnum(Objective),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  weight: z.string().trim().optional(),
  flavor: z.string().trim().optional(),
  images: z.array(imageSourceSchema).default([])
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

export const catalogProductQuerySchema = productFiltersSchema.extend({
  page: optionalPositiveInteger,
  limit: optionalPageSize
});
