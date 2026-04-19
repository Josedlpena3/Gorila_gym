import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { getHomeProducts } from "@/modules/products/product.service";
import { tryGetCurrentUser } from "@/modules/users/user.service";

const primaryLinkClass =
  "inline-flex items-center justify-center rounded-full bg-neon px-5 py-3 text-sm font-semibold text-ink transition hover:bg-neon/90";

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
      <section className="relative overflow-hidden rounded-[36px] border border-line/80 bg-steel/70 px-6 py-16 shadow-premium backdrop-blur sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(183,255,57,0.16),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.08),transparent_22%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:h-32 sm:w-32">
            <Image
              src="/branding/logo-gorila.png"
              alt="Gorila Strong"
              width={512}
              height={512}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.36em] text-neon sm:text-sm">
            Gorila Strong
          </p>
          <h1 className="mt-5 text-4xl font-black uppercase tracking-[0.08em] text-sand sm:text-5xl lg:text-6xl">
            Suplementación premium
          </h1>
          <div className="mt-8">
            <Link href="/catalogo" className={primaryLinkClass}>
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>

      {homeProducts.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-mist">Home</p>
              <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-sand">
                Destacados y novedades
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="text-sm font-semibold text-neon transition hover:text-neon/80"
            >
              Ver catálogo completo
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
