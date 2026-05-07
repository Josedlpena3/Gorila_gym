"use client";

import { DeliveryMethod, OrderStatus, PaymentMethod } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrderVisualForm } from "@/components/admin/order-visual-form";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { OrderWhatsappButton } from "@/components/admin/order-whatsapp-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_BADGE_VARIANTS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AdminOrderSummaryDto } from "@/types";

type OrderGrouping = "day" | "week" | "month" | "year";

type GroupedOrders = {
  id: string;
  label: string;
  totalSales: number;
  orderCount: number;
  orders: AdminOrderSummaryDto[];
};

const GROUPING_LABELS: Record<OrderGrouping, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
  year: "Año"
};

const ORDER_BORDER_COLORS: Record<string, string> = {
  green: "#4ade80",
  blue: "#60a5fa",
  red: "#f87171"
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

const monthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric"
});

function getTimestamp(value: string) {
  return new Date(value).getTime();
}

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getStartOfWeek(date: Date) {
  const start = getStartOfDay(date);
  const day = start.getDay();
  const offset = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + offset);

  return start;
}

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getStartOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function getGroupStart(date: Date, grouping: OrderGrouping) {
  if (grouping === "week") {
    return getStartOfWeek(date);
  }

  if (grouping === "month") {
    return getStartOfMonth(date);
  }

  if (grouping === "year") {
    return getStartOfYear(date);
  }

  return getStartOfDay(date);
}

