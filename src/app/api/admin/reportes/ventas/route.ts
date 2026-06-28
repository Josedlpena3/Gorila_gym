import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/errors";
import { requireAdminUser } from "@/modules/users/user.service";
import { decimalToNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const rangoSchema = z.enum(["hoy", "semana", "mes", "trimestre"]);

function calcularDesde(rango: "hoy" | "semana" | "mes" | "trimestre"): Date {
  const ahora = new Date();
  if (rango === "hoy") {
    const desde = new Date(ahora);
    desde.setHours(0, 0, 0, 0);
    return desde;
  }
  const dias: Record<string, number> = { semana: 7, mes: 30, trimestre: 90 };
  const desde = new Date(ahora);
  desde.setDate(desde.getDate() - dias[rango]);
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

async function fetchItems(desde: Date, hasta: Date) {
  return prisma.orderItem.findMany({
    where: {
      order: {
        status: { in: ["CONTACTED", "DELIVERED"] },
        createdAt: { gte: desde, lte: hasta }
      }
    },
    select: {
      productId: true,
      nameSnapshot: true,
      price: true,
      quantity: true,
      orderId: true
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

    const [items, itemsAnteriores] = await Promise.all([
      fetchItems(desde, hasta),
      fetchItems(periodoAnteriorDesde, periodoAnteriorHasta)
    ]);

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
    const totalIngresos = Math.round(productos.reduce((s, p) => s + p.totalIngresos, 0) * 100) / 100;
    const totalPedidos = new Set(items.map((i) => i.orderId)).size;

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
