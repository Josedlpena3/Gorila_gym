import { AdminOrdersClient } from "@/components/admin/admin-orders-client";
import { listAllOrders } from "@/modules/orders/order.service";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listAllOrders();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Pedidos</p>
        <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Gestión operativa
        </h1>
      </div>

      <AdminOrdersClient orders={orders} />
    </div>
  );
}
