import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { getAdminDashboard } from "@/modules/dashboard/dashboard.service";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboard();

  const metrics = [
    { label: "Facturación", value: formatCurrency(dashboard.revenue) },
    { label: "Pedidos", value: String(dashboard.totalOrders) },
    { label: "Productos activos", value: String(dashboard.activeProducts) },
    { label: "Clientes", value: String(dashboard.customers) },
    { label: "Pendientes de confirmación", value: String(dashboard.pendingVerification) },
    { label: "Stock crítico", value: String(dashboard.lowStockProducts) }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Dashboard</p>
        <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Operación Gorila Strong
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="section-card p-5">
            <p className="text-sm text-mist">{metric.label}</p>
            <p className="mt-4 text-3xl font-black text-sand">{metric.value}</p>
          </div>
        ))}
      </div>

      <section className="section-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-mist">Actividad</p>
            <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-sand">
              Pedidos recientes
            </h2>
          </div>
          <Badge variant="success">Tiempo real por API</Badge>
        </div>
        <div className="mt-6 grid gap-4">
          {dashboard.recentOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-[28px] border border-line bg-ink/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sand">{order.code}</p>
                  <p className="text-sm text-mist">
                    {order.city}, {order.province}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-mist">{ORDER_STATUS_LABELS[order.status]}</p>
                  <p className="text-lg font-black text-sand">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
