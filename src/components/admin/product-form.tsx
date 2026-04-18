"use client";

import { Objective } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OBJECTIVE_LABELS } from "@/lib/constants";

type ProductImageItem =
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

type ProductCategory = {
  id: string;
  name: string;
};

type ProductFormProps = {
  categories: ProductCategory[];
  product?: {
    id: string;
    sku: string;
    name: string;
    brand: string;
    categoryId: string;
    description: string;
    price: number;
    stock: number;
    objective: string;
    active: boolean;
    featured: boolean;
    weight?: string | null;
    flavor?: string | null;
    images: Array<{ id: string; url: string; alt: string }>;
  } | null;
};

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

function moveItem<T>(items: T[], from: number, to: number) {
  const nextItems = [...items];
  const [item] = nextItems.splice(from, 1);
  nextItems.splice(to, 0, item);
  return nextItems;
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] =
    useState<ProductCategory[]>(categories);
  const [isLoadingCategories, setIsLoadingCategories] = useState(categories.length === 0);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? ""
  );
  const [imageItems, setImageItems] = useState<ProductImageItem[]>(
    product?.images.map((image) => createStoredImageItem(image.id, image.url)) ?? []
  );
  const [isPending, startTransition] = useTransition();
  const imageItemsRef = useRef(imageItems);

  const title = useMemo(
    () => (product ? "Editar producto" : "Nuevo producto"),
    [product]
  );

  useEffect(() => {
    imageItemsRef.current = imageItems;
  }, [imageItems]);

  useEffect(() => {
    setAvailableCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (product?.categoryId) {
      setSelectedCategoryId(product.categoryId);
      return;
    }

    if (!selectedCategoryId && availableCategories[0]?.id) {
      setSelectedCategoryId(availableCategories[0].id);
    }
  }, [availableCategories, product?.categoryId, selectedCategoryId]);

  useEffect(() => {
    if (categories.length > 0) {
      setCategoryMessage(null);
      setIsLoadingCategories(false);
      return;
    }

    let isActive = true;
    const abortController = new AbortController();

    setIsLoadingCategories(true);

    void (async () => {
      try {
        const response = await fetch("/api/categories", {
          cache: "no-store",
          signal: abortController.signal
        });
        const payload = (await response.json().catch(() => null)) as unknown;

        if (!response.ok) {
          throw new Error("categories_unavailable");
        }

        const nextCategories = Array.isArray(payload)
          ? payload.filter(
              (entry): entry is ProductCategory =>
                Boolean(
                  entry &&
                    typeof entry === "object" &&
                    "id" in entry &&
                    "name" in entry &&
                    typeof entry.id === "string" &&
                    typeof entry.name === "string"
                )
            )
          : [];

        if (!isActive) {
          return;
        }

        setAvailableCategories(nextCategories);
        setCategoryMessage(
          nextCategories.length === 0
            ? "Todavía no hay categorías disponibles."
            : null
        );
      } catch (fetchError) {
        if (!isActive || abortController.signal.aborted) {
          return;
        }

        console.warn("No se pudieron cargar las categorías del formulario.");
        setCategoryMessage("No se pudieron cargar las categorías ahora.");
      } finally {
        if (isActive) {
          setIsLoadingCategories(false);
        }
      }
    })();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [categories]);

  useEffect(() => {
    return () => {
      imageItemsRef.current.forEach((item) => {
        if (item.source === "file") {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setImageItems((current) => [
      ...current,
      ...Array.from(files).map((file) => ({
        id: `file-${crypto.randomUUID()}`,
        source: "file" as const,
        file,
        label: file.name,
        previewUrl: URL.createObjectURL(file)
      }))
    ]);
  }

  function moveImageItem(index: number, direction: "up" | "down") {
    setImageItems((current) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      return moveItem(current, index, targetIndex);
    });
  }

  function removeImageItem(id: string) {
    setImageItems((current) => {
      const item = current.find((entry) => entry.id === id);

      if (item?.source === "file") {
        URL.revokeObjectURL(item.previewUrl);
      }

      return current.filter((entry) => entry.id !== id);
    });
  }

  function replacePendingFilesWithUploadedUrls(urls: string[]) {
    let uploadedIndex = 0;

    return imageItems
      .map((item) => {
        if (item.source !== "file") {
          return item;
        }

        const nextUrl = urls[uploadedIndex];
        uploadedIndex += 1;

        if (!nextUrl) {
          return null;
        }

        console.log("Imagen subida:", nextUrl);
        return createStoredImageItem(`stored-${crypto.randomUUID()}`, nextUrl);
      })
      .filter((item): item is ProductImageItem => Boolean(item));
  }

  return (
    <form
      className="section-card space-y-6 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);
          setWarning(null);

          const name = String(formData.get("name") ?? "").trim();
          const price = Number(formData.get("price"));
          const stock = Number(formData.get("stock"));
          const categoryId =
            String(formData.get("categoryId") ?? "").trim() ||
            availableCategories[0]?.id ||
            "";

          if (name.length === 0) {
            setError("El nombre es obligatorio.");
            return;
          }

          if (!Number.isFinite(price) || price <= 0) {
            setError("El precio debe ser mayor a 0.");
            return;
          }

          if (!Number.isInteger(stock) || stock < 0) {
            setError("El stock no puede ser negativo.");
            return;
          }

          if (!categoryId) {
            setError("No hay categorías disponibles para este producto.");
            return;
          }

          try {
            let uploadedImages: string[] = [];
            let imageItemsToPersist = imageItems;
            const pendingFiles = imageItems.filter(
              (item): item is Extract<ProductImageItem, { source: "file" }> =>
                item.source === "file"
            );

            if (pendingFiles.length > 0) {
              const uploadFormData = new FormData();

              pendingFiles.forEach((item) => {
                uploadFormData.append("files", item.file);
              });

              try {
                const uploadResponse = await fetch("/api/admin/uploads", {
                  method: "POST",
                  body: uploadFormData
                });
                const uploadPayload = await uploadResponse.json().catch(() => null);

                if (!uploadResponse.ok) {
                  setWarning(
                    uploadPayload?.error ??
                      "No se pudieron subir las imágenes. El producto se guardará sin esas imágenes."
                  );
                } else {
                  uploadedImages = Array.isArray(uploadPayload?.files)
                    ? uploadPayload.files
                        .map((entry: { url?: string }) => entry.url)
                        .filter(
                          (value: unknown): value is string =>
                            typeof value === "string"
                        )
                    : typeof uploadPayload?.url === "string"
                      ? [uploadPayload.url]
                      : [];

                  imageItemsToPersist = replacePendingFilesWithUploadedUrls(uploadedImages);
                  setImageItems(imageItemsToPersist);
                }
              } catch {
                setWarning(
                  "No se pudieron subir las imágenes. El producto se guardará sin esas imágenes."
                );
                imageItemsToPersist = imageItems.filter(
                  (item): item is Extract<ProductImageItem, { source: "stored" }> =>
                    item.source === "stored"
                );
              }
            }

            const images = imageItemsToPersist
              .map((item) => {
                return item.source === "stored" ? item.value : null;
              })
              .filter((value): value is string => Boolean(value));

            const payload = {
              sku: formData.get("sku"),
              name,
              brand: formData.get("brand"),
              categoryId,
              description: formData.get("description"),
              price,
              stock,
              objective: formData.get("objective"),
              active: formData.get("active") === "on",
              featured: formData.get("featured") === "on",
              weight: formData.get("weight"),
              flavor: formData.get("flavor"),
              images
            };

            console.log("Imagen guardada:", images[0] ?? null);

            const response = await fetch(
              product ? `/api/admin/products/${product.id}` : "/api/admin/products",
              {
                method: product ? "PUT" : "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
              }
            );

            if (!response.ok) {
              const result = await response.json().catch(() => null);
              setError(result?.error ?? "No se pudo guardar el producto.");
              return;
            }

            router.push("/admin/productos");
            router.refresh();
          } catch {
            setError("No se pudo guardar el producto.");
          }
        });
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-[0.08em]">{title}</h1>
          <p className="text-sm text-mist">
            Gestioná el catálogo con una carga estable y preparada para producción.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-mist">SKU</label>
          <Input name="sku" defaultValue={product?.sku ?? ""} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Nombre</label>
          <Input name="name" defaultValue={product?.name ?? ""} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Marca</label>
          <Input name="brand" defaultValue={product?.brand ?? "Gorila Strong"} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Categoría</label>
          <Select
            name="categoryId"
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            disabled={availableCategories.length === 0}
          >
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          {isLoadingCategories ? (
            <p className="text-xs text-mist">Cargando categorías...</p>
          ) : null}
          {categoryMessage ? (
            <p className="text-xs text-amber-200">{categoryMessage}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Objetivo</label>
          <Select
            name="objective"
            defaultValue={product?.objective ?? Objective.MUSCLE_GAIN}
          >
            {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Precio</label>
          <Input
            type="number"
            name="price"
            min="0.01"
            step="0.01"
            defaultValue={product?.price ?? 0}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Stock</label>
          <Input
            type="number"
            name="stock"
            min="0"
            step="1"
            defaultValue={product?.stock ?? 0}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Peso</label>
          <Input name="weight" defaultValue={product?.weight ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Sabor</label>
          <Input name="flavor" defaultValue={product?.flavor ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-mist">Descripción</label>
        <Textarea name="description" defaultValue={product?.description ?? ""} required />
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm text-mist">Subir imágenes</label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => {
              addFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <p className="text-xs text-mist">
            Las imágenes son opcionales. Si la carga no está disponible, podés guardar
            el producto igual y agregar imágenes más adelante.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-mist">Orden de imágenes</label>
          <p className="text-xs text-mist">
            La primera imagen queda como principal en catálogo y detalle.
          </p>
        </div>

        {imageItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-ink/40 p-4 text-sm text-mist">
            Podés publicar el producto sin imágenes y agregarlas más adelante.
          </div>
        ) : (
          <div className="space-y-3">
            {imageItems.map((item, index) => (
              <div
                key={item.id}
                className="rounded-3xl border border-line bg-ink/60 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-line bg-steel">
                      {item.source === "file" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.previewUrl}
                          alt={`Vista previa ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={item.previewUrl}
                          alt={`Vista previa ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.24em] text-mist">
                        Imagen {index + 1} {index === 0 ? "· Principal" : ""}
                      </p>
                      <p className="mt-2 truncate text-sm font-semibold text-sand">
                        {item.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-4 py-2"
                      onClick={() => moveImageItem(index, "up")}
                      disabled={index === 0}
                    >
                      Subir
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-4 py-2"
                      onClick={() => moveImageItem(index, "down")}
                      disabled={index === imageItems.length - 1}
                    >
                      Bajar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="px-4 py-2"
                      onClick={() => removeImageItem(item.id)}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" name="active" defaultChecked={product?.active ?? true} />
          Producto activo
        </label>
        <label className="flex items-center gap-2 text-sm text-mist">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured ?? false}
          />
          Destacar en home
        </label>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {warning ? <p className="text-sm text-amber-200">{warning}</p> : null}

      <div className="flex gap-3">
        <Button disabled={isPending || isLoadingCategories || availableCategories.length === 0}>
          {isPending ? "Guardando..." : "Guardar producto"}
        </Button>
        <Button variant="secondary" type="button" onClick={() => router.push("/admin/productos")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
