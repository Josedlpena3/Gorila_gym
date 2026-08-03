import { AdminPricesClient } from "@/components/admin/admin-prices-client";
import { getPriceOverview } from "@/modules/products/product.service";

export const dynamic = "force-dynamic";

export default async function AdminPreciosPage() {
  const products = await getPriceOverview();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Precios</p>
        <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Edición de precios
        </h1>
      </div>

      <AdminPricesClient products={products} />
    </div>
  );
}
