"use client";

import { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from "@/lib/api-client";
import { Field, FormError, FormStatus } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export function OrderStatusForm({
  orderId,
  currentStatus
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  async function submitOrderAction(payload: {
    status: OrderStatus;
  }) {
    setError(null);
    setFeedback(null);

    try {
      const result = await api.patch<{ status?: string }>(
        `/api/admin/orders/${orderId}`,
        payload
      );

      if (result?.status) {
        setStatus(result.status as OrderStatus);
      }

      setFeedback("Estado actualizado.");
      router.refresh();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, "No se pudo actualizar el pedido."));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Estado" className="min-w-[210px] flex-1">
          {(control) => (
            <Select
              {...control}
              name="status"
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
          )}
        </Field>
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
      </div>

      {feedback ? <FormStatus className="text-ember">{feedback}</FormStatus> : null}
      <FormError>{error}</FormError>
    </div>
  );
}
