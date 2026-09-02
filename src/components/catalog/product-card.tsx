import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { OBJECTIVE_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { ProductCardDto } from "@/types";

export function ProductCard({ product }: { product: ProductCardDto }) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 3;
  // Peso y sabor en una sola línea: son los dos datos que un comprador compara
  // entre productos, y como badges sueltos competían con el nombre.
  const meta = [product.weight, product.flavor].filter(Boolean).join(" · ");

  return (
    <article className="card-interactive group flex h-full flex-col overflow-hidden">
      <Link
        href={`/productos/${product.slug}`}
        aria-label={`Ver ${product.name}`}
        className="product-media relative block aspect-square overflow-hidden"
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
            className={`object-contain p-6 transition-transform duration-500 group-hover:scale-[1.06] sm:p-7 ${
              isOutOfStock ? "opacity-40 saturate-0" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-mist">
            Sin imagen
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-eyebrow text-mist backdrop-blur-sm">
          {OBJECTIVE_LABELS[product.objective] ?? product.objective}
        </span>

        {isOutOfStock ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-eyebrow text-mist backdrop-blur-sm">
            Sin stock
          </span>
        ) : isLowStock ? (
          <span className="absolute right-3 top-3 rounded-full bg-neon px-3 py-1 text-[10px] font-bold uppercase tracking-eyebrow text-white">
            Últimas {product.stock}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-mist">
            {product.brand}
          </p>
          <h3 className="mt-1.5 text-[0.95rem] font-bold leading-snug text-sand sm:text-base">
            <Link
              href={`/productos/${product.slug}`}
              className="line-clamp-2 transition group-hover:text-white"
            >
              {product.name}
            </Link>
          </h3>
          {meta ? <p className="mt-1.5 text-xs text-mist">{meta}</p> : null}
        </div>

        <p className="text-xl font-black tracking-[-0.03em] text-sand sm:text-2xl">
          {formatCurrency(product.price)}
        </p>

        <AddToCartButton
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
          productBrand={product.brand}
          productImage={product.image}
          productPrice={product.price}
          productStock={product.stock}
          disabled={isOutOfStock}
        />
      </div>
    </article>
  );
}
