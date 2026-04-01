"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
        <div className="space-y-2">
          <label className="text-sm text-mist">Nombre</label>
          <Input name="firstName" defaultValue={user.firstName} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Apellido</label>
          <Input name="lastName" defaultValue={user.lastName} required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-mist">Teléfono</label>
        <Input name="phone" defaultValue={user.phone} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-mist">Etiqueta de dirección</label>
          <Input name="label" defaultValue={defaultAddress?.label ?? "Casa"} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Destinatario</label>
          <Input
            name="recipientName"
            defaultValue={
              defaultAddress?.recipientName ?? `${user.firstName} ${user.lastName}`
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr,1fr]">
        <div className="space-y-2">
          <label className="text-sm text-mist">Calle</label>
          <Input name="street" defaultValue={defaultAddress?.street ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Número</label>
          <Input name="number" defaultValue={defaultAddress?.number ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm text-mist">Ciudad</label>
          <Input name="city" defaultValue={defaultAddress?.city ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Provincia</label>
          <Input name="province" defaultValue={defaultAddress?.province ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Código postal</label>
          <Input name="postalCode" defaultValue={defaultAddress?.postalCode ?? ""} />
        </div>
      </div>

      {message ? <p className="text-sm text-mist">{message}</p> : null}

      <Button disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar perfil"}
      </Button>
    </form>
  );
}

