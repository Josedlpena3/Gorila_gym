"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ProductImageItem =
  | {
      id: string;
      source: "stored";
      value: string;
      label: string;
      previewUrl: string;
    }
  | {
      id: string;
      source: "file";
      file: File;
      label: string;
      previewUrl: string;
    };

export type PendingImageItem = Extract<ProductImageItem, { source: "file" }>;

function getImageLabel(value: string) {
  const [, fileName] = value.split(/[/\\](?=[^/\\]+$)/);
  return fileName || value;
}

function createStoredImageItem(id: string, value: string): ProductImageItem {
  return {
    id,
    source: "stored",
    value,
    label: getImageLabel(value),
    previewUrl: value
  };
}

function reorder<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Galería del formulario de producto: imágenes ya guardadas y archivos todavía
 * sin subir, en un solo orden.
 *
 * Era la mitad de la complejidad de product-form.tsx, incluidos dos de sus seis
 * useEffect. El ciclo de vida de las URLs de objeto es la parte delicada —si no
 * se revocan, cada archivo elegido queda reservado en memoria hasta recargar la
 * página— y acá queda contenido en un solo lugar.
 */
export function useProductImages(
  initialImages: Array<{ id: string; url: string }> = []
) {
  const [items, setItems] = useState<ProductImageItem[]>(() =>
    initialImages.map((image) => createStoredImageItem(image.id, image.url))
  );

  // El ref existe solo para la limpieza al desmontar: el efecto de abajo corre
  // una vez y necesita ver la última lista, no la del primer render.
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.source === "file") {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setItems((current) => [
      ...current,
      ...Array.from(files).map((file) => ({
        id: `file-${crypto.randomUUID()}`,
        source: "file" as const,
        file,
        label: file.name,
        previewUrl: URL.createObjectURL(file)
      }))
    ]);
  }, []);

  const move = useCallback((index: number, direction: "up" | "down") => {
    setItems((current) => {
      const target = direction === "up" ? index - 1 : index + 1;

      if (target < 0 || target >= current.length) {
        return current;
      }

      return reorder(current, index, target);
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((current) => {
      const item = current.find((entry) => entry.id === id);

      if (item?.source === "file") {
        URL.revokeObjectURL(item.previewUrl);
      }

      return current.filter((entry) => entry.id !== id);
    });
  }, []);

  /**
   * Tras subir los archivos pendientes, los reemplaza por sus URLs definitivas
   * conservando el orden que eligió el administrador.
   */
  const replacePendingWithUrls = useCallback(
    (urls: string[], current: ProductImageItem[]) => {
      let uploadedIndex = 0;

      return current
        .map((item) => {
          if (item.source !== "file") {
            return item;
          }

          const nextUrl = urls[uploadedIndex];
          uploadedIndex += 1;

          return nextUrl
            ? createStoredImageItem(`stored-${crypto.randomUUID()}`, nextUrl)
            : null;
        })
        .filter((item): item is ProductImageItem => Boolean(item));
    },
    []
  );

  const getPendingFiles = useCallback(
    (current: ProductImageItem[]): PendingImageItem[] =>
      current.filter((item): item is PendingImageItem => item.source === "file"),
    []
  );

  const getStoredUrls = useCallback(
    (current: ProductImageItem[]) =>
      current
        .map((item) => (item.source === "stored" ? item.value : null))
        .filter((value): value is string => Boolean(value)),
    []
  );

  return {
    items,
    setItems,
    addFiles,
    move,
    remove,
    replacePendingWithUrls,
    getPendingFiles,
    getStoredUrls
  };
}
