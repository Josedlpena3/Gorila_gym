"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type EmailVerificationNoticeProps = {
  email: string;
  title?: string;
  description?: string;
  className?: string;
};

export function EmailVerificationNotice({
  email,
  title = "Tu email todavía no está verificado",
  description = "Podés navegar y usar el carrito, pero para confirmar un pedido primero necesitás verificar tu cuenta.",
  className
}: EmailVerificationNoticeProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const storedMessage = window.sessionStorage.getItem("emailVerificationNotice");
    const storedLink = window.sessionStorage.getItem("emailVerificationLink");

    if (storedMessage) {
      setMessage(storedMessage);
      window.sessionStorage.removeItem("emailVerificationNotice");
    }

    if (storedLink) {
      setVerificationLink(storedLink);
      window.sessionStorage.removeItem("emailVerificationLink");
    }
  }, []);

  return (
    <div
      className={`rounded-[28px] border border-amber-400/30 bg-amber-300/10 p-4 text-sm text-sand ${
        className ?? ""
      }`.trim()}
    >
      <p className="font-semibold text-sand">{title}</p>
      <p className="mt-2 text-mist">
        {description} Email actual: <span className="font-medium text-sand">{email}</span>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          className="rounded-2xl"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              setMessage(null);
              setVerificationLink(null);

              const response = await fetch("/api/auth/resend-verification", {
                method: "POST"
              });
              const payload = await response.json().catch(() => null);

              setMessage(
                payload?.message ??
                  (response.ok
                    ? "Te enviamos un nuevo enlace de verificación."
                    : "No se pudo reenviar el correo de verificación.")
              );
              setVerificationLink(payload?.verificationLink ?? null);
            });
          }}
        >
          {isPending ? "Enviando..." : "Reenviar verificación"}
        </Button>

        {verificationLink ? (
          <a href={verificationLink} className="font-semibold text-neon">
            Abrir enlace de verificación
          </a>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm text-mist">{message}</p> : null}
    </div>
  );
}
