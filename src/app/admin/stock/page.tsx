import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getStockOverview } from "@/modules/products/product.service";

export default async function AdminStockPage() {
  const products = await getStockOverview();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Stock</p>
        <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Control de inventario
        </h1>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <article key={product.id} className="section-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={product.stock <= 5 ? "warning" : "success"}>
                    {product.stock <= 5 ? "Stock bajo" : "Disponible"}
                  </Badge>
                  <Badge>{product.category}</Badge>
                </div>
                <h2 className="mt-4 text-2xl font-black uppercase tracking-[0.08em] text-sand">
                  {product.name}
                </h2>
                <p className="mt-2 text-sm text-mist">
                  SKU {product.sku} · {product.brand}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-black text-sand">{product.stock}</p>
                <p className="text-sm text-mist">{formatCurrency(product.price)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

