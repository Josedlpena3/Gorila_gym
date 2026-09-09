"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCatalogParams } from "@/components/catalog/use-catalog-params";
import { OBJECTIVE_LABELS } from "@/lib/constants";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { formatCurrency } from "@/lib/utils";

export type CatalogFacets = {
  brands: Array<{ label: string; count: number }>;
  minPrice: number;
  maxPrice: number;
};

function OptionChip({
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
      className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-neon bg-neon text-white"
          : "border-hairline bg-surface-sunken text-mist hover:border-white/25 hover:text-sand"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Panel de filtros del catálogo.
 *
 * En escritorio se despliega en el flujo, debajo de la barra. En móvil se
 * convierte en una hoja anclada abajo —donde llega el pulgar— con fondo oscuro
 * y foco atrapado, porque desplegarlo en el flujo empujaría la grilla fuera de
 * pantalla.
 *
 * La API acepta una marca y un objetivo por consulta, así que ambos son de
 * selección única: volver a tocar la opción activa la quita.
 */
export function CatalogFilters({ facets }: { facets: CatalogFacets }) {
  const { get, apply, clearAll, activeCount } = useCatalogParams();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const brand = get("brand");
  const objective = get("objective");
  const minPrice = get("minPrice");
  const maxPrice = get("maxPrice");

  const [minDraft, setMinDraft] = useState(minPrice ?? "");
  const [maxDraft, setMaxDraft] = useState(maxPrice ?? "");

  // El precio se escribe con el teclado, así que solo se aplica al confirmar.
  // Sincronizar el borrador cuando la URL cambia por otra vía (chip removido,
  // "limpiar todo", botón atrás) evita que queden números fantasma en el campo.
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

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  function applyPriceDraft() {
    const min = minDraft.replace(/\D/g, "");
    const max = maxDraft.replace(/\D/g, "");

    // Si vienen invertidos se ordenan en vez de devolver cero resultados.
    const [from, to] =
      min && max && Number(min) > Number(max) ? [max, min] : [min, max];

    apply({ minPrice: from || null, maxPrice: to || null });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-hairline bg-surface-sunken px-3 py-1.5 text-sm font-semibold text-sand transition hover:border-white/25"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filtros
        {activeCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neon px-1.5 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Cerrar filtros"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros del catálogo"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-hairline bg-surface p-5 shadow-premium md:static md:z-auto md:mt-4 md:max-h-none md:rounded-2xl md:p-5 md:shadow-card"
          >
            <div className="mb-4 flex items-center justify-between md:hidden">
              <p className="text-base font-bold text-sand">Filtros</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar filtros"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-mist transition hover:text-sand"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {facets.brands.length > 0 ? (
                <fieldset>
                  <legend className="mb-2.5 text-[11px] font-semibold uppercase tracking-eyebrow text-mist">
                    Marca
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {facets.brands.map(({ label, count }) => (
                      <OptionChip
                        key={label}
                        active={brand?.toLowerCase() === label.toLowerCase()}
                        onClick={() =>
                          apply({
                            brand:
                              brand?.toLowerCase() === label.toLowerCase()
                                ? null
                                : label
                          })
                        }
                      >
                        {label}
                        <span className="ml-1.5 opacity-60">{count}</span>
                      </OptionChip>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              <fieldset>
                <legend className="mb-2.5 text-[11px] font-semibold uppercase tracking-eyebrow text-mist">
                  Objetivo
                </legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
                    <OptionChip
                      key={value}
                      active={objective === value}
                      onClick={() =>
                        apply({ objective: objective === value ? null : value })
                      }
                    >
                      {label}
                    </OptionChip>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2.5 text-[11px] font-semibold uppercase tracking-eyebrow text-mist">
                  Precio
                </legend>
                <div className="flex items-center gap-2">
                  {(
                    [
                      ["Desde", minDraft, setMinDraft, facets.minPrice],
                      ["Hasta", maxDraft, setMaxDraft, facets.maxPrice]
                    ] as const
                  ).map(([label, value, setValue, placeholder]) => (
                    <label key={label} className="flex-1">
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
                        className="min-h-9 w-full rounded-xl border border-hairline bg-surface-sunken px-3 py-1.5 text-sm text-sand transition placeholder:text-mist/40 hover:border-white/20 focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/25"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-mist">
                  Del catálogo: {formatCurrency(facets.minPrice)} a{" "}
                  {formatCurrency(facets.maxPrice)}
                </p>
              </fieldset>
            </div>

            <div className="mt-5 flex gap-3 border-t border-hairline pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 md:flex-none"
                onClick={() => {
                  clearAll();
                  setIsOpen(false);
                }}
                disabled={activeCount === 0}
              >
                Limpiar
              </Button>
              <Button
                type="button"
                className="flex-1 md:hidden"
                onClick={() => setIsOpen(false)}
              >
                Ver resultados
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
