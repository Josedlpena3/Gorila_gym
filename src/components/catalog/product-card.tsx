import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
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
  const isOutOfStock = product.stock <= 0;

  return (
    <article className="section-card group flex h-full flex-col overflow-hidden">
      <Link
        href={`/productos/${product.slug}`}
        aria-label={`Ver detalle de ${product.name}`}
        className="relative block aspect-square overflow-hidden bg-steel/60"
      >
        {isOutOfStock ? (
          <div className="absolute right-3 top-3 z-10">
            <Badge variant="danger">Sin stock</Badge>
          </div>
        ) : null}
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
            className="object-contain object-center p-5 transition duration-500 group-hover:scale-[1.03] sm:p-6"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-mist sm:text-sm">
            Sin imagen
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-1 flex-col">
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
            className="mt-3 block min-h-[2.8rem] overflow-hidden text-[1.05rem] font-black leading-tight text-sand [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:min-h-[3.2rem] sm:text-[1.18rem] lg:text-[1.28rem]"
          >
            {product.name}
          </Link>
          <p className="mt-2 text-xs text-mist sm:text-sm">
            Objetivo:{" "}
            <span className="text-sand">
              {OBJECTIVE_LABELS[product.objective] ?? product.objective}
            </span>
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-4 pt-4">
          <div className="flex items-end justify-between gap-2">
            <p className="text-2xl font-black tracking-[-0.03em] text-sand sm:text-[2rem]">
              {formatCurrency(product.price)}
            </p>
            <Link
              href={`/productos/${product.slug}`}
              className="mb-1 text-xs text-mist transition hover:text-sand"
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
      </div>
    </article>
  );
}
