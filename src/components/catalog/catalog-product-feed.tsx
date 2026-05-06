"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const lastAutoLoadedPageRef = useRef<number | null>(null);
  const hasMore = page < totalPages;

  useEffect(() => {
    setProducts(initialData.products);
    setPage(initialData.page);
    setTotal(initialData.total);
    setTotalPages(initialData.totalPages);
    setError(null);
    setIsLoading(false);
    isLoadingRef.current = false;
    lastAutoLoadedPageRef.current = null;
  }, [initialData, queryString]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) {
      return;
    }

    isLoadingRef.current = true;
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
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore, page, queryString]);

  useEffect(() => {
    const current = loadMoreRef.current;

    if (!current || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (!firstEntry?.isIntersecting || isLoadingRef.current || !hasMore) {
          return;
        }

        if (lastAutoLoadedPageRef.current === page) {
          return;
        }

        lastAutoLoadedPageRef.current = page;
        void loadMore();
      },
      {
        rootMargin: "200px 0px",
        threshold: 0
      }
    );

    observer.observe(current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore, page]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:gap-6">
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

          {hasMore ? (
            <div
              ref={loadMoreRef}
              aria-hidden="true"
              className="h-10 w-full"
            />
          ) : null}

          {isLoading ? (
            <p className="text-sm text-mist">Cargando productos...</p>
          ) : null}

          {error ? <p className="text-sm text-red-200">{error}</p> : null}

          {error ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                lastAutoLoadedPageRef.current = null;
                void loadMore();
              }}
              disabled={isLoading}
            >
              Reintentar
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
