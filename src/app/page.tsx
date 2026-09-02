import Link from "next/link";
import { HomeFeaturedProducts } from "@/components/site/home-featured-products";
import { getHomeProducts } from "@/modules/products/product.service";

// ISR: el HTML se genera una vez y se sirve desde el CDN. Las mutaciones del
// admin lo invalidan al instante (revalidateProductPages en product.service),
// así que esta ventana solo cubre cambios de stock por ventas.
export const revalidate = 60;

const primaryLinkClass =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-neon px-5 py-3 text-sm font-semibold text-white transition hover:bg-neon/90 sm:w-auto";

export default async function HomePage() {
  // El error se captura porque esta página sí se prerenderiza en el build: si
  // la base no responde durante un deploy, preferimos una home sin destacados
  // (que se recompone sola en la siguiente revalidación) antes que un deploy
  // fallado. El catálogo, que es dinámico, sigue funcionando igual.
  const homeProducts = await getHomeProducts(8).catch((error) => {
    console.error("[home] no se pudieron cargar los productos", error);
    return [];
  });

  return (
    <div className="page-shell space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-line/80 bg-steel/70 px-4 py-8 shadow-premium backdrop-blur sm:px-8 sm:py-14 lg:px-16 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.10),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.04),transparent_22%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <p className="text-[11px] font-black uppercase tracking-eyebrow-wide text-ember sm:text-sm">
            Gorilla Strong
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-hero text-sand sm:text-5xl lg:text-6xl">
            Suplementación premium
          </h1>
          <p className="mt-3 max-w-md text-sm text-mist sm:mt-4 sm:text-base">
            Suplementos de calidad con asesoramiento personalizado. Enviamos a Villa Allende y zona.
          </p>
          <div className="mt-5 w-full sm:mt-6 sm:w-auto">
            <Link href="/catalogo" className={primaryLinkClass}>
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>

      {homeProducts.length > 0 ? (
        <HomeFeaturedProducts products={homeProducts} />
      ) : null}
    </div>
  );
}
