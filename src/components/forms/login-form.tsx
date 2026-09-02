"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { syncGuestCartToServer } from "@/lib/guest-cart";

export function LoginForm({ redirectTo = "/catalogo" }: { redirectTo?: string }) {
  const router = useRouter();
  const { refresh } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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

            // El header lee la sesión del cliente: sin este refresh seguiría
            // mostrando "Ingresar" después de un login exitoso.
            await refresh();

            router.push(nextPath);
            router.refresh();
          } catch {
            setError("No se pudo iniciar sesión.");
          }
        });
      }}
    >
      <Field label="Email">
        {(control) => (
          <Input
            {...control}
            type="email"
            name="email"
            placeholder="usuario@gmail.com"
            autoComplete="email"
            required
          />
        )}
      </Field>

      <Field label="Contraseña">
        {(control) => (
          <PasswordInput
            {...control}
            name="password"
            placeholder="********"
            autoComplete="current-password"
            required
          />
        )}
      </Field>

      <FormError>{error}</FormError>
      {isTemporarilyBlocked ? (
        <p role="status" className="text-xs text-amber-200">
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
