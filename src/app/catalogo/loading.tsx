import { ProductGridSkeleton } from "@/components/catalog/product-card-skeleton";

export default function CatalogLoading() {
  return (
    <div className="page-shell space-y-6 sm:space-y-8">
      <div className="section-card mx-auto max-w-5xl animate-pulse px-3 py-2.5 sm:px-4 sm:py-4">
        <div className="mb-2 flex items-center gap-2 md:mb-4">
          <div className="h-[38px] w-full max-w-sm rounded-[18px] bg-white/5 md:h-[44px] md:max-w-md" />
          <div className="h-[38px] w-20 rounded-[18px] bg-white/5 md:h-[44px]" />
        </div>
        <div className="flex gap-2 overflow-hidden pb-1">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="h-11 w-24 shrink-0 rounded-full bg-white/5"
            />
          ))}
        </div>
      </div>

      <ProductGridSkeleton count={8} />
    </div>
  );
}
