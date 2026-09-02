"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        toast.error("No se pudo eliminar el producto.");
        return;
      }

      setIsConfirmOpen(false);
      toast.success("Producto eliminado.");
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="danger"
        disabled={isPending}
        onClick={() => setIsConfirmOpen(true)}
      >
        {isPending ? "Eliminando..." : "Eliminar"}
      </Button>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Eliminar producto"
        description="Si el producto ya tiene pedidos asociados se archiva en lugar de borrarse, para no romper el historial de ventas."
        confirmLabel="Eliminar"
        isPending={isPending}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
