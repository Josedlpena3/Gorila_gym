import { Objective, ProductType } from "@prisma/client";
import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(3, "SKU inválido"),
  name: z.string().min(3, "Nombre inválido"),
  slug: z.string().optional(),
  brand: z.string().min(2, "Marca inválida"),
  categoryId: z.string().min(1, "Categoría requerida"),
  description: z.string().min(20, "Descripción demasiado corta"),
  benefits: z.array(z.string().min(2)).min(1, "Agregá al menos un beneficio"),
  price: z.coerce.number().positive("Precio inválido"),
  stock: z.coerce.number().int().min(0, "Stock inválido"),
  type: z.nativeEnum(ProductType),
  objective: z.nativeEnum(Objective),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  weight: z.string().optional(),
  flavor: z.string().optional(),
  images: z.array(z.string().url("URL de imagen inválida")).min(1)
});

export const productFiltersSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  type: z.nativeEnum(ProductType).optional(),
  objective: z.nativeEnum(Objective).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional()
});

