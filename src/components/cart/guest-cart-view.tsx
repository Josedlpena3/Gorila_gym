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

const MAX_QTY = 99;

function GuestItemControls({
  productId,
  quantity,
  stock,
  onRemove
}: {
  productId: string;
  quantity: number;
  stock: number;
  onRemove: () => void;
}) {
  const [inputValue, setInputValue] = useState(String(quantity));

  useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  function changeQty(next: number) {
    const clamped = Math.max(1, Math.min(next, MAX_QTY, stock));
    setInputValue(String(clamped));
    updateGuestCartItemQuantity(productId, clamped);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    setInputValue(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 1) {
      const clamped = Math.min(num, MAX_QTY, stock);
      updateGuestCartItemQuantity(productId, clamped);
    }
  }

  function handleInputCommit() {
    const num = parseInt(inputValue, 10);
    const clamped = !isNaN(num) && num >= 1 ? Math.min(num, MAX_QTY, stock) : quantity;
    setInputValue(String(clamped));
    updateGuestCartItemQuantity(productId, clamped);
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex min-h-11 items-center rounded-full border border-line">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center text-lg"
          disabled={quantity <= 1}
          onClick={() => changeQty(quantity - 1)}
        >
          -
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleInputCommit();
          }}
          className="w-[60px] bg-transparent text-center text-sm font-semibold focus:outline-none"
        />
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center text-lg"
          disabled={quantity >= stock || quantity >= MAX_QTY}
          onClick={() => changeQty(quantity + 1)}
        >
          +
        </button>
      </div>
      <Button
        variant="danger"
        className="w-full px-4 py-2 text-red-100 sm:w-auto"
        onClick={onRemove}
      >
        Quitar
      </Button>
    </div>
  );
}

export function GuestCartView() {
  const [cart, setCart] = useState(() => getGuestCartSnapshot());

  useEffect(() => {
    setCart(getGuestCartSnapshot());
    return subscribeToGuestCart(() => setCart(getGuestCartSnapshot()));
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
                className="flex gap-3 rounded-[28px] border border-line bg-ink/60 p-4 sm:gap-4"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-steel sm:h-28 sm:w-28">
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
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-mist">{item.brand}</p>
                    <h2 className="mt-2 text-lg font-semibold leading-tight text-sand sm:text-xl">
                      {item.name}
                    </h2>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <GuestItemControls
                      productId={item.productId}
                      quantity={item.quantity}
                      stock={item.stock}
                      onRemove={() => removeGuestCartItem(item.productId)}
                    />
                    <p className="text-xl font-black text-sand sm:text-right">
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
          <Link href="/checkout" className="mt-6 inline-flex w-full">
            <Button className="min-h-[52px] w-full">Continuar con el pedido</Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
