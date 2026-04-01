"use client";

import { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        className="min-w-[210px]"
        value={status}
        onChange={(event) => setStatus(event.target.value as OrderStatus)}
      >
        {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Button
        variant="secondary"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await fetch(`/api/admin/orders/${orderId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ status })
            });
            router.refresh();
          })
        }
      >
        Guardar
      </Button>
      {paymentMethod === "BANK_TRANSFER" ? (
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ action: "confirm-transfer" })
              });
              router.refresh();
            })
          }
        >
          Confirmar transferencia
        </Button>
      ) : null}
    </div>
  );
}

