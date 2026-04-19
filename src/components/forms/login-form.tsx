"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { syncGuestCartToServer } from "@/lib/guest-cart";

export function LoginForm({ redirectTo = "/catalogo" }: { redirectTo?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());

  useEffect(() => {
    if (!blockedUntil) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [blockedUntil]);

  useEffect(() => {
    if (blockedUntil && blockedUntil <= nowTimestamp) {
      setBlockedUntil(null);
    }
  }, [blockedUntil, nowTimestamp]);

  const isTemporarilyBlocked = Boolean(blockedUntil && blockedUntil > nowTimestamp);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (isTemporarilyBlocked) {
          return;
        }

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);

          try {
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

            const payload = (await response.json().catch(() => null)) as
              | {
                  error?: string;
                  retryAfterSeconds?: number;
                  user?: {
                    role: "ADMIN" | "CUSTOMER";
                  };
                }
              | null;

            if (!response.ok) {
              if (response.status === 429) {
                const retryAfterHeader = Number(response.headers.get("Retry-After"));
                const retryAfterSeconds = Number.isFinite(payload?.retryAfterSeconds)
                  ? Number(payload?.retryAfterSeconds)
                  : Number.isFinite(retryAfterHeader)
                    ? retryAfterHeader
                    : 300;

                setBlockedUntil(Date.now() + Math.max(retryAfterSeconds, 1) * 1000);
                setNowTimestamp(Date.now());
                setError("Demasiados intentos, esperá unos minutos");
                return;
              }

              setError(payload?.error ?? "No se pudo iniciar sesión.");
              return;
            }

            let nextPath = payload?.user?.role === "ADMIN" ? "/admin" : redirectTo;

            if (payload?.user?.role !== "ADMIN") {
              try {
                const syncResult = await syncGuestCartToServer();

                if (syncResult.failed > 0) {
                  console.warn("[login] algunos items del carrito no se pudieron sincronizar");
                  nextPath = "/carrito";
                }
              } catch {
                console.warn("[login] no se pudo sincronizar el carrito invitado");
              }
            }

            router.push(nextPath);
            router.refresh();
          } catch {
            setError("No se pudo iniciar sesión.");
          }
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
      {isTemporarilyBlocked ? (
        <p className="text-xs text-amber-200">
          El acceso está pausado temporalmente. Intentá nuevamente en unos minutos.
        </p>
      ) : null}

      <Button className="w-full" disabled={isPending || isTemporarilyBlocked}>
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
