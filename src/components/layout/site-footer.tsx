export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 py-8">
      <div className="page-shell flex flex-col gap-3 text-sm text-mist sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-sand">Gorila Strong</p>
          <p>Suplementación premium para acompañar tu entrenamiento.</p>
        </div>
        <div className="text-left sm:text-right">
          <p>Atención personalizada para coordinar entrega y seguimiento.</p>
        </div>
      </div>
    </footer>
  );
}
