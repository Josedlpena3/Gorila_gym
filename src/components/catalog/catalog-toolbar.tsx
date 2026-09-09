"use client";

import { useEffect, useState } from "react";
import { ActiveFilters } from "@/components/catalog/active-filters";
import type { CatalogCategory } from "@/components/catalog/catalog-categories";
import {
  CatalogFilters,
  type CatalogFacets
} from "@/components/catalog/catalog-filters";
import { useCatalogParams } from "@/components/catalog/use-catalog-params";
import { SearchInput } from "@/components/ui/search-input";

/**
 * Barra de control del catálogo: hamburger de filtros y buscador.
 *
 * Las categorías y las marcas viven adentro del menú. Arriba de la grilla
 * quedan solo los chips de lo que está activo, para que los productos tengan
 * el protagonismo.
 */
export function CatalogToolbar({
  categories,
  facets,
  total
}: {
  categories: CatalogCategory[];
  facets: CatalogFacets;
  total: number;
}) {
  const { get, apply, isPending } = useCatalogParams();
  const currentQuery = get("q");
  const [searchTerm, setSearchTerm] = useState(currentQuery ?? "");

  useEffect(() => {
    setSearchTerm(currentQuery ?? "");
  }, [currentQuery]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CatalogFilters categories={categories} facets={facets} />

        <form
          role="search"
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            apply({ q: searchTerm.trim() || null });
          }}
        >
          <SearchInput
            name="q"
            aria-label="Buscar productos"
            placeholder="Buscar productos…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onClear={() => {
              setSearchTerm("");
              apply({ q: null });
            }}
          />
          <button type="submit" className="sr-only">
            Buscar
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <ActiveFilters categories={categories} />
        <p aria-live="polite" className="ml-auto text-xs tabular-nums text-mist">
          {isPending
            ? "Actualizando…"
            : `${total} ${total === 1 ? "producto" : "productos"}`}
        </p>
      </div>
    </div>
  );
}
