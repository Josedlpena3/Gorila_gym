import Link from "next/link";
import { AdminProductsClient } from "@/components/admin/admin-products-client";
import { Button } from "@/components/ui/button";
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

      <AdminProductsClient products={products} />
    </div>
  );
}
