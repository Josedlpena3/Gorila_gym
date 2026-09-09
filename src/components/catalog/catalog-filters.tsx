"use client";

import { Check, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  getCategoryDisplayName,
  sortCatalogCategories,
  type CatalogCategory
} from "@/components/catalog/catalog-categories";
import { useCatalogParams } from "@/components/catalog/use-catalog-params";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

export type CatalogFacets = {
  brands: Array<{ label: string; count: number }>;
  minPrice: number;
  maxPrice: number;
};

type AccordionSection = "categories" | "brands" | null;

function AccordionTrigger({
  label,
  open,
  summary,
  controlsId,
  onClick
}: {
  label: string;
  open: boolean;
  summary?: string;
  controlsId: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controlsId}
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-between gap-3 text-left"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mist">
        {label}
      </span>
      <span className="flex min-w-0 items-center gap-2">
        {summary ? (
          <span className="truncate text-xs text-sand">{summary}</span>
        ) : null}
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-mist transition-transform",
            open && "rotate-90"
          )}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

/**
 * Menú de filtros del catálogo.
 *
 * El botón hamburger abre un panel a pantalla completa en el teléfono y un
 * panel lateral en escritorio. Adentro hay un acordeón: una sección a la vez,
 * para que categorías y marcas no compitan con la grilla de productos.
 *
 * Las marcas son de selección múltiple. Viajan en la URL como
 * `?brand=ENA,Star%20Nutrition` y el backend las combina con OR, independiente
 * de la categoría (AND).
 */
export function CatalogFilters({
  categories,
  facets
}: {
  categories: CatalogCategory[];
  facets: CatalogFacets;
}) {
  const { get, getList, apply, toggleInList, clearFilters, activeCount } =
    useCatalogParams();
  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<AccordionSection>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const categoriesId = useId();
  const brandsId = useId();

  const currentCategoryId = get("categoryId");
  const selectedBrands = getList("brand");
  const sortedCategories = sortCatalogCategories(categories);
  const selectedCategory = sortedCategories.find(
    (category) => category.id === currentCategoryId
  );

  useFocusTrap(panelRef, isOpen);

  useEffect(() => {
    if (!isOpen) {
      setOpenSection(null);
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function toggleSection(section: AccordionSection) {
    setOpenSection((current) => (current === section ? null : section));
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Abrir filtros"
        className={cn(
          "inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-2.5 text-sm font-medium transition sm:px-3",
          isOpen || activeCount > 0
            ? "border-neon/60 bg-neon/10 text-sand"
            : "border-hairline bg-surface-sunken text-mist hover:border-white/25 hover:text-sand"
        )}
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Filtros</span>
        {activeCount > 0 ? (
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-neon px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar filtros"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros del catálogo"
            className="absolute inset-y-0 left-0 flex h-full w-full max-w-none flex-col bg-ink shadow-premium sm:w-[22rem] sm:border-r sm:border-hairline"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-5 py-4">
              <p className="text-sm font-bold text-sand">Filtros</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar filtros"
                className="flex h-10 w-10 items-center justify-center rounded-full text-mist transition hover:bg-white/10 hover:text-sand"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5">
              <div className="border-b border-hairline">
                <AccordionTrigger
                  label="Categorías"
                  open={openSection === "categories"}
                  summary={
                    selectedCategory
                      ? getCategoryDisplayName(selectedCategory)
                      : undefined
                  }
                  controlsId={categoriesId}
                  onClick={() => toggleSection("categories")}
                />
                <ul
                  id={categoriesId}
                  hidden={openSection !== "categories"}
                  className="space-y-0.5 pb-4"
                >
                    {sortedCategories.map((category) => {
                      const active = category.id === currentCategoryId;
                      const label = getCategoryDisplayName(category);

                      return (
                        <li key={category.id}>
                          <button
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              apply({
                                categoryId: active ? null : category.id
                              })
                            }
                            className={cn(
                              "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm transition",
                              active
                                ? "bg-neon/15 text-sand"
                                : "text-mist hover:bg-white/5 hover:text-sand"
                            )}
                          >
                            {label}
                            {active ? (
                              <Check
                                className="h-4 w-4 shrink-0 text-ember"
                                aria-hidden="true"
                              />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>

              <div>
                <AccordionTrigger
                  label="Marcas"
                  open={openSection === "brands"}
                  summary={
                    selectedBrands.length > 0
                      ? String(selectedBrands.length)
                      : undefined
                  }
                  controlsId={brandsId}
                  onClick={() => toggleSection("brands")}
                />
                <ul
                  id={brandsId}
                  hidden={openSection !== "brands"}
                  className="space-y-0.5 pb-4"
                >
                    {facets.brands.map(({ label, count }) => {
                      const active = selectedBrands.some(
                        (brand) => brand.toLowerCase() === label.toLowerCase()
                      );

                      return (
                        <li key={label}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={active}
                            onClick={() => toggleInList("brand", label)}
                            className={cn(
                              "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition",
                              active
                                ? "text-sand"
                                : "text-mist hover:bg-white/5 hover:text-sand"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                active
                                  ? "border-neon bg-neon text-white"
                                  : "border-hairline bg-transparent"
                              )}
                              aria-hidden="true"
                            >
                              {active ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{label}</span>
                            <span className="text-[11px] tabular-nums opacity-50">
                              {count}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-hairline px-5 py-4">
              <button
                type="button"
                onClick={clearFilters}
                disabled={activeCount === 0}
                className="min-h-11 flex-1 rounded-xl border border-hairline text-sm font-medium text-mist transition hover:border-white/25 hover:text-sand disabled:cursor-not-allowed disabled:opacity-40"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-11 flex-1 rounded-xl bg-neon text-sm font-semibold text-white transition hover:bg-ember"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
