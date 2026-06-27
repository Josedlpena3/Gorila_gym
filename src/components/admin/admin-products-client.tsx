"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type AdminProductListItem = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
  featured: boolean;
  featuredPriority: number;
};

export function AdminProductsClient({
  products
}: {
  products: AdminProductListItem[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort((a, b) => a.localeCompare(b, "es")),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((product) => {
      if (selectedCategory && product.category !== selectedCategory) return false;
      if (!q) return true;
      return [product.name, product.sku, product.brand].some((v) =>
        v.toLowerCase().includes(q)
      );
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="space-y-4">
      <div className="section-card space-y-4 p-4">
        <label className="space-y-2 text-sm text-mist">
          <span>Buscar producto</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, SKU o marca"
          />
        </label>

        <div className="-mx-1 flex flex-wrap gap-2 px-1">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              !selectedCategory
                ? "border-neon bg-neon text-ink"
                : "border-white/10 bg-black/20 text-sand hover:border-neon/50 hover:text-neon"
            }`}
          >
            Todas
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() =>
                setSelectedCategory(selectedCategory === category ? null : category)
              }
              className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                selectedCategory === category
                  ? "border-neon bg-neon text-ink"
                  : "border-white/10 bg-black/20 text-sand hover:border-neon/50 hover:text-neon"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <p className="text-xs text-mist">
          {filteredProducts.length} de {products.length} productos
        </p>
      </div>

      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <article key={product.id} className="section-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={product.active ? "success" : "warning"}>
                    {product.active ? "Activo" : "Archivado"}
                  </Badge>
                  <Badge>{product.category}</Badge>
                  {product.featured ? (
                    <Badge variant="info">Destacado #{product.featuredPriority}</Badge>
                  ) : null}
                  <Badge variant={product.stock <= 0 ? "danger" : product.stock <= 5 ? "warning" : "success"}>
                    Stock: {product.stock}
                  </Badge>
                </div>
                <h2 className="mt-3 text-xl font-black uppercase tracking-[0.08em] text-sand">
                  {product.name}
                </h2>
                <p className="mt-1 text-sm text-mist">
                  SKU {product.sku} · {product.brand} · {formatCurrency(product.price)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/admin/productos/${product.id}`}>
                  <Button variant="secondary">Editar</Button>
                </Link>
                <DeleteProductButton productId={product.id} />
              </div>
            </div>
          </article>
        ))}

        {filteredProducts.length === 0 ? (
          <div className="section-card p-6 text-center text-sm text-mist">
            No se encontraron productos con esos filtros.
          </div>
        ) : null}
      </div>
    </div>
  );
}
