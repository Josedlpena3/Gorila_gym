import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
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
      <div className="grid gap-8 lg:grid-cols-[1fr,0.9fr]">
        <div className="space-y-4">
          <div className="relative h-[420px] overflow-hidden rounded-[34px] border border-line bg-steel">
            <Image
              src={product.images[0]?.url ?? product.image}
              alt={product.images[0]?.alt ?? product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {product.images.slice(0, 3).map((image) => (
              <div
                key={image.id}
                className="relative h-32 overflow-hidden rounded-3xl border border-line bg-steel"
              >
                <Image src={image.url} alt={image.alt} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="section-card p-8">
          <div className="flex flex-wrap gap-2">
            <Badge>{product.category}</Badge>
            <Badge variant={product.stock > 0 ? "success" : "warning"}>
              {product.stock > 0 ? "En stock" : "Sin stock"}
            </Badge>
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.32em] text-mist">{product.brand}</p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-[0.08em] text-sand">
            {product.name}
          </h1>
          <p className="mt-5 text-base text-mist">{product.description}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-line bg-ink/70 p-4">
              <p className="text-sm text-mist">Presentación</p>
              <p className="mt-2 text-lg font-semibold text-sand">{product.weight ?? "-"}</p>
            </div>
            <div className="rounded-3xl border border-line bg-ink/70 p-4">
              <p className="text-sm text-mist">Sabor</p>
              <p className="mt-2 text-lg font-semibold text-sand">{product.flavor ?? "-"}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm uppercase tracking-[0.3em] text-mist">Beneficios</p>
            <ul className="mt-4 space-y-3 text-sm text-sand">
              {product.benefits.map((benefit) => (
                <li key={benefit} className="rounded-2xl border border-line bg-ink/60 p-4">
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-mist">Precio</p>
              <p className="text-4xl font-black text-sand">{formatCurrency(product.price)}</p>
            </div>
            <div className="w-full max-w-xs">
              <AddToCartButton
                productId={product.id}
                disabled={product.stock <= 0}
                requiresLogin={!user}
                nextPath={`/productos/${product.slug}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

