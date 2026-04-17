"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ redirectTo = "/catalogo" }: { redirectTo?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="********"
            className="pr-12"
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
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <Button className="w-full" disabled={isPending}>
        {isPending ? "Ingresando..." : "Ingresar"}
      </Button>

      <div className="flex flex-col gap-2 text-sm text-mist sm:flex-row sm:items-center sm:justify-between">
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
