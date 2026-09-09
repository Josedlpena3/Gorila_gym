"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export type CatalogFilterKey =
  | "q"
  | "categoryId"
  | "brand"
  | "objective"
  | "minPrice"
  | "maxPrice"
  | "sort";

/**
 * Único lugar que sabe cómo viven los filtros del catálogo en la URL.
 *
 * Antes cada control armaba su propio `URLSearchParams` y decidía por su cuenta
 * qué borrar, y por eso los filtros se pisaban entre sí: buscar borraba la
 * categoría y elegir categoría borraba la búsqueda. Acá los filtros se componen
 * y lo único que se descarta siempre es `page`, porque cualquier cambio de
 * filtro invalida la paginación.
 *
 * Se usa `replace` y no `push` para no llenar el historial: volver atrás desde
 * el catálogo debería sacarte del catálogo, no deshacer filtro por filtro.
 */
export function useCatalogParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const current = searchParams.toString();

  const get = useCallback(
    (key: CatalogFilterKey) => searchParams.get(key) ?? undefined,
    [searchParams]
  );

  const apply = useCallback(
    (changes: Partial<Record<CatalogFilterKey, string | null>>) => {
      const next = new URLSearchParams(current);

      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }

      // La categoría vieja por slug convivía con `categoryId`. Al tocar
      // cualquier filtro se descarta para que no queden las dos.
      if ("categoryId" in changes) {
        next.delete("category");
      }

      next.delete("page");

      const query = next.toString();

      if (query === current) {
        return;
      }

      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false
        });
      });
    },
    [current, pathname, router]
  );

  const clearAll = useCallback(() => {
    if (!current) {
      return;
    }

    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [current, pathname, router]);

  const activeCount = (
    ["categoryId", "brand", "objective", "minPrice", "maxPrice"] as const
  ).filter((key) => searchParams.get(key)).length;

  return { get, apply, clearAll, isPending, activeCount };
}
