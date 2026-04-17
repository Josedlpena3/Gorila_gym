"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isValidWhatsAppPhone, normalizeWhatsAppPhone } from "@/lib/phone";
import { formatCurrency } from "@/lib/utils";
import type { CartDto } from "@/types";

type CheckoutFormProps = {
  user: {
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    phone: string;
    addresses: Array<{
      street: string;
      number: string;
      city: string;
      province: string;
      postalCode: string;
    }>;
  };
  cart: CartDto;
};

export function CheckoutForm({ user, cart }: CheckoutFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultAddress = user.addresses[0];

  return (
    <form
      className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr] lg:gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);

          const phone = String(formData.get("phone") ?? "").trim();
          const notes = String(formData.get("notes") ?? "").trim();

          if (!isValidWhatsAppPhone(phone)) {
            setError(
              "Ingresá un celular válido de WhatsApp con código de área. Ej.: +54 9 351 555 0000"
            );
            return;
          }

          const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              firstName: formData.get("firstName"),
              lastName: formData.get("lastName"),
              phone: normalizeWhatsAppPhone(phone),
              address: {
                street: formData.get("street"),
                number: formData.get("number"),
                city: formData.get("city"),
                province: formData.get("province"),
                postalCode: formData.get("postalCode")
              },
              notes: notes.length > 0 ? notes : undefined
            })
          });

          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            setError(payload?.error ?? "No se pudo confirmar el pedido.");
            return;
          }

          router.push(`/mis-pedidos?highlight=${payload.order.id}&created=1`);
          router.refresh();
        });
      }}
    >
      <div className="space-y-4 sm:space-y-6">
        <section className="section-card p-4 sm:p-6">
          <p className="text-base font-semibold text-sand sm:text-lg">Datos de contacto</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-mist">Nombre</label>
              <Input name="firstName" defaultValue={user.firstName} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist">Apellido</label>
              <Input name="lastName" defaultValue={user.lastName} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-mist">Celular</label>
              <Input
                type="tel"
                name="phone"
                defaultValue={user.phone}
                placeholder="+54 9 351 555 0000"
                inputMode="tel"
                autoComplete="tel"
                required
              />
              <p className="text-xs text-mist">
                Usá un número válido de WhatsApp con código de área.
              </p>
            </div>
          </div>
        </section>

        <section className="section-card p-4 sm:p-6">
          <p className="text-base font-semibold text-sand sm:text-lg">Dirección</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-mist">Calle</label>
              <Input name="street" defaultValue={defaultAddress?.street ?? ""} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist">Número</label>
              <Input name="number" defaultValue={defaultAddress?.number ?? ""} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist">Código postal</label>
              <Input
                name="postalCode"
                defaultValue={defaultAddress?.postalCode ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist">Ciudad</label>
              <Input name="city" defaultValue={defaultAddress?.city ?? ""} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist">Provincia</label>
              <Input
                name="province"
                defaultValue={defaultAddress?.province ?? ""}
                required
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm text-mist">Notas del pedido</label>
            <Textarea
              name="notes"
              placeholder="Horarios, referencias o aclaraciones para coordinar."
              className="min-h-[100px] sm:min-h-[120px]"
            />
          </div>
        </section>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>

      <aside className="section-card h-fit p-4 sm:p-6 lg:sticky lg:top-24">
        <p className="text-base font-semibold text-sand sm:text-lg">
          Resumen de compra
        </p>
        <div className="mt-5 space-y-3 text-sm text-mist">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sand">{item.name}</p>
                <p>
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <p className="font-semibold text-sand">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-mist">
            <span>Total de productos</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist">
          {user.emailVerified
            ? "Al confirmar el pedido, lo recibimos y te contactamos por WhatsApp para coordinar la entrega."
            : "Primero necesitás verificar tu email. Después vas a poder confirmar el pedido normalmente."}
        </div>

        <Button
          className="mt-6 min-h-[52px] w-full text-base sm:text-sm"
          disabled={isPending || !user.emailVerified}
        >
          {isPending
            ? "Confirmando pedido..."
            : user.emailVerified
              ? "Confirmar pedido"
              : "Verificá tu email para comprar"}
        </Button>
      </aside>
    </form>
  );
}
