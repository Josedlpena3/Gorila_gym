import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_BADGE_VARIANTS, ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getSiteConfig } from "@/modules/site-config/site-config.service";
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

  const [orders, siteConfig] = await Promise.all([
    listOrdersByUser(user.id),
    getSiteConfig().catch((error) => {
      console.error("[mis-pedidos] no se pudo cargar site-config", error);
      return null;
    })
  ]);
  const highlight =
    typeof searchParams.highlight === "string" ? searchParams.highlight : null;
  const created = typeof searchParams.created === "string" && searchParams.created === "1";

  return (
    <div className="page-shell space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-mist sm:text-sm sm:tracking-[0.3em]">
          Pedidos
        </p>
        <h1 className="text-2xl font-black uppercase tracking-[0.06em] text-sand sm:text-4xl">
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
              className={`section-card overflow-hidden p-4 sm:p-6 ${
                highlight === order.id ? "ring-2 ring-neon/60" : ""
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-mist">Pedido</p>
                    <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em] text-sand sm:text-2xl">
                      {order.code}
                    </h2>
                    <p className="mt-2 text-sm text-mist">
                      {formatDate(order.createdAt)} · {order.city}, {order.province}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-[24px] border border-line bg-ink/50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-mist">Contacto</p>
                      <p className="text-sm font-semibold text-sand">{order.contactPhone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-mist">Total</p>
                      <p className="text-lg font-bold text-sand sm:text-2xl">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-mist">
                    Nos comunicamos por WhatsApp para coordinar entrega y seguimiento.
                  </p>
                  {siteConfig ? (
                    <a
                      href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                        `Hola, quiero consultar por mi pedido ${order.code}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-neon px-5 py-3 text-sm font-semibold text-ink transition hover:bg-neon/90"
                    >
                      Contactar por WhatsApp
                    </a>
                  ) : null}
                </div>

                <div className="grid gap-3">
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
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
