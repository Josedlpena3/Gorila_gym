"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CartItemControls } from "@/components/cart/cart-item-controls";
import { formatCurrency } from "@/lib/utils";

type CartItemData = {
  id: string;
  productId: string;
  name: string;
  brand: string;
  image: string | null;
  stock: number;
  quantity: number;
  subtotal: number;
};

export function CartItem({ item }: { item: CartItemData }) {
  const router = useRouter();

  async function handleRemove() {
    const response = await fetch("/api/cart/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: item.productId })
    });

    if (response.ok) {
      router.refresh();
    } else {
      alert("No se pudo quitar el producto.");
    }
  }

  return (
    <article className="flex gap-3 rounded-[28px] border border-line bg-ink/60 p-4 sm:gap-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl sm:h-28 sm:w-28">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-contain p-3"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-steel text-xs text-mist">
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
          <CartItemControls
            productId={item.productId}
            quantity={item.quantity}
            stock={item.stock}
            onRemove={handleRemove}
          />
          <p className="text-xl font-black text-sand sm:text-right">
            {formatCurrency(item.subtotal)}
          </p>
        </div>
      </div>
    </article>
  );
}
