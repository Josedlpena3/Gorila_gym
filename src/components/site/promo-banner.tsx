import Link from "next/link";
import { Tag } from "lucide-react";

/**
 * Promoción real, no decorativa: `gorillastrong` es uno de los dos códigos que
 * `applyCheckoutDiscount` reconoce y aplica de verdad en el checkout, así que
 * lo que dice el cartel es lo que va a pagar el cliente.
 *
 * Si mañana cambia el código, se cambia acá y en lib/checkout-discounts.ts.
 */
const PROMO = {
  code: "GORILLASTRONG",
  label: "10% OFF",
  detail: "en tu primera compra con el código"
};

export function PromoBanner() {
  return (
    <Link
      href="/catalogo"
      className="group relative flex items-center justify-center gap-x-3 gap-y-1 overflow-hidden rounded-2xl border border-neon/35 bg-neon/[0.07] px-4 py-3 text-center transition hover:border-neon/60 hover:bg-neon/10 sm:flex-row"
    >
      {/* Brillo que respira detrás del cartel. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-pulse-glow bg-[radial-gradient(circle_at_50%_120%,rgba(220,38,38,0.28),transparent_60%)] motion-reduce:animate-none"
      />

      <Tag
        className="relative h-4 w-4 shrink-0 text-ember"
        aria-hidden="true"
      />
      <span className="relative text-sm text-mist">
        <strong className="font-black text-sand">{PROMO.label}</strong>{" "}
        {PROMO.detail}{" "}
        <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-ember">
          {PROMO.code}
        </span>
      </span>
    </Link>
  );
}
