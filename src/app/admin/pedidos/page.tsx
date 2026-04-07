import { OrderStatusForm } from "@/components/admin/order-status-form";
import { TransferPaymentCard } from "@/components/payments/transfer-payment-card";
import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
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

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="section-card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Badge>
                  <Badge variant={order.paymentStatus === "APPROVED" ? "success" : "default"}>
                    {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </Badge>
                  <Badge variant={order.status === "DELIVERED" ? "success" : "default"}>
                    {ORDER_STATUS_LABELS[order.status]}
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
                <p className="text-sm text-mist">
                  {order.street ? `${order.street} ${order.number ?? ""}`.trim() : "Sin calle"} ·{" "}
                  {order.postalCode ?? "Sin CP"}
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
            {order.payment.transfer ? (
              <TransferPaymentCard
                className="mt-6"
                transfer={order.payment.transfer}
                showAccountDetails={false}
              />
            ) : null}
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist">
                <p className="text-xs uppercase tracking-[0.24em] text-mist">
                  Datos del pedido
                </p>
                <p className="mt-3 text-sand">Cliente: {order.customer}</p>
                <p>Método de pago: {PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
                <p>Estado del pedido: {ORDER_STATUS_LABELS[order.status]}</p>
                <p>Estado del pago: {PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
                <p>Ciudad: {order.city}</p>
                <p>Provincia: {order.province}</p>
                <p>Dirección: {order.street ? `${order.street} ${order.number ?? ""}`.trim() : "-"}</p>
              </div>
              <div className="rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist">
                <p className="text-xs uppercase tracking-[0.24em] text-mist">
                  Productos
                </p>
                <div className="mt-3 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-line bg-ink/70 p-3">
                      <p className="font-semibold text-sand">{item.name}</p>
                      <p>{item.brand}</p>
                      <p>
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
