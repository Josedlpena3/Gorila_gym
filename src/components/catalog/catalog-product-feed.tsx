"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { Button } from "@/components/ui/button";
import type { CatalogProductsPageDto, ProductCardDto } from "@/types";

function ProductCardSkeleton() {
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

      const response = await fetch(`/api/products?${params.toString()}`);

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
        <div className="flex flex-col items-center gap-4">
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
            <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

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
