"use client";

import { Objective, ProductType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OBJECTIVE_LABELS, PRODUCT_TYPE_LABELS } from "@/lib/constants";

type ProductFormProps = {
  categories: Array<{ id: string; name: string }>;
  product?: {
    id: string;
    sku: string;
    name: string;
    brand: string;
    categoryId: string;
    description: string;
    benefits: string[];
    price: number;
    stock: number;
    type: ProductType;
    objective: string;
    active: boolean;
    featured: boolean;
    weight?: string | null;
    flavor?: string | null;
    images: Array<{ url: string }>;
  } | null;
};

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const title = useMemo(
    () => (product ? "Editar producto" : "Nuevo producto"),
    [product]
  );

  return (
    <form
      className="section-card space-y-6 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);

          const images = String(formData.get("images") ?? "")
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean);

          const benefits = String(formData.get("benefits") ?? "")
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean);

          const payload = {
            sku: formData.get("sku"),
            name: formData.get("name"),
            brand: formData.get("brand"),
            categoryId: formData.get("categoryId"),
            description: formData.get("description"),
            benefits,
            price: Number(formData.get("price")),
            stock: Number(formData.get("stock")),
            type: formData.get("type"),
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
          <label className="text-sm text-mist">Tipo</label>
          <Select name="type" defaultValue={product?.type ?? ProductType.PROTEIN}>
            {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-mist">Beneficios (uno por línea)</label>
          <Textarea
            name="benefits"
            defaultValue={product ? product.benefits.join("\n") : ""}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist">Imágenes (una URL por línea)</label>
          <Textarea
            name="images"
            defaultValue={product ? product.images.map((image) => image.url).join("\n") : ""}
            required
          />
        </div>
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
