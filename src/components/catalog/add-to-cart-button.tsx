"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useSession } from "@/components/auth/session-provider";
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
  quantity?: number;
  disabled?: boolean;
};

export function AddToCartButton({
  productId,
  productSlug,
  productName,
  productBrand,
  productImage,
  productPrice,
  productStock,
  quantity = 1,
  disabled
}: AddToCartButtonProps) {
  const router = useRouter();
  const { user, status, refresh } = useSession();
  const [isPending, startTransition] = useTransition();

  function saveToGuestCart() {
    addGuestCartItem({
      productId,
      slug: productSlug,
      name: productName,
      brand: productBrand,
      image: productImage,
      unitPrice: productPrice,
      stock: productStock,
      quantity
    });
    router.push("/carrito");
  }

  return (
    <Button
      className="w-full"
      disabled={disabled || isPending}
      onClick={() =>
        startTransition(async () => {
          // El destino del producto se decide en runtime y no con un prop del
          // servidor: así la tarjeta puede vivir en una página prerenderizada
          // sin arriesgar que un usuario logueado termine en el carrito de
          // invitado.
          if (status === "ready" && !user) {
            saveToGuestCart();
            return;
          }

          try {
            const response = await fetch("/api/cart/items", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                productId,
                quantity
              })
            });

            if (response.ok) {
              router.push("/carrito");
              router.refresh();
              return;
            }

            // 401 = sin sesión o sesión vencida. Antes esto era un error a la
            // cara del cliente; ahora el producto se guarda en el carrito de
            // invitado y se recupera al iniciar sesión.
            if (response.status === 401) {
              await refresh();
              saveToGuestCart();
              return;
            }

            const error = await response.json().catch(() => null);
            const { toast } = await import("sonner");
            toast.error(error?.error ?? "No se pudo agregar el producto al carrito.");
          } catch {
            const { toast } = await import("sonner");
            toast.error("No se pudo agregar el producto al carrito.");
          }
        })
      }
    >
      {isPending ? "Agregando..." : "Agregar al carrito"}
    </Button>
  );
}
