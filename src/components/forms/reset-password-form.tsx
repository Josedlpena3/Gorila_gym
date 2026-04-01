"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

        startTransition(async () => {
          setError(null);

          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              token,
              password: formData.get("password")
            })
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            setError(payload?.error ?? "No se pudo actualizar la contraseña.");
            return;
          }

          router.push("/login");
        });
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-mist">Nueva contraseña</label>
        <Input type="password" name="password" placeholder="Nueva contraseña" required />
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <Button className="w-full" disabled={isPending}>
        {isPending ? "Actualizando..." : "Actualizar contraseña"}
      </Button>
    </form>
  );
}

