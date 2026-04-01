import { z } from "zod";

const productIdSchema = z.string().min(1, "Producto requerido");

export const addCartItemSchema = z.object({
  productId: productIdSchema,
  quantity: z.coerce.number().int().positive().default(1)
});

export const updateCartItemSchema = z.object({
  productId: productIdSchema,
  quantity: z.coerce.number().int().min(0)
});

export const removeCartItemSchema = z.object({
  productId: productIdSchema
});
