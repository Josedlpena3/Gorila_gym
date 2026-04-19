"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  getGuestCartSnapshot,
  removeGuestCartItem,
  subscribeToGuestCart,
  updateGuestCartItemQuantity
} from "@/lib/guest-cart";

export function GuestCartView() {
  const [cart, setCart] = useState(() => getGuestCartSnapshot());

  useEffect(() => {
    setCart(getGuestCartSnapshot());

    return subscribeToGuestCart(() => {
      setCart(getGuestCartSnapshot());
    });
  }, []);

  if (cart.items.length === 0) {
    return (
      <div className="page-shell">
        <div className="section-card mx-auto max-w-2xl p-6 text-center sm:p-10">
          <h1 className="text-2xl font-black uppercase tracking-[0.08em] text-sand sm:text-3xl">
            Tu carrito está vacío
          </h1>
          <p className="mt-4 text-mist">
            Explorá el catálogo y agregá suplementos para continuar.
          </p>
          <Link href="/catalogo" className="mt-6 inline-flex">
            <Button>Ir al catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-4">
      <Link
        href="/catalogo"
        className="inline-flex items-center text-sm font-semibold text-sand transition hover:text-neon"
      >
        &larr; Volver a comprar
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr] lg:gap-6">
        <section className="section-card p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-mist">Carrito</p>
              <h1 className="text-2xl font-black uppercase tracking-[0.08em] text-sand sm:text-3xl">
                Tu selección
              </h1>
              <p className="mt-2 text-sm text-mist">
                Podés armar tu carrito sin login. Te pedimos acceso recién al finalizar la compra.
              </p>
            </div>
            <p className="text-sm text-mist">{cart.itemCount} unidades</p>
          </div>

          <div className="mt-6 space-y-4">
            {cart.items.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-[96px,1fr] gap-4 rounded-[28px] border border-line bg-ink/60 p-4 sm:grid-cols-[120px,1fr]"
              >
                <div className="relative h-24 overflow-hidden rounded-3xl bg-steel sm:h-28">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-3"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-mist">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-mist">{item.brand}</p>
                    <h2 className="mt-2 text-lg font-semibold leading-tight text-sand sm:text-xl">
                      {item.name}
                    </h2>
                    <p className="mt-2 text-sm text-mist">
                      Stock disponible: {item.stock} unidades
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          className="px-4 py-2 text-lg"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            updateGuestCartItemQuantity(item.productId, item.quantity - 1)
                          }
                        >
                          -
                        </button>
                        <span className="min-w-10 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          className="px-4 py-2 text-lg"
                          disabled={item.quantity >= item.stock}
                          onClick={() =>
                            updateGuestCartItemQuantity(item.productId, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <Button
                        variant="danger"
                        className="px-4 py-2 text-red-100"
                        onClick={() => removeGuestCartItem(item.productId)}
                      >
                        Quitar
                      </Button>
                    </div>
                    <p className="text-xl font-black text-sand">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="section-card h-fit p-4 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-black uppercase tracking-[0.08em] text-sand sm:text-2xl">
            Resumen
          </h2>
          <div className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
            <div className="flex items-center justify-between text-mist">
              <span>Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-mist">
              <span>Entrega</span>
              <span>Se coordina por WhatsApp</span>
            </div>
            <div className="flex items-center justify-between text-xl font-black text-sand">
              <span>Total estimado</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
          </div>
          <Link href="/login?next=/checkout" className="mt-6 inline-flex w-full">
            <Button className="min-h-[52px] w-full">Continuar con el pedido</Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
