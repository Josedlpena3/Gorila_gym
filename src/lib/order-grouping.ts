import { OrderStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import type { AdminOrderSummaryDto } from "@/types";

/**
 * Agrupación y métricas de pedidos para el panel de administración.
 *
 * Vivían dentro de admin-orders-client.tsx, que tenía 746 líneas y mezclaba
 * trece funciones de fecha con el render. Son lógica pura: acá se pueden
 * probar sin montar React.
 */

export type OrderGrouping = "day" | "week" | "month" | "year";

export type GroupedOrders = {
  id: string;
  label: string;
  totalSales: number;
  orderCount: number;
  orders: AdminOrderSummaryDto[];
};

export const GROUPING_LABELS: Record<OrderGrouping, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
  year: "Año"
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

export function isCountedSale(order: AdminOrderSummaryDto) {
  return order.status !== OrderStatus.CANCELLED;
}

export function sumSales(orders: AdminOrderSummaryDto[]) {
  return orders.reduce((total, order) => {
    return isCountedSale(order) ? total + order.total : total;
  }, 0);
}

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function buildGroupedOrders(
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

export function getMetrics(orders: AdminOrderSummaryDto[]) {
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
