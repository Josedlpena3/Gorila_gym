"use client";

import { DeliveryMethod, OrderStatus, PaymentMethod } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrderVisualForm } from "@/components/admin/order-visual-form";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { OrderWhatsappButton } from "@/components/admin/order-whatsapp-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_BADGE_VARIANTS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AdminOrderSummaryDto } from "@/types";

import {
  buildGroupedOrders,
  formatDateTime,
  getMetrics,
  GROUPING_LABELS,
  type OrderGrouping
} from "@/lib/order-grouping";

const ORDER_BORDER_COLORS: Record<string, string> = {
  green: "#4ade80",
  blue: "#60a5fa",
  red: "#f87171"
};

export function AdminOrdersClient({ orders }: { orders: AdminOrderSummaryDto[] }) {
  const router = useRouter();
  const [grouping, setGrouping] = useState<OrderGrouping>("day");
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [pendingDeleteOrderId, setPendingDeleteOrderId] = useState<string | null>(null);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);
  const [deleteErrorOrderId, setDeleteErrorOrderId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingDiscountOrderId, setEditingDiscountOrderId] = useState<string | null>(null);
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, string>>({});
  const [discountModes, setDiscountModes] = useState<Record<string, "code" | "percent">>({});
  const [percentDrafts, setPercentDrafts] = useState<Record<string, string>>({});
  const [savingDiscountOrderId, setSavingDiscountOrderId] = useState<string | null>(null);
  const [discountErrorOrderId, setDiscountErrorOrderId] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const groupedOrders = buildGroupedOrders(orders, grouping);
  const metrics = getMetrics(orders);

  function toggleOrder(orderId: string) {
    setExpandedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId]
    );
  }

  async function handleDeleteCancelledOrder(orderId: string) {
    setPendingDeleteOrderId(orderId);
    setDeleteErrorOrderId(null);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE"
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setDeleteErrorOrderId(orderId);
        setDeleteError(result?.error ?? "No se pudo eliminar el pedido.");
        return;
      }

      setConfirmDeleteOrderId(null);
      router.refresh();
    } catch {
      setDeleteErrorOrderId(orderId);
      setDeleteError("No se pudo eliminar el pedido.");
    } finally {
      setPendingDeleteOrderId(null);
    }
  }

  function startDiscountEdit(orderId: string, currentDiscountCode: string | null) {
    setEditingDiscountOrderId(orderId);
    setDiscountDrafts((current) => ({ ...current, [orderId]: currentDiscountCode ?? "" }));
    setDiscountModes((current) => ({ ...current, [orderId]: "code" }));
    setPercentDrafts((current) => ({ ...current, [orderId]: "" }));
    setDiscountErrorOrderId(null);
    setDiscountError(null);
  }

  function cancelDiscountEdit() {
    setEditingDiscountOrderId(null);
    setDiscountErrorOrderId(null);
    setDiscountError(null);
  }

  function setDiscountMode(orderId: string, mode: "code" | "percent") {
    setDiscountModes((current) => ({ ...current, [orderId]: mode }));
    setDiscountErrorOrderId(null);
    setDiscountError(null);
  }

  async function handleDiscountSave(orderId: string) {
    setSavingDiscountOrderId(orderId);
    setDiscountErrorOrderId(null);
    setDiscountError(null);

    const mode = discountModes[orderId] ?? "code";

    try {
      let body: Record<string, unknown>;

      if (mode === "percent") {
        const pct = parseFloat(percentDrafts[orderId] ?? "");
        if (isNaN(pct) || pct < 0 || pct > 99) {
          setDiscountErrorOrderId(orderId);
          setDiscountError("Ingresá un porcentaje entre 0 y 99.");
          setSavingDiscountOrderId(null);
          return;
        }
        body = { manualPercent: pct };
      } else {
        body = { discountCode: discountDrafts[orderId]?.trim() || null };
      }

      const response = await fetch(`/api/admin/orders/${orderId}/discount`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setDiscountErrorOrderId(orderId);
        setDiscountError(result?.error ?? "No se pudo actualizar el descuento.");
        return;
      }

      setEditingDiscountOrderId(null);
      router.refresh();
    } catch {
      setDiscountErrorOrderId(orderId);
      setDiscountError("No se pudo actualizar el descuento.");
    } finally {
      setSavingDiscountOrderId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="section-card p-5">
          <p className="text-sm text-mist">Total vendido</p>
          <p className="mt-4 text-3xl font-black text-sand">
            {formatCurrency(metrics.totalSales)}
          </p>
        </div>
        <div className="section-card p-5">
          <p className="text-sm text-mist">Ventas de hoy</p>
          <p className="mt-4 text-3xl font-black text-sand">
            {formatCurrency(metrics.salesToday)}
          </p>
        </div>
        <div className="section-card p-5">
          <p className="text-sm text-mist">Ventas de la semana</p>
          <p className="mt-4 text-3xl font-black text-sand">
            {formatCurrency(metrics.salesThisWeek)}
          </p>
        </div>
        <div className="section-card p-5">
          <p className="text-sm text-mist">Ventas del mes</p>
          <p className="mt-4 text-3xl font-black text-sand">
            {formatCurrency(metrics.salesThisMonth)}
          </p>
        </div>
        <div className="section-card p-5">
          <p className="text-sm text-mist">Pedidos activos</p>
          <p className="mt-4 text-3xl font-black text-sand">{metrics.activeOrders}</p>
        </div>
        <div className="section-card p-5">
          <p className="text-sm text-mist">Pedidos cancelados</p>
          <p className="mt-4 text-3xl font-black text-sand">{metrics.cancelledOrders}</p>
        </div>
      </section>

      <section className="section-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-eyebrow-wide text-mist">Vista</p>
            <h2 className="text-2xl font-black uppercase tracking-display text-sand">
              Pedidos agrupados
            </h2>
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={grouping}
              aria-label="Agrupar pedidos"
              onChange={(event) => setGrouping(event.target.value as OrderGrouping)}
            >
              {Object.entries(GROUPING_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        {groupedOrders.length === 0 ? (
          <div className="section-card p-6 text-center text-sm text-mist">
            No hay pedidos registrados por ahora.
          </div>
        ) : null}

        {groupedOrders.map((group) => (
          <section key={group.id} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-display text-sand">
                  {group.label}
                </h3>
                <p className="text-sm text-mist">
                  {group.orderCount} pedido{group.orderCount === 1 ? "" : "s"}
                </p>
              </div>
              <p className="text-sm font-semibold text-sand">
                Ventas: {formatCurrency(group.totalSales)}
              </p>
            </div>

            <div className="space-y-3">
              {group.orders.map((order) => {
                const isExpanded = expandedOrderIds.includes(order.id);
                const isDeleting = pendingDeleteOrderId === order.id;
                const isEditingDiscount = editingDiscountOrderId === order.id;
                const isSavingDiscount = savingDiscountOrderId === order.id;

                return (
                  <article
                    key={order.id}
                    className="section-card p-4 sm:p-5"
                    style={
                      order.colored
                        ? {
                            borderColor: ORDER_BORDER_COLORS[order.color ?? "green"] ?? "#4ade80",
                            borderWidth: "2px"
                          }
                        : undefined
                    }
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="grid gap-4 sm:grid-cols-2 xl:flex xl:items-center xl:gap-8">
                        <div>
                          <p className="text-xs uppercase tracking-eyebrow text-mist">
                            ID pedido
                          </p>
                          <p className="mt-1 text-lg font-black uppercase tracking-display text-sand">
                            {order.code}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-eyebrow text-mist">
                            Fecha
                          </p>
                          <p className="mt-1 text-sm text-sand">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-eyebrow text-mist">
                            Estado
                          </p>
                          <div className="mt-2">
                            <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.status]}>
                              {ORDER_STATUS_LABELS[order.status]}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-eyebrow text-mist">
                            Total
                          </p>
                          <p className="mt-1 text-xl font-black text-sand">
                            {formatCurrency(order.total)}
                          </p>
                          {order.sellerName ? (
                            <p className="mt-2 text-xs text-mist">
                              Vendedor: {order.sellerName}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={() => toggleOrder(order.id)}
                      >
                        {isExpanded ? "Ocultar detalle" : "Ver detalle"}
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="mt-5 space-y-4 border-t border-hairline/80 pt-5">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-3xl border border-hairline bg-surface-sunken p-4 text-sm text-mist">
                              <p className="text-xs uppercase tracking-eyebrow text-mist">
                                Contacto
                              </p>
                              <p className="mt-3 text-sand">Cliente: {order.customer}</p>
                              <p>Email: {order.email}</p>
                              <p>Celular: {order.customerPhone || order.contactPhone}</p>
                              <p>Fecha: {formatDate(order.createdAt)}</p>
                            </div>
                            <div className="rounded-3xl border border-hairline bg-surface-sunken p-4 text-sm text-mist">
                              <p className="text-xs uppercase tracking-eyebrow text-mist">
                                Entrega y pago
                              </p>
                              <p className="mt-3 text-sand">
                                Pago:{" "}
                                {PAYMENT_METHOD_LABELS[order.paymentMethod] ??
                                  order.paymentMethod}
                              </p>
                              <p>
                                Entrega:{" "}
                                {DELIVERY_METHOD_LABELS[order.deliveryMethod] ??
                                  order.deliveryMethod}
                              </p>
                              <p>Detalle: {order.deliveryDetail ?? "-"}</p>
                              <p>
                                Dirección:{" "}
                                {order.street
                                  ? `${order.street} ${order.number ?? ""}`.trim()
                                  : "-"}
                              </p>
                              <p>
                                Ubicación: {order.city}, {order.province}
                              </p>
                            </div>
                            <div className="rounded-3xl border border-hairline bg-surface-sunken p-4 text-sm text-mist sm:col-span-2">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                  <p className="text-xs uppercase tracking-eyebrow text-mist">
                                    Descuento
                                  </p>
                                  <p className="mt-2 text-sand">
                                    Código de descuento:{" "}
                                    {order.discountCode ? order.discountCode : "No aplicado"}
                                  </p>
                                  <p>
                                    Descuento aplicado: {formatCurrency(order.discountTotal)}
                                  </p>
                                  {order.discountApplied ? (
                                    <p>Beneficio: {order.discountApplied}</p>
                                  ) : null}
                                </div>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="w-full sm:w-auto"
                                  onClick={() =>
                                    startDiscountEdit(order.id, order.discountCode)
                                  }
                                >
                                  Editar descuento
                                </Button>
                              </div>

                              {isEditingDiscount ? (
                                <div className="mt-4 space-y-3">
                                  {/* Mode toggle */}
                                  <div className="flex gap-1 rounded-2xl border border-hairline bg-surface-sunken p-1">
                                    {(["code", "percent"] as const).map((mode) => (
                                      <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setDiscountMode(order.id, mode)}
                                        className={`flex-1 rounded-xl py-1.5 text-xs font-semibold transition ${
                                          (discountModes[order.id] ?? "code") === mode
                                            ? "bg-neon text-white"
                                            : "text-mist hover:text-sand"
                                        }`}
                                      >
                                        {mode === "code" ? "Código de descuento" : "% Directo"}
                                      </button>
                                    ))}
                                  </div>

                                  {(discountModes[order.id] ?? "code") === "code" ? (
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                      <input
                                        value={discountDrafts[order.id] ?? ""}
                                        aria-label={`Código de descuento del pedido ${order.code}`}
                                        onChange={(event) =>
                                          setDiscountDrafts((current) => ({
                                            ...current,
                                            [order.id]: event.target.value
                                          }))
                                        }
                                        placeholder="Ingresar código..."
                                        className="w-full rounded-2xl border border-hairline bg-surface-sunken px-4 py-3 text-sm text-sand focus:border-neon/70 focus:outline-none"
                                      />
                                      <Button
                                        type="button"
                                        disabled={isSavingDiscount}
                                        onClick={() => void handleDiscountSave(order.id)}
                                        className="whitespace-nowrap"
                                      >
                                        {isSavingDiscount ? "Guardando..." : "Guardar"}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={isSavingDiscount}
                                        onClick={cancelDiscountEdit}
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                      <div className="relative flex-1">
                                        <input
                                          type="number"
                                          min="0"
                                          max="99"
                                          step="1"
                                          value={percentDrafts[order.id] ?? ""}
                                          aria-label={`Porcentaje de descuento del pedido ${order.code}`}
                                          onChange={(event) =>
                                            setPercentDrafts((current) => ({
                                              ...current,
                                              [order.id]: event.target.value
                                            }))
                                          }
                                          placeholder="Ej: 20"
                                          className="w-full rounded-2xl border border-hairline bg-surface-sunken px-4 py-3 pr-10 text-sm text-sand focus:border-neon/70 focus:outline-none"
                                        />
                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-mist">
                                          %
                                        </span>
                                      </div>
                                      <Button
                                        type="button"
                                        disabled={isSavingDiscount}
                                        onClick={() => void handleDiscountSave(order.id)}
                                        className="whitespace-nowrap"
                                      >
                                        {isSavingDiscount ? "Guardando..." : "Aplicar descuento"}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={isSavingDiscount}
                                        onClick={cancelDiscountEdit}
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ) : null}
                              {discountErrorOrderId === order.id && discountError ? (
                                <p className="mt-3 text-sm text-red-300">{discountError}</p>
                              ) : null}
                            </div>
                            <div className="sm:col-span-2">
                              <OrderVisualForm
                                orderId={order.id}
                                currentColored={order.colored}
                                currentColor={order.color}
                                currentSellerName={order.sellerName}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 xl:items-end">
                            <OrderWhatsappButton
                              customerName={order.customer}
                              orderCode={order.code}
                              phone={order.customerPhone}
                              total={order.total}
                              paymentMethod={order.paymentMethod as PaymentMethod}
                              deliveryMethod={order.deliveryMethod as DeliveryMethod}
                              street={order.street}
                              number={order.number}
                              city={order.city}
                              province={order.province}
                              transfer={order.payment.transfer}
                              items={order.items}
                            />
                            <OrderStatusForm
                              orderId={order.id}
                              currentStatus={order.status}
                            />
                            {order.status === OrderStatus.CANCELLED ? (
                              <Button
                                type="button"
                                variant="danger"
                                disabled={isDeleting}
                                onClick={() => setConfirmDeleteOrderId(order.id)}
                              >
                                {isDeleting ? "Eliminando..." : "Eliminar pedido"}
                              </Button>
                            ) : null}
                            {deleteErrorOrderId === order.id && deleteError ? (
                              <p className="text-sm text-red-300">{deleteError}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-hairline bg-surface-sunken p-4 text-sm text-mist">
                          <p className="text-xs uppercase tracking-eyebrow text-mist">
                            Productos
                          </p>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-hairline bg-surface-sunken p-3"
                              >
                                <p className="font-semibold text-sand">{item.name}</p>
                                <p>{item.brand}</p>
                                <p>
                                  Cantidad: {item.quantity} x {formatCurrency(item.price)}
                                </p>
                                <p className="mt-1 font-semibold text-sand">
                                  Subtotal: {formatCurrency(item.subtotal)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDeleteOrderId !== null}
        title="Eliminar pedido cancelado"
        description="El pedido se borra de forma permanente y deja de aparecer en los reportes de ventas."
        confirmLabel="Eliminar pedido"
        isPending={pendingDeleteOrderId !== null}
        onConfirm={() => {
          if (confirmDeleteOrderId) {
            void handleDeleteCancelledOrder(confirmDeleteOrderId);
          }
        }}
        onCancel={() => setConfirmDeleteOrderId(null)}
      />
    </div>
  );
}
