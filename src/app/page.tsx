import Image from "next/image";
import Link from "next/link";
import { HomeFeaturedProducts } from "@/components/site/home-featured-products";
import { getHomeProducts } from "@/modules/products/product.service";
import { tryGetCurrentUser } from "@/modules/users/user.service";

const primaryLinkClass =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-neon px-5 py-3 text-sm font-semibold text-ink transition hover:bg-neon/90 sm:w-auto";

export default async function HomePage() {
  const [homeProducts, user] = await Promise.all([
    getHomeProducts(8).catch((error) => {
      console.error("[home] no se pudieron cargar los productos", error);
      return [];
    }),
    tryGetCurrentUser("home-page")
  ]);

  return (
    <div className="page-shell space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-line/80 bg-steel/70 px-4 py-12 shadow-premium backdrop-blur sm:px-8 sm:py-16 lg:px-16 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(183,255,57,0.16),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.08),transparent_22%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:h-32 sm:w-32">
            <Image
              src="/branding/logo-gorila.png"
              alt="Gorilla Strong"
              width={256}
              height={256}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.32em] text-neon sm:mt-8 sm:text-sm">
            Gorilla Strong
          </p>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-[0.06em] text-sand sm:text-5xl lg:text-6xl">
            Suplementación premium
          </h1>
          <p className="mt-4 max-w-md text-sm text-mist sm:mt-5 sm:text-base">
            Los mejores suplementos al mejor precio, con asesoramiento personalizado para que alcances tus objetivos.
          </p>
          <div className="mt-6 w-full sm:mt-8 sm:w-auto">
            <Link href="/catalogo" className={primaryLinkClass}>
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>

      {homeProducts.length > 0 ? (
        <HomeFeaturedProducts
          products={homeProducts}
          requiresLogin={!user}
        />
      ) : null}
    </div>
  );
}
