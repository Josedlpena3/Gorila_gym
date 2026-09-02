"use client";

import { DiscountType, PaymentMethod } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type DiscountFormProps = {
  discount?: {
    id: string;
    name: string;
    description: string | null;
    code: string | null;
    type: DiscountType;
    value: number;
    paymentMethod: PaymentMethod | null;
    province: string | null;
    active: boolean;
    startsAt: string | null;
    endsAt: string | null;
  };
};

function formatDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return offsetDate.toISOString().slice(0, 16);
}

export function DiscountForm({ discount }: DiscountFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(discount);

  async function handleDelete() {
    if (!discount) {
      return;
    }

    startTransition(async () => {
      setError(null);

      const response = await fetch(`/api/admin/discounts/${discount.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "No se pudo eliminar la promoción.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <form
      className="section-card space-y-4 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);

          const response = await fetch(
            isEditing ? `/api/admin/discounts/${discount!.id}` : "/api/admin/discounts",
            {
              method: isEditing ? "PATCH" : "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                name: formData.get("name"),
                description: formData.get("description"),
                code: formData.get("code"),
                type: formData.get("type"),
                value: Number(formData.get("value")),
                paymentMethod:
                  typeof formData.get("paymentMethod") === "string" &&
                  formData.get("paymentMethod") !== "ANY"
                    ? formData.get("paymentMethod")
                    : undefined,
                province: formData.get("province") || undefined,
                active: formData.get("active") === "true",
                startsAt: formData.get("startsAt") || undefined,
                endsAt: formData.get("endsAt") || undefined
              })
            }
          );

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            setError(
              payload?.error ??
                `No se pudo ${isEditing ? "actualizar" : "crear"} la promoción.`
            );
            return;
          }

          router.refresh();

          if (!isEditing) {
            event.currentTarget.reset();
          }
        });
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-display text-sand">
            {isEditing ? "Editar promoción" : "Nueva promoción"}
          </h2>
          <p className="text-sm text-mist">
            Podés limitar por provincia o vigencia.
          </p>
        </div>
        {discount ? (
          <Button
            type="button"
            variant="ghost"
            className="text-red-300 hover:text-red-200"
            disabled={isPending}
            onClick={() => void handleDelete()}
          >
            Eliminar
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          {(control) => (
            <Input
              {...control}
              name="name"
              placeholder="Promo Córdoba"
              required
              defaultValue={discount?.name}
            />
          )}
        </Field>
        <Field label="Código">
          {(control) => (
            <Input
              {...control}
              name="code"
              placeholder="OTONO10"
              defaultValue={discount?.code ?? ""}
            />
          )}
        </Field>
        <Field label="Tipo">
          {(control) => (
            <Select
              {...control}
              name="type"
              defaultValue={discount?.type ?? DiscountType.PERCENTAGE}
            >
              <option value={DiscountType.PERCENTAGE}>Porcentaje</option>
              <option value={DiscountType.FIXED}>Monto fijo</option>
            </Select>
          )}
        </Field>
        <Field label="Valor">
          {(control) => (
            <Input
              {...control}
              type="number"
              step="0.01"
              name="value"
              placeholder="10"
              required
              defaultValue={discount?.value}
            />
          )}
        </Field>
        <Field label="Provincia">
          {(control) => (
            <Input
              {...control}
              name="province"
              placeholder="Córdoba"
              defaultValue={discount?.province ?? ""}
            />
          )}
        </Field>
        <Field label="Inicio">
          {(control) => (
            <Input
              {...control}
              type="datetime-local"
              name="startsAt"
              defaultValue={formatDateTimeLocal(discount?.startsAt)}
            />
          )}
        </Field>
        <Field label="Fin">
          {(control) => (
            <Input
              {...control}
              type="datetime-local"
              name="endsAt"
              defaultValue={formatDateTimeLocal(discount?.endsAt)}
            />
          )}
        </Field>
        <Field label="Estado">
          {(control) => (
            <Select {...control} name="active" defaultValue={String(discount?.active ?? true)}>
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </Select>
          )}
        </Field>
      </div>

      <Field label="Descripción">
        {(control) => (
          <Input
            {...control}
            name="description"
            placeholder="Beneficio especial por zona o campaña."
            defaultValue={discount?.description ?? ""}
          />
        )}
      </Field>

      <FormError>{error}</FormError>
      <Button disabled={isPending}>
        {isPending
          ? isEditing
            ? "Guardando..."
            : "Creando..."
          : isEditing
            ? "Guardar cambios"
            : "Crear promoción"}
      </Button>
    </form>
  );
}
