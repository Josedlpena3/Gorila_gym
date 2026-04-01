import Link from "next/link";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getAdminProducts } from "@/modules/products/product.service";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-mist">Productos</p>
          <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-sand">
            Catálogo editable
          </h1>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button>Nuevo producto</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {products.map((product) => (
          <article key={product.id} className="section-card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={product.active ? "success" : "warning"}>
                    {product.active ? "Activo" : "Archivado"}
                  </Badge>
                  <Badge>{product.category}</Badge>
                </div>
                <h2 className="mt-4 text-2xl font-black uppercase tracking-[0.08em] text-sand">
                  {product.name}
                </h2>
                <p className="mt-2 text-sm text-mist">
                  {product.brand} · Stock {product.stock} · {formatCurrency(product.price)}
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

