"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const ORDER_COLOR_OPTIONS = [
  { value: "green", label: "Verde" },
  { value: "blue", label: "Azul" },
  { value: "red", label: "Rojo" }
] as const;

type OrderColorValue = (typeof ORDER_COLOR_OPTIONS)[number]["value"];

function getInitialColor(color: string | null) {
  return ORDER_COLOR_OPTIONS.some((option) => option.value === color)
    ? (color as OrderColorValue)
    : "green";
}

export function OrderVisualForm({
  orderId,
  currentColored,
  currentColor,
  currentSellerName
}: {
  orderId: string;
  currentColored: boolean;
  currentColor: string | null;
  currentSellerName: string | null;
}) {
  const router = useRouter();
  const [colored, setColored] = useState(currentColored);
  const [color, setColor] = useState<OrderColorValue>(getInitialColor(currentColor));
  const [sellerName, setSellerName] = useState(currentSellerName ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setColored(currentColored);
    setColor(getInitialColor(currentColor));
    setSellerName(currentSellerName ?? "");
    setFeedback(null);
    setError(null);
  }, [currentColor, currentColored, currentSellerName]);

  async function submitVisualUpdate() {
    setFeedback(null);
    setError(null);

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        colored,
        color: colored ? color : null,
        sellerName: colored ? sellerName.trim() || null : null
      })
    });

    const result = (await response.json().catch(() => null)) as
      | {
          error?: string;
          colored?: boolean;
          color?: string | null;
          sellerName?: string | null;
        }
      | null;

    if (!response.ok) {
      setError(result?.error ?? "No se pudo actualizar el marcado del pedido.");
      return;
    }

    setColored(Boolean(result?.colored ?? colored));
    setColor(getInitialColor(result?.color ?? color));
    setSellerName(result?.sellerName ?? (colored ? sellerName.trim() : ""));
    setFeedback("Marcado actualizado.");
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist">
      <p className="text-xs uppercase tracking-[0.24em] text-mist">Marcado interno</p>

      <label className="flex items-center gap-3 text-sand">
        <input
          type="checkbox"
          checked={colored}
          onChange={(event) => {
            const nextColored = event.target.checked;
            setColored(nextColored);
            if (!nextColored) {
              setSellerName("");
            }
            setFeedback(null);
            setError(null);
          }}
          className="h-4 w-4 rounded border-line bg-ink/70 accent-lime-400"
        />
        Marcar pedido
      </label>

      {colored ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-mist">Color</label>
            <Select
              value={color}
              onChange={(event) => {
                setColor(event.target.value as OrderColorValue);
                setFeedback(null);
                setError(null);
              }}
            >
              {ORDER_COLOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-mist">
              Vendedor
            </label>
            <Input
              value={sellerName}
              placeholder="Nombre del vendedor"
              onChange={(event) => {
                setSellerName(event.target.value);
                setFeedback(null);
                setError(null);
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await submitVisualUpdate();
            })
          }
        >
          {isPending ? "Guardando..." : "Guardar marcado"}
        </Button>
        {feedback ? <p className="text-sm text-neon">{feedback}</p> : null}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
