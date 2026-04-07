"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

type CartItemControlsProps = {
  productId: string;
  quantity: number;
  stock: number;
};

export function CartItemControls({
  productId,
  quantity,
  stock
}: CartItemControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const updateQuantity = (nextQuantity: number) =>
    startTransition(async () => {
      const response = await fetch("/api/cart/items", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId,
          quantity: nextQuantity
        })
      });

      if (response.ok) {
        router.refresh();
        return;
      }

      const error = await response.json().catch(() => null);
      alert(error?.error ?? "No se pudo actualizar el carrito.");
    });

  const removeItem = () =>
    startTransition(async () => {
      const response = await fetch("/api/cart/items", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ productId })
      });

      if (response.ok) {
        router.refresh();
        return;
      }

      alert("No se pudo quitar el producto.");
    });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-full border border-line">
        <button
          className="px-4 py-2 text-lg"
          disabled={isPending || quantity <= 1}
          onClick={() => updateQuantity(quantity - 1)}
        >
          -
        </button>
        <span className="min-w-10 text-center text-sm font-semibold">{quantity}</span>
        <button
          className="px-4 py-2 text-lg"
          disabled={isPending || quantity >= stock}
          onClick={() => updateQuantity(quantity + 1)}
        >
          +
        </button>
      </div>
      <Button
        variant="danger"
        className="px-4 py-2 text-red-100"
        onClick={removeItem}
      >
        Quitar
      </Button>
    </div>
  );
}
