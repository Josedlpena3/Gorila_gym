"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ redirectTo = "/" }: { redirectTo?: string }) {
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

          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: formData.get("email"),
              password: formData.get("password")
            })
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            setError(payload?.error ?? "No se pudo iniciar sesión.");
            return;
          }

          const payload = await response.json();
          const nextPath = payload.user.role === "ADMIN" ? "/admin" : redirectTo;
          router.push(nextPath);
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-mist">Email</label>
        <Input type="email" name="email" placeholder="vos@gorilastrong.com" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-mist">Contraseña</label>
        <Input type="password" name="password" placeholder="********" required />
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <Button className="w-full" disabled={isPending}>
        {isPending ? "Ingresando..." : "Ingresar"}
      </Button>

      <div className="flex items-center justify-between text-sm text-mist">
        <Link href="/recuperar-password" className="hover:text-sand">
          Recuperar contraseña
        </Link>
        <Link href="/registro" className="hover:text-sand">
          Crear cuenta
        </Link>
      </div>
    </form>
  );
}

