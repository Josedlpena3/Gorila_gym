import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
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
  console.log("Imagen catálogo:", product.image);

  return (
    <article className="section-card group overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-steel/70">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain p-5 transition duration-500 group-hover:scale-[1.03] sm:p-6"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-mist">
            Sin imagen
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {product.featured ? <Badge variant="success">Destacado</Badge> : null}
          <Badge>{product.category}</Badge>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-mist">{product.brand}</p>
          {(product.weight || product.flavor) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.weight ? <Badge variant="info">{product.weight}</Badge> : null}
              {product.flavor ? <Badge variant="warning">{product.flavor}</Badge> : null}
            </div>
          ) : null}
          <Link
            href={`/productos/${product.slug}`}
            className="mt-2 block text-lg font-black leading-tight sm:text-xl"
          >
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

        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between">
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
          productSlug={product.slug}
          productName={product.name}
          productBrand={product.brand}
          productImage={product.image}
          productPrice={product.price}
          productStock={product.stock}
          disabled={product.stock <= 0}
          requiresLogin={requiresLogin}
          nextPath={`/productos/${product.slug}`}
        />
      </div>
    </article>
  );
}
