"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Contiene los fallos dentro del área de contenido del panel.
 *
 * Antes solo existía el error.tsx de la raíz: cualquier consulta que fallara
 * reemplazaba la pantalla completa, navegación incluida, y dejaba al
 * administrador sin manera de moverse a otra sección.
 */
export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin-error-boundary]", error);
  }, [error]);

  return (
    <div className="section-card p-6 sm:p-8">
      <p className="text-xs uppercase tracking-eyebrow-wide text-mist">Panel</p>
      <h1 className="mt-3 text-2xl font-black uppercase tracking-display text-sand sm:text-3xl">
        No pudimos cargar esta sección
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-mist sm:text-base">
        El resto del panel sigue funcionando: podés cambiar de sección desde el
        menú. Si vuelve a pasar, reintentá en un minuto.
      </p>

      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-mist">
          Referencia del error: {error.digest}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" onClick={() => reset()}>
          Reintentar
        </Button>
        <Link href="/admin">
          <Button variant="secondary">Ir al inicio del panel</Button>
        </Link>
      </div>
    </div>
  );
}
