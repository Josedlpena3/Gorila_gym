"use client";

import { X } from "lucide-react";
import { useCatalogParams } from "@/components/catalog/use-catalog-params";
import { OBJECTIVE_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { CatalogFilterKey } from "@/components/catalog/use-catalog-params";

type ActiveChip = {
  key: CatalogFilterKey;
  label: string;
  clear: Partial<Record<CatalogFilterKey, null>>;
};

/**
 * Resumen de lo que está filtrando ahora mismo, con cada criterio removible.
 *
 * Los filtros viven en un panel que se cierra, así que sin esto el usuario no
 * tiene forma de saber por qué ve 12 productos en vez de 156 — ni cómo volver
 * atrás sin abrir el panel de nuevo.
 */
export function ActiveFilters({
  categories
}: {
  categories: Array<{ id: string; name: string }>;
}) {
  const { get, apply, clearAll } = useCatalogParams();

  const query = get("q");
  const categoryId = get("categoryId");
  const brand = get("brand");
  const objective = get("objective");
  const minPrice = get("minPrice");
  const maxPrice = get("maxPrice");

  const chips: ActiveChip[] = [];

  if (query) {
    chips.push({ key: "q", label: `“${query}”`, clear: { q: null } });
  }

  if (categoryId) {
    const category = categories.find((entry) => entry.id === categoryId);

    if (category) {
      chips.push({
        key: "categoryId",
        label: category.name,
        clear: { categoryId: null }
      });
    }
  }

  if (brand) {
    chips.push({ key: "brand", label: brand, clear: { brand: null } });
  }

  if (objective) {
    chips.push({
      key: "objective",
      label: OBJECTIVE_LABELS[objective] ?? objective,
      clear: { objective: null }
    });
  }

  if (minPrice || maxPrice) {
    const from = minPrice ? formatCurrency(Number(minPrice)) : null;
    const to = maxPrice ? formatCurrency(Number(maxPrice)) : null;

    chips.push({
      key: "minPrice",
      label: from && to ? `${from} – ${to}` : from ? `Desde ${from}` : `Hasta ${to}`,
      clear: { minPrice: null, maxPrice: null }
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-eyebrow text-mist">
        Filtrando por
      </span>

      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => apply(chip.clear)}
          className="group inline-flex min-h-8 items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-semibold text-sand transition hover:border-neon/70 hover:bg-neon/20"
        >
          {chip.label}
          <X
            className="h-3 w-3 text-mist transition group-hover:text-sand"
            aria-hidden="true"
          />
          <span className="sr-only">Quitar filtro</span>
        </button>
      ))}

      {chips.length > 1 ? (
        <button
          type="button"
          onClick={clearAll}
          className="min-h-8 text-xs font-semibold text-mist underline-offset-4 transition hover:text-sand hover:underline"
        >
          Limpiar todo
        </button>
      ) : null}
    </div>
  );
}
