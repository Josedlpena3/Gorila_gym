"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        startTransition(async () => {
          setError(null);

          if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
          }

          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              token,
              password,
              confirmPassword
            })
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            setError(payload?.error ?? "No se pudo actualizar la contraseña.");
            return;
          }

          router.push("/login?reset=1");
        });
      }}
    >
      <Field label="Nueva contraseña">
        {(control) => (
          <PasswordInput
            {...control}
            name="password"
            placeholder="Nueva contraseña"
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
            placeholder="Repetí la nueva contraseña"
            autoComplete="new-password"
            required
          />
        )}
      </Field>

      <FormError>{error}</FormError>
      <Button className="w-full" disabled={isPending}>
        {isPending ? "Actualizando..." : "Actualizar contraseña"}
      </Button>
    </form>
  );
}
