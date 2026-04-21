"use client";

import { DeliveryMethod, PaymentMethod } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearGuestCart,
  getGuestCartSnapshot,
  subscribeToGuestCart
} from "@/lib/guest-cart";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { formatCurrency } from "@/lib/utils";
import type { CartDto } from "@/types";

type CheckoutFormUser = {
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

type CheckoutFormProps = {
  user: CheckoutFormUser | null;
  cart: CartDto | null;
  pickupAvailable: boolean;
  transferAvailable: boolean;
  transferAlias: string | null;
};

function getFullName(user: CheckoutFormUser | null) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
}

function splitFullName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  const [firstName = "", ...rest] = normalized.split(" ");

  return {
    firstName,
    lastName: rest.join(" ")
  };
}

function SelectorButton({
  active,
  children,
  disabled,
  onClick
}: {
  active: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "min-h-[52px] rounded-[24px] border px-4 py-3 text-left text-sm font-semibold transition",
        active
          ? "border-neon bg-neon/10 text-sand"
          : "border-line bg-ink/60 text-mist hover:border-neon/40 hover:text-sand",
        disabled ? "cursor-not-allowed opacity-50" : ""
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function CheckoutForm({
  user,
  cart,
  pickupAvailable,
  transferAvailable,
  transferAlias
}: CheckoutFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successOrderCode, setSuccessOrderCode] = useState<string | null>(null);
  const [guestCart, setGuestCart] = useState<CartDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultAddress = user?.addresses[0];
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    defaultAddress ? DeliveryMethod.SHIPMENT : DeliveryMethod.PICKUP
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transferAvailable ? PaymentMethod.BANK_TRANSFER : PaymentMethod.CASH
  );

  useEffect(() => {
    if (user) {
      return;
    }

    setGuestCart(getGuestCartSnapshot());

    return subscribeToGuestCart(() => {
      setGuestCart(getGuestCartSnapshot());
    });
  }, [user]);

  useEffect(() => {
    if (!pickupAvailable && deliveryMethod === DeliveryMethod.PICKUP) {
      setDeliveryMethod(DeliveryMethod.SHIPMENT);
    }
  }, [deliveryMethod, pickupAvailable]);

  useEffect(() => {
    if (!transferAvailable && paymentMethod === PaymentMethod.BANK_TRANSFER) {
      setPaymentMethod(PaymentMethod.CASH);
    }
  }, [paymentMethod, transferAvailable]);

  const activeCart = user ? cart : guestCart;

  if (successOrderCode) {
    return (
      <div className="section-card mx-auto max-w-2xl p-6 text-center sm:p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-mist">Pedido recibido</p>
        <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-sand sm:text-3xl">
          Ya registramos tu compra
        </h2>
        <p className="mt-4 text-sm leading-6 text-mist sm:text-base">
          Tu código es <span className="font-semibold text-sand">{successOrderCode}</span>.
          Te vamos a contactar por WhatsApp para coordinar la entrega.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/catalogo" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Seguir comprando</Button>
          </Link>
          <Link href="/encontranos" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">
              Ver información del local
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!user && activeCart === null) {
    return (
      <div className="section-card p-6 text-center sm:p-8">
        <p className="text-sm text-mist">Cargando tu carrito...</p>
      </div>
    );
  }

  if (!activeCart || activeCart.items.length === 0) {
    return (
      <div className="section-card p-6 text-center sm:p-8">
        <h2 className="text-xl font-black uppercase tracking-[0.08em] text-sand sm:text-2xl">
          Tu carrito está vacío
        </h2>
        <p className="mt-3 text-sm text-mist sm:text-base">
          Agregá productos al carrito para continuar con la compra.
        </p>
        <Link href="/catalogo" className="mt-6 inline-flex w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Ir al catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <form
      className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr] lg:gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);

          const phone = String(formData.get("phone") ?? "").trim();
          const fullName = String(formData.get("fullName") ?? "").trim();

          if (!isValidPhone(phone)) {
            setError("Ingresá un teléfono válido de al menos 8 dígitos.");
            return;
          }

          if (!fullName) {
            setError("Ingresá tu nombre.");
            return;
          }

          if (!deliveryMethod) {
            setError("Seleccioná una forma de entrega.");
            return;
          }

          if (!paymentMethod) {
            setError("Seleccioná una forma de pago.");
            return;
          }

          const { firstName, lastName } = splitFullName(fullName);

          if (!firstName) {
            setError("Ingresá tu nombre.");
            return;
          }

          const address =
            deliveryMethod === DeliveryMethod.SHIPMENT
              ? {
                  street: String(formData.get("street") ?? "").trim(),
                  number: String(formData.get("number") ?? "").trim(),
                  city: String(formData.get("city") ?? "").trim(),
                  province: String(formData.get("province") ?? "").trim(),
                  postalCode: String(formData.get("postalCode") ?? "").trim()
                }
              : undefined;

          const payloadBody: Record<string, unknown> = {
            firstName,
            lastName,
            phone: normalizePhone(phone),
            deliveryMethod,
            paymentMethod,
            address
          };

          if (!user) {
            payloadBody.items = activeCart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity
            }));
          }

          const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payloadBody)
          });

          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            setError(payload?.error ?? "No se pudo confirmar el pedido.");
            return;
          }

          if (user) {
            router.push(`/mis-pedidos?highlight=${payload.order.id}&created=1`);
            router.refresh();
            return;
          }

          clearGuestCart();
          setSuccessOrderCode(
            typeof payload?.order?.code === "string" ? payload.order.code : "pedido"
          );
        });
      }}
    >
      <div className="space-y-4 sm:space-y-6">
        <section className="section-card p-4 sm:p-6">
          <p className="text-base font-semibold text-sand sm:text-lg">Tus datos</p>
          <div className="mt-4 grid gap-4">
            <div className="space-y-2">
              <label className="text-sm text-mist">Nombre</label>
              <Input name="fullName" defaultValue={getFullName(user)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist">Celular</label>
              <Input
                type="tel"
                name="phone"
                defaultValue={user?.phone ?? ""}
                placeholder="5493515550000"
                inputMode="tel"
                autoComplete="tel"
                required
              />
              <p className="text-xs text-mist">Solo números. Ej.: 5493515550000</p>
            </div>
          </div>
        </section>

        <section className="section-card p-4 sm:p-6">
          <p className="text-base font-semibold text-sand sm:text-lg">Forma de entrega</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SelectorButton
              active={deliveryMethod === DeliveryMethod.PICKUP}
              disabled={!pickupAvailable}
              onClick={() => setDeliveryMethod(DeliveryMethod.PICKUP)}
            >
              Retiro en el local
            </SelectorButton>
            <SelectorButton
              active={deliveryMethod === DeliveryMethod.SHIPMENT}
              onClick={() => setDeliveryMethod(DeliveryMethod.SHIPMENT)}
            >
              Envío a domicilio
            </SelectorButton>
          </div>
          {deliveryMethod === DeliveryMethod.PICKUP ? (
            <p className="mt-3 text-sm text-mist">
              Coordinamos por WhatsApp el horario para retirar tu pedido.
            </p>
          ) : null}
        </section>

        {deliveryMethod === DeliveryMethod.SHIPMENT ? (
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
          </section>
        ) : null}

        <section className="section-card p-4 sm:p-6">
          <p className="text-base font-semibold text-sand sm:text-lg">Forma de pago</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SelectorButton
              active={paymentMethod === PaymentMethod.CASH}
              onClick={() => setPaymentMethod(PaymentMethod.CASH)}
            >
              Efectivo
            </SelectorButton>
            <SelectorButton
              active={paymentMethod === PaymentMethod.BANK_TRANSFER}
              disabled={!transferAvailable}
              onClick={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
            >
              Transferencia
            </SelectorButton>
          </div>
          {paymentMethod === PaymentMethod.BANK_TRANSFER && transferAvailable ? (
            <p className="mt-3 text-sm text-mist">
              Si querés, podés adelantar la transferencia. Alias:{" "}
              <span className="font-semibold text-sand">{transferAlias}</span>
            </p>
          ) : null}
        </section>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>

      <aside className="section-card h-fit p-4 sm:p-6 lg:sticky lg:top-24">
        <p className="text-base font-semibold text-sand sm:text-lg">
          Resumen de compra
        </p>
        <div className="mt-5 space-y-3 text-sm text-mist">
          {activeCart.items.map((item) => (
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
            <span>{formatCurrency(activeCart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-mist">
            <span>Entrega</span>
            <span>
              {deliveryMethod === DeliveryMethod.PICKUP
                ? "Retiro en el local"
                : "Envío a domicilio"}
            </span>
          </div>
          <div className="flex justify-between text-mist">
            <span>Pago</span>
            <span>
              {paymentMethod === PaymentMethod.BANK_TRANSFER ? "Transferencia" : "Efectivo"}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold text-sand">
            <span>Total</span>
            <span>{formatCurrency(activeCart.subtotal)}</span>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist">
          Confirmamos el pedido por WhatsApp con tu forma de entrega y pago elegida.
        </div>

        <Button className="mt-6 min-h-[52px] w-full text-base sm:text-sm" disabled={isPending}>
          {isPending ? "Confirmando pedido..." : "Confirmar pedido"}
        </Button>
      </aside>
    </form>
  );
}
