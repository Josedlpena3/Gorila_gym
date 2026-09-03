/**
 * Cubre todas las subrutas del panel: pedidos, productos, stock, precios,
 * promociones, reportes y usuarios. Todas son dinámicas y consultan la base, así
 * que sin esto cada click dejaba la pantalla anterior congelada.
 *
 * Solo dibuja el área de contenido: la navegación del panel vive en el layout y
 * se mantiene visible mientras esto se muestra.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-white/5" />
        <div className="h-8 w-64 rounded-full bg-surface-raised" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="section-card p-5">
            <div className="h-3 w-28 rounded-full bg-white/5" />
            <div className="mt-4 h-8 w-32 rounded-full bg-surface-raised" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="section-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded-full bg-white/5" />
                <div className="h-5 w-44 rounded-full bg-surface-raised" />
              </div>
              <div className="h-7 w-28 rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
