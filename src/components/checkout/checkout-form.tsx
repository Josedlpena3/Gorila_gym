"use client";

import { DeliveryMethod, PaymentMethod } from "@prisma/client";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearGuestCart,
  getGuestCartSnapshot,
  subscribeToGuestCart
} from "@/lib/guest-cart";
import { applyCheckoutDiscount } from "@/lib/checkout-discounts";
import { extractPhoneDigits, normalizePhone } from "@/lib/phone";
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
  transferConfig: {
    alias: string;
    cbu: string;
    accountHolder: string;
  } | null;
};

type OrderDeliveryMethodPayload = "retiro" | "envio";
type OrderPaymentMethodPayload = "efectivo" | "transferencia";

const STORE_WHATSAPP_NUMBER = "5493513552255";

function getFullName(user: CheckoutFormUser | null) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
}

function getOrderDeliveryMethodValue(
  deliveryMethod: DeliveryMethod
): OrderDeliveryMethodPayload {
  return deliveryMethod === DeliveryMethod.PICKUP ? "retiro" : "envio";
}

function getOrderPaymentMethodValue(
  paymentMethod: PaymentMethod
): OrderPaymentMethodPayload {
  return paymentMethod === PaymentMethod.BANK_TRANSFER ? "transferencia" : "efectivo";
}

function SelectorButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-h-[52px] rounded-[24px] border px-4 py-3 text-left text-sm font-semibold transition",
        active
          ? "border-neon bg-neon/10 text-sand"
          : "border-line bg-ink/60 text-mist hover:border-neon/40 hover:text-sand"
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function buildCheckoutWhatsappMessage(input: {
  customerName: string;
  phone: string;
  orderCode: string;
  items: CartDto["items"];
  total: number;
  discountApplied: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  transferConfig: CheckoutFormProps["transferConfig"];
}) {
  const products = input.items.map((item) => `- ${item.name} x${item.quantity}`).join("\n");
  const deliveryLabel =
    input.deliveryMethod === DeliveryMethod.PICKUP
      ? "Retiro en el local"
      : "Envío a domicilio";
  const transferDetails = input.transferConfig ?? {
    alias: "josedlp3",
    cbu: "0000003100097110373230",
    accountHolder: "Jose Ignacio de la Peña"
  };
  const baseMessage = [
    `Hola, soy ${input.customerName}.`,
    "",
    `Te contacto por mi pedido #${input.orderCode}.`,
    "",
    "Productos:",
    products,
    "",
    `Total: ${formatCurrency(input.total)}`,
    ...(input.discountApplied ? [`Descuento aplicado: ${input.discountApplied}`] : []),
    `Teléfono: ${input.phone}`,
    `Forma de entrega: ${deliveryLabel}`
  ];

  if (input.paymentMethod === PaymentMethod.BANK_TRANSFER) {
    return [
      ...baseMessage,
      "",
      "Elegiste la opción: Transferencia",
      "",
      "Datos bancarios:",
      `Alias: ${transferDetails.alias}`,
      `CVU: ${transferDetails.cbu}`,
      `Nombre: ${transferDetails.accountHolder}`,
      "",
      "Mandanos el comprobante para confirmar tu pedido."
    ].join("\n");
  }

  return [
    ...baseMessage,
    "",
    "Elegiste la opción: Efectivo"
  ].join("\n");
}

