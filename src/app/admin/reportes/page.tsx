import { ReportesVentasClient } from "@/components/admin/reportes-ventas-client";

export default function AdminReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Administración</p>
        <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Reporte de ventas
        </h1>
      </div>

      <ReportesVentasClient />
    </div>
  );
}
