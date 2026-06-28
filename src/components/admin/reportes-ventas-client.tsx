"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type RangoKey = "hoy" | "semana" | "mes" | "trimestre";

type Producto = {
  productId: string | null;
  productName: string;
  totalUnidades: number;
  totalIngresos: number;
  variacionUnidades: number | null;
};

type ReporteData = {
  productos: Producto[];
  resumen: { totalUnidades: number; totalIngresos: number; totalPedidos: number };
  desde: string;
  hasta: string;
};

const RANGOS: { key: RangoKey; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "Última semana" },
  { key: "mes", label: "Último mes" },
  { key: "trimestre", label: "Últimos 3 meses" }
];

function SkeletonCard() {
  return (
    <div className="section-card animate-pulse p-5">
      <div className="h-3 w-1/3 rounded-full bg-steel/80" />
      <div className="mt-4 h-8 w-1/2 rounded-full bg-steel/80" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-[20px] border border-line bg-ink/60 px-4 py-3">
      <div className="h-4 w-1/3 rounded-full bg-steel/80" />
      <div className="h-4 w-12 rounded-full bg-steel/80" />
      <div className="h-4 w-20 rounded-full bg-steel/80" />
    </div>
  );
}

export function ReportesVentasClient() {
  const [rango, setRango] = useState<RangoKey>("mes");
  const [data, setData] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: RangoKey) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reportes/ventas?rango=${r}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al cargar el reporte.");
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(rango);
  }, [rango, fetchData]);

  const resumen = data?.resumen;
  const productos = data?.productos ?? [];

  const metricas = resumen
    ? [
        { label: "Unidades vendidas", value: String(resumen.totalUnidades) },
        { label: "Ingresos del período", value: formatCurrency(resumen.totalIngresos) },
        { label: "Pedidos incluidos", value: String(resumen.totalPedidos) }
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="section-card flex flex-wrap gap-2 p-3">
        {RANGOS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setRango(key)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              rango === key
                ? "bg-neon text-ink"
                : "text-mist hover:bg-white/5 hover:text-sand"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : metricas.map((m) => (
              <div key={m.label} className="section-card p-5">
                <p className="text-sm text-mist">{m.label}</p>
                <p className="mt-4 text-3xl font-black text-sand">{m.value}</p>
              </div>
            ))}
      </div>

      {/* Products table */}
      <div className="section-card p-5">
        <div className="mb-4">
          <p className="text-sm uppercase tracking-[0.28em] text-mist">Detalle</p>
          <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-sand">
            Productos vendidos
          </h2>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : productos.length === 0 ? (
          <div className="py-10 text-center text-sm text-mist">
            No hay ventas registradas en este período.
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[1fr,auto,auto] gap-4 px-4 py-2 text-xs uppercase tracking-[0.2em] text-mist">
              <span>Producto</span>
              <span className="text-right">Unidades</span>
              <span className="w-28 text-right">Ingresos</span>
            </div>

            {productos.map((p, i) => (
              <div
                key={p.productId ?? p.productName}
                className="grid grid-cols-[1fr,auto,auto] items-center gap-4 rounded-[20px] border border-line bg-ink/60 px-4 py-3"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {i === 0 ? <Badge variant="success">Top</Badge> : null}
                  <span className="truncate text-sm font-semibold text-sand">
                    {p.productName}
                  </span>
                  {p.variacionUnidades !== null ? (
                    <span
                      className={`text-xs font-semibold ${
                        p.variacionUnidades >= 0 ? "text-neon" : "text-red-300"
                      }`}
                    >
                      {p.variacionUnidades >= 0 ? "+" : ""}
                      {p.variacionUnidades}%
                    </span>
                  ) : null}
                </div>
                <span className="text-right text-sm font-black text-sand">
                  {p.totalUnidades}
                </span>
                <span className="w-28 text-right text-sm font-black text-sand">
                  {formatCurrency(p.totalIngresos)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
