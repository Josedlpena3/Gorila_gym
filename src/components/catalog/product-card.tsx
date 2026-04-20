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
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
            className="object-contain p-4 transition duration-500 group-hover:scale-[1.03] sm:p-5"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-mist sm:text-sm">
            Sin imagen
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2 sm:left-4 sm:top-4">
          {product.featured ? <Badge variant="success">Destacado</Badge> : null}
          <Badge>{product.category}</Badge>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-mist sm:text-xs sm:tracking-[0.28em]">
            {product.brand}
          </p>
          {(product.weight || product.flavor) ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {product.weight ? <Badge variant="info">{product.weight}</Badge> : null}
              {product.flavor ? <Badge variant="warning">{product.flavor}</Badge> : null}
            </div>
          ) : null}
          <Link
            href={`/productos/${product.slug}`}
            className="mt-2 block text-base font-black leading-tight sm:text-lg lg:text-xl"
          >
            {product.name}
          </Link>
          <p className="mt-2 text-xs text-mist sm:text-sm">
            Objetivo:{" "}
            <span className="text-sand">
              {OBJECTIVE_LABELS[product.objective] ?? product.objective}
            </span>
          </p>
          <div className="mt-3 text-xs leading-5 text-mist sm:text-sm">
            <ExpandableText text={product.description} collapsedLength={90} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xl font-black text-sand sm:text-2xl">
              {formatCurrency(product.price)}
            </p>
            <p className="text-xs text-mist sm:text-sm">
              {product.stock > 0 ? `${product.stock} en stock` : "Sin stock"}
            </p>
          </div>
          <Link
            href={`/productos/${product.slug}`}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-neon transition hover:text-neon/80"
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
