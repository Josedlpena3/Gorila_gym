"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import type { ProductCardDto } from "@/types";

const catalogLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-6 py-3 text-sm font-semibold text-ink transition hover:bg-neon/90";

export function HomeFeaturedProducts({
  products,
  requiresLogin
}: {
  products: ProductCardDto[];
  requiresLogin: boolean;
}) {
  const endOfFeaturedRef = useRef<HTMLDivElement | null>(null);
  const [showCatalogButton, setShowCatalogButton] = useState(false);

  useEffect(() => {
    const current = endOfFeaturedRef.current;

    if (!current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowCatalogButton(Boolean(entry?.isIntersecting));
      },
      {
        threshold: 0.5
      }
    );

    observer.observe(current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-mist sm:text-sm sm:tracking-[0.28em]">
          Home
        </p>
        <h2 className="text-2xl font-black uppercase tracking-[0.06em] text-sand sm:text-3xl">
          Destacados y novedades
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            requiresLogin={requiresLogin}
          />
        ))}
      </div>

      <div ref={endOfFeaturedRef} aria-hidden="true" className="h-10" />

      {showCatalogButton ? (
        <div className="flex justify-center pt-2">
          <Link href="/catalogo" className={catalogLinkClass}>
            Ver catálogo completo
          </Link>
        </div>
      ) : null}
    </section>
  );
}
