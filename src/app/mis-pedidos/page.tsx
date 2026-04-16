import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_BADGE_VARIANTS, ORDER_STATUS_LABELS } from "@/lib/constants";
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
  const created = typeof searchParams.created === "string" && searchParams.created === "1";

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Pedidos</p>
        <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-sand sm:text-4xl">
          Historial y seguimiento
        </h1>
      </div>

      {created ? (
        <div className="section-card border border-neon/30 bg-neon/10 p-4 text-sm text-sand sm:p-5">
          Recibimos tu pedido. Te vamos a contactar por WhatsApp para coordinar.
        </div>
      ) : null}

      {orders.length === 0 ? (
        <div className="section-card p-6 text-center sm:p-10">
          <h2 className="text-xl font-black uppercase tracking-[0.08em] text-sand sm:text-2xl">
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
              className={`section-card p-4 sm:p-6 ${
                highlight === order.id ? "ring-2 ring-neon/60" : ""
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                  <h2 className="mt-4 text-xl font-black uppercase tracking-[0.08em] text-sand sm:text-2xl">
                    {order.code}
                  </h2>
                  <p className="mt-2 text-sm text-mist">
                    {formatDate(order.createdAt)} · {order.city}, {order.province}
                  </p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-sm text-mist">Contacto</p>
                  <p className="text-sm font-semibold text-sand">{order.contactPhone}</p>
                  <p className="mt-2 max-w-xs text-xs text-mist lg:ml-auto">
                    Nos comunicamos por WhatsApp para coordinar entrega y seguimiento.
                  </p>
                  <p className="mt-3 text-2xl font-black text-sand sm:text-3xl">
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
