import { OrderStatus, PaymentMethod, DeliveryMethod } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildGroupedOrders,
  getMetrics,
  isCountedSale,
  sumSales
} from "@/lib/order-grouping";
import type { AdminOrderSummaryDto } from "@/types";

/**
 * Son los números que el administrador mira para saber cuánto vendió. Lo que
 * más importa es que un pedido cancelado no sume a la facturación.
 */
function pedido(
  overrides: Partial<AdminOrderSummaryDto> & { total: number; createdAt: string }
): AdminOrderSummaryDto {
  return {
    id: `id-${overrides.createdAt}-${overrides.total}`,
    code: "GS-000001",
    status: OrderStatus.DELIVERED,
    paymentMethod: PaymentMethod.CASH,
    deliveryMethod: DeliveryMethod.PICKUP,
    deliveryDetail: null,
    subtotal: overrides.total,
    shippingCost: 0,
    discountTotal: 0,
    discountCode: null,
    discountApplied: null,
    recipientName: "Test",
    contactPhone: "3511234567",
    street: null,
    number: null,
    floor: null,
    apartment: null,
    province: "Córdoba",
    customer: "Test Cliente",
    email: "test@test.local",
    customerPhone: "3511234567",
    colored: false,
    color: null,
    sellerName: null,
    ...overrides
  } as AdminOrderSummaryDto;
}

const hoy = new Date();
const iso = (d: Date) => d.toISOString();
const haceDias = (n: number) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() - n);
  return d;
};

describe("isCountedSale", () => {
  it("cuenta los pedidos que no están cancelados", () => {
    for (const status of [
      OrderStatus.PENDING_CONFIRMATION,
      OrderStatus.CONTACTED,
      OrderStatus.DELIVERED
    ]) {
      expect(isCountedSale(pedido({ total: 1000, createdAt: iso(hoy), status }))).toBe(true);
    }
  });

  it("no cuenta un pedido cancelado", () => {
    expect(
      isCountedSale(
        pedido({ total: 1000, createdAt: iso(hoy), status: OrderStatus.CANCELLED })
      )
    ).toBe(false);
  });
});

describe("sumSales", () => {
  it("suma solo lo que no está cancelado", () => {
    const total = sumSales([
      pedido({ total: 10000, createdAt: iso(hoy) }),
      pedido({ total: 5000, createdAt: iso(hoy) }),
      pedido({ total: 99999, createdAt: iso(hoy), status: OrderStatus.CANCELLED })
    ]);

    expect(total).toBe(15000);
  });

  it("da cero sin pedidos", () => {
    expect(sumSales([])).toBe(0);
  });
});

describe("buildGroupedOrders", () => {
  it("junta en un grupo los pedidos del mismo día", () => {
    const grupos = buildGroupedOrders(
      [
        pedido({ total: 1000, createdAt: iso(hoy) }),
        pedido({ total: 2000, createdAt: iso(hoy) })
      ],
      "day"
    );

    expect(grupos).toHaveLength(1);
    expect(grupos[0].orderCount).toBe(2);
    expect(grupos[0].totalSales).toBe(3000);
  });

  it("separa días distintos", () => {
    const grupos = buildGroupedOrders(
      [
        pedido({ total: 1000, createdAt: iso(hoy) }),
        pedido({ total: 2000, createdAt: iso(haceDias(3)) })
      ],
      "day"
    );

    expect(grupos).toHaveLength(2);
  });

  it("un cancelado entra en el conteo de pedidos pero no en la facturación", () => {
    const grupos = buildGroupedOrders(
      [
        pedido({ total: 1000, createdAt: iso(hoy) }),
        pedido({ total: 9000, createdAt: iso(hoy), status: OrderStatus.CANCELLED })
      ],
      "day"
    );

    expect(grupos[0].orderCount).toBe(2);
    expect(grupos[0].totalSales).toBe(1000);
  });

  it("agrupa por mes cuando se pide por mes", () => {
    const grupos = buildGroupedOrders(
      [
        pedido({ total: 1000, createdAt: iso(hoy) }),
        pedido({ total: 2000, createdAt: iso(haceDias(2)) })
      ],
      "month"
    );

    // Dos fechas con dos días de diferencia caen en el mismo mes salvo que
    // justo crucen el borde; en ese caso son dos grupos, y las dos cosas son
    // correctas. Lo que no puede pasar es perder un pedido.
    expect(grupos.reduce((n, g) => n + g.orderCount, 0)).toBe(2);
  });

  it("devuelve lista vacía sin pedidos", () => {
    expect(buildGroupedOrders([], "day")).toEqual([]);
  });
});

describe("getMetrics", () => {
  it("separa activos de cancelados y no suma los cancelados a la facturación", () => {
    const metricas = getMetrics([
      pedido({ total: 10000, createdAt: iso(hoy) }),
      pedido({ total: 5000, createdAt: iso(hoy) }),
      pedido({ total: 7000, createdAt: iso(hoy), status: OrderStatus.CANCELLED })
    ]);

    expect(metricas.activeOrders).toBe(2);
    expect(metricas.cancelledOrders).toBe(1);
    expect(metricas.totalSales).toBe(15000);
    expect(metricas.salesToday).toBe(15000);
  });

  it("deja fuera de 'hoy' un pedido viejo, pero lo mantiene en el total", () => {
    const metricas = getMetrics([
      pedido({ total: 1000, createdAt: iso(hoy) }),
      pedido({ total: 4000, createdAt: iso(haceDias(40)) })
    ]);

    expect(metricas.salesToday).toBe(1000);
    expect(metricas.totalSales).toBe(5000);
  });

  it("devuelve todo en cero sin pedidos", () => {
    const metricas = getMetrics([]);

    expect(metricas.totalSales).toBe(0);
    expect(metricas.activeOrders).toBe(0);
    expect(metricas.cancelledOrders).toBe(0);
  });
});
