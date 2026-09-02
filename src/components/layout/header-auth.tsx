"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { LogoutButton } from "@/components/forms/logout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Estado de sesión del header. El ancho mínimo del contenedor está fijado para
 * que pasar de "cargando" a invitado o a usuario logueado no desplace la
 * navegación de al lado (CLS = 0).
 */
export function HeaderAuth() {
  const { user, status } = useSession();

  return (
    <div className="flex items-center justify-end gap-2 md:min-w-[200px] lg:min-w-[264px] lg:gap-3">
      {status === "loading" ? (
        <div aria-hidden="true" className="flex items-center gap-2">
          <div className="h-11 w-[92px] animate-pulse rounded-full bg-white/5" />
          <div className="h-11 w-[124px] animate-pulse rounded-full bg-white/5" />
        </div>
      ) : user ? (
        <>
          <Link
            href="/mi-cuenta"
            className="text-right transition hover:text-ember"
          >
            <p className="whitespace-nowrap text-sm font-semibold text-sand">Mi cuenta</p>
            <p className="hidden whitespace-nowrap text-xs uppercase tracking-eyebrow text-mist lg:block">
              Ver perfil
            </p>
          </Link>
          {/* En tablet el ancho no alcanza para el bloque completo. El badge es
              informativo y el botón Panel es redundante con el enlace "Admin"
              de la navegación, así que los dos se reservan para lg. */}
          <div className="hidden lg:block">
            <Badge variant={user.role === "ADMIN" ? "success" : "info"}>
              {user.role === "ADMIN" ? "Administrador" : "Cliente"}
            </Badge>
          </div>
          {user.role === "ADMIN" ? (
            <Link href="/admin" className="hidden lg:block">
              <Button variant="secondary" className="gap-2 px-4 py-2">
                <ShieldCheck className="h-4 w-4" />
                Panel
              </Button>
            </Link>
          ) : null}
          <LogoutButton compact />
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" className="px-4 py-2">
              Ingresar
            </Button>
          </Link>
          <Link href="/registro">
            <Button className="px-4 py-2">Crear cuenta</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
