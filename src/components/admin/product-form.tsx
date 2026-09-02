"use client";

import { Objective } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api, getApiErrorMessage } from "@/lib/api-client";
import { OBJECTIVE_LABELS } from "@/lib/constants";
import {
  useProductCategories,
  type ProductCategory
} from "@/components/admin/use-product-categories";
import { useProductImages } from "@/components/admin/use-product-images";

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
    featuredPriority?: number;
    weight?: string | null;
    flavor?: string | null;
    images: Array<{ id: string; url: string; alt: string }>;
  } | null;
};




export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const {
    categories: availableCategories,
    isLoading: isLoadingCategories,
    message: categoryMessage
  } = useProductCategories(categories);
  const images = useProductImages(product?.images);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? ""
  );
  const [isFeatured, setIsFeatured] = useState(product?.featured ?? false);
  const [isPending, startTransition] = useTransition();

  const title = useMemo(
    () => (product ? "Editar producto" : "Nuevo producto"),
    [product]
  );

  // Único efecto que queda: elegir una categoría por defecto cuando el producto
  // es nuevo y la lista llegó por fetch en vez de por prop.
  useEffect(() => {
    if (product?.categoryId) {
      setSelectedCategoryId(product.categoryId);
      return;
    }

    if (!selectedCategoryId && availableCategories[0]?.id) {
      setSelectedCategoryId(availableCategories[0].id);
    }
  }, [availableCategories, product?.categoryId, selectedCategoryId]);

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
          const brand = String(formData.get("brand") ?? "").trim();
          const description = String(formData.get("description") ?? "").trim();
          const price = Number(formData.get("price"));
          const stock = Number(formData.get("stock"));
          const categoryId =
            selectedCategoryId.trim() ||
            String(formData.get("categoryId") ?? "").trim() ||
            availableCategories[0]?.id ||
            "";

          if (name.length === 0) {
            setError("El nombre es obligatorio.");
            return;
          }

          if (brand.length < 2) {
            setError("La marca debe tener al menos 2 caracteres.");
            return;
          }

          if (description.length < 20) {
            setError("La descripción debe tener al menos 20 caracteres.");
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
            let imageItemsToPersist = images.items;
            const pendingFiles = images.getPendingFiles(images.items);

            if (pendingFiles.length > 0) {
              const uploadFormData = new FormData();

              pendingFiles.forEach((item) => {
                uploadFormData.append("files", item.file);
              });

              try {
                const uploadPayload = await api.post<{
                  files?: Array<{ url?: string }>;
                  url?: string;
                }>("/api/admin/uploads", uploadFormData, {
                  fallbackMessage:
                    "No se pudieron subir las imágenes. El producto se guardará sin esas imágenes."
                });

                {
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

                  imageItemsToPersist = images.replacePendingWithUrls(
                    uploadedImages,
                    images.items
                  );
                  images.setItems(imageItemsToPersist);
                }
              } catch (uploadError) {
                setWarning(
                  getApiErrorMessage(
                    uploadError,
                    "No se pudieron subir las imágenes. El producto se guardará sin esas imágenes."
                  )
                );
                imageItemsToPersist = images.items.filter(
                  (item) => item.source === "stored"
                );
              }
            }

            const imageUrls = images.getStoredUrls(imageItemsToPersist);

            const payload = {
              ...(product ? { sku: formData.get("sku") } : {}),
              name,
              brand,
              categoryId,
              description,
              price,
              stock,
              objective: formData.get("objective"),
              active: formData.get("active") === "on",
              featured: formData.get("featured") === "on",
              featuredPriority: Number(formData.get("featuredPriority") || 1),
              weight: formData.get("weight") || null,
              flavor: formData.get("flavor") || null,
              images: imageUrls
            };

            const endpoint = product
              ? `/api/admin/products/${product.id}`
              : "/api/admin/products";

            if (product) {
              await api.put(endpoint, payload);
            } else {
              await api.post(endpoint, payload);
            }

            router.push("/admin/productos");
            router.refresh();
          } catch (saveError) {
            setError(getApiErrorMessage(saveError, "No se pudo guardar el producto."));
          }
        });
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-display">{title}</h1>
          <p className="text-sm text-mist">
            Gestioná el catálogo con una carga estable y preparada para producción.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {product ? (
          <Field label="SKU">
            {(control) => (
              <Input
                {...control}
                name="sku"
                defaultValue={product.sku}
                readOnly
                className="cursor-default opacity-60"
              />
            )}
          </Field>
        ) : null}
        <Field label="Nombre">
          {(control) => (
            <Input {...control} name="name" defaultValue={product?.name ?? ""} required />
          )}
        </Field>
        <Field label="Marca">
          {(control) => (
            <Input {...control} name="brand" defaultValue={product?.brand ?? ""} required />
          )}
        </Field>
        <div>
          <Field
            label="Categoría"
            hint={isLoadingCategories ? "Cargando categorías..." : undefined}
          >
            {(control) => (
              <Select
                {...control}
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
            )}
          </Field>
          {categoryMessage ? (
            <p role="status" className="mt-2 text-xs text-amber-200">
              {categoryMessage}
            </p>
          ) : null}
        </div>
        <Field label="Objetivo">
          {(control) => (
            <Select
              {...control}
              name="objective"
              defaultValue={product?.objective ?? Objective.MUSCLE_GAIN}
            >
              {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Precio">
          {(control) => (
            <Input
              {...control}
              type="number"
              name="price"
              min="0.01"
              step="0.01"
              defaultValue={product?.price ?? 0}
              required
            />
          )}
        </Field>
        <Field label="Stock">
          {(control) => (
            <Input
              {...control}
              type="number"
              name="stock"
              min="0"
              step="1"
              defaultValue={product?.stock ?? 0}
              required
            />
          )}
        </Field>
        <Field label="Peso">
          {(control) => (
            <Input {...control} name="weight" defaultValue={product?.weight ?? ""} />
          )}
        </Field>
        <Field label="Sabor">
          {(control) => (
            <Input {...control} name="flavor" defaultValue={product?.flavor ?? ""} />
          )}
        </Field>
      </div>

      <Field label="Descripción">
        {(control) => (
          <Textarea {...control} name="description" defaultValue={product?.description ?? ""} required />
        )}
      </Field>

      <Field
        label="Imágenes"
        hint="Opcional. Podés elegir varias a la vez (Ctrl / Cmd + clic). Si la carga no está disponible, guardá el producto y agregalas después desde Editar."
      >
        {(control) => (
          <Input
            {...control}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => {
              images.addFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        )}
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-mist">Orden de imágenes</p>
          <p className="text-xs text-mist">
            La primera imagen queda como principal en catálogo y detalle.
          </p>
        </div>

        {images.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-ink/40 p-4 text-sm text-mist">
            Podés publicar el producto sin imágenes y agregarlas más adelante.
          </div>
        ) : (
          <div className="space-y-3">
            {images.items.map((item, index) => (
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
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-eyebrow text-mist">
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
                      onClick={() => images.move(index, "up")}
                      disabled={index === 0}
                    >
                      Subir
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-4 py-2"
                      onClick={() => images.move(index, "down")}
                      disabled={index === images.items.length - 1}
                    >
                      Bajar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="px-4 py-2"
                      onClick={() => images.remove(item.id)}
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
            onChange={(event) => setIsFeatured(event.target.checked)}
          />
          Destacar en home
        </label>
        <label className="flex items-center gap-2 text-sm text-mist">
          <span>Prioridad</span>
          <Input
            type="number"
            name="featuredPriority"
            min="1"
            step="1"
            defaultValue={product?.featuredPriority ?? 1}
            disabled={!isFeatured}
            className="w-24"
          />
        </label>
      </div>

      <FormError>{error}</FormError>
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
