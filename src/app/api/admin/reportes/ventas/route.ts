import { NextResponse } from "next/server";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/errors";
import { requireAdminUser } from "@/modules/users/user.service";
import { decimalToNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const rangoSchema = z.enum(["hoy", "semana", "mes", "trimestre"]);

function calcularDesde(rango: "hoy" | "semana" | "mes" | "trimestre"): Date {
  // Argentina = UTC-3, sin horario de verano
  const OFFSET_MS = 3 * 60 * 60 * 1000;
  const now = new Date();
  // Tiempo Argentina representado como UTC para operar con métodos UTC
  const argNow = new Date(now.getTime() - OFFSET_MS);
  argNow.setUTCHours(0, 0, 0, 0);
  // Medianoche Argentina de hoy en UTC real (= 03:00 UTC)
  const argMidnightUTC = new Date(argNow.getTime() + OFFSET_MS);

  if (rango === "hoy") return argMidnightUTC;

  if (rango === "semana") {
    // Lunes de la semana calendario actual en Argentina
    const dayOfWeek = argNow.getUTCDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(argMidnightUTC);
    weekStart.setUTCDate(weekStart.getUTCDate() + offsetToMonday);
    return weekStart;
  }

  if (rango === "mes") {
    // Día 1 del mes calendario actual en Argentina
    const year = argNow.getUTCFullYear();
    const month = argNow.getUTCMonth();
    return new Date(Date.UTC(year, month, 1) + OFFSET_MS);
  }

  // trimestre: 90 días atrás desde medianoche Argentina de hoy
  const desde = new Date(argMidnightUTC);
  desde.setUTCDate(desde.getUTCDate() - 90);
  return desde;
}

function agruparPorProducto(
  items: Array<{
    productId: string | null;
    nameSnapshot: string;
    price: Parameters<typeof decimalToNumber>[0];
    quantity: number;
    orderId: string;
  }>
) {
  const map = new Map<
    string,
    { productId: string | null; productName: string; totalUnidades: number; totalIngresos: number; ordenes: Set<string> }
  >();

  for (const item of items) {
    const key = item.productId ?? item.nameSnapshot;
    const price = decimalToNumber(item.price) ?? 0;
    const existing = map.get(key);

    if (existing) {
      existing.totalUnidades += item.quantity;
      existing.totalIngresos += item.quantity * price;
      existing.ordenes.add(item.orderId);
    } else {
      map.set(key, {
        productId: item.productId,
        productName: item.nameSnapshot,
        totalUnidades: item.quantity,
        totalIngresos: item.quantity * price,
        ordenes: new Set([item.orderId])
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.totalUnidades - a.totalUnidades)
    .map(({ ordenes, totalIngresos, ...rest }) => ({
      ...rest,
      totalIngresos: Math.round(totalIngresos * 100) / 100
    }));
}

async function fetchOrders(desde: Date, hasta: Date) {
  return prisma.order.findMany({
    where: {
      status: { not: OrderStatus.CANCELLED },
      createdAt: { gte: desde, lte: hasta }
    },
    select: {
      id: true,
      total: true,
      items: {
        select: {
          productId: true,
          nameSnapshot: true,
          price: true,
          quantity: true,
          orderId: true
        }
      }
    }
  });
}

export async function GET(request: Request) {
  try {
    await requireAdminUser();

    const url = new URL(request.url);
    const rango = rangoSchema.parse(url.searchParams.get("rango") ?? "mes");

    const hasta = new Date();
    const desde = calcularDesde(rango);

    const duracionMs = hasta.getTime() - desde.getTime();
    const periodoAnteriorHasta = new Date(desde);
    const periodoAnteriorDesde = new Date(desde.getTime() - duracionMs);

    const [orders, ordersAnteriores] = await Promise.all([
      fetchOrders(desde, hasta),
      fetchOrders(periodoAnteriorDesde, periodoAnteriorHasta)
    ]);

    const items = orders.flatMap((o) => o.items);
    const itemsAnteriores = ordersAnteriores.flatMap((o) => o.items);

    const productos = agruparPorProducto(items);

    const anterioresPorProducto = new Map(
      agruparPorProducto(itemsAnteriores).map((p) => [p.productId ?? p.productName, p])
    );

    const productosConVariacion = productos.map((p) => {
      const key = p.productId ?? p.productName;
      const anterior = anterioresPorProducto.get(key);
      const variacionUnidades =
        anterior && anterior.totalUnidades > 0
          ? Math.round(((p.totalUnidades - anterior.totalUnidades) / anterior.totalUnidades) * 100)
          : null;
      return { ...p, variacionUnidades };
    });

    const totalUnidades = productos.reduce((s, p) => s + p.totalUnidades, 0);
    // Resumen usa order.total (con descuentos) para coincidir con la vista de pedidos
    const totalIngresos = Math.round(
      orders.reduce((s, o) => s + (decimalToNumber(o.total) ?? 0), 0) * 100
    ) / 100;
    const totalPedidos = orders.length;

    return NextResponse.json({
      productos: productosConVariacion,
      resumen: { totalUnidades, totalIngresos, totalPedidos },
      rango,
      desde: desde.toISOString(),
      hasta: hasta.toISOString()
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
