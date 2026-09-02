import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import type { ProductCardDto } from "@/types";

export function HomeFeaturedProducts({
  products
}: {
  products: ProductCardDto[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-eyebrow text-mist sm:text-sm sm:tracking-eyebrow-wide">
          Home
        </p>
        <h2 className="text-2xl font-black uppercase tracking-hero text-sand sm:text-3xl">
          Destacados y novedades
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Link
          href="/catalogo"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-6 py-3 text-sm font-semibold text-white transition hover:bg-neon/90"
        >
          Ver catálogo completo
        </Link>
      </div>
    </section>
  );
}
