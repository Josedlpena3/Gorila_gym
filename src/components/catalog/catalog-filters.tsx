"use client";

import { Check, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCatalogParams } from "@/components/catalog/use-catalog-params";
import { OBJECTIVE_LABELS } from "@/lib/constants";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { formatCurrency } from "@/lib/utils";

export type CatalogFacets = {
  brands: Array<{ label: string; count: number }>;
  minPrice: number;
  maxPrice: number;
};

function FilterChip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-neon/70 bg-neon/15 text-sand"
          : "border-hairline bg-transparent text-mist hover:border-white/25 hover:text-sand"
      }`}
    >
      {active ? (
        <Check className="h-3 w-3 shrink-0 text-ember" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}

function FilterGroup({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * Filtros del catálogo, en un contenedor que cambia de naturaleza según el
 * ancho.
 *
 * En escritorio es un popover anclado al botón, en posición absoluta: se abre
 * sobre la grilla en vez de empujarla, así el catálogo no salta cada vez que
 * alguien mira los filtros.
 *
 * En móvil es una hoja anclada abajo al 85% de la pantalla, donde llega el
 * pulgar. Cierra con la X, con Escape, tocando fuera, o arrastrando hacia
 * abajo.
 *
 * Las marcas son de selección múltiple: la lista viaja en la URL separada por
 * comas y el backend las combina con OR.
 */
export function CatalogFilters({ facets }: { facets: CatalogFacets }) {
  const { get, getList, apply, toggleInList, clearAll, activeCount } =
    useCatalogParams();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedBrands = getList("brand");
  const objective = get("objective");
  const minPrice = get("minPrice");
  const maxPrice = get("maxPrice");

  const [minDraft, setMinDraft] = useState(minPrice ?? "");
  const [maxDraft, setMaxDraft] = useState(maxPrice ?? "");
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef<number | null>(null);

  useEffect(() => {
    setMinDraft(minPrice ?? "");
    setMaxDraft(maxPrice ?? "");
  }, [minPrice, maxPrice]);

  useFocusTrap(panelRef, isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      dragStartRef.current = null;
    }
  }, [isOpen]);

  function applyPriceDraft() {
    const min = minDraft.replace(/\D/g, "");
    const max = maxDraft.replace(/\D/g, "");
    const [from, to] =
      min && max && Number(min) > Number(max) ? [max, min] : [min, max];

    apply({ minPrice: from || null, maxPrice: to || null });
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition ${
          isOpen || activeCount > 0
            ? "border-neon/60 bg-neon/10 text-sand"
            : "border-hairline bg-surface-sunken text-mist hover:border-white/25 hover:text-sand"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filtros
        {activeCount > 0 ? (
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-neon px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros del catálogo"
            style={
              dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined
            }
            onTouchStart={(event) => {
              dragStartRef.current = event.touches[0]?.clientY ?? null;
            }}
            onTouchMove={(event) => {
              const start = dragStartRef.current;
              const currentY = event.touches[0]?.clientY;

              if (start === null || currentY === undefined) {
                return;
              }

              setDragOffset(Math.max(0, currentY - start));
            }}
            onTouchEnd={() => {
              // Más de 100 px hacia abajo cierra; menos, vuelve a su lugar.
              if (dragOffset > 100) {
                setIsOpen(false);
              }

              setDragOffset(0);
              dragStartRef.current = null;
            }}
            className={[
              "fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col rounded-t-3xl border-t border-hairline bg-surface shadow-premium",
              "md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+8px)]",
              "md:h-auto md:w-[min(30rem,calc(100vw-2rem))] md:rounded-2xl md:border md:shadow-premium",
              dragOffset > 0 ? "" : "transition-transform"
            ].join(" ")}
          >
            {/* Manija: señal de que la hoja se puede arrastrar. */}
            <div
              aria-hidden="true"
              className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/20 md:hidden"
            />

            <div className="flex shrink-0 items-center justify-between px-5 py-3 md:px-4 md:pb-2 md:pt-4">
              <p className="text-sm font-bold text-sand">Filtros</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar filtros"
                className="flex h-8 w-8 items-center justify-center rounded-full text-mist transition hover:bg-white/10 hover:text-sand"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-4 md:px-4">
              {facets.brands.length > 0 ? (
                <FilterGroup label="Marca">
                  <div className="flex flex-wrap gap-1.5">
                    {facets.brands.map(({ label, count }) => (
                      <FilterChip
                        key={label}
                        active={selectedBrands.some(
                          (brand) => brand.toLowerCase() === label.toLowerCase()
                        )}
                        onClick={() => toggleInList("brand", label)}
                      >
                        {label}
                        <span className="text-[10px] opacity-50">{count}</span>
                      </FilterChip>
                    ))}
                  </div>
                </FilterGroup>
              ) : null}

              <FilterGroup label="Objetivo">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
                    <FilterChip
                      key={value}
                      active={objective === value}
                      onClick={() =>
                        apply({ objective: objective === value ? null : value })
                      }
                    >
                      {label}
                    </FilterChip>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Precio">
                <div className="flex items-center gap-2">
                  {(
                    [
                      ["Precio desde", minDraft, setMinDraft, facets.minPrice],
                      ["Precio hasta", maxDraft, setMaxDraft, facets.maxPrice]
                    ] as const
                  ).map(([label, value, setValue, placeholder]) => (
                    <label key={label} className="min-w-0 flex-1">
                      <span className="sr-only">{label}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={value}
                        placeholder={String(placeholder)}
                        onChange={(event) =>
                          setValue(event.target.value.replace(/\D/g, ""))
                        }
                        onBlur={applyPriceDraft}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            applyPriceDraft();
                          }
                        }}
                        className="min-h-9 w-full rounded-lg border border-hairline bg-surface-sunken px-2.5 py-1.5 text-sm text-sand transition placeholder:text-mist/40 hover:border-white/20 focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/25"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] text-mist">
                  {formatCurrency(facets.minPrice)} –{" "}
                  {formatCurrency(facets.maxPrice)} en el catálogo
                </p>
              </FilterGroup>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-hairline px-5 py-3 md:px-4">
              <button
                type="button"
                onClick={clearAll}
                disabled={activeCount === 0}
                className="min-h-10 flex-1 rounded-xl border border-hairline text-sm font-medium text-mist transition hover:border-white/25 hover:text-sand disabled:cursor-not-allowed disabled:opacity-40 md:flex-none md:px-4"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-10 flex-1 rounded-xl bg-neon text-sm font-semibold text-white transition hover:bg-ember md:flex-none md:px-4"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
