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

const optionalPriority = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, z.coerce.number().int().min(1).optional());

const imageSourceSchema = z
  .string()
  .trim()
  .min(1, "Agregá al menos una imagen")
  .transform((value) => value.trim());

export const productSchema = z.object({
  sku: z.string().trim().min(3, "SKU inválido").optional(),
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
  featuredPriority: optionalPriority,
  weight: z.string().trim().nullable().optional(),
  flavor: z.string().trim().nullable().optional(),
  images: z.array(imageSourceSchema).default([])
});

/**
 * Criterios de ordenamiento del catálogo. Se validan como enum para que un
 * valor arbitrario en la URL no llegue nunca a Prisma.
 */
export const CATALOG_SORT_KEYS = [
  "relevancia",
  "precio-asc",
  "precio-desc",
  "novedades"
] as const;

export type CatalogSortKey = (typeof CATALOG_SORT_KEYS)[number];

/**
 * La marca llega como lista separada por comas: `?brand=ENA,Mervick`.
 *
 * Se acepta también un valor suelto, que es una lista de uno, así que los
 * enlaces que ya circulaban con una sola marca siguen funcionando igual.
 */
const brandListSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const brands = value
    .split(",")
    .map((brand) => brand.trim())
    .filter(Boolean);

  return brands.length > 0 ? brands : undefined;
}, z.array(z.string()).optional());

export const productFiltersSchema = z.object({
  sort: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.enum(CATALOG_SORT_KEYS).optional()
  ),
  q: optionalText,
  categoryId: optionalText,
  category: optionalText,
  brand: brandListSchema,
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
