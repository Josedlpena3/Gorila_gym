import { cache } from "react";
import { notFound } from "next/navigation";
import { Check, MessageCircle, Truck, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { BackToCatalogLink } from "@/components/products/back-to-catalog-link";
import { ProductAddToCart } from "@/components/products/product-add-to-cart";
import { ProductGallery } from "@/components/products/product-gallery";
import { Badge } from "@/components/ui/badge";
import { ExpandableText } from "@/components/ui/expandable-text";
import { formatCurrency } from "@/lib/utils";
import { getProductBySlug } from "@/modules/products/product.service";

// ISR: la ficha se cachea y se sirve desde el CDN. Las mutaciones del admin la
// invalidan al instante (revalidateProductPages en product.service).
export const revalidate = 60;

// Devolver [] no prerenderiza ninguna ficha durante el build —así el deploy no
// depende de que la base responda— pero sí habilita el cache on-demand: cada
// producto se genera en su primera visita y después se sirve cacheado. Sin este
// export, Next trata la ruta como totalmente dinámica y `revalidate` se ignora.
export function generateStaticParams() {
  return [];
}

// React.cache deduplica la DB call entre generateMetadata y el render de la página
const getProductCached = cache((slug: string) => getProductBySlug(slug));

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductCached(params.slug).catch(() => null);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  const description = product.description.length > 155
    ? `${product.description.slice(0, 152)}…`
    : product.description;

  return {
    title: `${product.name} – ${product.brand}`,
    description,
    openGraph: {
      title: `${product.name} – ${product.brand}`,
      description,
      images: product.image
        ? [{ url: product.image, alt: product.name }]
        : []
    }
  };
}

export default async function ProductPage({
  params
}: {
  params: { slug: string };
}) {
  // Los errores de base se dejan propagar al error boundary: bajo ISR, cachear
  // una ficha rota la dejaría rota durante toda la ventana de revalidación,
  // mientras que al fallar Next sigue sirviendo la última versión buena.
  const product = await getProductCached(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="page-shell space-y-10">
      <BackToCatalogLink />

      <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr] lg:items-start xl:gap-10">
        <ProductGallery images={product.images} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{product.category}</Badge>
            <Badge variant={product.stock > 0 ? "success" : "warning"}>
              {product.stock > 0 ? "En stock" : "Sin stock"}
            </Badge>
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-eyebrow-wide text-mist">
            {product.brand}
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase leading-[1.05] tracking-hero text-sand sm:text-4xl">
            {product.name}
          </h1>

          {product.weight || product.flavor ? (
            <p className="mt-3 text-sm text-mist">
              {[product.weight, product.flavor].filter(Boolean).join(" · ")}
            </p>
          ) : null}

          <div className="sticky bottom-3 z-10 mt-6 rounded-3xl border border-hairline bg-surface/95 p-4 shadow-card backdrop-blur sm:static sm:bg-surface sm:backdrop-blur-0">
            <p className="text-4xl font-black tracking-[-0.03em] text-sand sm:text-5xl">
              {formatCurrency(product.price)}
            </p>
            <div className="mt-4">
              <ProductAddToCart
                productId={product.id}
                productSlug={product.slug}
                productName={product.name}
                productBrand={product.brand}
                productImage={product.image}
                productPrice={product.price}
                productStock={product.stock}
                disabled={product.stock <= 0}
              />
            </div>
          </div>

          {/* Señales de confianza: lo que alguien quiere saber antes de comprar
              y que antes no estaba en ningún lado de la ficha. */}
          <ul className="mt-5 grid gap-2.5">
            {[
              {
                icon: Truck,
                text: "Envío a Villa Allende y zona, o retiro en el local."
              },
              {
                icon: Wallet,
                text: "Pagás en efectivo, por transferencia o con tarjeta."
              },
              {
                icon: MessageCircle,
                text: "Coordinamos la entrega con vos por WhatsApp."
              }
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-mist">
                <Icon
                  className="h-4 w-4 shrink-0 text-ember"
                  aria-hidden="true"
                />
                {text}
              </li>
            ))}
          </ul>

          <div className="rule-soft mt-7 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-eyebrow text-mist">
              Descripción
            </h2>
            <div className="mt-3 text-sm leading-7 text-mist sm:text-base">
              <ExpandableText text={product.description} collapsedLength={320} />
            </div>
          </div>

          {product.benefits.length > 0 ? (
            <div className="rule-soft mt-7 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-eyebrow text-mist">
                Beneficios
              </h2>
              <ul className="mt-3 grid gap-2 text-sm text-sand sm:grid-cols-2">
                {product.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2.5 rounded-2xl border border-hairline bg-surface p-3 leading-5"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-ember"
                      aria-hidden="true"
                    />
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
