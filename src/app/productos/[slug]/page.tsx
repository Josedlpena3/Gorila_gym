import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { ProductGallery } from "@/components/products/product-gallery";
import { Badge } from "@/components/ui/badge";
import { ExpandableText } from "@/components/ui/expandable-text";
import { formatCurrency } from "@/lib/utils";
import { getProductBySlug } from "@/modules/products/product.service";
import { getCurrentUser } from "@/modules/users/user.service";

export default async function ProductPage({
  params
}: {
  params: { slug: string };
}) {
  const [product, user] = await Promise.all([
    getProductBySlug(params.slug),
    getCurrentUser()
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="grid gap-5 lg:grid-cols-[0.85fr,1.15fr] lg:items-start xl:gap-6">
        <ProductGallery
          images={product.images}
          fallback={{
            url: product.image,
            alt: product.name
          }}
        />

        <div className="section-card p-5 sm:p-6 lg:p-7">
          <div className="flex flex-wrap gap-2">
            <Badge>{product.category}</Badge>
            <Badge variant={product.stock > 0 ? "success" : "warning"}>
              {product.stock > 0 ? "En stock" : "Sin stock"}
            </Badge>
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.28em] text-mist sm:text-sm sm:tracking-[0.32em]">
            {product.brand}
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.06em] text-sand sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-col gap-3 rounded-[28px] border border-line bg-ink/55 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-mist">Precio</p>
              <p className="text-3xl font-black text-sand sm:text-4xl">
                {formatCurrency(product.price)}
              </p>
            </div>
            <div className="w-full sm:max-w-xs">
              <AddToCartButton
                productId={product.id}
                disabled={product.stock <= 0}
                requiresLogin={!user}
                nextPath={`/productos/${product.slug}`}
              />
            </div>
          </div>

          <div className="mt-4 text-sm leading-6 text-mist sm:text-base">
            <ExpandableText text={product.description} collapsedLength={320} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-line bg-ink/70 p-3.5 sm:p-4">
              <p className="text-sm text-mist">Presentación</p>
              <p className="mt-1.5 text-base font-semibold text-sand sm:text-lg">
                {product.weight ?? "-"}
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-ink/70 p-3.5 sm:p-4">
              <p className="text-sm text-mist">Sabor</p>
              <p className="mt-1.5 text-base font-semibold text-sand sm:text-lg">
                {product.flavor ?? "-"}
              </p>
            </div>
          </div>

          {product.benefits.length > 0 ? (
            <div className="mt-5">
              <p className="text-sm uppercase tracking-[0.26em] text-mist">Beneficios</p>
              <ul className="mt-3 grid gap-2.5 text-sm text-sand sm:grid-cols-2">
                {product.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="rounded-2xl border border-line bg-ink/60 p-3 leading-5"
                  >
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
