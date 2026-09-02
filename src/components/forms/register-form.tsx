"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { syncGuestCartToServer } from "@/lib/guest-cart";

export function RegisterForm() {
  const router = useRouter();
  const { refresh } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);

          const password = String(formData.get("password") ?? "");
          const confirmPassword = String(formData.get("confirmPassword") ?? "");

          if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
          }

          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              firstName: formData.get("firstName"),
              lastName: formData.get("lastName"),
              email: formData.get("email"),
              phone: formData.get("phone"),
              password,
              confirmPassword
            })
          });
          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            const validationError = Object.values(payload?.details?.fieldErrors ?? {})
              .flat()
              .find((message): message is string => Boolean(message));

            setError(
              validationError ?? payload?.error ?? "No se pudo crear la cuenta."
            );
            return;
          }

          if (typeof window !== "undefined") {
            if (payload?.emailError) {
              window.sessionStorage.setItem(
                "emailVerificationNotice",
                `La cuenta se creó, pero no pudimos enviar el correo de verificación. ${payload.emailError}`
              );
            } else {
              window.sessionStorage.removeItem("emailVerificationNotice");
            }

            if (payload?.verificationLink) {
              window.sessionStorage.setItem(
                "emailVerificationLink",
                payload.verificationLink
              );
            } else {
              window.sessionStorage.removeItem("emailVerificationLink");
            }
          }

          // El registro deja la sesión iniciada: hay que refrescarla para que
          // el header y el aviso de verificación reflejen la cuenta nueva.
          await refresh();

          try {
            const syncResult = await syncGuestCartToServer();

            if (syncResult.failed > 0) {
              router.push("/carrito");
              router.refresh();
              return;
            }
          } catch {
            console.warn("[register] no se pudo sincronizar el carrito invitado");
          }

          router.push("/catalogo");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          {(control) => (
            <Input
              {...control}
              name="firstName"
              placeholder="Luciano"
              autoComplete="given-name"
              required
            />
          )}
        </Field>
        <Field label="Apellido">
          {(control) => (
            <Input
              {...control}
              name="lastName"
              placeholder="Pereyra"
              autoComplete="family-name"
              required
            />
          )}
        </Field>
      </div>

      <Field label="Email">
        {(control) => (
          <Input
            {...control}
            type="email"
            name="email"
            placeholder="vos@gorillastrong.com"
            autoComplete="email"
            required
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono">
          {(control) => (
            <Input
              {...control}
              name="phone"
              placeholder="+54 351 5550000"
              autoComplete="tel"
              required
            />
          )}
        </Field>

        <Field
          label="Contraseña"
          className="sm:col-span-2"
          hint="Debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número."
        >
          {(control) => (
            <PasswordInput
              {...control}
              name="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
            />
          )}
        </Field>
      </div>

      <Field label="Repetir contraseña">
        {(control) => (
          <PasswordInput
            {...control}
            name="confirmPassword"
            placeholder="Repetí tu contraseña"
            autoComplete="new-password"
            required
          />
        )}
      </Field>

      <FormError>{error}</FormError>

      <Button className="w-full" disabled={isPending}>
        {isPending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
