/**
 * Placeholder de una tarjeta de producto. Comparte proporciones con
 * `ProductCard` para que el reemplazo no genere salto de layout.
 */
export function ProductCardSkeleton() {
  return (
    <div className="section-card animate-pulse overflow-hidden">
      <div className="aspect-square bg-steel/80" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-3 w-1/3 rounded-full bg-steel/80" />
        <div className="h-5 w-full rounded-full bg-steel/80" />
        <div className="h-5 w-3/4 rounded-full bg-steel/80" />
        <div className="mt-4 h-4 w-1/2 rounded-full bg-steel/80" />
        <div className="mt-2 h-10 w-full rounded-[22px] bg-steel/80" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
