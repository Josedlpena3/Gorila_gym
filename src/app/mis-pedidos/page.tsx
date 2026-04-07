import { redirect } from "next/navigation";
import { TransferPaymentCard } from "@/components/payments/transfer-payment-card";
import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listOrdersByUser } from "@/modules/orders/order.service";
import { getCurrentUser } from "@/modules/users/user.service";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/mis-pedidos");
  }

  const orders = await listOrdersByUser(user.id);
  const highlight =
    typeof searchParams.highlight === "string" ? searchParams.highlight : null;

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Pedidos</p>
        <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Historial y seguimiento
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="section-card p-10 text-center">
          <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-sand">
            Todavía no tenés pedidos
          </h2>
          <p className="mt-3 text-mist">
            Cuando finalices una compra, vas a verla acá con su estado actualizado.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className={`section-card p-6 ${
                highlight === order.id ? "ring-2 ring-neon/60" : ""
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={order.status === "DELIVERED" ? "success" : "default"}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <Badge>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Badge>
                  </div>
                  <h2 className="mt-4 text-2xl font-black uppercase tracking-[0.08em] text-sand">
                    {order.code}
                  </h2>
                  <p className="mt-2 text-sm text-mist">
                    {formatDate(order.createdAt)} · {order.city}, {order.province}
                  </p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-sm text-mist">Estado del pago</p>
                  <p className="text-sm font-semibold text-sand">
                    {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </p>
                  <p className="mt-3 text-3xl font-black text-sand">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-line bg-ink/60 p-4"
                  >
                    <p className="font-semibold text-sand">{item.name}</p>
                    <p className="mt-1 text-sm text-mist">{item.brand}</p>
                    <p className="mt-3 text-sm text-mist">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                  </div>
                ))}
              </div>

              {order.payment.transfer ? (
                <TransferPaymentCard
                  className="mt-6"
                  transfer={order.payment.transfer}
                />
              ) : null}

              {order.payment.checkoutUrl &&
              order.payment.status === "PENDING" &&
              order.status === "PENDING_PAYMENT" ? (
                <div className="mt-6">
                  <a
                    href={order.payment.checkoutUrl}
                    className="inline-flex rounded-full bg-neon px-5 py-3 text-sm font-semibold text-ink transition hover:bg-neon/90"
                  >
                    Continuar pago
                  </a>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
