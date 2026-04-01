"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

type AddToCartButtonProps = {
  productId: string;
  disabled?: boolean;
  requiresLogin?: boolean;
  nextPath?: string;
};

export function AddToCartButton({
  productId,
  disabled,
  requiresLogin,
  nextPath = "/catalogo"
}: AddToCartButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className="w-full"
      disabled={disabled || isPending}
      onClick={() =>
        startTransition(async () => {
          if (requiresLogin) {
            router.push(`/login?next=${encodeURIComponent(nextPath)}`);
            return;
          }

          const response = await fetch("/api/cart/items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              productId,
              quantity: 1
            })
          });

          if (response.ok) {
            router.push("/carrito");
            router.refresh();
            return;
          }

          const error = await response.json().catch(() => null);
          alert(error?.error ?? "No se pudo agregar el producto al carrito.");
        })
      }
    >
      {isPending ? "Agregando..." : "Agregar al carrito"}
    </Button>
  );
}
