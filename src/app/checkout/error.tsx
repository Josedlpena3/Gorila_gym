"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * El checkout es la pantalla donde un error cuesta una venta. Contenerlo acá
 * deja el header y la navegación en pie, y le dice al cliente lo único que le
 * importa saber: que su carrito sigue estando.
 */
export default function CheckoutError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[checkout-error-boundary]", error);
  }, [error]);

  return (
    <div className="page-shell">
      <div className="section-card mx-auto max-w-2xl p-6 text-center sm:p-8">
        <p className="text-xs uppercase tracking-eyebrow-wide text-mist">Checkout</p>
        <h1 className="mt-3 text-2xl font-black uppercase tracking-display text-sand sm:text-3xl">
          No pudimos preparar tu pedido
        </h1>
        <p className="mt-4 text-sm leading-7 text-mist sm:text-base">
          Tu carrito sigue guardado, no perdiste nada. Reintentá en unos
          segundos y, si el problema sigue, escribinos por WhatsApp y lo
          cerramos juntos.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => reset()}>
            Reintentar
          </Button>
          <Link href="/carrito">
            <Button variant="secondary">Volver al carrito</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
