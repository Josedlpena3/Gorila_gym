"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
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
              password: formData.get("password")
            })
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            const validationError = Object.values(payload?.details?.fieldErrors ?? {})
              .flat()
              .find((message): message is string => Boolean(message));

            setError(
              validationError ?? payload?.error ?? "No se pudo crear la cuenta."
            );
            return;
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-mist">Contraseña</label>
          <Input type="password" name="password" placeholder="Mínimo 8 caracteres" required />
          <p className="text-xs text-mist">
            Debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <Button className="w-full" disabled={isPending}>
        {isPending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
