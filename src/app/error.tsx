"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error-boundary]", error);
  }, [error]);

  return (
    <div className="page-shell py-10">
      <div className="section-card p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-mist">Error</p>
        <h1 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-sand sm:text-3xl">
          Ocurrió un error inesperado.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-mist sm:text-base">
          La aplicación respondió con un estado visible en lugar de caer en un
          comportamiento ambiguo. Podés reintentar la carga después de revisar la
          conexión a la base de datos o la configuración de variables de entorno.
        </p>
        <div className="mt-6">
          <Button onClick={() => reset()}>Reintentar</Button>
        </div>
      </div>
    </div>
  );
}
