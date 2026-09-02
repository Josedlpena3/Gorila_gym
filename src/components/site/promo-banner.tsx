import Link from "next/link";
import { Banknote } from "lucide-react";

/**
 * El 10% por pago en efectivo se aplica a mano al cobrar, no lo calcula el
 * checkout: `applyPaymentSurcharge` devuelve el total sin cambios. Por eso el
 * cartel aclara "al momento de pagar" — si dijera solamente "10% OFF", el
 * cliente vería el total completo en el checkout y pensaría que no se aplicó.
 *
 * Si algún día el descuento se calcula en el sistema, este texto y la nota del
 * checkout (checkout-form, sección de forma de pago) se ajustan juntos.
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
      <span className="relative text-xs text-mist/70">
        · sin código, te lo descontamos al momento de pagar
      </span>
    </Link>
  );
}
