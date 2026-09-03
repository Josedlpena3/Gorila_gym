import Link from "next/link";
import { Banknote } from "lucide-react";

/**
 * El 10% por pago en efectivo se aplica a mano al cobrar, no lo calcula el
 * checkout: `applyPaymentSurcharge` devuelve el total sin cambios.
 *
 * El cartel solo anuncia el beneficio; la aclaración de cuándo se aplica vive
 * en el checkout, que es donde el cliente ve el total completo y podría creer
 * que no se lo hicieron. Si algún día el descuento se calcula en el sistema,
 * este texto y esa nota se ajustan juntos.
 */
export function PromoBanner() {
  return (
    <Link
      href="/catalogo"
      className="group relative flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 overflow-hidden rounded-2xl border border-neon/35 bg-neon/[0.07] px-4 py-3 text-center transition hover:border-neon/60 hover:bg-neon/10"
    >
      {/* Brillo que respira detrás del cartel. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-pulse-glow bg-[radial-gradient(circle_at_50%_120%,rgba(220,38,38,0.28),transparent_60%)] motion-reduce:animate-none"
      />

      <Banknote
        className="relative h-4 w-4 shrink-0 text-ember"
        aria-hidden="true"
      />
      <span className="relative text-sm text-mist">
        <strong className="font-black text-sand">10% OFF</strong> pagando en
        efectivo
      </span>
    </Link>
  );
}
