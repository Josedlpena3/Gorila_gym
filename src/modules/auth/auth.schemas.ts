import { z } from "zod";

const passwordRules = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "Debe incluir una mayúscula")
  .regex(/[a-z]/, "Debe incluir una minúscula")
  .regex(/[0-9]/, "Debe incluir un número");

export const registerSchema = z.object({
  firstName: z.string().min(2, "Nombre inválido"),
  lastName: z.string().min(2, "Apellido inválido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Teléfono inválido"),
  password: passwordRules
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido")
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Token inválido"),
  password: passwordRules
});

