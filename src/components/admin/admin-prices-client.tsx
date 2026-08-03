"use client";

import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type PriceProduct = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  stock: number;
  price: number;
};

type RowState = {
  value: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
};

export function AdminPricesClient({ products }: { products: PriceProduct[] }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      products.map((p) => [
        p.id,
        { value: String(p.price), saving: false, saved: false, error: null }
      ])
    )
  );
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category))).sort((a, b) =>
        a.localeCompare(b, "es")
      ),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (!q) return true;
      return [p.name, p.sku, p.brand].some((v) => v.toLowerCase().includes(q));
    });
  }, [products, search, selectedCategory]);

  function setRow(id: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function savePrice(product: PriceProduct) {
    const row = rows[product.id];
    if (!row) return;
    const newPrice = parseFloat(row.value);

    if (isNaN(newPrice) || newPrice < 0.01) {
      setRow(product.id, { error: "Precio inválido" });
      return;
    }

    if (newPrice === product.price && !row.error) {
      setRow(product.id, { saved: true, error: null });
      setTimeout(() => setRow(product.id, { saved: false }), 1500);
      return;
    }

    setRow(product.id, { saving: true, error: null });

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: newPrice })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Error al guardar");
      }

      setRow(product.id, { saving: false, saved: true, error: null });
      setTimeout(() => setRow(product.id, { saved: false }), 2000);
    } catch (err) {
      setRow(product.id, {
        saving: false,
        error: err instanceof Error ? err.message : "Error al guardar"
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="section-card space-y-4 p-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, SKU o marca"
        />
        <div className="-mx-1 flex flex-wrap gap-2 px-1">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              !selectedCategory
                ? "border-neon bg-neon text-white"
                : "border-white/10 bg-black/20 text-sand hover:border-neon/50 hover:text-neon"
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
              className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                selectedCategory === cat
                  ? "border-neon bg-neon text-white"
                  : "border-white/10 bg-black/20 text-sand hover:border-neon/50 hover:text-neon"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <p className="text-xs text-mist">
          {filteredProducts.length} de {products.length} productos
        </p>
      </div>

      <div className="space-y-3">
        {filteredProducts.map((product) => {
          const row = rows[product.id] ?? {
            value: String(product.price),
            saving: false,
            saved: false,
            error: null
          };
          const currentValue = parseFloat(row.value);
          const isDirty = !isNaN(currentValue) && currentValue !== product.price;

          return (
            <article key={product.id} className="section-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{product.category}</Badge>
                    <Badge variant={product.stock <= 0 ? "danger" : "default"}>
                      {product.stock <= 0 ? "Sin stock" : `Stock: ${product.stock}`}
                    </Badge>
                  </div>
                  <p className="mt-2 font-black uppercase tracking-[0.06em] text-sand">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-xs text-mist">
                    SKU {product.sku} · {product.brand} · precio actual:{" "}
                    <span className="font-semibold text-sand">
                      {formatCurrency(product.price)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-mist">
                      $
                    </span>
                    <Input
                      ref={(el) => {
                        inputRefs.current[product.id] = el;
                      }}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={row.value}
                      onChange={(e) =>
                        setRow(product.id, {
                          value: e.target.value,
                          saved: false,
                          error: null
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void savePrice(product);
                      }}
                      className="w-32 pl-7 text-right"
                      disabled={row.saving}
                    />
                  </div>
                  <Button
                    type="button"
                    variant={row.saved ? "secondary" : "primary"}
                    className="min-w-[80px] px-4 py-2"
                    disabled={row.saving}
                    onClick={() => void savePrice(product)}
                  >
                    {row.saving ? "..." : row.saved ? "✓ OK" : isDirty ? "Guardar" : "Guardar"}
                  </Button>
                </div>
              </div>
              {row.error ? (
                <p className="mt-2 text-xs text-red-300">{row.error}</p>
              ) : null}
            </article>
          );
        })}

        {filteredProducts.length === 0 ? (
          <div className="section-card p-6 text-center text-sm text-mist">
            No se encontraron productos con esos filtros.
          </div>
        ) : null}
      </div>
    </div>
  );
}
