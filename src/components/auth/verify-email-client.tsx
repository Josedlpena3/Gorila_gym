"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type VerifyState = "verifying" | "success" | "error";

type VerifyEmailClientProps = {
  token: string;
};

export function VerifyEmailClient({ token }: VerifyEmailClientProps) {
  const [state, setState] = useState<VerifyState>("verifying");
  const [message, setMessage] = useState("Estamos verificando tu email...");

  useEffect(() => {
    let cancelled = false;

    async function verifyEmail() {
      if (!token) {
        setState("error");
        setMessage("El enlace de verificación es inválido o está incompleto.");
        return;
      }

      setState("verifying");
      setMessage("Estamos verificando tu email...");

      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store"
          }
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            payload?.error ?? "No se pudo verificar el email. Intentá nuevamente."
          );
        }

        if (cancelled) {
          return;
        }

        setState("success");
        setMessage(
          payload?.message ??
            "Tu email fue verificado correctamente. Ya podés iniciar sesión."
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "No se pudo verificar el email. Intentá nuevamente."
        );
      }
    }

    verifyEmail();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const title =
    state === "verifying"
      ? "Verificando email"
      : state === "success"
        ? "Email verificado"
        : "No se pudo verificar el email";

  return (
    <div className="page-shell">
      <div className="section-card mx-auto max-w-xl p-8 text-center sm:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Verificación</p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] text-sand sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-mist sm:text-base">{message}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {state === "success" ? (
            <Link href="/login?verified=1" className="inline-flex">
              <Button>Ir al login</Button>
            </Link>
          ) : state === "error" ? (
            <Link href="/login" className="inline-flex">
              <Button variant="secondary">Ir al login</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
