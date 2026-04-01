import { DiscountForm } from "@/components/admin/discount-form";
import { Badge } from "@/components/ui/badge";
import { listDiscounts } from "@/modules/discounts/discount.service";

export default async function AdminPromotionsPage() {
  const discounts = await listDiscounts();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Promociones</p>
        <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Descuentos y campañas
        </h1>
      </div>

      <DiscountForm />

      <div className="grid gap-4">
        {discounts.map((discount) => (
          <article key={discount.id} className="space-y-4">
            <div className="section-card p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={discount.active ? "success" : "warning"}>
                      {discount.active ? "Activa" : "Inactiva"}
                    </Badge>
                    {discount.paymentMethod ? <Badge>{discount.paymentMethod}</Badge> : null}
                    {discount.province ? <Badge>{discount.province}</Badge> : null}
                  </div>
                  <h2 className="mt-4 text-2xl font-black uppercase tracking-[0.08em] text-sand">
                    {discount.name}
                  </h2>
                  <p className="mt-2 text-sm text-mist">
                    {discount.description ?? "Sin descripción"}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-3xl font-black text-sand">
                    {discount.type === "PERCENTAGE"
                      ? `${discount.value}%`
                      : `$${discount.value}`}
                  </p>
                  <p className="text-sm text-mist">{discount.code ?? "Sin código"}</p>
                </div>
              </div>
            </div>
            <DiscountForm discount={discount} />
          </article>
        ))}
      </div>
    </div>
  );
}