function getGroupLabel(start: Date, grouping: OrderGrouping) {
  if (grouping === "week") {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `Semana del ${formatDate(start)} al ${formatDate(end)}`;
  }

  if (grouping === "month") {
    const label = monthFormatter.format(start);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  if (grouping === "year") {
    return String(start.getFullYear());
  }

  return formatDate(start);
}

function isCountedSale(order: AdminOrderSummaryDto) {
  return order.status !== OrderStatus.CANCELLED;
}

function sumSales(orders: AdminOrderSummaryDto[]) {
  return orders.reduce((total, order) => {
    return isCountedSale(order) ? total + order.total : total;
  }, 0);
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function buildGroupedOrders(
  orders: AdminOrderSummaryDto[],
  grouping: OrderGrouping
): GroupedOrders[] {
  const groups = new Map<string, GroupedOrders>();

  orders
    .slice()
    .sort((left, right) => getTimestamp(right.createdAt) - getTimestamp(left.createdAt))
    .forEach((order) => {
      const createdAt = new Date(order.createdAt);
      const start = getGroupStart(createdAt, grouping);
      const id = `${grouping}:${start.getTime()}`;
      const existing = groups.get(id);

      if (existing) {
        existing.orders.push(order);
        existing.orderCount += 1;
        if (isCountedSale(order)) {
          existing.totalSales += order.total;
        }
        return;
      }

      groups.set(id, {
        id,
        label: getGroupLabel(start, grouping),
        totalSales: isCountedSale(order) ? order.total : 0,
        orderCount: 1,
        orders: [order]
      });
    });

  return Array.from(groups.values());
}

function isWithinPeriod(
  createdAt: string,
  periodStart: Date,
  periodEnd: Date
) {
  const timestamp = getTimestamp(createdAt);
  return timestamp >= periodStart.getTime() && timestamp < periodEnd.getTime();
}

function getMetrics(orders: AdminOrderSummaryDto[]) {
  const now = new Date();
  const todayStart = getStartOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const weekStart = getStartOfWeek(now);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const monthStart = getStartOfMonth(now);
  const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  const activeOrders = orders.filter((order) => order.status !== OrderStatus.CANCELLED).length;
  const cancelledOrders = orders.filter((order) => order.status === OrderStatus.CANCELLED).length;

  return {
    totalSales: sumSales(orders),
    salesToday: sumSales(
      orders.filter((order) => isWithinPeriod(order.createdAt, todayStart, tomorrowStart))
    ),
    salesThisWeek: sumSales(
      orders.filter((order) => isWithinPeriod(order.createdAt, weekStart, nextWeekStart))
    ),
    salesThisMonth: sumSales(
      orders.filter((order) => isWithinPeriod(order.createdAt, monthStart, nextMonthStart))
    ),
    activeOrders,
    cancelledOrders
  };
}

export function AdminOrdersClient({ orders }: { orders: AdminOrderSummaryDto[] }) {
  const router = useRouter();
  const [grouping, setGrouping] = useState<OrderGrouping>("day");
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [pendingDeleteOrderId, setPendingDeleteOrderId] = useState<string | null>(null);
  const [deleteErrorOrderId, setDeleteErrorOrderId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingDiscountOrderId, setEditingDiscountOrderId] = useState<string | null>(null);
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, string>>({});
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
    if (!window.confirm("¿Eliminar pedido cancelado?")) {
      return;
    }

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
    setDiscountDrafts((current) => ({
      ...current,
      [orderId]: currentDiscountCode ?? ""
    }));
    setDiscountErrorOrderId(null);
    setDiscountError(null);
  }

  function cancelDiscountEdit() {
    setEditingDiscountOrderId(null);
    setDiscountErrorOrderId(null);
    setDiscountError(null);
  }

  async function handleDiscountSave(orderId: string) {
    setSavingDiscountOrderId(orderId);
    setDiscountErrorOrderId(null);
    setDiscountError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/discount`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          discountCode: discountDrafts[orderId]?.trim() || null
        })
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
            <p className="text-sm uppercase tracking-[0.28em] text-mist">Vista</p>
            <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-sand">
              Pedidos agrupados
            </h2>
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={grouping}
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
                <h3 className="text-xl font-black uppercase tracking-[0.08em] text-sand">
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
                          <p className="text-xs uppercase tracking-[0.24em] text-mist">
                            ID pedido
                          </p>
                          <p className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-sand">
                            {order.code}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-mist">
                            Fecha
                          </p>
                          <p className="mt-1 text-sm text-sand">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-mist">
                            Estado
                          </p>
                          <div className="mt-2">
                            <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.status]}>
                              {ORDER_STATUS_LABELS[order.status]}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-mist">
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
                      <div className="mt-5 space-y-4 border-t border-line/80 pt-5">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist">
                              <p className="text-xs uppercase tracking-[0.24em] text-mist">
                                Contacto
                              </p>
                              <p className="mt-3 text-sand">Cliente: {order.customer}</p>
                              <p>Email: {order.email}</p>
                              <p>Celular: {order.customerPhone || order.contactPhone}</p>
                              <p>Fecha: {formatDate(order.createdAt)}</p>
                            </div>
                            <div className="rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist">
                              <p className="text-xs uppercase tracking-[0.24em] text-mist">
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
                            <div className="rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist sm:col-span-2">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                  <p className="text-xs uppercase tracking-[0.24em] text-mist">
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
                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                                  <input
                                    value={discountDrafts[order.id] ?? ""}
                                    onChange={(event) =>
                                      setDiscountDrafts((current) => ({
                                        ...current,
                                        [order.id]: event.target.value
                                      }))
                                    }
                                    placeholder="Ingresar código..."
                                    className="w-full rounded-2xl border border-line bg-ink/70 px-4 py-3 text-sm text-sand focus:border-neon/70 focus:outline-none"
                                  />
                                  <Button
                                    type="button"
                                    disabled={isSavingDiscount}
                                    onClick={() => void handleDiscountSave(order.id)}
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
                                onClick={() => void handleDeleteCancelledOrder(order.id)}
                              >
                                {isDeleting ? "Eliminando..." : "Eliminar pedido"}
                              </Button>
                            ) : null}
                            {deleteErrorOrderId === order.id && deleteError ? (
                              <p className="text-sm text-red-300">{deleteError}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist">
                          <p className="text-xs uppercase tracking-[0.24em] text-mist">
                            Productos
                          </p>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-line bg-ink/70 p-3"
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
    </div>
  );
}
