"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

export type ProductCategory = {
  id: string;
  name: string;
};

function isProductCategory(value: unknown): value is ProductCategory {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "name" in value &&
      typeof (value as ProductCategory).id === "string" &&
      typeof (value as ProductCategory).name === "string"
  );
}

/**
 * Categorías disponibles para el formulario de producto.
 *
 * Normalmente llegan como prop desde el servidor; el fetch es el plan B para
 * cuando esa lista viene vacía. Antes eran dos `useEffect` dentro del
 * formulario: uno espejaba la prop en estado y el otro hacía la petición.
 */
export function useProductCategories(categoriesFromServer: ProductCategory[]) {
  const [categories, setCategories] = useState(categoriesFromServer);
  const [isLoading, setIsLoading] = useState(categoriesFromServer.length === 0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (categoriesFromServer.length > 0) {
      setCategories(categoriesFromServer);
      setMessage(null);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const abortController = new AbortController();
    setIsLoading(true);

    void (async () => {
      try {
        const payload = await api.get<unknown>("/api/categories", {
          cache: "no-store",
          signal: abortController.signal
        });

        if (!isActive) {
          return;
        }

        const next = Array.isArray(payload) ? payload.filter(isProductCategory) : [];

        setCategories(next);
        setMessage(
          next.length === 0 ? "Todavía no hay categorías disponibles." : null
        );
      } catch {
        if (!isActive || abortController.signal.aborted) {
          return;
        }

        console.warn("No se pudieron cargar las categorías del formulario.");
        setMessage("No se pudieron cargar las categorías ahora.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [categoriesFromServer]);

  return { categories, isLoading, message };
}
