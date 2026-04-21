import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
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
              alt="Gorila Strong"
              width={512}
              height={512}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.32em] text-neon sm:mt-8 sm:text-sm">
            Gorila Strong
          </p>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-[0.06em] text-sand sm:text-5xl lg:text-6xl">
            Suplementación premium
          </h1>
          <div className="mt-6 w-full sm:mt-8 sm:w-auto">
            <Link href="/catalogo" className={primaryLinkClass}>
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>

      {homeProducts.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-mist sm:text-sm sm:tracking-[0.28em]">
                Home
              </p>
              <h2 className="text-2xl font-black uppercase tracking-[0.06em] text-sand sm:text-3xl">
                Destacados y novedades
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="inline-flex min-h-[44px] items-center text-sm font-semibold text-neon transition hover:text-neon/80"
            >
              Ver catálogo completo
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {homeProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                requiresLogin={!user}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
