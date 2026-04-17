"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      <div className="space-y-2">
        <label className="text-sm text-mist">Contraseña actual</label>
        <div className="relative">
          <Input
            type={showCurrentPassword ? "text" : "password"}
            name="currentPassword"
            className="pr-12"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword((current) => !current)}
            aria-label={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showCurrentPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-mist transition hover:text-sand"
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-mist">Nueva contraseña</label>
        <div className="relative">
          <Input
            type={showNewPassword ? "text" : "password"}
            name="newPassword"
            className="pr-12"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((current) => !current)}
            aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showNewPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-mist transition hover:text-sand"
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-mist">
          Debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-mist">Repetir nueva contraseña</label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
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
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

      <Button disabled={isPending}>
        {isPending ? "Actualizando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