export function CheckoutForm({
  user,
  cart,
  pickupAvailable,
  transferAvailable,
  transferConfig
}: CheckoutFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [successOrderCode, setSuccessOrderCode] = useState<string | null>(null);
  const [guestCart, setGuestCart] = useState<CartDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultAddress = user?.addresses[0];
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    pickupAvailable ? DeliveryMethod.PICKUP : DeliveryMethod.SHIPMENT
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [discountCode, setDiscountCode] = useState("");

  useEffect(() => {
    if (user) {
      return;
    }

    setGuestCart(getGuestCartSnapshot());

    return subscribeToGuestCart(() => {
      setGuestCart(getGuestCartSnapshot());
    });
  }, [user]);

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
          Ya abrimos WhatsApp para que sigas la coordinación desde ahí.
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

  const discountPreview = applyCheckoutDiscount(
    discountCode,
    activeCart.subtotal,
    deliveryMethod
  );

  async function submitOrderToWhatsapp(pendingWhatsappWindow: Window | null) {
    if (!formRef.current) {
      pendingWhatsappWindow?.close();
      setError("No se pudo preparar el pedido.");
      return;
    }

    if (!activeCart || activeCart.items.length === 0) {
      pendingWhatsappWindow?.close();
      setError("Tu carrito está vacío.");
      return;
    }

    setError(null);

    const formData = new FormData(formRef.current);
    const phone = String(formData.get("phone") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const normalizedFullName = fullName.replace(/\s+/g, " ").trim();
    const [firstName = ""] = normalizedFullName.split(" ");

    if (!/^[0-9]+$/.test(phone)) {
      pendingWhatsappWindow?.close();
      setError("El teléfono debe tener solo números.");
      return;
    }

    if (phone.length < 8) {
      pendingWhatsappWindow?.close();
      setError("Ingresá un teléfono válido de al menos 8 dígitos.");
      return;
    }

    if (!fullName) {
      pendingWhatsappWindow?.close();
      setError("Ingresá tu nombre.");
      return;
    }

    if (firstName.length < 2) {
      pendingWhatsappWindow?.close();
      setError("Ingresá un nombre válido.");
      return;
    }

    if (deliveryMethod === DeliveryMethod.PICKUP && !pickupAvailable) {
      pendingWhatsappWindow?.close();
      setError("El retiro en el local no está disponible en este momento.");
      return;
    }

    if (paymentMethod === PaymentMethod.BANK_TRANSFER && !transferAvailable) {
      pendingWhatsappWindow?.close();
      setError("La transferencia no está disponible en este momento.");
      return;
    }

    const items = activeCart.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.unitPrice
    }));

    if (items.length === 0) {
      pendingWhatsappWindow?.close();
      setError("Tu carrito está vacío.");
      return;
    }

    if (
      items.some(
        (item) =>
          !item.name.trim() ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.price) ||
          item.price <= 0
      )
    ) {
      pendingWhatsappWindow?.close();
      setError("Hay productos inválidos en el pedido.");
      return;
    }

    if (!Number.isFinite(discountPreview.total) || discountPreview.total <= 0) {
      pendingWhatsappWindow?.close();
      setError("El total del pedido es inválido.");
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

    if (
      deliveryMethod === DeliveryMethod.SHIPMENT &&
      (!address ||
        !address.street ||
        !address.number ||
        !address.city ||
        !address.province ||
        !address.postalCode)
    ) {
      pendingWhatsappWindow?.close();
      setError("Completá la dirección para envío.");
      return;
    }

    const shipmentAddress =
      deliveryMethod === DeliveryMethod.SHIPMENT ? address ?? null : null;

    if (
      shipmentAddress &&
      (shipmentAddress.street.length < 2 ||
        shipmentAddress.city.length < 2 ||
        shipmentAddress.province.length < 2 ||
        shipmentAddress.postalCode.length < 3)
    ) {
      pendingWhatsappWindow?.close();
      setError("Revisá la dirección. Hay campos incompletos o inválidos.");
      return;
    }

    const payload: Record<string, unknown> = {
      name: normalizedFullName,
      phone: extractPhoneDigits(phone),
      items,
      total: discountPreview.total,
      deliveryMethod: getOrderDeliveryMethodValue(deliveryMethod),
      paymentMethod: getOrderPaymentMethodValue(paymentMethod),
      discountCode: discountPreview.discountCode,
      ...(shipmentAddress ? { address: shipmentAddress } : {})
    };

    if (!payload.discountCode) {
      delete payload.discountCode;
    }

    console.log("PAYLOAD ENVIADO:", payload);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          order?: {
            total?: number;
            code?: string;
          };
        }
      | null;

    if (!response.ok) {
      pendingWhatsappWindow?.close();
      setError(responsePayload?.error ?? "No se pudo confirmar el pedido.");
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    const finalTotal =
      typeof responsePayload?.order?.total === "number"
        ? responsePayload.order.total
        : discountPreview.total;
    const whatsappMessage = buildCheckoutWhatsappMessage({
      customerName: fullName,
      phone: normalizedPhone,
      orderCode:
        typeof responsePayload?.order?.code === "string"
          ? responsePayload.order.code
          : "pedido",
      items: activeCart.items,
      total: finalTotal,
      discountApplied: discountPreview.discountApplied,
      deliveryMethod,
      paymentMethod,
      transferConfig
    });
    const whatsappUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    if (pendingWhatsappWindow && !pendingWhatsappWindow.closed) {
      pendingWhatsappWindow.location.href = whatsappUrl;
    } else if (typeof window !== "undefined") {
      window.location.href = whatsappUrl;
    }

    clearGuestCart();
    setSuccessOrderCode(
      typeof responsePayload?.order?.code === "string"
        ? responsePayload.order.code
        : "pedido"
    );
  }

  function handleWhatsApp() {
    const pendingWhatsappWindow =
      typeof window !== "undefined" ? window.open("", "_blank") : null;

    startTransition(() => {
      void submitOrderToWhatsapp(pendingWhatsappWindow);
    });
  }

  return (
    <form
      ref={formRef}
      className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr] lg:gap-6"
      onSubmit={(event) => {
        event.preventDefault();
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
              onClick={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
            >
              Transferencia
            </SelectorButton>
          </div>
          {paymentMethod === PaymentMethod.BANK_TRANSFER && transferAvailable ? (
            <p className="mt-3 text-sm text-mist">
              Si querés, podés adelantar la transferencia. Alias:{" "}
              <span className="font-semibold text-sand">{transferConfig?.alias}</span>
            </p>
          ) : null}
        </section>

        <section className="section-card p-4 sm:p-6">
          <p className="text-base font-semibold text-sand sm:text-lg">
            Código de descuento
          </p>
          <div className="mt-4 space-y-2">
            <label className="text-sm text-mist" htmlFor="discountCode">
              Código promocional
            </label>
            <Input
              id="discountCode"
              type="text"
              name="discountCode"
              value={discountCode}
              onChange={(event) => setDiscountCode(event.target.value)}
              placeholder="Código de descuento (opcional)"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {discountPreview.discountApplied ? (
              <p className="text-sm text-green-300">
                Código aplicado: {discountPreview.discountApplied}
              </p>
            ) : null}
            {discountCode.trim() && discountPreview.invalid ? (
              <p className="text-sm text-amber-300">Código inválido</p>
            ) : null}
          </div>
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
          {discountPreview.discountApplied ? (
            <div className="flex justify-between text-mist">
              <span>Código aplicado</span>
              <span>{discountPreview.discountApplied}</span>
            </div>
          ) : null}
          {discountPreview.discountAmount > 0 ? (
            <div className="flex justify-between text-green-300">
              <span>Descuento</span>
              <span>-{formatCurrency(discountPreview.discountAmount)}</span>
            </div>
          ) : null}
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
            <span>{formatCurrency(discountPreview.total)}</span>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist">
          Primero registramos el pedido y después abrimos WhatsApp con el mensaje listo.
        </div>

        <Button
          type="button"
          className="mt-6 min-h-[52px] w-full text-base sm:text-sm"
          disabled={isPending}
          onClick={handleWhatsApp}
        >
          {isPending ? "Preparando WhatsApp..." : "Pedir por WhatsApp"}
        </Button>
      </aside>
    </form>
  );
}
