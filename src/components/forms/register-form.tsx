"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { syncGuestCartToServer } from "@/lib/guest-cart";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        <div className="space-y-2">
          <label className="text-sm font-medium text-mist">Nombre</label>
          <Input name="firstName" placeholder="Luciano" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-mist">Apellido</label>
          <Input name="lastName" placeholder="Pereyra" required />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-mist">Email</label>
        <Input type="email" name="email" placeholder="vos@gorilastrong.com" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-mist">Teléfono</label>
          <Input name="phone" placeholder="+54 351 5550000" required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-mist">Contraseña</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mínimo 8 caracteres"
              className="pr-12"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-mist transition hover:text-sand"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-mist">
            Debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-mist">Repetir contraseña</label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Repetí tu contraseña"
            className="pr-12"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showConfirmPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-mist transition hover:text-sand"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <Button className="w-full" disabled={isPending}>
        {isPending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
