"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormStatus } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

export function ChangePasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newPassword = String(formData.get("newPassword") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        startTransition(async () => {
          setMessage(null);
          setError(null);

          if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
          }

          const response = await fetch("/api/auth/change-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              currentPassword: formData.get("currentPassword"),
              newPassword,
              confirmPassword
            })
          });

          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            setError(payload?.error ?? "No se pudo actualizar la contraseña.");
            return;
          }

          setMessage(payload?.message ?? "La contraseña fue actualizada correctamente.");
          event.currentTarget.reset();
        });
      }}
    >
      <Field label="Contraseña actual">
        {(control) => (
          <PasswordInput
            {...control}
            name="currentPassword"
            autoComplete="current-password"
            required
          />
        )}
      </Field>

      <Field
        label="Nueva contraseña"
        hint="Debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número."
      >
        {(control) => (
          <PasswordInput
            {...control}
            name="newPassword"
            autoComplete="new-password"
            required
          />
        )}
      </Field>

      <Field label="Repetir nueva contraseña">
        {(control) => (
          <PasswordInput
            {...control}
            name="confirmPassword"
            autoComplete="new-password"
            required
          />
        )}
      </Field>

      <FormError>{error}</FormError>
      <FormStatus className="text-emerald-300">{message}</FormStatus>

      <Button disabled={isPending}>
        {isPending ? "Actualizando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
