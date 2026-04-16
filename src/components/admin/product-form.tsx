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

type ProductFormProps = {
  categories: Array<{ id: string; name: string }>;
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

  return (
    <form
      className="section-card space-y-6 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);

          let uploadedImages: string[] = [];
          const pendingFiles = imageItems.filter(
            (item): item is Extract<ProductImageItem, { source: "file" }> =>
              item.source === "file"
          );

          if (pendingFiles.length > 0) {
            const uploadFormData = new FormData();

            pendingFiles.forEach((item) => {
              uploadFormData.append("files", item.file);
            });

            const uploadResponse = await fetch("/api/admin/uploads", {
              method: "POST",
              body: uploadFormData
            });

            const uploadPayload = await uploadResponse.json().catch(() => null);

            if (!uploadResponse.ok) {
              setError(uploadPayload?.error ?? "No se pudieron subir las imágenes.");
              return;
            }

            uploadedImages = Array.isArray(uploadPayload?.files)
              ? uploadPayload.files
                  .map((entry: { url?: string }) => entry.url)
                  .filter((value: unknown): value is string => typeof value === "string")
              : [];
          }

          let uploadedIndex = 0;
          const images = imageItems
            .map((item) => {
              if (item.source === "file") {
                const url = uploadedImages[uploadedIndex];
                uploadedIndex += 1;
                return url;
              }

              return item.value;
            })
            .filter((value): value is string => Boolean(value));

          if (images.length === 0) {
            setError("Debes cargar al menos una imagen desde tu equipo.");
            return;
          }

          const payload = {
            sku: formData.get("sku"),
            name: formData.get("name"),
            brand: formData.get("brand"),
            categoryId: formData.get("categoryId"),
            description: formData.get("description"),
            price: Number(formData.get("price")),
            stock: Number(formData.get("stock")),
            objective: formData.get("objective"),
            active: formData.get("active") === "on",
            featured: formData.get("featured") === "on",
            weight: formData.get("weight"),
            flavor: formData.get("flavor"),
            images
          };

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
        });
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-[0.08em]">{title}</h1>
          <p className="text-sm text-mist">
            Producto editable, tipado y listo para el catálogo.
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
          <Select name="categoryId" defaultValue={product?.categoryId ?? categories[0]?.id}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
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
          <Input type="number" name="price" defaultValue={product?.price ?? 0} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Stock</label>
          <Input type="number" name="stock" defaultValue={product?.stock ?? 0} required />
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
            Solo se aceptan archivos locales. Al guardar, quedan almacenados dentro
            del sitio y podés ordenarlos manualmente.
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
            Todavía no agregaste imágenes.
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

      <div className="flex gap-3">
        <Button disabled={isPending}>{isPending ? "Guardando..." : "Guardar producto"}</Button>
        <Button variant="secondary" type="button" onClick={() => router.push("/admin/productos")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
