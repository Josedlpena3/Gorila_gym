import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { ProductGallery } from "@/components/products/product-gallery";
import { ExpandableText } from "@/components/ui/expandable-text";
import { OBJECTIVE_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { ProductCardDto } from "@/types";

export function ProductCard({
  product,
  requiresLogin
}: {
  product: ProductCardDto;
  requiresLogin?: boolean;
}) {
  return (
    <article className="section-card group overflow-hidden">
      <div className="relative overflow-hidden">
        <ProductGallery
          mode="card"
          images={product.images}
          fallback={{
            url: product.image,
            alt: product.name
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          {product.featured ? <Badge variant="success">Destacado</Badge> : null}
          <Badge>{product.category}</Badge>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-mist">{product.brand}</p>
          <Link href={`/productos/${product.slug}`} className="mt-2 block text-xl font-black">
            {product.name}
          </Link>
          <p className="mt-2 text-sm text-mist">
            Objetivo:{" "}
            <span className="text-sand">
              {OBJECTIVE_LABELS[product.objective] ?? product.objective}
            </span>
          </p>
          <div className="mt-3 text-sm text-mist">
            <ExpandableText text={product.description} collapsedLength={110} />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-black text-sand">{formatCurrency(product.price)}</p>
            <p className="text-sm text-mist">
              {product.stock > 0 ? `${product.stock} en stock` : "Sin stock"}
            </p>
          </div>
          <Link
            href={`/productos/${product.slug}`}
            className="text-sm font-semibold text-neon transition hover:text-neon/80"
          >
            Ver detalle
          </Link>
        </div>

        <AddToCartButton
          productId={product.id}
          disabled={product.stock <= 0}
          requiresLogin={requiresLogin}
          nextPath={`/productos/${product.slug}`}
        />
      </div>
    </article>
  );
}
