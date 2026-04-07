import { z } from "zod";

const passwordRules = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "La contraseña debe contener al menos 1 mayúscula")
  .regex(/[a-z]/, "La contraseña debe contener al menos 1 minúscula")
  .regex(/[0-9]/, "La contraseña debe contener al menos 1 número");

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
