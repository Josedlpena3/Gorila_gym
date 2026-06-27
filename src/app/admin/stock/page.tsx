import { AdminStockClient } from "@/components/admin/admin-stock-client";
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

      <AdminStockClient products={products} />
    </div>
  );
}
