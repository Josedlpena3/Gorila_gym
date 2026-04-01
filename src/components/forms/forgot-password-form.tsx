"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setMessage(null);
          setDevLink(null);

          const response = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: formData.get("email")
            })
          });

          const payload = await response.json();
          setMessage(payload.message ?? "Revisá tu correo.");
          setDevLink(payload.resetLink ?? null);
        });
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-mist">Email de tu cuenta</label>
        <Input type="email" name="email" placeholder="vos@gorilastrong.com" required />
      </div>

      <Button className="w-full" disabled={isPending}>
        {isPending ? "Generando enlace..." : "Recuperar contraseña"}
      </Button>

      {message ? <p className="text-sm text-mist">{message}</p> : null}
      {devLink ? (
        <Link href={devLink} className="block text-sm font-semibold text-neon">
          Abrir enlace de recuperación de desarrollo
        </Link>
      ) : null}
    </form>
  );
}

