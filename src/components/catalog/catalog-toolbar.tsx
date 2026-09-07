"use client";

import { useEffect, useState } from "react";
import { ActiveFilters } from "@/components/catalog/active-filters";
import {
  CatalogFilters,
  type CatalogFacets
} from "@/components/catalog/catalog-filters";
import { CatalogSort } from "@/components/catalog/catalog-sort";
import { useCatalogParams } from "@/components/catalog/use-catalog-params";
import { SearchInput } from "@/components/ui/search-input";

type CategoryFilter = {
  id: string;
  name: string;
  slug: string;
};

const CATEGORY_ORDER: readonly string[] = [
  "Creatinas",
  "Proteínas",
  "Pre entrenos",
  "Alimentos",
  "Aminoácidos",
  "Hidratación",
  "Barritas"
] as const;

function getCategoryDisplayName(category: CategoryFilter) {
  if (category.slug === "panqueques") return "Alimentos";
  if (category.slug === "geles") return "Hidratación";
  return category.name;
}

function sortCategories(categories: CategoryFilter[]) {
  return [...categories].sort((a, b) => {
    const nameA = getCategoryDisplayName(a);
    const nameB = getCategoryDisplayName(b);
    const indexA = CATEGORY_ORDER.indexOf(nameA);
    const indexB = CATEGORY_ORDER.indexOf(nameB);
    if (indexA === -1 && indexB === -1) return nameA.localeCompare(nameB, "es");
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

/**
 * Barra de control del catálogo.
 *
 * Ocupa dos filas fijas —búsqueda con sus controles, y categorías— y nada más:
 * los filtros viven en un panel que se abre encima, no en el flujo, para que la
 * grilla de productos siga siendo lo que domina la pantalla.
 */
export function CatalogToolbar({
  categories,
  facets,
  total
}: {
  categories: CategoryFilter[];
  facets: CatalogFacets;
  total: number;
}) {
  const { get, apply, isPending } = useCatalogParams();
  const currentQuery = get("q");
  const currentCategory = get("categoryId");

  const [searchTerm, setSearchTerm] = useState(currentQuery ?? "");

  useEffect(() => {
    setSearchTerm(currentQuery ?? "");
  }, [currentQuery]);

  const visibleCategories = categories.filter((c) => c.slug !== "shakers");
  const sortedCategories = sortCategories(visibleCategories);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Un <form> de verdad: el teclado de iOS y Android muestra la tecla
            "Buscar" en vez de un Enter genérico. */}
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
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <CatalogFilters facets={facets} />
          <CatalogSort />
        </div>
      </div>

      {/* Las categorías envuelven en vez de desplazarse: son nueve, un conjunto
          chico y estable, y con scroll horizontal quedaban seis fuera de
          pantalla en un celular sin ninguna señal de que estaban ahí. */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => apply({ categoryId: null })}
          aria-pressed={!currentCategory}
          className={`inline-flex min-h-8 items-center whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
            !currentCategory
              ? "border-neon/70 bg-neon/15 text-sand"
              : "border-hairline text-mist hover:border-white/25 hover:text-sand"
          }`}
        >
          Todo
        </button>

        {sortedCategories.map((category) => {
          const active = category.id === currentCategory;

          return (
            <button
              type="button"
              key={category.id}
              onClick={() => apply({ categoryId: active ? null : category.id })}
              aria-pressed={active}
              className={`inline-flex min-h-8 items-center whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                active
                  ? "border-neon/70 bg-neon/15 text-sand"
                  : "border-hairline text-mist hover:border-white/25 hover:text-sand"
              }`}
            >
              {getCategoryDisplayName(category)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <ActiveFilters categories={visibleCategories} />
        <p aria-live="polite" className="ml-auto text-xs tabular-nums text-mist">
          {isPending
            ? "Actualizando…"
            : `${total} ${total === 1 ? "producto" : "productos"}`}
        </p>
      </div>
    </div>
  );
}
