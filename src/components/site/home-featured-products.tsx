import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import type { ProductCardDto } from "@/types";

export function HomeFeaturedProducts({
  products
}: {
  products: ProductCardDto[];
}) {
  return (
    <section className="space-y-6">
      {/* El eyebrow decía "Home", que no es información. Ahora el encabezado
          explica qué son estos productos y el enlace al catálogo sube acá, que
          es donde alguien decide si sigue mirando. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-hero text-sand sm:text-3xl">
            Destacados
          </h2>
        </div>
        <Link
          href="/catalogo"
          className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-sand transition hover:text-ember"
        >
          Ver todo el catálogo
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
