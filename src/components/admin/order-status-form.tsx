"use client";

import { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export function OrderStatusForm({
  orderId,
  currentStatus,
  paymentMethod
}: {
  orderId: string;
  currentStatus: OrderStatus;
  paymentMethod: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  async function submitOrderAction(payload: { status?: OrderStatus; action?: "confirm-transfer" }) {
    setError(null);
    setFeedback(null);

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.error ?? "No se pudo actualizar el pedido.");
      return;
    }

    if (result?.status) {
      setStatus(result.status as OrderStatus);
    }

    setFeedback(
      payload.action === "confirm-transfer"
        ? "Transferencia confirmada."
        : "Estado actualizado."
    );
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          className="min-w-[210px]"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as OrderStatus);
            setFeedback(null);
            setError(null);
          }}
        >
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await submitOrderAction({ status });
            })
          }
        >
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
        {paymentMethod === "BANK_TRANSFER" ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await submitOrderAction({ action: "confirm-transfer" });
              })
            }
          >
            {isPending ? "Actualizando..." : "Confirmar transferencia"}
          </Button>
        ) : null}
      </div>

      {feedback ? <p className="text-sm text-neon">{feedback}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
