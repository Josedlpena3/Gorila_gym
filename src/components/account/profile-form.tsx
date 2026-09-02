"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormStatus } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type ProfileFormProps = {
  user: {
    firstName: string;
    lastName: string;
    phone: string;
    addresses: Array<{
      label: string;
      recipientName: string;
      street: string;
      number: string;
      city: string;
      province: string;
      postalCode: string;
    }>;
  };
};

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultAddress = user.addresses[0];

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setMessage(null);

          const response = await fetch("/api/users/me", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              firstName: formData.get("firstName"),
              lastName: formData.get("lastName"),
              phone: formData.get("phone"),
              address: {
                label: formData.get("label"),
                recipientName: formData.get("recipientName"),
                street: formData.get("street"),
                number: formData.get("number"),
                city: formData.get("city"),
                province: formData.get("province"),
                postalCode: formData.get("postalCode")
              }
            })
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            setMessage(payload?.error ?? "No se pudo guardar el perfil.");
            return;
          }

          setMessage("Perfil actualizado.");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          {(control) => (
            <Input {...control} name="firstName" defaultValue={user.firstName} required />
          )}
        </Field>
        <Field label="Apellido">
          {(control) => (
            <Input {...control} name="lastName" defaultValue={user.lastName} required />
          )}
        </Field>
      </div>

      <Field label="Teléfono">
        {(control) => (
          <Input {...control} name="phone" defaultValue={user.phone} required />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Etiqueta de dirección">
          {(control) => (
            <Input {...control} name="label" defaultValue={defaultAddress?.label ?? "Casa"} />
          )}
        </Field>
        <Field label="Destinatario">
          {(control) => (
            <Input
              {...control}
              name="recipientName"
              defaultValue={
                defaultAddress?.recipientName ?? `${user.firstName} ${user.lastName}`
              }
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr,1fr]">
        <Field label="Calle">
          {(control) => (
            <Input {...control} name="street" defaultValue={defaultAddress?.street ?? ""} />
          )}
        </Field>
        <Field label="Número">
          {(control) => (
            <Input {...control} name="number" defaultValue={defaultAddress?.number ?? ""} />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Ciudad">
          {(control) => (
            <Input {...control} name="city" defaultValue={defaultAddress?.city ?? ""} />
          )}
        </Field>
        <Field label="Provincia">
          {(control) => (
            <Input {...control} name="province" defaultValue={defaultAddress?.province ?? ""} />
          )}
        </Field>
        <Field label="Código postal">
          {(control) => (
            <Input {...control} name="postalCode" defaultValue={defaultAddress?.postalCode ?? ""} />
          )}
        </Field>
      </div>

      <FormStatus>{message}</FormStatus>

      <Button disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar perfil"}
      </Button>
    </form>
  );
}

