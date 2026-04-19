"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const filteredProducts = products.filter((product) => {
    if (!debouncedSearch) {
      return true;
    }

    return [product.name, product.sku, product.brand].some((value) =>
      value.toLowerCase().includes(debouncedSearch)
    );
  });

  return (
    <div className="space-y-4">
      <div className="section-card p-4">
        <label className="space-y-2 text-sm text-mist">
          <span>Buscar producto</span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre, SKU o marca"
          />
        </label>
      </div>

      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <article key={product.id} className="section-card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={product.active ? "success" : "warning"}>
                    {product.active ? "Activo" : "Archivado"}
                  </Badge>
                  <Badge>{product.category}</Badge>
                  {product.featured ? (
                    <Badge variant="info">Destacado #{product.featuredPriority}</Badge>
                  ) : null}
                </div>
                <h2 className="mt-4 text-2xl font-black uppercase tracking-[0.08em] text-sand">
                  {product.name}
                </h2>
                <p className="mt-2 text-sm text-mist">
                  SKU {product.sku} · {product.brand} · Stock {product.stock} ·{" "}
                  {formatCurrency(product.price)}
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
      </div>
    </div>
  );
}
