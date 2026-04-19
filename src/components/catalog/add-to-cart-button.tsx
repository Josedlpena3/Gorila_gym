"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addGuestCartItem } from "@/lib/guest-cart";

type AddToCartButtonProps = {
  productId: string;
  productSlug: string;
  productName: string;
  productBrand: string;
  productImage: string | null;
  productPrice: number;
  productStock: number;
  disabled?: boolean;
  requiresLogin?: boolean;
  nextPath?: string;
};

export function AddToCartButton({
  productId,
  productSlug,
  productName,
  productBrand,
  productImage,
  productPrice,
  productStock,
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
            addGuestCartItem({
              productId,
              slug: productSlug,
              name: productName,
              brand: productBrand,
              image: productImage,
              unitPrice: productPrice,
              stock: productStock,
              quantity: 1
            });
            router.push("/carrito");
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
