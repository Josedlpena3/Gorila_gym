import { ReportesVentasClient } from "@/components/admin/reportes-ventas-client";

export default function AdminReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-eyebrow-wide text-mist">Administración</p>
        <h1 className="text-4xl font-black uppercase tracking-display text-sand">
          Reporte de ventas
        </h1>
      </div>

      <ReportesVentasClient />
    </div>
  );
}
