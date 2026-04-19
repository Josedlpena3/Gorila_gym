"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { Button } from "@/components/ui/button";
import type { CatalogProductsPageDto, ProductCardDto } from "@/types";

function mergeProducts(current: ProductCardDto[], incoming: ProductCardDto[]) {
  const seen = new Set(current.map((product) => product.id));
  const next = [...current];

  incoming.forEach((product) => {
    if (seen.has(product.id)) {
      return;
    }

    seen.add(product.id);
    next.push(product);
  });

  return next;
}

export function CatalogProductFeed({
  initialData,
  requiresLogin,
  queryString
}: {
  initialData: CatalogProductsPageDto;
  requiresLogin: boolean;
  queryString: string;
}) {
  const [products, setProducts] = useState(initialData.products);
  const [page, setPage] = useState(initialData.page);
  const [total, setTotal] = useState(initialData.total);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProducts(initialData.products);
    setPage(initialData.page);
    setTotal(initialData.total);
    setTotalPages(initialData.totalPages);
    setError(null);
    setIsLoading(false);
  }, [initialData, queryString]);

  async function loadMore() {
    if (isLoading || page >= totalPages) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(queryString);
      params.set("page", String(page + 1));
      params.set("limit", "20");

      const response = await fetch(`/api/products?${params.toString()}`, {
        method: "GET",
        cache: "no-store"
      });

      const data = (await response.json()) as CatalogProductsPageDto & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar más productos.");
      }

      setProducts((current) => mergeProducts(current, data.products));
      setPage(data.page);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "No se pudieron cargar más productos."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            requiresLogin={requiresLogin}
          />
        ))}
      </div>

      {products.length === 0 ? (
        <div className="section-card p-6 text-center text-sm text-mist">
          No hay productos disponibles para esta búsqueda.
        </div>
      ) : null}

      {products.length > 0 ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-mist">
            Mostrando {products.length} de {total} productos
          </p>

          {page < totalPages ? (
            <Button
              type="button"
              variant="secondary"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? "Cargando..." : "Cargar más"}
            </Button>
          ) : null}

          {error ? <p className="text-sm text-red-200">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
