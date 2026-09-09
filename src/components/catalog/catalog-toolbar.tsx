"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ActiveFilters } from "@/components/catalog/active-filters";
import {
  CatalogFilters,
  type CatalogFacets
} from "@/components/catalog/catalog-filters";
import { CatalogSort } from "@/components/catalog/catalog-sort";
import { useCatalogParams } from "@/components/catalog/use-catalog-params";
import { Input } from "@/components/ui/input";

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

  // El buscador se confirma con Enter o con el botón, así que el campo mantiene
  // su propio borrador. Se resincroniza cuando la URL cambia por otra vía —un
  // chip removido, el botón atrás— para que no quede texto que ya no se aplica.
  useEffect(() => {
    setSearchTerm(currentQuery ?? "");
  }, [currentQuery]);

  const visibleCategories = categories.filter((c) => c.slug !== "shakers");
  const sortedCategories = sortCategories(visibleCategories);

  function submitSearch() {
    apply({ q: searchTerm.trim() || null });
  }

  return (
    <div className="space-y-4">
      <div className="section-card relative z-20 px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist"
                aria-hidden="true"
              />
              <Input
                name="q"
                type="search"
                aria-label="Buscar productos"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitSearch();
                  }
                }}
                placeholder="¿Qué estás buscando?"
                className="min-h-10 rounded-xl py-2 pl-9 pr-3 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={submitSearch}
              className="inline-flex min-h-10 items-center whitespace-nowrap rounded-xl border border-neon/60 bg-neon/10 px-4 text-sm font-semibold text-ember transition hover:bg-neon/20"
            >
              Buscar
            </button>

            <div className="ml-auto flex items-center gap-2">
              <CatalogFilters facets={facets} />
              <CatalogSort />
            </div>
          </div>

          {/* La fila envuelve en vez de desplazarse: nueve categorías son un
              conjunto chico y estable, y con scroll horizontal quedaban seis
              fuera de pantalla en un celular sin ninguna señal de que estaban. */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => apply({ categoryId: null })}
              aria-pressed={!currentCategory}
              className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                !currentCategory
                  ? "border-neon bg-neon text-white"
                  : "border-hairline bg-surface-sunken text-mist hover:border-white/25 hover:text-sand"
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
                  onClick={() =>
                    apply({ categoryId: active ? null : category.id })
                  }
                  aria-pressed={active}
                  className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-neon bg-neon text-white"
                      : "border-hairline bg-surface-sunken text-mist hover:border-white/25 hover:text-sand"
                  }`}
                >
                  {getCategoryDisplayName(category)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActiveFilters categories={visibleCategories} />
        <p
          aria-live="polite"
          className="ml-auto text-xs text-mist"
        >
          {isPending
            ? "Actualizando…"
            : `${total} ${total === 1 ? "producto" : "productos"}`}
        </p>
      </div>
    </div>
  );
}
