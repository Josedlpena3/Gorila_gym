import { OrderStatusForm } from "@/components/admin/order-status-form";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listAllOrders } from "@/modules/orders/order.service";

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

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="section-card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Badge>
                  <Badge variant={order.paymentStatus === "APPROVED" ? "success" : "default"}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                <h2 className="mt-4 text-2xl font-black uppercase tracking-[0.08em] text-sand">
                  {order.code}
                </h2>
                <p className="mt-2 text-sm text-mist">
                  {order.customer} · {order.email}
                </p>
                <p className="text-sm text-mist">
                  {formatDate(order.createdAt)} · {order.city}, {order.province}
                </p>
                <p className="mt-3 text-2xl font-black text-sand">
                  {formatCurrency(order.total)}
                </p>
              </div>
              <OrderStatusForm
                orderId={order.id}
                currentStatus={order.status}
                paymentMethod={order.paymentMethod}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

