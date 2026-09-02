"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api, getApiErrorMessage } from "@/lib/api-client";

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await api.delete(`/api/admin/products/${productId}`);
        setIsConfirmOpen(false);
        toast.success("Producto eliminado.");
        router.refresh();
      } catch (error) {
        toast.error(getApiErrorMessage(error, "No se pudo eliminar el producto."));
      }
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
