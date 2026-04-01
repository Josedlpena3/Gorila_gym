"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      disabled={isPending}
      onClick={() => {
        const confirmed = window.confirm(
          "¿Querés eliminar o archivar este producto?"
        );

        if (!confirmed) {
          return;
        }

        startTransition(async () => {
          const response = await fetch(`/api/admin/products/${productId}`, {
            method: "DELETE"
          });

          if (!response.ok) {
            alert("No se pudo eliminar el producto.");
            return;
          }

          router.refresh();
        });
      }}
    >
      {isPending ? "Eliminando..." : "Eliminar"}
    </Button>
  );
}

