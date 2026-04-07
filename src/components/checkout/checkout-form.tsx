"use client";

import { DeliveryMethod, PaymentMethod } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { TransferPaymentCard } from "@/components/payments/transfer-payment-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { CartDto, CheckoutQuoteDto } from "@/types";

type CheckoutFormProps = {
  user: {
    firstName: string;
    lastName: string;
    phone: string;
    addresses: Array<{
      id: string;
      label: string;
      recipientName: string;
      street: string;
      number: string;
      city: string;
      province: string;
      postalCode: string;
    }>;
  };
  cart: CartDto;
  deliveryOptions: {
    methods: DeliveryMethod[];
    shipmentAvailable: boolean;
    pickupAvailable: boolean;
    pickupAddress: {
      recipientName: string;
      street: string;
      number: string;
      floor: string | null;
      apartment: string | null;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    } | null;
  };
};

export function CheckoutForm({
  user,
  cart,
  deliveryOptions
}: CheckoutFormProps) {
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    deliveryOptions.methods[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    user.addresses[0]?.id ?? ""
  );
  const [province, setProvince] = useState<string>(
    user.addresses[0]?.province ??
      deliveryOptions.pickupAddress?.province ??
      ""
  );
  const [quote, setQuote] = useState<CheckoutQuoteDto | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferProofFileName, setTransferProofFileName] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (deliveryMethod === DeliveryMethod.PICKUP) {
      setProvince(deliveryOptions.pickupAddress?.province ?? "");
      setSelectedAddressId("");
      return;
    }

    if (selectedAddressId) {
      const selectedAddress = user.addresses.find(
        (address) => address.id === selectedAddressId
      );

      if (selectedAddress) {
        setProvince(selectedAddress.province);
      }
    }
  }, [
    deliveryMethod,
    selectedAddressId,
    deliveryOptions.pickupAddress?.province,
    user.addresses
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      setQuoteLoading(true);
      setQuoteError(null);

      const response = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          deliveryMethod,
          paymentMethod: paymentMethod ?? undefined,
          province: deliveryMethod === DeliveryMethod.SHIPMENT ? province : undefined
        })
      });

      const payload = await response.json().catch(() => null);

      if (cancelled) {
        return;
      }

      if (!response.ok) {
        setQuote(null);
        setQuoteError(payload?.error ?? "No se pudo calcular el checkout.");
        setQuoteLoading(false);
        return;
      }

      setQuote(payload);
      setQuoteLoading(false);

      const firstMethod = payload.availablePaymentMethods[0]?.method ?? null;
      const selectedMethodStillAvailable = payload.availablePaymentMethods.some(
        (option: { method: PaymentMethod }) => option.method === paymentMethod
      );

      if (!selectedMethodStillAvailable && firstMethod) {
        setPaymentMethod(firstMethod);
      }
    }

    void loadQuote();

    return () => {
      cancelled = true;
    };
  }, [deliveryMethod, paymentMethod, province]);

  const paymentOptions = quote?.availablePaymentMethods ?? [];
  const discountAmount = quote?.appliedDiscount?.amount ?? 0;
  const total = quote?.total ?? cart.subtotal;
  const shippingCost = quote?.shippingCost ?? 0;

  return (
    <form
      className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]"
      onSubmit={(event) => {
        event.preventDefault();

        if (!paymentMethod) {
          setError("No hay medios de pago disponibles para esta combinación.");
          return;
        }

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);

          const address =
            deliveryMethod === DeliveryMethod.SHIPMENT && !selectedAddressId
              ? {
                  label: formData.get("label"),
                  recipientName: formData.get("recipientName"),
                  street: formData.get("street"),
                  number: formData.get("number"),
                  city: formData.get("city"),
                  province: formData.get("province"),
                  postalCode: formData.get("postalCode"),
                  country: "Argentina"
                }
              : undefined;

          let transferReceipt: {
            url: string;
            fileName: string;
            mimeType: string;
            size: number;
            uploadedAt: string;
          } | undefined;

          if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
            const proof = formData.get("transferProof");

            if (!(proof instanceof File) || proof.size <= 0) {
              setError(
                "Debes adjuntar el comprobante antes de confirmar una transferencia."
              );
              return;
            }

            const uploadFormData = new FormData();
            uploadFormData.append("proof", proof);

            const proofResponse = await fetch("/api/checkout/transfer-proof", {
              method: "POST",
              body: uploadFormData
            });
            const proofPayload = await proofResponse.json().catch(() => null);

            if (!proofResponse.ok || !proofPayload?.receipt) {
              setError(
                proofPayload?.error ?? "No se pudo subir el comprobante de transferencia."
              );
              return;
            }

            transferReceipt = proofPayload.receipt;
          }

          const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              deliveryMethod,
              paymentMethod,
              addressId: selectedAddressId || undefined,
              address,
              transferReceipt,
              saveAddress: !selectedAddressId,
              notes: formData.get("notes")
            })
          });

          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            setError(payload?.error ?? "No se pudo crear el pedido.");
            return;
          }

          if (payload.checkoutUrl) {
            window.location.href = payload.checkoutUrl;
            return;
          }

          router.push(`/mis-pedidos?highlight=${payload.order.id}`);
          router.refresh();
        });
      }}
    >
      <div className="space-y-6">
        <section className="section-card p-6">
          <div className="flex flex-wrap gap-3">
            {deliveryOptions.shipmentAvailable ? (
              <button
                type="button"
                onClick={() => setDeliveryMethod(DeliveryMethod.SHIPMENT)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  deliveryMethod === DeliveryMethod.SHIPMENT
                    ? "bg-neon text-ink"
                    : "border border-line text-sand"
                }`}
              >
                Envío a domicilio
              </button>
            ) : null}
            {deliveryOptions.pickupAvailable ? (
              <button
                type="button"
                onClick={() => setDeliveryMethod(DeliveryMethod.PICKUP)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  deliveryMethod === DeliveryMethod.PICKUP
                    ? "bg-neon text-ink"
                    : "border border-line text-sand"
                }`}
              >
                Retiro en tienda
              </button>
            ) : null}
          </div>

          {deliveryMethod === DeliveryMethod.SHIPMENT ? (
            <div className="mt-6 space-y-4">
              {user.addresses.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm text-mist">Dirección guardada</label>
                  <Select
                    value={selectedAddressId}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      const address = user.addresses.find((item) => item.id === nextId);
                      setSelectedAddressId(nextId);
                      setProvince(address?.province ?? province);
                    }}
                  >
                    <option value="">Usar una nueva dirección</option>
                    {user.addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label} - {address.street} {address.number}, {address.city}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}

              {!selectedAddressId ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-mist">Etiqueta</label>
                    <Input name="label" defaultValue="Casa" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-mist">Destinatario</label>
                    <Input
                      name="recipientName"
                      defaultValue={`${user.firstName} ${user.lastName}`}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-mist">Calle</label>
                    <Input name="street" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-mist">Número</label>
                    <Input name="number" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-mist">Ciudad</label>
                    <Input name="city" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-mist">Provincia</label>
                    <Input
                      name="province"
                      value={province}
                      onChange={(event) => setProvince(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm text-mist">Código postal</label>
                    <Input name="postalCode" required />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-line bg-ink/60 p-5 text-sm text-mist">
              <p className="font-semibold text-sand">Retiro en tienda</p>
              <p>
                {deliveryOptions.pickupAddress?.street}{" "}
                {deliveryOptions.pickupAddress?.number},{" "}
                {deliveryOptions.pickupAddress?.city}
              </p>
              <p>Listo para retiro una vez confirmado el pago.</p>
            </div>
          )}
        </section>

        <section className="section-card p-6">
          <p className="text-lg font-semibold text-sand">Pago</p>
          <div className="mt-4 grid gap-3">
            {paymentOptions.map((option) => (
              <button
                key={option.method}
                type="button"
                onClick={() => setPaymentMethod(option.method)}
                className={`rounded-3xl border p-4 text-left ${
                  paymentMethod === option.method
                    ? "border-neon bg-neon/10"
                    : "border-line bg-ink/50"
                }`}
              >
                <p className="font-semibold text-sand">{option.label}</p>
                <p className="mt-1 text-sm text-mist">{option.description}</p>
              </button>
            ))}
          </div>

          {paymentMethod === PaymentMethod.BANK_TRANSFER && quote?.transferPreview ? (
            <div className="mt-4 space-y-4">
              <TransferPaymentCard
                className="border-neon/50"
                transfer={{
                  ...quote.transferPreview,
                  reference: "Se genera al confirmar el pedido",
                  amount: total,
                  expiresAt: null,
                  receipt: null
                }}
              />
              <div className="rounded-3xl border border-line bg-ink/60 p-4">
                <label className="text-sm font-semibold text-sand">
                  Comprobante de transferencia
                </label>
                <Input
                  type="file"
                  name="transferProof"
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-3"
                  onChange={(event) =>
                    setTransferProofFileName(event.target.files?.[0]?.name ?? "")
                  }
                />
                <p className="mt-2 text-xs text-mist">
                  Es obligatorio para confirmar el pedido por transferencia.
                </p>
                {transferProofFileName ? (
                  <p className="mt-2 text-xs text-mist">
                    Archivo seleccionado: {transferProofFileName}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {paymentMethod === PaymentMethod.CASH ? (
            <div className="mt-4 rounded-3xl border border-line bg-ink/60 p-5 text-sm text-mist">
              <p className="font-semibold text-sand">Pago en efectivo</p>
              <p className="mt-2">
                Disponible sólo para Córdoba. No requiere transferencia ni comprobante
                bancario.
              </p>
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            <label className="text-sm text-mist">Notas del pedido</label>
            <Textarea
              name="notes"
              placeholder="Indicaciones de entrega, horarios o aclaraciones."
            />
          </div>
        </section>

        {quoteError ? <p className="text-sm text-red-300">{quoteError}</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>

      <aside className="section-card h-fit p-6">
        <p className="text-lg font-semibold text-sand">Resumen</p>
        <div className="mt-5 space-y-3 text-sm text-mist">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div>
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
            <span>Subtotal</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-mist">
            <span>Envío</span>
            <span>
              {quoteLoading
                ? "Calculando..."
                : shippingCost === 0
                  ? "Gratis"
                  : formatCurrency(shippingCost)}
            </span>
          </div>
          <div className="flex justify-between text-mist">
            <span>Descuento</span>
            <span>{discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : "-"}</span>
          </div>
          <div className="flex justify-between text-lg font-black text-sand">
            <span>Total</span>
            <span>{quoteLoading ? "Calculando..." : formatCurrency(total)}</span>
          </div>
          {quote?.appliedDiscount ? (
            <p className="text-xs text-mist">
              Promoción aplicada:{" "}
              <span className="text-sand">{quote.appliedDiscount.name}</span>
            </p>
          ) : null}
        </div>

        <Button
          className="mt-6 w-full"
          disabled={
            isPending ||
            quoteLoading ||
            paymentOptions.length === 0 ||
            !paymentMethod
          }
        >
          {isPending ? "Procesando pedido..." : "Confirmar compra"}
        </Button>
      </aside>
    </form>
  );
}
