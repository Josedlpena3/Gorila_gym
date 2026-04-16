import { OrderStatus, RoleKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { listAllOrders } from "@/modules/orders/order.service";
import type { AdminDashboardDto } from "@/types";

export async function getAdminDashboard(): Promise<AdminDashboardDto> {
  const [
    ordersAggregate,
    activeProducts,
    lowStockProducts,
    customerRole,
    pendingVerification,
    recentOrders
  ] =
    await Promise.all([
      prisma.order.aggregate({
        where: {
          status: {
            in: [OrderStatus.CONTACTED, OrderStatus.DELIVERED]
          }
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      }),
      prisma.product.count({
        where: {
          active: true
        }
      }),
      prisma.product.count({
        where: {
          active: true,
          stock: {
            lte: 5
          }
        }
      }),
      prisma.role.findUnique({
        where: { key: RoleKey.CUSTOMER },
        include: {
          _count: {
            select: {
              users: true
            }
          }
        }
      }),
      prisma.order.count({
        where: {
          status: OrderStatus.PENDING_CONFIRMATION
        }
      }),
      listAllOrders()
    ]);

  return {
    revenue: decimalToNumber(ordersAggregate._sum.total) ?? 0,
    totalOrders: ordersAggregate._count.id,
    activeProducts,
    customers: customerRole?._count.users ?? 0,
    pendingVerification,
    lowStockProducts,
    recentOrders: recentOrders.slice(0, 5)
  };
}
