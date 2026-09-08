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

  /** Valores múltiples viajan separados por comas: `?brand=ENA,Mervick`. */
  const getList = useCallback(
    (key: CatalogFilterKey) => {
      const raw = searchParams.get(key);
      return raw ? raw.split(",").map((v) => v.trim()).filter(Boolean) : [];
    },
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

  /**
   * Agrega o quita un valor de una lista. La comparación es insensible a
   * mayúsculas porque las marcas están cargadas de varias formas y el chip
   * muestra una grafía que puede no ser la que quedó en la URL.
   */
  const toggleInList = useCallback(
    (key: CatalogFilterKey, value: string) => {
      const raw = searchParams.get(key);
      const list = raw
        ? raw.split(",").map((v) => v.trim()).filter(Boolean)
        : [];
      const exists = list.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      );
      const next = exists
        ? list.filter((item) => item.toLowerCase() !== value.toLowerCase())
        : [...list, value];

      apply({ [key]: next.length > 0 ? next.join(",") : null });
    },
    [apply, searchParams]
  );

  const clearAll = useCallback(() => {
    if (!current) {
      return;
    }

    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [current, pathname, router]);

  /**
   * Saca categoría y marcas —y cualquier filtro viejo que ya no se muestra—
   * pero deja la búsqueda. El buscador es un control aparte y tiene su propia X.
   */
  const clearFilters = useCallback(() => {
    apply({
      categoryId: null,
      brand: null,
      objective: null,
      minPrice: null,
      maxPrice: null,
      sort: null
    });
  }, [apply]);

  const activeCount =
    (searchParams.get("categoryId") ? 1 : 0) + getList("brand").length;

  return {
    get,
    getList,
    apply,
    toggleInList,
    clearAll,
    clearFilters,
    isPending,
    activeCount
  };
}
