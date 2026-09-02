"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from "@/lib/api-client";
import { Field, FormError, FormStatus } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setMessage(null);
          setError(null);
          setDevLink(null);

          try {
            const payload = await api.post<{
              message?: string;
              emailError?: string | null;
              resetLink?: string | null;
            }>(
              "/api/auth/forgot-password",
              { email: formData.get("email") },
              { fallbackMessage: "No se pudo procesar la solicitud." }
            );

            setMessage(payload?.message ?? "Revisá tu correo.");
            setError(payload?.emailError ?? null);
            setDevLink(payload?.resetLink ?? null);
          } catch (error) {
            setError(getApiErrorMessage(error, "No se pudo procesar la solicitud."));
          }
        });
      }}
    >
      <Field label="Email de tu cuenta">
        {(control) => (
          <Input {...control} type="email" name="email" placeholder="vos@gorillastrong.com" required />
        )}
      </Field>

      <Button className="w-full" disabled={isPending}>
        {isPending ? "Generando enlace..." : "Recuperar contraseña"}
      </Button>

      <FormStatus>{message}</FormStatus>
      <FormError>{error}</FormError>
      {devLink ? (
        <Link href={devLink} className="block text-sm font-semibold text-ember">
          Abrir enlace de recuperación de desarrollo
        </Link>
      ) : null}
    </form>
  );
}
