/**
 * Cinta de marcas del catálogo, en movimiento continuo.
 *
 * La lista se duplica y la animación desplaza el 50% del ancho: al terminar
 * vuelve al inicio y el corte no se ve. Es CSS puro, sin JavaScript, y se
 * detiene si el sistema pide movimiento reducido.
 */
export function BrandMarquee({ brands }: { brands: string[] }) {
  if (brands.length === 0) {
    return null;
  }

  const loop = [...brands, ...brands];

  return (
    <section
      aria-label="Marcas que trabajamos"
      className="relative overflow-hidden rounded-2xl border border-hairline bg-surface py-4 shadow-card"
    >
      {/* Degradados en los bordes: la cinta entra y sale en vez de cortarse. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent"
      />

      <div className="flex w-max animate-marquee items-center gap-10 motion-reduce:animate-none">
        {loop.map((brand, index) => (
          <span
            key={`${brand}-${index}`}
            aria-hidden={index >= brands.length ? "true" : undefined}
            className="whitespace-nowrap text-sm font-bold uppercase tracking-eyebrow text-mist/70"
          >
            {brand}
          </span>
        ))}
      </div>
    </section>
  );
}
